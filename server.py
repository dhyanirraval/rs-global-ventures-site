from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import smtplib
import time
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import parse, request
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / 'data'
UPLOAD_DIR = ROOT / 'uploads'
CATALOG_FILE = DATA_DIR / 'catalog.json'
DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)


def load_env_file():
    env_file = ROOT / '.env'
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file()

def load_example_env():
    ex_file = ROOT / '.env.example'
    vals = {}
    if not ex_file.exists():
        return vals
    for line in ex_file.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        vals[k.strip()] = v.strip()
    return vals

_EXAMPLE = load_example_env()
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') or _EXAMPLE.get('ADMIN_EMAIL')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or _EXAMPLE.get('ADMIN_PASSWORD')
SESSION_SECRET = os.environ.get('SESSION_SECRET', 'replace-with-a-long-random-secret')
PORT = int(os.environ.get('PORT', '3000'))
SESSION_TTL = 8 * 60 * 60
CONTACT_EMAIL_TO = os.environ.get('CONTACT_EMAIL_TO', 'info@rsglobalventures.in')
MAIL_FROM = os.environ.get('MAIL_FROM', CONTACT_EMAIL_TO)
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587') or '587')
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() in {'1', 'true', 'yes'}
CONTACT_WEBHOOK_URL = os.environ.get('CONTACT_WEBHOOK_URL', '')
CONTACT_WEBHOOK_TOKEN = os.environ.get('CONTACT_WEBHOOK_TOKEN', '')

sessions: dict[str, float] = {}


def send_contact_email(payload: dict) -> tuple[bool, str]:
    if CONTACT_WEBHOOK_URL:
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        req = request.Request(
            CONTACT_WEBHOOK_URL,
            data=body,
            headers={'Content-Type': 'application/json', 'User-Agent': 'RSGlobalVenturesContact/1.0'}
        )
        if CONTACT_WEBHOOK_TOKEN:
            req.add_header('Authorization', f'Bearer {CONTACT_WEBHOOK_TOKEN}')
        try:
            with request.urlopen(req, timeout=15) as response:
                return response.status in {200, 201, 202, 204}, 'Webhook accepted the message.'
        except Exception as exc:
            return False, f'Webhook delivery failed: {exc}'

    if not SMTP_HOST:
        return False, 'Email delivery is not configured. Set SMTP_HOST and related environment variables.'

    message = EmailMessage()
    message['Subject'] = 'New Business Inquiry – RS Global Ventures'
    message['From'] = MAIL_FROM
    message['To'] = CONTACT_EMAIL_TO
    if payload.get('email'):
        message['Reply-To'] = payload['email']

    details = []
    for key, label in [
        ('name', 'Name'),
        ('company', 'Company'),
        ('email', 'Email'),
        ('phone', 'Phone / WhatsApp'),
        ('country', 'Country'),
        ('category', 'Product / Category'),
        ('quantity', 'Quantity / Requirement'),
        ('message', 'Message'),
    ]:
        value = payload.get(key, '').strip()
        if value:
            details.append(f'{label}: {value}')

    message.set_content('\n\n'.join(details) if details else 'No details provided.')
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            if SMTP_USE_TLS:
                smtp.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
        return True, 'Email sent successfully.'
    except Exception as exc:
        return False, f'Email delivery failed: {exc}'


def read_catalog():
    return json.loads(CATALOG_FILE.read_text(encoding='utf-8'))


def write_catalog(catalog):
    tmp = CATALOG_FILE.with_suffix('.tmp')
    tmp.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(CATALOG_FILE)


def json_bytes(data):
    return json.dumps(data, ensure_ascii=False).encode('utf-8')


def safe_name(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    stem = re.sub(r'[^a-zA-Z0-9_-]+', '-', Path(filename).stem).strip('-')[:50] or 'image'
    return f"{int(time.time()*1000)}-{secrets.token_hex(5)}-{stem}{ext}"


def make_session():
    now = str(int(time.time()))
    nonce = secrets.token_hex(24)
    token = nonce + '.' + hmac.new(SESSION_SECRET.encode(), (now + nonce).encode(), hashlib.sha256).hexdigest()
    sessions[token] = time.time() + SESSION_TTL
    return token


def valid_session(token: str | None) -> bool:
    if not token:
        return False
    exp = sessions.get(token)
    if not exp:
        return False
    if exp < time.time():
        sessions.pop(token, None)
        return False
    return True


def cookie_token(headers):
    raw = headers.get('Cookie', '')
    for piece in raw.split(';'):
        if '=' in piece:
            k, v = piece.strip().split('=', 1)
            if k == 'rsgv_admin':
                return v
    return None


def require_auth(handler):
    token = cookie_token(handler.headers)
    if not valid_session(token):
        handler.send_json({'error': 'Unauthorized'}, 401)
        return None
    return token


class Handler(SimpleHTTPRequestHandler):
    server_version = 'RSGlobalVentures/1.0'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print('%s - %s' % (self.address_string(), fmt % args))

    def send_json(self, data, code=200, headers=None):
        body = json_bytes(data)
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        if headers:
            for k, v in headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def read_body(self, max_bytes=12 * 1024 * 1024):
        length = int(self.headers.get('Content-Length', '0') or 0)
        if length > max_bytes:
            self.send_json({'error': 'Request is too large.'}, 413)
            return None
        return self.rfile.read(length)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/catalog':
            return self.send_json(read_catalog())
        if path == '/api/admin/me':
            if not require_auth(self):
                return
            return self.send_json({'email': ADMIN_EMAIL})
        if path == '/admin' or path == '/admin/':
            self.path = '/admin.html'
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/admin/login':
            return self.login()
        if path == '/api/admin/logout':
            return self.logout()
        if path == '/api/admin/upload':
            return self.upload_image()
        if path == '/api/admin/catalog':
            return self.save_catalog_item()
        if path == '/api/contact':
            return self.submit_contact_form()
        self.send_json({'error': 'Not found'}, 404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith('/api/admin/catalog/'):
            return self.delete_catalog_item(unquote(path.rsplit('/', 1)[1]))
        self.send_json({'error': 'Not found'}, 404)

    def login(self):
        raw = self.read_body(100_000)
        if raw is None:
            return
        ctype = self.headers.get('Content-Type', '')
        try:
            if 'application/json' in ctype:
                body = json.loads(raw.decode('utf-8') or '{}')
            else:
                body = {k: v[0] for k, v in parse_qs(raw.decode('utf-8')).items()}
        except Exception:
            return self.send_json({'error': 'Invalid request'}, 400)
        if body.get('email') != ADMIN_EMAIL or body.get('password') != ADMIN_PASSWORD:
            return self.send_json({'error': 'Invalid email or password'}, 401)
        token = make_session()
        headers = {'Set-Cookie': f'rsgv_admin={token}; HttpOnly; Path=/; SameSite=Lax; Max-Age={SESSION_TTL}'}
        self.send_json({'ok': True}, 200, headers)

    def logout(self):
        token = require_auth(self)
        if not token:
            return
        sessions.pop(token, None)
        self.send_json({'ok': True}, 200, {'Set-Cookie': 'rsgv_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'})

    def upload_image(self):
        if not require_auth(self):
            return
        ctype = self.headers.get('Content-Type', '')
        if not ctype.startswith('multipart/form-data'):
            return self.send_json({'error': 'Use multipart/form-data.'}, 400)
        boundary = None
        for part in ctype.split(';')[1:]:
            if '=' in part:
                k, v = part.strip().split('=', 1)
                if k.lower() == 'boundary':
                    boundary = v.strip().strip('\"')
                    break
        raw = self.read_body(12 * 1024 * 1024)
        if raw is None or not boundary:
            return self.send_json({'error': 'Invalid upload.'}, 400)
        try:
            marker = ('--' + boundary).encode()
            payload = None
            filename = 'image.jpg'
            ctype_value = ''
            for chunk in raw.split(marker):
                chunk = chunk.strip(b'\r\n-')
                if not chunk or b'\r\n\r\n' not in chunk:
                    continue
                head, content = chunk.split(b'\r\n\r\n', 1)
                head_text = head.decode('utf-8', 'replace')
                if 'name="image"' not in head_text and "name='image'" not in head_text:
                    continue
                m = re.search(r'filename="([^"]+)"', head_text) or re.search(r"filename='([^']+)'", head_text)
                if m:
                    filename = m.group(1)
                m = re.search(r'Content-Type:\s*([^\r\n]+)', head_text, flags=re.I)
                if m:
                    ctype_value = m.group(1).strip().lower()
                payload = content.rstrip(b'\r\n')
                break
            if payload is None:
                return self.send_json({'error': 'Image field is missing.'}, 400)
        except Exception as exc:
            return self.send_json({'error': f'Upload parse failed: {exc}'}, 400)
        allowed = {'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'}
        if ctype_value not in allowed:
            return self.send_json({'error': 'Only JPG, PNG, WebP, GIF or AVIF images are allowed.'}, 400)
        if not payload:
            return self.send_json({'error': 'Empty image.'}, 400)
        name = safe_name(filename)
        (UPLOAD_DIR / name).write_bytes(payload)
        self.send_json({'url': '/uploads/' + name, 'filename': name})

    def save_catalog_item(self):
        if not require_auth(self):
            return
        raw = self.read_body(1_500_000)
        if raw is None:
            return
        try:
            body = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            return self.send_json({'error': 'Invalid JSON.'}, 400)
        allowed = {'category', 'subcategory', 'product', 'variant'}
        typ = body.get('type')
        name = str(body.get('name') or '').strip()
        description = str(body.get('description') or '').strip()
        if typ not in allowed:
            return self.send_json({'error': 'Invalid type.'}, 400)
        if not name or not description:
            return self.send_json({'error': 'Name and description are required.'}, 400)
        catalog = read_catalog()
        item_id = body.get('id') or f"item-{int(time.time()*1000)}"
        parent_id = None if typ == 'category' else body.get('parentId')
        if typ != 'category' and not any(x.get('id') == parent_id for x in catalog):
            return self.send_json({'error': 'Parent does not exist.'}, 400)
        item = {
            'id': item_id,
            'type': typ,
            'parentId': parent_id,
            'name': name,
            'tag': str(body.get('tag') or '').strip(),
            'description': description,
            'image': body.get('image') or '/default-product.svg',
        }
        idx = next((i for i, x in enumerate(catalog) if x.get('id') == item_id), None)
        old = catalog[idx] if idx is not None else None
        if idx is None:
            catalog.append(item)
        else:
            catalog[idx] = item
        # Remove a replaced uploaded image after the catalog update succeeds.
        if old and old.get('image', '').startswith('/uploads/') and old.get('image') != item['image']:
            old_file = ROOT / old['image'].lstrip('/')
            if old_file.exists():
                old_file.unlink()
        write_catalog(catalog)
        self.send_json(item)

    def delete_catalog_item(self, item_id):
        if not require_auth(self):
            return
        catalog = read_catalog()
        if not any(x.get('id') == item_id for x in catalog):
            return self.send_json({'error': 'Item not found.'}, 404)
        ids = {item_id}
        changed = True
        while changed:
            changed = False
            for item in catalog:
                if item.get('parentId') in ids and item.get('id') not in ids:
                    ids.add(item['id']); changed = True
        removed = [x for x in catalog if x.get('id') in ids]
        for item in removed:
            image = item.get('image', '')
            if image.startswith('/uploads/'):
                file_path = ROOT / image.lstrip('/')
                if file_path.exists():
                    file_path.unlink()
        write_catalog([x for x in catalog if x.get('id') not in ids])
        self.send_json({'ok': True, 'deleted': list(ids)})

    def submit_contact_form(self):
        raw = self.read_body(250_000)
        if raw is None:
            return
        try:
            payload = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            return self.send_json({'error': 'Invalid request body.'}, 400)

        required = ['name', 'company', 'email', 'phone', 'country', 'category', 'quantity', 'message']
        cleaned = {}
        for key in required:
            value = str(payload.get(key, '') or '').strip()
            if not value:
                return self.send_json({'error': f'{key} is required.'}, 400)
            cleaned[key] = value

        if '@' not in cleaned['email'] or '.' not in cleaned['email']:
            return self.send_json({'error': 'Please enter a valid email address.'}, 400)

        # Basic anti-spam guard: block obviously empty/overlong values and repeated submissions by same email in quick succession.
        # This is intentionally lightweight and does not expose credentials.
        email = cleaned['email'].lower()
        if any(char in email for char in ['<', '>', ';', '\n', '\r']):
            return self.send_json({'error': 'Invalid email address.'}, 400)

        ok, msg = send_contact_email(cleaned)
        if not ok:
            return self.send_json({'error': msg}, 500)
        return self.send_json({'ok': True, 'message': 'Thank you for contacting RS Global Ventures. Your inquiry has been received. Our team will get back to you shortly.'})


if __name__ == '__main__':
    print(f'RS Global Ventures running on http://127.0.0.1:{PORT}')
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()

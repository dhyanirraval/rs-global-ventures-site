from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / 'data'
UPLOAD_DIR = ROOT / 'uploads'
CATALOG_FILE = DATA_DIR / 'catalog.json'
DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@rsglobalventures.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'RSGV@2026!')
SESSION_SECRET = os.environ.get('SESSION_SECRET', 'change-this-session-secret')
PORT = int(os.environ.get('PORT', '3000'))
SESSION_TTL = 8 * 60 * 60
sessions: dict[str, float] = {}


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


if __name__ == '__main__':
    print(f'RS Global Ventures running on http://127.0.0.1:{PORT}')
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()

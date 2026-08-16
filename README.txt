RS Global Ventures website

Run locally:
  npm install
  npm start
  Open http://localhost:3000
  Admin: http://localhost:3000/admin

Default admin credentials (change before deployment):
  Email: admin@rsglobalventures.com
  Password: RSGV@2026!

Admin URL:
  http://localhost:3000/admin

Environment variables:
  ADMIN_EMAIL
  ADMIN_PASSWORD
  SESSION_SECRET
  PORT

No database is used. Catalog data is stored in data/catalog.json and uploaded product/category images are stored in uploads/.
For hosting such as Render, use a persistent disk/volume if you want uploaded files and catalog.json to survive redeploys/restarts. Otherwise use external object storage for images and a persistent data store for production.

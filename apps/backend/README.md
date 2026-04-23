# Ngolab Express Backend (Node.js)

Backend ini berjalan terpisah dari frontend dan menjadi API layer untuk Admin dan Kiosk.
Backend ini langsung terhubung ke database MySQL.

## Struktur Folder

- `server.js`: entrypoint server.
- `app.js`: app factory (middleware, health route, route registration, error handler).
- `config/env.js`: loader + normalisasi env untuk server.
- `config/db.js`: satu-satunya tempat koneksi MySQL.
- `routes/index.js`: registrasi route utama.
- `routes/*.js`: implementasi endpoint (`auth`, `admin`, `kiosk`).
- `controllers/*.js`: logika bisnis tiap domain.
- `scripts/seed-admin.mjs`: seed admin idempotent.
- `scripts/smoke-test.mjs`: smoke test endpoint utama.

## 1. Setup

1. Buat file `apps/backend/.env`.
2. Isi nilai environment:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `FRONTEND_ORIGIN`
  - `PORT` (opsional, default `4000`)
3. Install dependency:
   - `npm install`

## 2. Run

- Development:
  - `npm run dev`
- Production:
  - `npm start`
- Seed admin default (`admin/123`, idempotent):
  - `npm run seed:admin`
- Smoke test endpoint inti:
  - `npm run test:smoke`

Server default berjalan di `http://localhost:4000`.

## 3. Endpoint Utama

- Health:
  - `GET /health`
- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/change-password`
- Admin:
  - `GET /api/admin/orders`
  - `GET /api/admin/order-details`
  - `GET /api/admin/products`
  - `GET /api/admin/categories`
  - `GET /api/admin/vouchers`
  - `GET /api/admin/members`
  - `GET /api/admin/member-logs`
  - `POST /api/admin/products`
  - `DELETE /api/admin/products/:id`
  - `POST /api/admin/categories`
  - `DELETE /api/admin/categories/:id`
  - `POST /api/admin/vouchers`
  - `DELETE /api/admin/vouchers/:id`
- Kiosk:
  - `GET /api/kiosk/init`
  - `GET /api/kiosk/member/:code`
  - `POST /api/kiosk/orders`

## 4. Integrasi Frontend

Set `VITE_BACKEND_URL` di frontend:

- `VITE_BACKEND_URL=http://localhost:4000`

Untuk frontend terpisah:

- Admin app: `http://localhost:3001`
- User app: `http://localhost:3002`

Frontend service memakai backend ini via package shared API di `apps/shared-lib/src/api.ts`.

## 5. Urutan Verifikasi Setelah Refactor

1. Jalankan backend (`npm run dev` atau `npm start`).
2. Pastikan admin tersedia (`npm run seed:admin`).
3. Jalankan smoke test (`npm run test:smoke`).
4. Jika smoke test lolos, lanjut verifikasi dari admin-app/user-app.

# Ngolab Express Backend (Node.js)

Backend ini berjalan terpisah dari frontend dan menjadi API layer untuk Admin dan Kiosk.
Backend ini langsung terhubung ke database MySQL.

## 1. Setup

1. Copy file environment:
  - Dari `apps/backend/.env.example` ke `apps/backend/.env`
2. Isi nilai yang wajib:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
   - `FRONTEND_ORIGIN`
3. Install dependency:
   - `npm install`

## 2. Run

- Development:
  - `npm run dev`
- Production:
  - `npm start`

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

Frontend service di `apps/frontend/src/shared/services/api.ts` akan memakai backend ini untuk semua request admin dan kiosk.

# Ngolab Express

Struktur project sekarang dipisah menjadi beberapa aplikasi yang saling terhubung:

- `apps/frontend/apps/admin-app` untuk Vite + React (Super Admin Dashboard)
- `apps/frontend/apps/user-app` untuk Vite + React (User Kiosk)
- `apps/shared-lib` untuk service dan konstanta yang dipakai bersama
- `apps/backend` untuk Node.js + Express API

## Struktur Folder

```txt
ngolab-express/
├─ apps/
│  ├─ frontend/
│  │  └─ apps/
│  │     ├─ admin-app/
│  │     └─ user-app/
│  ├─ shared-lib/
│  └─ backend/
├─ package.json
├─ .gitignore
└─ README.md
```

## Prasyarat

- Node.js 18+
- MySQL aktif untuk backend

## Setup

1. Install dependency frontend:
  - `npm install --prefix apps/frontend/apps/admin-app`
  - `npm install --prefix apps/frontend/apps/user-app`
2. Install dependency backend:
   - `npm install --prefix apps/backend`
3. Buat atau cek env frontend di `apps/frontend/apps/admin-app/.env` dan `apps/frontend/apps/user-app/.env`:
   - `VITE_BACKEND_URL=http://localhost:4000`
4. Buat atau cek env backend di `apps/backend/.env`:
   - `PORT=4000`
   - `FRONTEND_ORIGIN=http://localhost:3001,http://localhost:3002`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306`
   - `DB_USER=root`
   - `DB_PASSWORD=`
   - `DB_NAME=ngolab_express_system`

## Menjalankan Aplikasi

- Admin app saja:
  - `npm run dev:admin`
- User app saja:
  - `npm run dev:user`
- Backend saja:
  - `npm run dev:backend`
- Semua sekaligus dari root:
  - `npm run dev`

Port default:

- Admin app: `http://localhost:3001`
- User app: `http://localhost:3002`
- Backend API: `http://localhost:4000`

Kedua frontend menggunakan backend API yang sama dan backend terhubung ke satu database MySQL yang sama.

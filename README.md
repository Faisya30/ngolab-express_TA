# Ngolab Express

Struktur project sekarang dipisah menjadi dua aplikasi:

- `apps/frontend` untuk Vite + React (Admin Dashboard dan User Kiosk)
- `apps/backend` untuk Node.js + Express API

## Struktur Folder

```txt
ngolab-express/
├─ apps/
│  ├─ frontend/
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
   - `npm install --prefix apps/frontend`
2. Install dependency backend:
   - `npm install --prefix apps/backend`
3. Buat atau cek env frontend di `apps/frontend/.env`:
   - `VITE_BACKEND_URL=http://localhost:4000`
4. Buat atau cek env backend di `apps/backend/.env` (DB host/user/password/db name dan lainnya).

## Menjalankan Aplikasi

- Frontend saja:
  - `npm run dev:frontend`
- Backend saja:
  - `npm run dev:backend`
- Keduanya sekaligus dari root:
  - `npm run dev`

Frontend default berjalan di `http://localhost:3000` dan backend di `http://localhost:4000`.

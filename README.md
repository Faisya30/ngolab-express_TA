# Ngolab Express Frontend

Frontend untuk Admin Dashboard dan User Kiosk yang terhubung ke backend lokal (`backend/`) dan database MySQL.

## Prasyarat

- Node.js 18+
- Backend berjalan di `http://localhost:4000`

## Setup Frontend

1. Install dependency:
   - `npm install`
2. Buat atau cek file `.env` di root frontend:
   - `VITE_BACKEND_URL=http://localhost:4000`
3. Jalankan frontend:
   - `npm run dev`

Frontend default berjalan di `http://localhost:3000`.

## Scripts

- `npm run dev` - jalankan Vite dev server
- `npm run build` - build production
- `npm run preview` - preview hasil build
- `npm run lint` - TypeScript check (`tsc --noEmit`)

## Catatan

- Seluruh alur data admin dan kiosk menggunakan backend lokal, tidak lagi menggunakan Apps Script.
- Konfigurasi backend ada di `backend/.env`.

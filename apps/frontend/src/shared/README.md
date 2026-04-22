# Shared Folder

Folder `shared` digunakan untuk menyimpan resources dan logic yang **dipakai oleh Admin Module dan User Module**.

## Struktur Folder

```
shared/
├── assets/
│   └── images/              # Logo, icon, dan gambar yang dipakai di semua modules
├── services/
│   └── api.ts               # Satu pintu untuk komunikasi dengan backend/API
├── constants/               # Konstanta yang dipakai di banyak tempat
├── components/              # Komponen reusable (shared UI components)
└── README.md
```

## Panduan Penggunaan

### 1. **Assets/Images** 📷
Simpan logo, icon, dan gambar yang dipakai di multiple modules di sini.

**Contoh penggunaan di Admin:**
```tsx
import Logo from '../../shared/assets/images/logo.png';

<img src={Logo} alt="Ngolab Express" />
```

**Contoh penggunaan di User:**
```tsx
import Logo from '../../shared/assets/images/logo.png';

<img src={Logo} alt="Ngolab Express" />
```

### 2. **Services/API** 🔌
Semua komunikasi dengan backend HARUS lewat `api.ts` di sini.

Sudah tersedia: `fetchFromSheet(action, data)` yang handle:
- Request ke Google Sheets API
- Error handling
- Retry logic
- Timeout management

**Contoh penggunaan:**
```tsx
import { fetchFromSheet } from '../../shared/services/api';

// Di component:
const data = await fetchFromSheet('getOrders', {});
const result = await fetchFromSheet('addProduct', { name: 'Nasi Goreng' });
```

### 3. **Constants** ⚙️
Simpan konstanta yang dipakai di banyak tempat (ViewType, API endpoints, dll).

**Contoh struktur:**
```tsx
// shared/constants/index.ts
export const VIEW_TYPES = {
  DASHBOARD: 'DASHBOARD',
  PRODUCTS: 'PRODUCTS',
  // ...
} as const;

export const API_ACTIONS = {
  GET_ORDERS: 'getOrders',
  GET_PRODUCTS: 'getProducts',
  // ...
} as const;
```

**Contoh penggunaan:**
```tsx
import { VIEW_TYPES } from '../../shared/constants';

const [view, setView] = useState<ViewType>(VIEW_TYPES.DASHBOARD);
```

### 4. **Components** 🎨
Simpan komponen UI yang reusable dan dipakai di Admin dan User module.

**Contoh:**
- `Button.tsx` - Button standar Ngolab
- `LoadingSpinner.tsx` - Loading indicator
- `Modal.tsx` - Modal dialog
- `NotificationToast.tsx` - Toast notification

**Contoh penggunaan:**
```tsx
import { Button, Modal, LoadingSpinner } from '../../shared/components';

<Button variant="primary">Simpan</Button>
```

## Key Rules 📋

1. ✅ **Gunakan `shared/` untuk hal-hal yang dipakai 2+ modules**
2. ❌ **Jangan simpan logic spesifik Admin di sini** (itu di `modules/admin/`)
3. ✅ **API calls HARUS lewat `shared/services/api.ts`**
4. ✅ **Logo dan assets umum di `shared/assets/`**
5. ✅ **Konstanta global di `shared/constants/`**

## Contoh Struktur Lengkap

```
ngolab-express-frontend/src/
├── shared/
│   ├── assets/images/
│   │   ├── logo.png              # Logo Ngolab Express
│   │   ├── icon-menu.png
│   │   └── icon-user.png
│   ├── services/
│   │   └── api.ts                # API handler
│   ├── constants/
│   │   ├── index.ts              # Export semua constants
│   │   ├── viewTypes.ts
│   │   └── apiActions.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── NotificationToast.tsx
│   └── README.md
├── modules/
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   └── components/
│   └── user/
│       ├── Kiosk.tsx
│       └── components/
└── App.tsx
```

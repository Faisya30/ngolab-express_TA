const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

type BackendRequest = {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: any;
};

function getCurrentAdminRole(): string {
  try {
    const rawAdmin = localStorage.getItem('current_admin');
    if (!rawAdmin) return '';
    const admin = JSON.parse(rawAdmin);
    return String(admin?.role || '');
  } catch (_error) {
    return '';
  }
}

function mapActionToBackendRequest(action: string, data?: any): BackendRequest | null {
  switch (action) {
    case 'getOrders':
      return { method: 'GET', path: '/api/admin/orders' };
    case 'getOrderDetails':
      return { method: 'GET', path: '/api/admin/order-details' };
    case 'getProducts':
      return { method: 'GET', path: '/api/admin/products' };
    case 'getCategories':
      return { method: 'GET', path: '/api/admin/categories' };
    case 'getVouchers':
      return { method: 'GET', path: '/api/admin/vouchers' };
    case 'getMembers':
      return { method: 'GET', path: '/api/admin/members' };
    case 'getMemberLogs':
      return { method: 'GET', path: '/api/admin/member-logs' };
    case 'saveProduct':
      return { method: 'POST', path: '/api/admin/products', body: data };
    case 'saveCategory':
      return { method: 'POST', path: '/api/admin/categories', body: data };
    case 'saveVoucher':
      return { method: 'POST', path: '/api/admin/vouchers', body: data };
    case 'deleteRow': {
      const sheet = String(data?.sheetName || '').toLowerCase();
      const id = String(data?.id || '');
      if (!id) return null;
      if (sheet === 'products') return { method: 'DELETE', path: `/api/admin/products/${encodeURIComponent(id)}` };
      if (sheet === 'categories') return { method: 'DELETE', path: `/api/admin/categories/${encodeURIComponent(id)}` };
      if (sheet === 'vouchers') return { method: 'DELETE', path: `/api/admin/vouchers/${encodeURIComponent(id)}` };
      return null;
    }
    case 'initKiosk':
      return { method: 'GET', path: '/api/kiosk/init' };
    case 'getMember':
      return { method: 'GET', path: `/api/kiosk/member/${encodeURIComponent(String(data?.code || ''))}` };
    case 'submitOrder':
      return { method: 'POST', path: '/api/kiosk/orders', body: data };
    default:
      return null;
  }
}

export async function fetchFromSheet(action: string, data?: any, retryCount = 0): Promise<any> {
  if (!BACKEND_URL) {
    return {
      success: false,
      error: 'VITE_BACKEND_URL belum diset. Aplikasi sekarang hanya mendukung backend lokal.',
    };
  }

  const backendRequest = mapActionToBackendRequest(action, data);
  if (!backendRequest) {
    return { success: false, error: `Action tidak didukung: ${action}` };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const url = `${BACKEND_URL}${backendRequest.path}`;
    const adminRole = getCurrentAdminRole();

    const options: any = {
      method: backendRequest.method,
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-role': adminRole,
      },
    };

    const body = backendRequest.body !== undefined ? backendRequest.body : data;
    if (options.method !== 'GET' && body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    try {
      const result = JSON.parse(responseText);
      return result;
    } catch (_parseError) {
      if (responseText.toLowerCase().includes('success')) {
        return { success: true };
      }
      return {
        success: false,
        error: 'Format respon server tidak valid.',
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (retryCount < 1 && error.name !== 'AbortError') {
      return fetchFromSheet(action, data, retryCount + 1);
    }

    if (error.name === 'AbortError') {
      return { success: false, error: 'Koneksi lambat (Timeout). Silakan coba lagi.' };
    }

    let errorMessage = 'Gagal terhubung ke server. Pastikan internet stabil.';

    if (!window.navigator.onLine) {
      errorMessage = 'Koneksi internet terputus. Periksa wifi atau paket data Anda.';
    } else if (error.message && error.message.includes('Failed to fetch')) {
      errorMessage = 'Gagal terhubung ke backend (CORS/Network Error). Pastikan backend berjalan dan VITE_BACKEND_URL benar.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

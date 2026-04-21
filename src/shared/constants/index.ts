// View types untuk navigation
export type ViewType = 
  | 'DASHBOARD' 
  | 'CATEGORIES' 
  | 'PRODUCTS' 
  | 'TRANSACTIONS' 
  | 'REPORTS' 
  | 'VOUCHERS' 
  | 'MEMBER_LOG';

// API Actions - nama-nama action yang didukung backend
export const API_ACTIONS = {
  // Orders
  GET_ORDERS: 'getOrders',
  ADD_ORDER: 'addOrder',
  UPDATE_ORDER: 'updateOrder',
  DELETE_ORDER: 'deleteOrder',
  
  // Products
  GET_PRODUCTS: 'getProducts',
  ADD_PRODUCT: 'addProduct',
  UPDATE_PRODUCT: 'updateProduct',
  DELETE_PRODUCT: 'deleteProduct',
  
  // Categories
  GET_CATEGORIES: 'getCategories',
  ADD_CATEGORY: 'addCategory',
  UPDATE_CATEGORY: 'updateCategory',
  DELETE_CATEGORY: 'deleteCategory',
  
  // Vouchers
  GET_VOUCHERS: 'getVouchers',
  ADD_VOUCHER: 'addVoucher',
  UPDATE_VOUCHER: 'updateVoucher',
  DELETE_VOUCHER: 'deleteVoucher',
  
  // Members
  GET_MEMBERS: 'getMembers',
  GET_MEMBER_LOGS: 'getMemberLogs',
  UPDATE_MEMBER_POINTS: 'updateMemberPoints',
  
  // Transactions
  GET_TRANSACTIONS: 'getTransactions',
  GET_ORDER_DETAILS: 'getOrderDetails',
} as const;

// Sheet names di Google Sheets
export const SHEET_NAMES = {
  ORDERS: 'Orders',
  ORDER_DETAILS: 'OrderDetails',
  PRODUCTS: 'Products',
  CATEGORIES: 'Categories',
  VOUCHERS: 'Vouchers',
  MEMBERS: 'Members',
  MEMBER_LOGS: 'MemberLogs',
} as const;

// Pagination
export const PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_SIZE_LARGE: 25,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  CURRENT_ADMIN: 'current_admin',
  CURRENT_USER: 'current_user',
  THEME: 'theme_preference',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

// Menu items untuk Admin Sidebar
export const ADMIN_MENU_ITEMS = [
  { id: 'DASHBOARD' as ViewType, label: 'Overview', icon: '📊' },
  { id: 'CATEGORIES' as ViewType, label: 'Kategori', icon: '📂' },
  { id: 'PRODUCTS' as ViewType, label: 'Produk', icon: '📦' },
  { id: 'TRANSACTIONS' as ViewType, label: 'Pesanan', icon: '📝' },
  { id: 'REPORTS' as ViewType, label: 'Laporan', icon: '📈' },
  { id: 'VOUCHERS' as ViewType, label: 'Promo', icon: '🎫' },
  { id: 'MEMBER_LOG' as ViewType, label: 'Member', icon: '👥' },
] as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
  SERVER_ERROR: 'Server sedang bermasalah. Silakan coba beberapa saat lagi.',
  INVALID_INPUT: 'Input tidak valid. Silakan periksa kembali.',
  UNAUTHORIZED: 'Anda tidak memiliki akses. Silakan login kembali.',
  NOT_FOUND: 'Data tidak ditemukan.',
  TIMEOUT: 'Permintaan timeout. Silakan coba lagi.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Data berhasil disimpan.',
  UPDATED: 'Data berhasil diperbarui.',
  DELETED: 'Data berhasil dihapus.',
  CREATED: 'Data berhasil dibuat.',
} as const;

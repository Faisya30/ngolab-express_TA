
export type ViewType = 'DASHBOARD' | 'CATEGORIES' | 'PRODUCTS' | 'TRANSACTIONS' | 'REPORTS';

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  isRecommended: boolean;
  cashbackReward: number;
  product_type?: 'kiosk' | 'cv';
}

export interface Order {
  timestamp: string;
  orderId: string;
  service: 'Dine In' | 'Take Away';
  subtotal: number;
  discount: number;
  total: number;
  payment: string;
  member: string;
  voucher: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  QRIS = 'QRIS',
  E_WALLET = 'E-WALLET',
  CASH = 'CASH'
}

export interface TransactionItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  timestamp: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  status: OrderStatus;
  memberId?: string;
  items: TransactionItem[];
  discount: number;
  cashbackUsed: number;
}

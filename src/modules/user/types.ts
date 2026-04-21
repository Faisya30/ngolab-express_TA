export enum Screen {
  WELCOME = 'WELCOME',
  SERVICE_TYPE = 'SERVICE_TYPE',
  MENU = 'MENU',
  CART = 'CART',
  SCANNER = 'SCANNER',
  VOUCHER_SELECTION = 'VOUCHER_SELECTION',
  MEMBER_BENEFITS = 'MEMBER_BENEFITS',
  QRIS = 'QRIS',
  CASH = 'CASH',
  SUCCESS = 'SUCCESS',
}

export enum ServiceType {
  DINE_IN = 'Dine In',
  TAKE_AWAY = 'Take Away',
}

export enum PaymentMethod {
  QRIS = 'QRIS',
  CASH = 'Cash',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  isRecommended?: boolean;
  cashbackReward?: number;
}

export interface CartItem extends Product {
  quantity: number;
  isPaidWithKoin?: boolean;
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: 'PERCENT' | 'FIXED';
}

export interface Member {
  code: string;
  name: string;
  points: number;
  cashbackPoints: number;
  vouchers: Voucher[];
  isAffiliate?: boolean;
}

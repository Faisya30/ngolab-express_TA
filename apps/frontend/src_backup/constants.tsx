
import { Category, Product, Voucher, Member, Transaction, OrderStatus, PaymentMethod } from './types.ts';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'bakso', name: 'Bakso Malang', isActive: true },
  { id: 'mie', name: 'Mie Yamin', isActive: true },
  { id: 'addon', name: 'Lain - lain', isActive: true },
  { id: 'minum', name: 'Dorinku', isActive: true },
  { id: 'icecream', name: 'Dessert', isActive: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 'BKS-01', 
    name: 'Bakso Malang', 
    price: 20000, 
    category: 'bakso', 
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=400', 
    description: 'Bakso malang enak', 
    isRecommended: true, 
    cashbackReward: 1500
  },
  { 
    id: 'MIE-01', 
    name: 'Mie Yamin', 
    price: 14000, 
    category: 'mie', 
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400', 
    description: 'Mie bumbu rahasia', 
    isRecommended: false, 
    cashbackReward: 0
  },
];

export const INITIAL_VOUCHERS: Voucher[] = [
  { id: 'v1', title: 'DISKON20%', description: 'Hemat Banget', discount: 50, type: 'PERCENT' }
];

export const INITIAL_MEMBERS: Member[] = [
  { code: 'MEM-001', name: 'Faisya Cahyarani', cashbackPoints: 50000, isAffiliate: false },
  { code: 'MEM-002', name: 'Payiyi', cashbackPoints: 125000, isAffiliate: true },
  { code: 'NGOLAB-DEMO', name: 'Guest VIP', cashbackPoints: 7500, isAffiliate: false },
];

export const CHART_DATA = [
  { time: '08:00', sales: 120000 },
  { time: '10:00', sales: 450000 },
  { time: '12:00', sales: 980000 },
  { time: '14:00', sales: 720000 },
  { time: '16:00', sales: 540000 },
  { time: '18:00', sales: 890000 },
  { time: '20:00', sales: 1100000 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-001',
    orderNumber: 'ORD/20231027/001',
    timestamp: '2023-10-27T10:00:00Z',
    paymentMethod: PaymentMethod.QRIS,
    totalAmount: 34000,
    status: OrderStatus.COMPLETED,
    memberId: 'MEM-001',
    items: [
      { id: '1', productName: 'Bakso Malang', qty: 1, price: 20000, subtotal: 20000 },
      { id: '2', productName: 'Mie Yamin', qty: 1, price: 14000, subtotal: 14000 }
    ],
    discount: 0,
    cashbackUsed: 0
  }
];

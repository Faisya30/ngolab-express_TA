import { Product, Member, Voucher } from './types';

export const CATEGORIES = [
  { id: 'bakso', name: 'Bakso', icon: '🍲' },
  { id: 'mie', name: 'Mie Yamin', icon: '🍜' },
  { id: 'icecream', name: 'Es Krim', icon: '🍦' },
  { id: 'drinks', name: 'Minuman', icon: '🥤' },
];

export const DUMMY_VOUCHERS: Voucher[] = [
  { id: 'v1', title: 'DISKON PEMBUKA 50%', description: 'Potongan 50% hingga Rp 25.000 untuk pengguna baru', discount: 50, type: 'PERCENT' },
  { id: 'v2', title: 'POTONGAN RP 15.000', description: 'Potongan langsung Rp 15.000 tanpa minimal belanja', discount: 15000, type: 'FIXED' },
  { id: 'v3', title: 'CASHBACK SERU 20%', description: 'Cashback 20% dalam bentuk koin untuk semua menu', discount: 20, type: 'PERCENT' },
  { id: 'v4', title: 'DISKON MIE MANIA', description: 'Potongan Rp 10.000 khusus menu Mie Yamin', discount: 10000, type: 'FIXED' },
];

export const DUMMY_MEMBER: Member = {
  code: 'NGOLAB-DEMO-2020',
  name: 'Budi Hartono (VIP)',
  points: 12500,
  cashbackPoints: 50000,
  vouchers: DUMMY_VOUCHERS,
  isAffiliate: true,
};

export const PRODUCTS: Product[] = [
  {
    id: 'bk1',
    name: 'Bakso Malang Komplit',
    price: 35000,
    category: 'bakso',
    image: 'https://images.unsplash.com/photo-1629118541538-27f9172083bc?q=80&w=600&auto=format&fit=crop',
    description: 'Bakso urat, halus, siomay, dan pangsit goreng renyah.',
    isRecommended: true,
    cashbackReward: 2500,
  },
  {
    id: 'bk2',
    name: 'Bakso Super Urat',
    price: 38000,
    category: 'bakso',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=600&auto=format&fit=crop',
    description: 'Bakso urat jumbo dengan kuah kaldu sapi asli yang gurih.',
    isRecommended: true,
    cashbackReward: 3000,
  },
  {
    id: 'my1',
    name: 'Mie Yamin Manis Komplit',
    price: 32000,
    category: 'mie',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=600&auto=format&fit=crop',
    description: 'Mie kenyal bumbu manis, ayam cincang, dan kuah terpisah.',
    isRecommended: true,
    cashbackReward: 2000,
  },
  {
    id: 'my2',
    name: 'Mie Yamin Asin Ayam',
    price: 28000,
    category: 'mie',
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600&auto=format&fit=crop',
    description: 'Mie yamin asin klasik dengan topping ayam gurih.',
    isRecommended: false,
    cashbackReward: 1500,
  },
  {
    id: 'ic1',
    name: 'Vanilla Soft Serve',
    price: 12000,
    category: 'icecream',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=600&auto=format&fit=crop',
    description: 'Es krim vanilla lembut dalam cone renyah.',
    isRecommended: true,
    cashbackReward: 1000,
  },
  {
    id: 'dr1',
    name: 'Es Jeruk Peras',
    price: 15000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=600&auto=format&fit=crop',
    description: 'Jeruk segar asli diperas langsung dengan es batu.',
    isRecommended: true,
    cashbackReward: 1200,
  },
];

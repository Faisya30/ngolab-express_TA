/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Scan, 
  Users, 
  Gamepad2, 
  Package, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  TrendingUp, 
  Users2, 
  CreditCard,
  ChevronRight,
  Search,
  Bell,
  UserPlus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Mock Data ---

const APP_TYPES = [
  { id: 'kiosk', label: 'Kiosk', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100', adminUrl: '/admin/kiosk' },
  { id: 'cv', label: 'Computer Vision', icon: Scan, color: 'text-blue-600', bg: 'bg-blue-100', adminUrl: '/admin/cv' },
  { id: 'affiliate', label: 'Member & Afiliasi', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', adminUrl: '/admin/affiliate' },
  { id: 'game', label: 'Gamefication', icon: Gamepad2, color: 'text-orange-600', bg: 'bg-orange-100', adminUrl: '/admin/game' },
];

const ANALYTICS_DATA = [
  { name: 'Mon', sales: 4000, members: 240, orders: 2400 },
  { name: 'Tue', sales: 3000, members: 139, orders: 2210 },
  { name: 'Wed', sales: 2000, members: 980, orders: 2290 },
  { name: 'Thu', sales: 2780, members: 390, orders: 2000 },
  { name: 'Fri', sales: 1890, members: 480, orders: 2181 },
  { name: 'Sat', sales: 2390, members: 380, orders: 2500 },
  { name: 'Sun', sales: 3490, members: 430, orders: 2100 },
];

const INVENTORY = [
  { id: 'P001', name: 'Premium Coffee Beans', stock: 45, price: 120000, tag: 'kiosk' },
  { id: 'P002', name: 'Organic Green Tea', stock: 12, price: 85000, tag: 'cv' },
  { id: 'P003', name: 'Artisan Dark Chocolate', stock: 0, price: 45000, tag: 'kiosk' },
  { id: 'P004', name: 'Smart Retail Scale', stock: 8, price: 1500000, tag: 'cv' },
  { id: 'P005', name: 'Reusable Eco Bottle', stock: 120, price: 35000, tag: 'kiosk' },
];

const ADMINS = [
  { id: 1, username: 'superadmin', role: 'Super Admin', created_at: '2024-01-10' },
  { id: 2, username: 'kiosk_mgr', role: 'Kiosk Manager', created_at: '2024-02-15' },
  { id: 3, username: 'cv_analyst', role: 'CV Expert', created_at: '2024-03-01' },
  { id: 4, username: 'gamification', role: 'Game Manager', created_at: '2024-04-22' },
];

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm", className)}>
    {children}
  </div>
);

const Badge = ({ label, variant }: { label: string, variant: 'kiosk' | 'cv' | 'member' | 'system' }) => {
  const styles = {
    kiosk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cv: 'bg-blue-50 text-blue-700 border-blue-200',
    member: 'bg-purple-50 text-purple-700 border-purple-200',
    system: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize", styles[variant])}>
      {label}
    </span>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeApp, setActiveApp] = useState('kiosk');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const filteredInventory = useMemo(() => {
    return INVENTORY.filter(item => activeApp === 'all' || item.tag === activeApp || (activeApp !== 'kiosk' && activeApp !== 'cv'));
  }, [activeApp]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Specific credentials for the user
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Username atau Password salah. Gunakan admin / admin123');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl text-white mb-4 shadow-lg shadow-emerald-500/20">
              <TrendingUp size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Ngolab Express</h1>
            <p className="text-slate-400 mt-2">Super Admin Ecosystem Login</p>
          </div>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs text-center font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Users size={16} />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <CreditCard size={16} />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                <div className="text-[10px] text-emerald-500/80 leading-relaxed uppercase font-bold">
                  Demo Access:<br />
                  <span className="text-emerald-400">Username: admin</span><br />
                  <span className="text-emerald-400">Password: admin123</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98]"
              >
                Sign In to Dashboard
              </button>
            </form>
          </Card>

          <p className="text-center mt-8 text-slate-500 text-xs">
            &copy; 2024 Ngolab Express. All rights reserved.
            <br />
            Internal system for authorized personnel only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-lg z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight text-nowrap">Ngolab Express</span>
          </div>
          
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          
          <h1 className="text-sm font-medium text-slate-400 hidden lg:block">
            Super Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search resources..."
              className="pl-10 pr-4 py-1.5 bg-slate-800 border-transparent text-white placeholder:text-slate-500 focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-full text-sm w-64 transition-all outline-none"
            />
          </div>
          
          <div className="flex items-center gap-3 px-3">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white uppercase">{username}</span>
                <span className="text-[10px] text-slate-500">Super Admin</span>
              </div>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setUsername('');
                  setPassword('');
                }}
                className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-12">
          
          {/* Welcome & App Switcher (Mobile Toggle) */}
          <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Overview Dashboard</p>
              <h2 className="text-3xl font-bold text-zinc-900">Welcome Back, Admin</h2>
              <p className="text-zinc-500 text-sm mt-1">Hari ini ekosistem <span className="font-semibold text-zinc-700">Ngolab Express</span> terpantau stabil.</p>
            </div>
            
            {/* Quick App Context Switcher */}
            <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm w-fit">
              {APP_TYPES.slice(0, 4).map(app => (
                <div key={app.id} className="flex">
                  <button
                    onClick={() => setActiveApp(app.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                      activeApp === app.id 
                        ? "bg-zinc-900 text-white shadow-md" 
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <app.icon size={16} />
                    <span className="hidden sm:inline">{app.label}</span>
                    
                    {/* Explicit link to Admin Page when active */}
                    {activeApp === app.id && (
                      <a 
                        href={app.adminUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 p-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-md transition-colors flex items-center gap-1 text-[10px] animate-in fade-in slide-in-from-left-1"
                      >
                        <ChevronRight size={10} className="stroke-3" />
                        <span className="font-bold uppercase tracking-tighter">Admin</span>
                      </a>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Centralized Analytics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transform rotate-12 group-hover:rotate-0 transition-transform">
                <TrendingUp size={80} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Total Sales (IDR)</p>
                  <h3 className="text-2xl font-bold">Rp 154.200.000</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <TrendingUp size={14} />
                <span>+12.5% from last month</span>
              </div>
            </Card>

            <Card className="p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transform rotate-12 group-hover:rotate-0 transition-transform">
                <Users2 size={80} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Total Members</p>
                  <h3 className="text-2xl font-bold">8,432</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <TrendingUp size={14} />
                <span>+4.2% since yesterday</span>
              </div>
            </Card>

            <Card className="p-6 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transform rotate-12 group-hover:rotate-0 transition-transform">
                <ShoppingBag size={80} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Total Orders</p>
                  <h3 className="text-2xl font-bold">12,105</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-600">
                <TrendingUp size={14} />
                <span>+8.9% this week</span>
              </div>
            </Card>
          </section>

          {/* Revenue Chart */}
          <section>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Pendapatan Terpusat</h3>
                  <p className="text-sm text-zinc-500">Data gabungan dari Kiosk, CV, dan Afiliasi</p>
                </div>
                <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_DATA}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#71717a', fontSize: 12}} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#71717a', fontSize: 12}}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </section>

          {/* Data Tables Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Global Inventory Table */}
            <Card className="flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Global Inventory</h3>
                  <p className="text-sm text-zinc-500">Katalog produk lintas aplikasi</p>
                </div>
                <button className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                  View Full Catalog <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Produk</th>
                      <th className="px-6 py-3">Stok</th>
                      <th className="px-6 py-3">Harga</th>
                      <th className="px-6 py-3">Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-400">{item.id}</td>
                        <td className="px-6 py-4 font-semibold text-zinc-900">{item.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={item.stock === 0 ? 'text-rose-600' : 'text-zinc-700'}>
                              {item.stock} Units
                            </span>
                            <div className="w-20 h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", item.stock === 0 ? 'bg-rose-500' : 'bg-emerald-500')} 
                                style={{ width: `${Math.min(item.stock, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-700">Rp {item.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge label={item.tag} variant={item.tag as any} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* User Management Table */}
            <Card className="flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">User Management</h3>
                  <p className="text-sm text-zinc-500">Kelola admin dan hak akses</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Username</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Created At</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {ADMINS.map((admin) => (
                      <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-400">#{admin.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold border border-zinc-200 uppercase">
                              {admin.username.charAt(0)}
                            </div>
                            <span className="font-semibold text-zinc-900">{admin.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge label={admin.role} variant="system" />
                        </td>
                        <td className="px-6 py-4 text-zinc-500">{admin.created_at}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1 px-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors font-medium">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 mt-auto border-t border-zinc-100 text-center">
                <button className="text-zinc-500 hover:text-zinc-900 text-xs font-medium">
                  Lihat Semua Log Aktivitas
                </button>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

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
  UserPlus,
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
  Area,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm', className)}>
    {children}
  </div>
);

const Badge = ({ label, variant }: { label: string; variant: 'kiosk' | 'cv' | 'member' | 'system' }) => {
  const styles = {
    kiosk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cv: 'bg-blue-50 text-blue-700 border-blue-200',
    member: 'bg-purple-50 text-purple-700 border-purple-200',
    system: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', styles[variant])}>
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
    return INVENTORY.filter((item) => activeApp === 'all' || item.tag === activeApp || (activeApp !== 'kiosk' && activeApp !== 'cv'));
  }, [activeApp]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

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
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-lg z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight text-nowrap">Ngolab Express</span>
          </div>

          <div className="h-6 w-px bg-slate-700 hidden sm:block" />

          <h1 className="text-sm font-medium text-slate-400 hidden lg:block">Super Admin Dashboard</h1>
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
            <button
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-slate-900 text-white border-r border-slate-800 shrink-0 hidden lg:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold">Admin Center</h2>
            <p className="text-sm text-slate-400">Centralized operations and analytics</p>
          </div>

          <nav className="p-4 space-y-2">
            {APP_TYPES.map((app) => {
              const Icon = app.icon;
              const isActive = activeApp === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1 font-medium">{app.label}</span>
                  <ChevronRight size={16} className={isActive ? 'opacity-100' : 'opacity-40'} />
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <Card className="p-5">
              <p className="text-sm text-zinc-500 mb-2">Total Revenue</p>
              <div className="text-2xl font-bold text-zinc-900">Rp 128.4M</div>
              <div className="text-sm text-emerald-600 mt-2">+12.4% from last month</div>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-zinc-500 mb-2">Active Users</p>
              <div className="text-2xl font-bold text-zinc-900">2,413</div>
              <div className="text-sm text-blue-600 mt-2">+8.1% growth</div>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-zinc-500 mb-2">Orders Processed</p>
              <div className="text-2xl font-bold text-zinc-900">1,284</div>
              <div className="text-sm text-amber-600 mt-2">94% completion rate</div>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-zinc-500 mb-2">System Health</p>
              <div className="text-2xl font-bold text-zinc-900">99.98%</div>
              <div className="text-sm text-violet-600 mt-2">All services online</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <Card className="xl:col-span-2 p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Revenue Overview</h3>
                  <p className="text-sm text-zinc-500">Weekly performance metrics across all channels</p>
                </div>
                <Badge label="system" variant="system" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_DATA}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Quick Access</h3>
                  <p className="text-sm text-zinc-500">Switch between business modules</p>
                </div>
                <button className="p-2 bg-zinc-100 rounded-lg">
                  <Menu size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {APP_TYPES.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', app.bg)}>
                        <Icon size={18} className={app.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-zinc-900">{app.label}</div>
                        <div className="text-xs text-zinc-500 truncate">{app.adminUrl}</div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Category Distribution</h3>
                  <p className="text-sm text-zinc-500">Inventory split by active app type</p>
                </div>
                <Badge label={activeApp} variant={activeApp === 'cv' ? 'cv' : activeApp === 'kiosk' ? 'kiosk' : 'system'} />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Kiosk', value: INVENTORY.filter((i) => i.tag === 'kiosk').length },
                    { name: 'CV', value: INVENTORY.filter((i) => i.tag === 'cv').length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Inventory</h3>
                  <p className="text-sm text-zinc-500">Live items filtered by active module</p>
                </div>
                <button className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2">
                  <Plus size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-white">
                    <div>
                      <div className="font-semibold text-zinc-900">{item.name}</div>
                      <div className="text-xs text-zinc-500">ID: {item.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-zinc-900">{item.stock} pcs</div>
                      <div className="text-xs text-zinc-500">Rp {item.price.toLocaleString('id-ID')}</div>
                    </div>
                    <Badge label={item.tag} variant={item.tag === 'cv' ? 'cv' : 'kiosk'} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Admin Directory</h3>
                <p className="text-sm text-zinc-500">Internal access list for super admin monitoring</p>
              </div>
              <button className="px-3 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-semibold flex items-center gap-2 bg-white">
                <UserPlus size={16} /> Invite Admin
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-200">
                    <th className="py-3 font-medium">Username</th>
                    <th className="py-3 font-medium">Role</th>
                    <th className="py-3 font-medium">Created</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMINS.map((admin) => (
                    <tr key={admin.id} className="border-b border-zinc-100">
                      <td className="py-4 font-medium text-zinc-900">{admin.username}</td>
                      <td className="py-4 text-zinc-600">{admin.role}</td>
                      <td className="py-4 text-zinc-600">{admin.created_at}</td>
                      <td className="py-4"><Badge label="active" variant="system" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
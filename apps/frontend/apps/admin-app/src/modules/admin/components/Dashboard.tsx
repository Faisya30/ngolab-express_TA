
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface DashboardProps {
  orders: any[];
  orderDetails: any[];
  products: any[];
  onRefresh: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, orderDetails, products, onRefresh }) => {
  
  const parseSafeNumber = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Bersihkan semua karakter kecuali angka dan titik desimal
    const cleanStr = String(val).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const getValue = (row: any, aliases: string[], colLetter: string): any => {
    if (!row) return '';
    // Utamakan Kolom Huruf (Berdasarkan urutan Spreadsheet: A=a, B=b, dst)
    const letterKey = colLetter.toLowerCase();
    if (row[letterKey] !== undefined && row[letterKey] !== null && row[letterKey] !== '') {
        return row[letterKey];
    }
    // Fallback ke Nama Header
    for (const alias of aliases) {
      const key = alias.toLowerCase().replace(/\s/g, '');
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return '';
  };

  const stats = useMemo(() => {
    // 1. Total Revenue - Kolom F di sheet 'Orders'
    const totalRevenue = orders.reduce((acc, curr) => {
      const val = getValue(curr, ['total', 'grandtotal'], 'f');
      return acc + parseSafeNumber(val);
    }, 0);
    
    // 2. Total Transactions
    const totalOrdersCount = orders.length;
    
    // 3. Average Order
    const avgBasket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    
    // 4. Top Product - BERDASARKAN SCREENSHOT OrderDetails:
    // Kolom B (index 1) = Nama Produk
    // Kolom C (index 2) = Qty
    const productCounts: Record<string, number> = {};
    
    if (orderDetails && orderDetails.length > 0) {
      orderDetails.forEach(item => {
        const name = getValue(item, ['productname', 'namaproduk'], 'b');
        const qty = getValue(item, ['qty', 'quantity'], 'c');
        
        if (name && typeof name === 'string' && name.trim() !== '' && name.toLowerCase() !== 'unknown') {
          const quantity = parseSafeNumber(qty) || 1;
          const cleanName = name.trim();
          productCounts[cleanName] = (productCounts[cleanName] || 0) + quantity;
        }
      });
    }

    const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
    const bestSeller = sortedProducts.length > 0 ? sortedProducts[0][0] : 'No Data';

    return [
      { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString()}`, icon: '💰' },
      { label: 'Total Transactions', value: totalOrdersCount.toLocaleString(), icon: '🧾' },
      { label: 'Average Order', value: `Rp ${Math.round(avgBasket).toLocaleString()}`, icon: '🛒' },
      { label: 'Top Product', value: bestSeller, icon: '🔥' },
    ];
  }, [orders, orderDetails]);

  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {
      '08:00': 0, '10:00': 0, '12:00': 0, '14:00': 0, '16:00': 0, '18:00': 0, '20:00': 0
    };
    orders.forEach(order => {
      const ts = getValue(order, ['timestamp', 'waktu'], 'b');
      if (ts && typeof ts === 'string') {
        const match = ts.match(/(\d{2}):/);
        if (match) {
          const h = match[1];
          const key = ['08', '10', '12', '14', '16', '18', '20'].find(b => parseInt(h) >= parseInt(b) && parseInt(h) < parseInt(b)+2);
          if (key) {
            const rev = getValue(order, ['total', 'grandtotal'], 'f');
            buckets[`${key}:00`] += parseSafeNumber(rev);
          }
        }
      }
    });
    return Object.entries(buckets).map(([time, sales]) => ({ time, sales }));
  }, [orders]);

  const paymentData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      const method = String(getValue(o, ['payment', 'metode'], 'g') || 'CASH').toUpperCase();
      counts[method] = (counts[method] || 0) + 1;
    });
    const total = orders.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: name.includes('QRIS') ? '#2563eb' : '#10b981'
    }));
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Real-time Overview</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Live updates from kiosk terminal</p>
        </div>
        <button onClick={() => onRefresh()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 text-xs uppercase tracking-widest">
           Sync Live Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute -top-2 -right-2 text-4xl opacity-5 group-hover:scale-110 transition-transform">{stat.icon}</div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate" title={stat.value}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-8 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Sales Trend</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">Orders Chart</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(v) => `Rp${(v/1000).toLocaleString()}k`} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v: any) => [`Rp ${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Payment Types</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 700, fontSize: 11}} width={70} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

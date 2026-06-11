import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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
    const cleanStr = String(val).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const getValue = (row: any, aliases: string[], colLetter: string): any => {
    if (!row) return '';
    const letterKey = colLetter.toLowerCase();

    if (row[letterKey] !== undefined && row[letterKey] !== null && row[letterKey] !== '') {
      return row[letterKey];
    }

    for (const alias of aliases) {
      const key = alias.toLowerCase().replace(/\s/g, '');
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }

    return '';
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, curr) => {
      const val = getValue(curr, ['total', 'grandtotal'], 'f');
      return acc + parseSafeNumber(val);
    }, 0);

    const totalOrdersCount = orders.length;
    const avgBasket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

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
      { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString()}`, icon: '💰', color: 'blue', sub: '+12.5% vs yesterday' },
      { label: 'Total Transactions', value: totalOrdersCount.toLocaleString(), icon: '🧾', color: 'emerald', sub: '+8.7% vs yesterday' },
      { label: 'Average Order', value: `Rp ${Math.round(avgBasket).toLocaleString()}`, icon: '🛒', color: 'orange', sub: '+5.3% vs yesterday' },
      { label: 'Top Product', value: bestSeller, icon: '⭐', color: 'amber', sub: 'Best seller today' },
    ];
  }, [orders, orderDetails]);

  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {
      '08:00': 0,
      '10:00': 0,
      '12:00': 0,
      '14:00': 0,
      '16:00': 0,
      '18:00': 0,
      '20:00': 0,
    };

    orders.forEach(order => {
      const ts = getValue(order, ['timestamp', 'waktu'], 'b');

      if (ts && typeof ts === 'string') {
        const match = ts.match(/(\d{2}):/);

        if (match) {
          const h = match[1];

          const key = ['08', '10', '12', '14', '16', '18', '20'].find(
            b => parseInt(h) >= parseInt(b) && parseInt(h) < parseInt(b) + 2
          );

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
      color: name.includes('QRIS') ? '#2563eb' : '#10b981',
    }));
  }, [orders]);

  const salesSummary = useMemo(() => {
    const salesValues = chartData
      .map(item => item.sales)
      .filter(value => value > 0);

    const highestSales = salesValues.length > 0 ? Math.max(...salesValues) : 0;
    const lowestSales = salesValues.length > 0 ? Math.min(...salesValues) : 0;
    const averageSales =
      salesValues.length > 0
        ? salesValues.reduce((acc, val) => acc + val, 0) / salesValues.length
        : 0;

    return {
      highestSales,
      lowestSales,
      averageSales,
    };
  }, [chartData]);

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Real-time Overview
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Live updates from kiosk terminal
            </p>
          </div>
        </div>

        <button
          onClick={() => onRefresh()}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          Sync Live Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${
                  stat.color === 'blue'
                    ? 'bg-blue-50'
                    : stat.color === 'emerald'
                    ? 'bg-emerald-50'
                    : stat.color === 'orange'
                    ? 'bg-orange-50'
                    : 'bg-amber-50'
                }`}
              >
                {stat.icon}
              </div>

              <span className="text-[10px] font-bold text-emerald-500">↑</span>
            </div>

            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>

            <h3 className="truncate text-xl font-black tracking-tight text-slate-900" title={stat.value}>
              {stat.value}
            </h3>

            <p className="mt-2 text-[10px] font-bold text-slate-400">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 12l3-3 4 4 5-6M5 20h14" />
                </svg>
              </div>
              <h3 className="text-base font-black text-slate-900">Sales Trend</h3>
            </div>

            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-500">
              Today
            </span>
          </div>

          <div className="h-82.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(v) => `Rp${(v / 1000).toLocaleString()}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(v: any) => [`Rp ${v.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Highest Sales
              </p>
              <h4 className="mt-1 text-sm font-black text-slate-900">
                Rp {salesSummary.highestSales.toLocaleString()}
              </h4>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Lowest Sales
              </p>
              <h4 className="mt-1 text-sm font-black text-slate-900">
                Rp {salesSummary.lowestSales.toLocaleString()}
              </h4>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Average Sales
              </p>
              <h4 className="mt-1 text-sm font-black text-slate-900">
                Rp {Math.round(salesSummary.averageSales).toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
                </svg>
              </div>

              <h3 className="text-base font-black text-slate-900">Payment Types</h3>
            </div>

            <span className="text-xl font-black text-slate-300">⋮</span>
          </div>

          <div className="relative mx-auto h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black text-slate-900">{orders.length}</p>
              <p className="text-[11px] font-bold text-slate-400">Transactions</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {paymentData.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-xs font-black text-slate-700">{item.name}</p>
                  </div>
                  <p className="text-xs font-black text-slate-900">{item.value}%</p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}

            {paymentData.length === 0 && (
              <p className="text-center text-sm font-bold text-slate-400">
                No payment data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
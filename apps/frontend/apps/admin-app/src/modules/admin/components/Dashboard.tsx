import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  orders: any[];
  orderDetails: any[];
  products: any[];
  onRefresh: () => Promise<void>;
  period: 'day' | 'week' | 'month' | 'all';
  setPeriod: React.Dispatch<React.SetStateAction<'day' | 'week' | 'month' | 'all'>>;
}

const Dashboard: React.FC<DashboardProps> = ({
  orders,
  orderDetails,
  products,
  onRefresh,
  period,
  setPeriod,
}) => {
  const periodLabel =
    period === 'day'
      ? 'Hari Ini'
      : period === 'week'
      ? 'Minggu Ini'
      : period === 'month'
      ? 'Bulan Ini'
      : 'Semua Data';

  const parseSafeNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;

  const str = String(val).trim();

  if (/^\d+\.\d{2}$/.test(str)) {
    return Number(str);
  }

  const cleanStr = str
    .replace(/[^\d,-]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');

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

    orderDetails.forEach(item => {
      const name = getValue(item, ['product_name_snapshot', 'productname', 'namaproduk'], 'b');
      const qty = getValue(item, ['qty', 'quantity'], 'c');

      if (name && String(name).trim() !== '' && String(name).toLowerCase() !== 'unknown') {
        const quantity = parseSafeNumber(qty) || 1;
        const cleanName = String(name).trim();
        productCounts[cleanName] = (productCounts[cleanName] || 0) + quantity;
      }
    });

    const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
    const bestSeller = sortedProducts.length > 0 ? sortedProducts[0][0] : 'No Data';
const bestSellerQty = sortedProducts.length > 0 ? sortedProducts[0][1] : 0;

    return [
      { label: periodLabel, value: `Rp ${totalRevenue.toLocaleString()}`, icon: '💰', color: 'blue', sub: 'Total revenue periode aktif' },
      { label: 'Total Transactions', value: totalOrdersCount.toLocaleString(), icon: '🧾', color: 'emerald', sub: 'Transaksi periode aktif' },
      { label: 'Average Order', value: `Rp ${Math.round(avgBasket).toLocaleString()}`, icon: '🛒', color: 'orange', sub: 'Rata-rata per transaksi' },
      { label: 'Top Product', value: bestSeller, icon: '⭐', color: 'amber', sub: `${bestSellerQty} porsi terjual` },
    ];
  }, [orders, orderDetails, periodLabel]);

  const chartData = useMemo(() => {
  const buckets: Record<string, number> = {};

  if (period === 'day') {
    ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].forEach(
      key => (buckets[key] = 0)
    );
  }

  if (period === 'week') {
    ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].forEach(
      key => (buckets[key] = 0)
    );
  }

  orders.forEach(order => {
    const ts = getValue(order, ['created_at', 'timestamp', 'waktu'], 'b');
    if (!ts) return;

    const date = new Date(ts);
    const rev = parseSafeNumber(getValue(order, ['total', 'grandtotal'], 'f'));

    if (period === 'day') {
      const h = String(date.getHours()).padStart(2, '0');
      const key = ['08', '10', '12', '14', '16', '18', '20'].find(
        b => parseInt(h) >= parseInt(b) && parseInt(h) < parseInt(b) + 2
      );

      if (key) buckets[`${key}:00`] += rev;
    }

    if (period === 'week') {
      const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const key = dayLabels[date.getDay()];
      buckets[key] = (buckets[key] || 0) + rev;
    }

    if (period === 'month') {
      const key = String(date.getDate());
      buckets[key] = (buckets[key] || 0) + rev;
    }

    if (period === 'all') {
      const key = date.toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
      });
      buckets[key] = (buckets[key] || 0) + rev;
    }
  });

  return Object.entries(buckets).map(([time, sales]) => ({ time, sales }));
}, [orders, period]);

  const paymentData = useMemo(() => {
    const counts: Record<string, number> = {};

    orders.forEach(o => {
      const method = String(getValue(o, ['payment_method', 'payment', 'metode'], 'g') || 'CASH').toUpperCase();
      counts[method] = (counts[method] || 0) + 1;
    });

    const total = orders.length || 1;

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      value: Math.round((count / total) * 100),
    }));
  }, [orders]);

  const salesSummary = useMemo(() => {
    const salesValues = chartData.map(item => item.sales).filter(value => value > 0);

    const highestSales = salesValues.length > 0 ? Math.max(...salesValues) : 0;
    const lowestSales = salesValues.length > 0 ? Math.min(...salesValues) : 0;
    const averageSales =
      salesValues.length > 0
        ? salesValues.reduce((acc, val) => acc + val, 0) / salesValues.length
        : 0;

    return { highestSales, lowestSales, averageSales };
  }, [chartData]);

  const customerTypeData = useMemo(() => {
  const result = {
    member: { count: 0, revenue: 0 },
    guest: { count: 0, revenue: 0 },
  };

  orders.forEach(order => {
    const tipe = String(getValue(order, ['tipe_pelanggan', 'customer_type'], 'h') || 'guest').toLowerCase();
    const total = parseSafeNumber(getValue(order, ['total', 'grandtotal'], 'f'));

    if (tipe === 'member') {
      result.member.count += 1;
      result.member.revenue += total;
    } else {
      result.guest.count += 1;
      result.guest.revenue += total;
    }
  });

  return result;
}, [orders]);

const topProducts = useMemo(() => {
  const productCounts: Record<string, number> = {};

  orderDetails.forEach(item => {
    const name = getValue(item, ['product_name_snapshot', 'productname', 'namaproduk'], 'b');
    const qty = getValue(item, ['qty', 'quantity'], 'c');

    if (name && String(name).trim() !== '' && String(name).toLowerCase() !== 'unknown') {
      const cleanName = String(name).trim();
      productCounts[cleanName] = (productCounts[cleanName] || 0) + (parseSafeNumber(qty) || 1);
    }
  });

  return Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));
}, [orderDetails]);

  const latestOrders = orders.slice(0, 5);

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Real-time Overview
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Menampilkan data {periodLabel.toLowerCase()} secara real-time
          </p>
        </div>

        <button
          onClick={() => onRefresh()}
          className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          Sync Live Data
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'day', label: 'Hari Ini' },
          { key: 'week', label: 'Minggu Ini' },
          { key: 'month', label: 'Bulan Ini' },
          { key: 'all', label: 'Semua' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key as 'day' | 'week' | 'month' | 'all')}
            className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
              period === item.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-emerald-500">LIVE</span>
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
            <div>
              <h3 className="text-base font-black text-slate-900">Sales Trend</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">{periodLabel}</p>
            </div>

            <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-500">
              Revenue
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={12} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `Rp${(v / 1000).toLocaleString()}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                  formatter={(v: any) => [`Rp ${Number(v).toLocaleString()}`, 'Revenue']}
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Highest Sales</p>
              <h4 className="mt-1 text-sm font-black text-slate-900">Rp {salesSummary.highestSales.toLocaleString()}</h4>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lowest Sales</p>
              <h4 className="mt-1 text-sm font-black text-slate-900">Rp {salesSummary.lowestSales.toLocaleString()}</h4>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Sales</p>
              <h4 className="mt-1 text-sm font-black text-slate-900">Rp {Math.round(salesSummary.averageSales).toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Transaksi Terbaru</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">{periodLabel}</p>
            </div>

            <span className="rounded-xl bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600">
              Live
            </span>
          </div>

          <div className="space-y-3">
            {latestOrders.map((order, index) => {
              const orderCode = getValue(order, ['order_code', 'orderid'], 'a') || `Order ${index + 1}`;
              const total = parseSafeNumber(getValue(order, ['total', 'grandtotal'], 'f'));
              const payment = getValue(order, ['payment_method', 'payment'], 'g') || 'CASH';
              const createdAt = getValue(order, ['created_at', 'timestamp'], 'b');
              const time = createdAt
                ? new Date(createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '-';

              return (
                <div key={`${orderCode}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{orderCode}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-400">
                        {time} • {payment}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-blue-600">
                      Rp {total.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}

            {latestOrders.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
                Belum ada transaksi
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-black text-slate-900">Payment Types</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">{periodLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {paymentData.map((item) => (
            <div key={item.name} className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-500">{item.name}</p>
                <p className="text-xs font-black text-slate-400">{item.count} transaksi</p>
              </div>

              <h4 className="mt-2 text-2xl font-black text-slate-900">{item.value}%</h4>
            </div>
          ))}

          {paymentData.length === 0 && (
            <p className="text-sm font-bold text-slate-400">
              Belum ada data pembayaran
            </p>
          )}
        </div>
      </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Member Transactions
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-900">
                {customerTypeData.member.count}
              </h3>

              <p className="mt-2 text-sm font-bold text-blue-600">
                Rp {customerTypeData.member.revenue.toLocaleString()}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              👤
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Guest Transactions
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-900">
                {customerTypeData.guest.count}
              </h3>

              <p className="mt-2 text-sm font-bold text-emerald-600">
                Rp {customerTypeData.guest.revenue.toLocaleString()}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              👥
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h3 className="text-base font-black text-slate-900">
      Top 5 Produk Terlaris
    </h3>
    <p className="mt-1 text-xs font-bold text-slate-400">
      Berdasarkan jumlah produk terjual
    </p>
  </div>

  <div className="space-y-4">
    {topProducts.map((product, index) => (
      <div
        key={product.name}
        className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
            #{index + 1}
          </div>

          <div>
            <p className="font-black text-slate-900">
              {product.name}
            </p>

            <p className="text-xs font-bold text-slate-400">
              {product.qty} porsi terjual
            </p>
          </div>
        </div>

        <div className="text-sm font-black text-blue-600">
          {product.qty}
        </div>
      </div>
    ))}
  </div>
</div>
    </div>
    
  );
};

export default Dashboard;
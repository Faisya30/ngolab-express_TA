
import React from 'react';

const Reports: React.FC = () => {
  const reports = [
    { title: 'Total Penjualan', value: 'Rp 142,500,000', period: 'Bulan ini', icon: '💰' },
    { title: 'Total Order', value: '4,281', period: 'Bulan ini', icon: '📦' },
    { title: 'Rata-rata Order', value: 'Rp 33,285', period: 'Bulan ini', icon: '📈' },
    { title: 'Member Aktif', value: '820', period: 'Bulan ini', icon: '👥' },
  ];

  const topProducts = [
    { name: 'Nasi Goreng Spesial', sales: 1205, revenue: 'Rp 30.125.000' },
    { name: 'Caramel Macchiato', sales: 842, revenue: 'Rp 23.576.000' },
    { name: 'Es Teh Manis', sales: 750, revenue: 'Rp 3.750.000' },
    { name: 'Kentang Goreng', sales: 520, revenue: 'Rp 7.800.000' },
    { name: 'Chicken Wings', sales: 412, revenue: 'Rp 10.300.000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Operasional</h2>
          <p className="text-slate-500 text-sm">Rekapitulasi performa Kiosk Ngolab Express</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none">
            <option>Oktober 2023</option>
            <option>September 2023</option>
            <option>Agustus 2023</option>
          </select>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <span className="text-4xl">{report.icon}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{report.title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{report.value}</h3>
            <p className="text-xs text-blue-600 font-semibold mt-1">{report.period}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Produk Terlaris (Qty)</h3>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-6 text-sm font-bold text-slate-400">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-700">{p.name}</span>
                    <span className="text-xs font-medium text-slate-500">{p.sales} terjual</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(p.sales / topProducts[0].sales) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Ringkasan Pendapatan Produk</h3>
          <div className="space-y-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Produk</th>
                  <th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td className="py-3 text-sm font-medium text-slate-600">{p.name}</td>
                    <td className="py-3 text-right text-sm font-bold text-slate-800">{p.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

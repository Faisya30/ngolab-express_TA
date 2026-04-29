
import React, { useState, useMemo } from 'react';

interface Props {
  initialTransactions: any[];
  allOrderDetails?: any[];
  onRefresh?: () => Promise<void>;
}

type FilterType = 'ALL' | 'DINE_IN' | 'TAKE_AWAY';

const TransactionList: React.FC<Props> = ({ initialTransactions, allOrderDetails = [], onRefresh }) => {
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Normalisasi ID
  const normalizeId = (id: any): string => {
    if (id === null || id === undefined) return "";
    return String(id).replace(/#/g, '').trim().toLowerCase();
  };

  // Fungsi Pemformatan Waktu yang Cantik
  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    if (!dateStr) return { date: "-", time: "" };
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { date: dateStr, time: "" };

      const optionsDate: Intl.DateTimeFormatOptions = { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      };
      const optionsTime: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      };

      const d = new Intl.DateTimeFormat('id-ID', optionsDate).format(date);
      const t = new Intl.DateTimeFormat('id-ID', optionsTime).format(date);
      
      return { date: d, time: t };
    } catch (e) {
      return { date: dateStr, time: "" };
    }
  };

  const getValue = (row: any, aliases: string[], colLetter: string): any => {
    if (!row) return '';
    const letterKey = colLetter.toLowerCase();
    if (row[letterKey] !== undefined && row[letterKey] !== null && row[letterKey] !== '') {
      return row[letterKey];
    }
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s_]/g, '');
      if (row[cleanAlias] !== undefined && row[cleanAlias] !== null && row[cleanAlias] !== '') {
        return row[cleanAlias];
      }
    }
    return '';
  };

  // Seluruh transaksi yang sudah diproses & diurutkan
  const processedTransactions = useMemo(() => {
    if (!initialTransactions) return [];
    
    return initialTransactions
      .map(trx => {
        const rawId = getValue(trx, ['orderid', 'id'], 'a');
        const id = normalizeId(rawId);
        const total = getValue(trx, ['total', 'grandtotal'], 'f');
        const method = getValue(trx, ['payment', 'metode'], 'g');
        const customer = getValue(trx, ['member', 'customer'], 'h');
        const dateRaw = getValue(trx, ['timestamp', 'tanggal', 'date'], 'b');
        const service = getValue(trx, ['service', 'layanan'], 'c');
        const discount = getValue(trx, ['discount'], 'e');
        const subtotal = getValue(trx, ['subtotal'], 'd');

        return {
          ...trx,
          id,
          displayId: String(rawId).startsWith('#') ? rawId : `#${rawId}`,
          total: Number(String(total || 0).replace(/[^\d]/g, '')),
          method: String(method || 'CASH'),
          customer: String(customer || 'Guest'),
          date: dateRaw,
          timestamp: dateRaw ? new Date(dateRaw).getTime() : 0,
          service: String(service || 'Dine In'),
          discount: Number(String(discount || 0).replace(/[^\d]/g, '')),
          subtotal: Number(String(subtotal || 0).replace(/[^\d]/g, ''))
        };
      })
      .filter(t => t.id !== "" && t.id !== "orderid")
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [initialTransactions]);

  // Transaksi yang difilter untuk ditampilkan di tabel
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'ALL') return processedTransactions;
    return processedTransactions.filter(trx => {
      const service = trx.service.toLowerCase();
      if (activeFilter === 'DINE_IN') return service.includes('dine');
      if (activeFilter === 'TAKE_AWAY') return service.includes('take') || service.includes('bungkus');
      return true;
    });
  }, [processedTransactions, activeFilter]);

  // Hitung jumlah untuk badges
  const stats = useMemo(() => {
    return {
      all: processedTransactions.length,
      dineIn: processedTransactions.filter(t => t.service.toLowerCase().includes('dine')).length,
      takeAway: processedTransactions.filter(t => t.service.toLowerCase().includes('take') || t.service.toLowerCase().includes('bungkus')).length,
    };
  }, [processedTransactions]);

  const currentDetails = useMemo(() => {
    if (!selectedTrx || !allOrderDetails || allOrderDetails.length === 0) return [];
    const targetId = normalizeId(selectedTrx.id);
    return allOrderDetails.filter(detail => {
      const detailIdRaw = getValue(detail, ['orderid', 'id'], 'a');
      return normalizeId(detailIdRaw) === targetId;
    });
  }, [selectedTrx, allOrderDetails]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Order Logs</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Audit transaksi terminal • Real-time update</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95"
          >
            {isRefreshing ? (
               <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/50 p-1.5 rounded-3xl w-fit border border-slate-200/50">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-6 py-3 rounded-[1.1rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
        >
          Semua
          <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{stats.all}</span>
        </button>
        <button 
          onClick={() => setActiveFilter('DINE_IN')}
          className={`px-6 py-3 rounded-[1.1rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeFilter === 'DINE_IN' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
        >
          Dine In
          <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeFilter === 'DINE_IN' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{stats.dineIn}</span>
        </button>
        <button 
          onClick={() => setActiveFilter('TAKE_AWAY')}
          className={`px-6 py-3 rounded-[1.1rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeFilter === 'TAKE_AWAY' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
        >
          Take Away
          <span className={`px-2 py-0.5 rounded-lg text-[9px] ${activeFilter === 'TAKE_AWAY' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{stats.takeAway}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order ID</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu & Tanggal</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Layanan</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-10 py-32 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-20">
                      <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-600">Tidak ada data {activeFilter.replace('_', ' ')}</p>
                   </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((trx, idx) => {
                const { date, time } = formatDateTime(trx.date);
                const isDineIn = trx.service.toLowerCase().includes('dine');
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        <span className="font-mono text-[13px] font-black text-slate-800 tracking-tighter">{trx.displayId}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-700 uppercase">{date}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{time} WIB</span>
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <span className={`inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        isDineIn 
                          ? 'bg-blue-50 text-blue-600 border-blue-100' 
                          : 'bg-indigo-50 text-indigo-500 border-indigo-100'
                      }`}>
                        {trx.service}
                      </span>
                    </td>
                    <td className="px-10 py-5 font-black text-slate-900 text-sm tracking-tight">
                      Rp {trx.total.toLocaleString()}
                    </td>
                    <td className="px-10 py-5 text-right">
                      <button 
                        onClick={() => setSelectedTrx(trx)} 
                        className="p-3 text-slate-400 hover:text-white hover:bg-slate-900 bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-200 group-hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedTrx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                   <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Order Detail</h3>
                  <p className="text-slate-400 text-xs font-black uppercase mt-1 tracking-widest">{selectedTrx.displayId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTrx(null)} 
                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-500 bg-white rounded-full border border-slate-100 transition-all shadow-sm active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{selectedTrx.customer}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metode Bayar</p>
                  <p className="text-sm font-black text-emerald-600 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {selectedTrx.method}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</p>
                  <p className="text-sm font-black text-blue-500 uppercase">Paid & Completed</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu Pesanan</p>
                  <p className="text-[11px] font-black text-slate-800 uppercase">
                    {formatDateTime(selectedTrx.date).date} • {formatDateTime(selectedTrx.date).time}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Rincian Item</h4>
                   <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{currentDetails.length} Items</span>
                </div>
                
                <div className="max-h-72 overflow-y-auto rounded-4xl border border-slate-100 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
                      <tr className="bg-slate-50/50">
                        <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase">Produk</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase text-center">Qty</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase text-right">Harga</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentDetails.length > 0 ? currentDetails.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-5 px-8">
                            <p className="text-[13px] font-black text-slate-800 uppercase leading-none">{getValue(item, ['productname', 'name'], 'b')}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{getValue(item, ['category'], 'f')}</p>
                          </td>
                          <td className="py-5 px-8 text-center font-black text-slate-800 text-xs">{getValue(item, ['qty', 'quantity'], 'c')}x</td>
                          <td className="py-5 px-8 text-right font-bold text-slate-400 text-[11px]">Rp {Number(getValue(item, ['priceeach', 'price'], 'd') || 0).toLocaleString()}</td>
                          <td className="py-5 px-8 text-right font-black text-slate-800 text-sm">Rp {Number(getValue(item, ['totalitem', 'subtotal'], 'e') || 0).toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <p className="text-[11px] font-black uppercase text-rose-500 bg-rose-50 px-5 py-2 rounded-2xl border border-rose-100">Item data missing from sheet</p>
                              <p className="text-slate-400 text-[9px] uppercase tracking-widest">Verify 'OrderDetails' tab in spreadsheet</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-10 border-t-2 border-dashed border-slate-100 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                <div className="flex gap-10 items-center justify-center md:justify-start">
                   <div className="text-center md:text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</p>
                     <p className="text-lg font-black text-slate-700 tracking-tight">Rp {selectedTrx.subtotal.toLocaleString()}</p>
                   </div>
                   <div className="text-center md:text-left">
                     <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Discount</p>
                     <p className="text-lg font-black text-rose-500 tracking-tight">-Rp {selectedTrx.discount.toLocaleString()}</p>
                   </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-4xl text-center md:text-right shadow-xl shadow-slate-900/20">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Grand Total Dibayar</p>
                   <p className="text-4xl font-black text-white tracking-tighter">Rp {selectedTrx.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

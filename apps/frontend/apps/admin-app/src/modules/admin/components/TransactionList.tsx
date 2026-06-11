import React, { useState, useMemo } from 'react';

interface Props {
  orders: any[];
  orderDetails?: any[];
  allOrderDetails?: any[];
  onRefresh?: () => Promise<void>;
}

type FilterType = 'ALL' | 'DINE_IN' | 'TAKE_AWAY';

const TransactionList: React.FC<Props> = ({ orders, orderDetails, allOrderDetails = [], onRefresh }) => {
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const normalizeId = (id: any): string => {
    if (id === null || id === undefined) return '';
    return String(id).replace(/#/g, '').trim().toLowerCase();
  };

  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    if (!dateStr) return { date: '-', time: '' };

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { date: dateStr, time: '' };

      const d = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);

      const t = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);

      return { date: d, time: t };
    } catch (e) {
      return { date: dateStr, time: '' };
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

  const parseNumber = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;

    const str = String(value).trim();
    const num = parseFloat(str);

    return isNaN(num) ? 0 : num;
  };

  const processedTransactions = useMemo(() => {
    if (!orders) return [];
    console.log('RAW ORDERS:', orders);

    return orders
      .map(trx => {
        const rawId = getValue(trx, ['orderid', 'id'], 'a');
        const id = normalizeId(rawId);
        const total = getValue(trx, ['total', 'grandtotal'], 'f');
        const method = getValue(trx, ['payment', 'metode'], 'g');
        const customer = getValue(
          trx,
          [
            'nama_pelanggan',
            'namapelanggan',
            'customer',
            'member',
            'member_name',
            'membername',
            'username',
            'user_id',
            'userid',
            'member_code',
            'membercode',
          ],
          'h'
        );
        const dateRaw = getValue(trx, ['timestamp', 'tanggal', 'date'], 'b');
        const service = getValue(trx, ['service', 'layanan'], 'c');
        const discount = getValue(trx, ['discount'], 'e');
        const subtotal = getValue(trx, ['subtotal'], 'd');

        return {
          ...trx,
          id,
          displayId: String(rawId).startsWith('#') ? rawId : `#${rawId}`,
          total: parseNumber(total),
          method: String(method || 'CASH'),
          customer: String(customer || 'Guest'),
customerType: String(
  getValue(trx, ['tipe_pelanggan', 'tipepelanggan'], 'i') || ''
),
          date: dateRaw,
          timestamp: dateRaw ? new Date(dateRaw).getTime() : 0,
          service: String(service || 'Dine In'),
          discount: parseNumber(discount),
          subtotal: parseNumber(subtotal),
        };
      })
      .filter(t => t.id !== '' && t.id !== 'orderid')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'ALL') return processedTransactions;

    return processedTransactions.filter(trx => {
      const service = trx.service.toLowerCase();

      if (activeFilter === 'DINE_IN') return service.includes('dine');
      if (activeFilter === 'TAKE_AWAY') return service.includes('take') || service.includes('bungkus');

      return true;
    });
  }, [processedTransactions, activeFilter]);

  const stats = useMemo(() => {
    return {
      all: processedTransactions.length,
      dineIn: processedTransactions.filter(t => t.service.toLowerCase().includes('dine')).length,
      takeAway: processedTransactions.filter(
        t => t.service.toLowerCase().includes('take') || t.service.toLowerCase().includes('bungkus')
      ).length,
    };
  }, [processedTransactions]);

  const getDetailsByTransaction = (trx: any) => {
    if (!trx || !orderDetails || orderDetails.length === 0) return [];

    const targetId = normalizeId(trx.id);

    return orderDetails.filter(detail => {
      const detailIdRaw = getValue(detail, ['orderid', 'id'], 'a');
      return normalizeId(detailIdRaw) === targetId;
    });
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  const toggleDetail = (trx: any) => {
    if (selectedTrx?.id === trx.id) {
      setSelectedTrx(null);
    } else {
      setSelectedTrx(trx);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Order Logs
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Audit transaksi terminal • Real-time update
          </p>
          <div className="mt-3 h-1 w-12 rounded-full bg-blue-600" />
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 active:scale-95 disabled:opacity-70"
        >
          {isRefreshing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {isRefreshing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      <div className="flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {[
          { key: 'ALL' as FilterType, label: 'Semua', count: stats.all },
          { key: 'DINE_IN' as FilterType, label: 'Dine In', count: stats.dineIn },
          { key: 'TAKE_AWAY' as FilterType, label: 'Take Away', count: stats.takeAway },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveFilter(item.key)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === item.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
          >
            {item.label}
            <span
              className={`rounded-lg px-2 py-0.5 text-[9px] ${activeFilter === item.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full in-w-237.5 border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Waktu & Tanggal
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  ID Transaksi
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Layanan
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Customer
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Metode
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-50">
                      <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        Tidak ada data {activeFilter.replace('_', ' ')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, idx) => {
                  const { date, time } = formatDateTime(trx.date);
                  const isDineIn = trx.service.toLowerCase().includes('dine');
                  const methodIsQris = trx.method.toLowerCase().includes('qris');
                  const isSelected = selectedTrx?.id === trx.id;
                  const details = getDetailsByTransaction(trx);

                  return (
                    <React.Fragment key={idx}>
                      <tr className={`group transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-blue-50/20'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>

                            <div>
                              <p className="text-sm font-black text-slate-900">{time || '-'}</p>
                              <p className="mt-0.5 text-[10px] font-bold text-slate-400">{date}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-orange-50 px-3 py-1.5 font-mono text-[10px] font-black uppercase text-orange-500">
                            {trx.displayId}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${isDineIn ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                              }`}
                          >
                            {trx.service}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900">
  {trx.customer}
</p>
{trx.customerType.toLowerCase() === 'member' && (
  <p className="mt-1 text-[10px] font-black uppercase text-blue-500">
    Member
  </p>
)}
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900">
                            Rp {trx.total.toLocaleString()}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${methodIsQris ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'
                              }`}
                          >
                            {trx.method}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleDetail(trx)}
                            className={`rounded-xl border px-4 py-2 text-xs font-black transition-all ${isSelected
                                ? 'border-blue-200 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                          >
                            {isSelected ? 'Tutup' : 'Detail'}
                          </button>
                        </td>
                      </tr>

                      {isSelected && (
                        <tr className="bg-blue-50/20">
                          <td colSpan={7} className="px-6 pb-6">
                            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.5fr]">
                                <div className="rounded-2xl bg-slate-50 p-5">
                                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-900">
                                    Detail Pesanan
                                  </h4>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Customer
                                      </p>
                                      <p className="mt-1 text-sm font-black uppercase text-slate-900">
                                        {trx.customer}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Metode Bayar
                                      </p>
                                      <p className="mt-1 text-sm font-black uppercase text-emerald-600">
                                        {trx.method}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Status
                                      </p>
                                      <p className="mt-1 text-sm font-black uppercase text-blue-600">
                                        Paid & Completed
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Waktu Pesanan
                                      </p>
                                      <p className="mt-1 text-xs font-black uppercase text-slate-900">
                                        {date} • {time}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-white">
                                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                                      Rincian Item ({details.length} Item)
                                    </h4>
                                  </div>

                                  <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                      <tr>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase text-slate-500">
                                          Produk
                                        </th>
                                        <th className="px-5 py-3 text-center text-[10px] font-black uppercase text-slate-500">
                                          Qty
                                        </th>
                                        <th className="px-5 py-3 text-right text-[10px] font-black uppercase text-slate-500">
                                          Harga
                                        </th>
                                        <th className="px-5 py-3 text-right text-[10px] font-black uppercase text-slate-500">
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-50">
                                      {details.length > 0 ? (
                                        details.map((item, i) => (
                                          <tr key={i}>
                                            <td className="px-5 py-4">
                                              <p className="text-sm font-black uppercase text-slate-900">
                                                {getValue(item, ['productname', 'name'], 'b')}
                                              </p>
                                              <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                                                {getValue(item, ['category'], 'f')}
                                              </p>
                                            </td>
                                            <td className="px-5 py-4 text-center text-xs font-black text-slate-900">
                                              {getValue(item, ['qty', 'quantity'], 'c')}x
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                                              Rp {parseNumber(getValue(item, ['priceeach', 'price'], 'd')).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm font-black text-slate-900">
                                              Rp {parseNumber(getValue(item, ['totalitem', 'subtotal'], 'e')).toLocaleString()}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={4} className="py-10 text-center">
                                            <p className="inline-flex rounded-2xl border border-rose-100 bg-rose-50 px-5 py-2 text-[11px] font-black uppercase text-rose-500">
                                              Item data missing from sheet
                                            </p>
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="mt-5 grid grid-cols-1 items-center gap-5 border-t-2 border-dashed border-slate-100 pt-5 md:grid-cols-2">
                                <div className="flex gap-8">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      Subtotal
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-700">
                                      Rp {trx.subtotal.toLocaleString()}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                                      Discount
                                    </p>
                                    <p className="mt-1 text-lg font-black text-rose-500">
                                      -Rp {trx.discount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-blue-600 p-5 text-right shadow-xl shadow-blue-600/20">
                                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">
                                    Grand Total Dibayar
                                  </p>
                                  <p className="text-3xl font-black tracking-tight text-white">
                                    Rp {trx.total.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-500">
        Menampilkan 1 - {filteredTransactions.length} dari {processedTransactions.length} transaksi
      </p>
    </div>
  );
};

export default TransactionList;
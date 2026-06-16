import React, { useState, useMemo } from 'react';

interface Props {
  orders: any[];
  orderDetails?: any[];
  allOrderDetails?: any[];
  onRefresh?: () => Promise<void>;
}

type FilterType = 'ALL' | 'DINE_IN' | 'TAKE_AWAY';

const TransactionList: React.FC<Props> = ({
  orders,
  orderDetails = [],
  allOrderDetails = [],
  onRefresh,
}) => {
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const normalizeId = (id: any): string => {
    if (id === null || id === undefined) return '';
    return String(id).replace(/#/g, '').trim().toLowerCase();
  };

  const getValue = (row: any, aliases: string[], colLetter = ''): any => {
    if (!row) return '';

    const normalizeKey = (key: string) =>
      key.toLowerCase().replace(/[\s_]/g, '');

    const possibleKeys = [colLetter, ...aliases].filter(Boolean);

    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }

    const rowKeys = Object.keys(row);

    for (const alias of possibleKeys) {
      const foundKey = rowKeys.find(
        key => normalizeKey(key) === normalizeKey(alias)
      );

      if (
        foundKey &&
        row[foundKey] !== undefined &&
        row[foundKey] !== null &&
        row[foundKey] !== ''
      ) {
        return row[foundKey];
      }
    }

    return '';
  };

  const parseNumber = (value: any): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;

    const str = String(value).replace(/[^\d.-]/g, '').trim();
    const num = parseFloat(str);

    return isNaN(num) ? 0 : num;
  };

  const formatRupiah = (value: any): string => {
    return Number(value || 0).toLocaleString('id-ID');
  };

  const formatDateTime = (dateStr: string): { date: string; time: string } => {
    if (!dateStr) return { date: '-', time: '-' };

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { date: String(dateStr), time: '-' };

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
    } catch (_e) {
      return { date: String(dateStr), time: '-' };
    }
  };

  const processedTransactions = useMemo(() => {
    if (!orders) return [];

    console.log('RAW ORDERS:', orders);
    console.log('RAW ORDER DETAILS:', orderDetails);
    console.log('RAW ALL ORDER DETAILS:', allOrderDetails);

    return orders
      .map(trx => {
        const rawId = getValue(trx, ['id', 'order_id', 'orderid'], 'a');

        const orderCode = getValue(trx, ['order_code', 'ordercode', 'code'], '');
        const total = getValue(trx, ['total', 'grand_total', 'grandtotal'], 'f');
        const method = getValue(trx, ['payment_method', 'payment', 'metode'], 'g');

        const customer = getValue(
          trx,
          [
            'nama_pelanggan',
            'namapelanggan',
            'customer_name',
            'customer',
            'member_name',
            'membername',
            'full_name',
            'fullname',
            'username',
            'user_id',
            'userid',
          ],
          'h'
        );

        const customerType = getValue(
          trx,
          ['tipe_pelanggan', 'tipepelanggan', 'customer_type', 'customertype'],
          'i'
        );

        const dateRaw = getValue(
          trx,
          ['created_at', 'createdAt', 'timestamp', 'tanggal', 'date'],
          'b'
        );

        const service = getValue(
          trx,
          ['service_type', 'service', 'layanan', 'order_type', 'ordertype'],
          'c'
        );

        const discount = getValue(trx, ['discount'], 'e');
        const subtotal = getValue(trx, ['subtotal'], 'd');

        return {
          ...trx,
          id: normalizeId(rawId),
          rawId,
          displayId: orderCode || `#${rawId}`,
          total: parseNumber(total),
          method: String(method || 'CASH'),
          customer: String(customer || 'Guest'),
          customerType: String(customerType || ''),
          date: dateRaw,
          timestamp: dateRaw ? new Date(dateRaw).getTime() : 0,
          service: String(service || 'Dine In'),
          discount: parseNumber(discount),
          subtotal: parseNumber(subtotal),
        };
      })
      .filter(t => t.id !== '' && t.id !== 'orderid')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, orderDetails, allOrderDetails]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'ALL') return processedTransactions;

    return processedTransactions.filter(trx => {
      const service = trx.service.toLowerCase();

      if (activeFilter === 'DINE_IN') return service.includes('dine');
      if (activeFilter === 'TAKE_AWAY') {
        return service.includes('take') || service.includes('bungkus');
      }

      return true;
    });
  }, [processedTransactions, activeFilter]);

  const stats = useMemo(() => {
    return {
      all: processedTransactions.length,
      dineIn: processedTransactions.filter(t =>
        t.service.toLowerCase().includes('dine')
      ).length,
      takeAway: processedTransactions.filter(t => {
        const service = t.service.toLowerCase();
        return service.includes('take') || service.includes('bungkus');
      }).length,
    };
  }, [processedTransactions]);

  const getDetailsByTransaction = (trx: any) => {
    const detailsSource =
      orderDetails && orderDetails.length > 0 ? orderDetails : allOrderDetails;

    if (!trx || !detailsSource || detailsSource.length === 0) return [];

    const targetId = normalizeId(trx.id);

    return detailsSource.filter(detail => {
      const detailOrderId = getValue(
        detail,
        ['order_id', 'orderid', 'orderId'],
        'a'
      );

      return normalizeId(detailOrderId) === targetId;
    });
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const toggleDetail = (trx: any) => {
    setSelectedTrx(selectedTrx?.id === trx.id ? null : trx);
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
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
              activeFilter === item.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {item.label}
            <span
              className={`rounded-lg px-2 py-0.5 text-[9px] ${
                activeFilter === item.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
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
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Tidak ada data {activeFilter.replace('_', ' ')}
                    </p>
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
                    <React.Fragment key={`${trx.id}-${idx}`}>
                      <tr
                        className={`group transition-colors ${
                          isSelected ? 'bg-blue-50/30' : 'hover:bg-blue-50/20'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900">
                            {time || '-'}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                            {date}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-orange-50 px-3 py-1.5 font-mono text-[10px] font-black uppercase text-orange-500">
                            {trx.displayId}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                              isDineIn
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-indigo-50 text-indigo-600'
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
                            Rp {formatRupiah(trx.total)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                              methodIsQris
                                ? 'bg-orange-50 text-orange-500'
                                : 'bg-emerald-50 text-emerald-500'
                            }`}
                          >
                            {trx.method}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleDetail(trx)}
                            className={`rounded-xl border px-4 py-2 text-xs font-black transition-all ${
                              isSelected
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
                                        details.map((item, i) => {
                                          const productName = getValue(
                                            item,
                                            [
                                              'product_name_snapshot',
                                              'productnamesnapshot',
                                              'product_name',
                                              'productname',
                                              'name',
                                            ],
                                            'b'
                                          );

                                          const qty = getValue(
                                            item,
                                            ['qty', 'quantity'],
                                            'c'
                                          );

                                          const price = getValue(
                                            item,
                                            [
                                              'price_snapshot',
                                              'pricesnapshot',
                                              'price_each',
                                              'priceeach',
                                              'price',
                                            ],
                                            'd'
                                          );

                                          const itemSubtotal = getValue(
                                            item,
                                            ['subtotal', 'total_item', 'totalitem'],
                                            'e'
                                          );

                                          return (
                                            <tr key={i}>
                                              <td className="px-5 py-4">
                                                <p className="text-sm font-black uppercase text-slate-900">
                                                  {productName || '-'}
                                                </p>
                                              </td>

                                              <td className="px-5 py-4 text-center text-xs font-black text-slate-900">
                                                {qty || 0}x
                                              </td>

                                              <td className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                                                Rp {formatRupiah(parseNumber(price))}
                                              </td>

                                              <td className="px-5 py-4 text-right text-sm font-black text-slate-900">
                                                Rp {formatRupiah(parseNumber(itemSubtotal))}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      ) : (
                                        <tr>
                                          <td colSpan={4} className="py-10 text-center">
                                            <p className="inline-flex rounded-2xl border border-rose-100 bg-rose-50 px-5 py-2 text-[11px] font-black uppercase text-rose-500">
                                              Item data missing from order_items
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
                                      Rp {formatRupiah(trx.subtotal)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                                      Discount
                                    </p>
                                    <p className="mt-1 text-lg font-black text-rose-500">
                                      -Rp {formatRupiah(trx.discount)}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-blue-600 p-5 text-right shadow-xl shadow-blue-600/20">
                                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-blue-100">
                                    Grand Total Dibayar
                                  </p>
                                  <p className="text-3xl font-black tracking-tight text-white">
                                    Rp {formatRupiah(trx.total)}
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
        Menampilkan {filteredTransactions.length > 0 ? 1 : 0} -{' '}
        {filteredTransactions.length} dari {processedTransactions.length} transaksi
      </p>
    </div>
  );
};

export default TransactionList;
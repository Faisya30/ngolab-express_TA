import React, { useMemo } from 'react';

interface AffiliateDashboardProps {
  onRefresh: () => Promise<void>;
  hubData: any;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: string; color: string }> = ({ 
  label, value, icon, color 
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-lg">
        {icon}
      </div>
    </div>
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label}
    </p>
    <h3 className="truncate text-xl font-black tracking-tight text-slate-900" title={String(value)}>
      {typeof value === 'number' && label.includes('Komisi') 
        ? `Rp ${value.toLocaleString()}` 
        : value.toLocaleString()}
    </h3>
  </div>
);

const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ onRefresh, hubData }) => {
  const stats = useMemo(() => {
    if (!hubData) return [];
    
    return [
      { label: 'Total Users', value: hubData.total_users || 0, icon: '👥', color: 'blue' },
      { label: 'Member Aktif', value: hubData.active_members || 0, icon: '👤', color: 'emerald' },
      { label: 'Afiliator Aktif', value: hubData.active_affiliates || 0, icon: '🤝', color: 'purple' },
      { label: 'Total Komisi', value: hubData.total_commission || 0, icon: '💰', color: 'orange' },
    ];
  }, [hubData]);

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Member & Affiliate Dashboard
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ringkasan data member dan afiliasi
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard 
            key={i}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
};

export default AffiliateDashboard;
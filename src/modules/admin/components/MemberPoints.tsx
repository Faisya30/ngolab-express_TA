
import React, { useMemo, useState } from 'react';
import { Member } from '../../../types';

interface Props {
  members: Member[];
  rawLogs: any[];
  onRefresh: () => Promise<void>;
}

const MemberPoints: React.FC<Props> = ({ members, rawLogs, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  // Fungsi helper untuk mengambil data berdasarkan huruf kolom (a, b, c...) atau alias
  const getValue = (row: any, aliases: string[], colLetter: string): any => {
    if (!row) return '';
    const letterKey = colLetter.toLowerCase();
    
    // Cek berdasarkan huruf kolom dulu (A=a, B=b, dst)
    if (row[letterKey] !== undefined && row[letterKey] !== null && row[letterKey] !== '') {
      return row[letterKey];
    }
    
    // Fallback ke alias header jika huruf kolom tidak ketemu
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[\s_]/g, '');
      if (row[cleanAlias] !== undefined && row[cleanAlias] !== null && row[cleanAlias] !== '') {
        return row[cleanAlias];
      }
    }
    return '';
  };

  const parseNum = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    // Bersihkan format ribuan Indonesia
    const cleanStr = String(val).replace(/[^\d,-]/g, '').replace(/,/g, '.');
    return parseFloat(cleanStr) || 0;
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await onRefresh();
    setIsSyncing(false);
  };

  // 1. Memproses Data Member (Master Saldo dari sheet 'Members')
  const normalizedMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    
    return members.map(m => {
      const code = String(getValue(m, ['code', 'membercode'], 'a')).trim();
      // Skip jika ini adalah baris header
      if (code.toLowerCase() === 'code' || code.toLowerCase() === 'member code') return null;

      return {
        code: code,
        name: getValue(m, ['name', 'membername'], 'b') || 'No Name',
        points: parseNum(getValue(m, ['cashbackpoints', 'points'], 'c')),
        isAffiliate: String(getValue(m, ['isaffiliate'], 'd')).toLowerCase() === 'true' || 
                     String(getValue(m, ['isaffiliate'], 'd')).toLowerCase() === 'yes'
      };
    }).filter(m => m !== null && m.code !== '');
  }, [members]);

  // 2. Memproses Riwayat (Log dari sheet 'MemberLog')
  const validLogRows = useMemo(() => {
    return rawLogs.filter(row => {
      const ts = getValue(row, ['timestamp'], 'a');
      const code = getValue(row, ['membercode', 'code'], 'b');
      // Pastikan bukan header
      return ts && 
             String(ts).toLowerCase() !== 'timestamp' && 
             code && 
             String(code).toLowerCase() !== 'member code';
    });
  }, [rawLogs]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Database <span className="text-blue-600">Member</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-slate-200"></span>
            Poin & Loyalitas Terminal
          </p>
        </div>
        
        <button onClick={handleSync} disabled={isSyncing} className="px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95 disabled:opacity-50">
          {isSyncing ? <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          {isSyncing ? 'Syncing...' : 'Update Data'}
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {normalizedMembers.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 opacity-60">
             <div className="text-4xl mb-4">📭</div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center px-6">
               Data member tidak ditemukan.<br/>Pastikan sheet 'Members' sudah terisi.
             </p>
          </div>
        ) : normalizedMembers.map((member, idx) => (
          <div key={idx} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                {member.isAffiliate && <span className="px-3 py-1 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">Affiliate</span>}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter truncate leading-none">{member.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Code: {member.code}</p>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Saldo Cashback</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-blue-600 tracking-tight">PTS: {member.points.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Log Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mt-12">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">Riwayat Poin (Log)</h3>
           <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">{validLogRows.length} Transaksi Tercatat</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Earned</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Used</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Affiliate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {validLogRows.length === 0 ? (
                <tr><td colSpan={6} className="px-10 py-20 text-center opacity-30 italic text-sm">Tidak ada riwayat transaksi poin</td></tr>
              ) : validLogRows.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-10 py-4 text-[11px] font-bold text-slate-500">{getValue(row, ['timestamp'], 'a')}</td>
                  <td className="px-10 py-4">
                    <p className="text-[12px] font-black text-slate-800 uppercase leading-none">{getValue(row, ['membername', 'name'], 'c')}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{getValue(row, ['membercode', 'code'], 'b')}</p>
                  </td>
                  <td className="px-10 py-4 font-mono text-xs text-slate-400">#{getValue(row, ['orderid', 'id'], 'd')}</td>
                  <td className="px-10 py-4 text-center"><span className="text-[11px] font-black text-emerald-500">+{parseNum(getValue(row, ['pointsearned', 'earned'], 'e')).toLocaleString()}</span></td>
                  <td className="px-10 py-4 text-center"><span className="text-[11px] font-black text-rose-500">-{parseNum(getValue(row, ['pointsused', 'used'], 'f')).toLocaleString()}</span></td>
                  <td className="px-10 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${String(getValue(row, ['affiliate'], 'g')).toLowerCase() === 'yes' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                      {String(getValue(row, ['affiliate'], 'g')).toLowerCase() === 'yes' ? 'YES' : 'NO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberPoints;

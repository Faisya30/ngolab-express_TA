
import React, { useState } from 'react';
import { Voucher } from '../../../types';
import { fetchFromSheet } from '@ngolab/shared-lib';

interface Props {
  initialVouchers: Voucher[];
  onUpdate: () => void;
}

const VoucherManagement: React.FC<Props> = ({ initialVouchers, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus voucher ini?')) return;
    const result = await fetchFromSheet('deleteRow', { sheetName: 'Vouchers', id });
    if (result.success) onUpdate();
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const voucherData: Voucher = {
      id: editingVoucher?.id || `VOU-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      discount: Number(formData.get('discount')),
      type: formData.get('type') as 'PERCENT' | 'VALUE',
    };
    const result = await fetchFromSheet('saveVoucher', { voucher: voucherData });
    if (result.success) {
      onUpdate();
      setIsModalOpen(false);
      setEditingVoucher(null);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Promotions</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Manage Discount & Vouchers</p>
        </div>
        <button 
          onClick={() => { setEditingVoucher(null); setIsModalOpen(true); }} 
          className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Create New Voucher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {initialVouchers.map((v) => (
          <div key={v.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 text-5xl opacity-5 group-hover:scale-125 transition-transform duration-700">🎟️</div>
            <div className="flex justify-between items-start mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100">🏷️</div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingVoucher(v); setIsModalOpen(true); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(v.id)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-10">
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{v.title}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{v.description}</p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-dashed border-slate-100">
              <div className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100">
                {v.type === 'PERCENT' ? `${v.discount}% Reduction` : `Rp${Number(v.discount).toLocaleString()} Discount`}
              </div>
              <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">#{v.id.slice(-6)}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 border border-white/20 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Voucher Hub</h3>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Voucher Code</label>
                  <input name="title" required defaultValue={editingVoucher?.title} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-800 uppercase tracking-widest" placeholder="PROMO2024" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reward Type</label>
                    <select name="type" defaultValue={editingVoucher?.type || 'PERCENT'} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-600 appearance-none">
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="VALUE">Value (IDR)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
                    <input name="discount" type="number" required defaultValue={editingVoucher?.discount} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-blue-600" />
                  </div>
                </div>
                <div className="flex gap-4 pt-8">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                   <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">{isSaving ? 'Processing...' : 'Deploy Voucher'}</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;

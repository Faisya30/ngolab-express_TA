
import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '../../../types';
import { fetchFromSheet } from '../../../shared/services/api';

interface CategoryManagementProps {
  initialCategories: Category[];
  onUpdate: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ initialCategories, onUpdate }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const executeDelete = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);
    
    try {
      const result = await fetchFromSheet('deleteRow', { sheetName: 'Categories', id: id });
      if (result && result.success) {
        onUpdate();
        setConfirmDeleteId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const categoryData: Category = {
      id: editingCategory?.id || `CAT-${Date.now()}`,
      name: (formData.get('name') as string).toUpperCase(),
      isActive: editingCategory ? editingCategory.isActive : true
    };

    try {
      const result = await fetchFromSheet('saveCategory', { category: categoryData });
      if (result.success) {
        onUpdate();
        setIsModalOpen(false);
        setEditingCategory(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getGradient = (name: string) => {
    const colors = [
      'from-blue-400 to-indigo-400',
      'from-indigo-400 to-blue-400',
      'from-emerald-400 to-teal-400',
      'from-amber-400 to-orange-400',
      'from-violet-400 to-purple-400'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Category <span className="text-blue-600">Hub</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-slate-200"></span>
            Struktur Menu Terminal
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-200 transition-all w-64 shadow-sm"
            />
            <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <button 
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className="px-8 py-3.5 bg-slate-900 rounded-2xl text-[11px] font-black text-white hover:bg-pink-500 shadow-xl shadow-slate-900/10 hover:shadow-pink-500/20 transition-all active:scale-95 uppercase tracking-widest flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Add New
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-60">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4">📂</div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Tidak Ada Kategori Ditemukan</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 relative overflow-hidden">
              {/* Background Decor */}
              <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${getGradient(cat.name)} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className={`w-14 h-14 bg-gradient-to-br ${getGradient(cat.name)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/10`}>
                  {cat.name.charAt(0)}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  
                  {confirmDeleteId === cat.id ? (
                    <div className="flex items-center gap-1 animate-in slide-in-from-right-1">
                      <button onClick={() => executeDelete(cat.id)} disabled={isDeleting} className="w-10 h-10 bg-rose-500 text-white rounded-xl text-[9px] font-black hover:bg-rose-600 shadow-md transition-all">{isDeleting ? '...' : 'OK'}</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black hover:bg-slate-200 transition-all">NO</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(cat.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{cat.id}</p>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate">{cat.name}</h3>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active In Kiosk
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{editingCategory ? 'Update' : 'Add'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Category Master</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Kategori</label>
                <input 
                  name="name" 
                  required 
                  autoFocus
                  defaultValue={editingCategory?.name} 
                  className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-800 text-base uppercase tracking-widest placeholder:text-slate-200" 
                  placeholder="MISALNYA: MINUMAN"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-5 bg-slate-100 rounded-[1.5rem] font-black text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="flex-2 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-[11px] px-10"
                >
                  {isSaving ? 'Tunggu...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Category } from '../../../types';
import { fetchFromSheet } from '@ngolab/shared-lib';
import { ProductType } from '../utils/productScope';

interface Props {
  initialProducts: Product[];
  categories: Category[];
  onUpdate: () => void;
  adminProductType: ProductType | null;
}

const ProductManagement: React.FC<Props> = ({ initialProducts, categories, onUpdate, adminProductType }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<'kiosk' | 'cv'>('kiosk');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (isModalOpen) {
      setImagePreview(editingProduct?.image || null);
      setSelectedProductType(
        (String(editingProduct?.product_type || '').toLowerCase() as 'kiosk' | 'cv') ||
        adminProductType ||
        'kiosk'
      );
    } else {
      setImagePreview(null);
    }
  }, [isModalOpen, editingProduct, adminProductType]);

  // Filter categories based on product type
  const filteredCategories = useMemo(() => {
    const currentType = selectedProductType || adminProductType || 'kiosk';
    return categories.filter(c => {
      const catType = String(c.product_type || c.productType || 'all').toLowerCase();
      // Show category if it matches product type or is 'all'
      return catType === currentType || catType === 'all';
    });
  }, [categories, selectedProductType, adminProductType]);

  // Helper to get category name
  const getCategoryName = (catId: string) => {
    if (!catId) return 'NO CATEGORY';
    const category = categories.find(c => 
      c.id === catId || 
      c.name.toLowerCase() === catId.toLowerCase()
    );
    return category ? category.name : catId;
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Support both ID and Name matching for legacy data
      const matchCategory = selectedCategory === 'ALL' || 
                            p.category === selectedCategory ||
                            getCategoryName(p.category) === selectedCategory;
      
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory, categories]);

  const executeDelete = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const result = await fetchFromSheet('deleteRow', { sheetName: 'Products', id: id });
      if (result && result.success) {
        onUpdate();
        setConfirmDeleteId(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const formData = new FormData(e.currentTarget);
    const productId = editingProduct?.id || `PROD-${Date.now()}`;
    const productTypeToSave = adminProductType || selectedProductType;
    
    const productData = {
      id: productId,
      name: (formData.get('name') as string || '').trim(),
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      image: imagePreview || '',
      description: formData.get('description') as string,
      isRecommended: formData.get('isRecommended') === 'on',
      cashbackReward: Number(formData.get('cashbackReward') || 0),
      product_type: productTypeToSave,
    };

    if (!productData.name) {
      setSaveError('Nama produk tidak boleh kosong.');
      setIsSaving(false);
      return;
    }

    console.log(`[💾 SAVING PRODUCT] ID: ${productId} | Payload Size: ${JSON.stringify(productData).length} chars`);

    try {
      const result = await fetchFromSheet('saveProduct', { product: productData });
      console.log('[✅ SAVE RESULT]', result);
      
      if (result && result.success) {
        // Beri jeda sedikit agar data di spreadsheet sempat terupdate sebelum refresh
        setTimeout(() => {
          onUpdate();
          setIsModalOpen(false);
          setEditingProduct(null);
          setIsSaving(false);
        }, 500);
      } else {
        setSaveError(result?.error || 'Server menolak permintaan simpan. Coba lagi.');
        setIsSaving(false);
      }
    } catch (err) {
      console.error('[❌ SAVE ERROR]', err);
      setSaveError('Terjadi kesalahan teknis saat menyimpan.');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Tools Area */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Inventory <span className="text-blue-600">Master</span></h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-8 h-px bg-slate-200"></span>
            Kelola Produk & Menu Kiosk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <input 
              type="text"
              placeholder="Cari menu atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-200 transition-all w-64 shadow-sm"
            />
            <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {/* Category Filter */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 uppercase tracking-widest outline-none focus:border-blue-200 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="px-8 py-3.5 bg-slate-900 rounded-2xl text-[11px] font-black text-white hover:bg-blue-600 shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-60">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4">🍽️</div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Tidak Ada Produk Ditemukan</p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div key={p.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 overflow-hidden flex flex-col relative">
              {/* Product Image Area */}
              <div className="h-56 overflow-hidden relative bg-slate-50">
                <img 
                  src={p.image || 'https://via.placeholder.com/400?text=No+Image'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={p.name} 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=IMG+Error'; }}
                />
                
                {/* Overlay Badges */}
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black text-slate-800 shadow-lg uppercase tracking-widest border border-white/20">
                    {getCategoryName(p.category)}
                  </span>
                  {p.isRecommended && (
                    <span className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-[9px] font-black shadow-lg uppercase tracking-widest flex items-center gap-2">
                      <span className="animate-pulse">★</span> Recommended
                    </span>
                  )}
                </div>

                {/* Floating Price Tag */}
                <div className="absolute bottom-5 right-5 px-5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-[13px] font-black tracking-tight">Rp {Number(p.price).toLocaleString()}</p>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">{p.id}</p>
                    {p.cashbackReward > 0 && (
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest">
                        +{p.cashbackReward} Pts
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-2 line-clamp-2 leading-relaxed">
                    {p.description || 'Tidak ada deskripsi tersedia untuk produk ini.'}
                  </p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Price Tag</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">Rp {Number(p.price).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} 
                      className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-slate-100"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    
                    {confirmDeleteId === p.id ? (
                      <div className="flex gap-1 animate-in slide-in-from-right-1 duration-200">
                         <button onClick={() => executeDelete(p.id)} className="px-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200">{isDeleting ? '...' : 'OK'}</button>
                         <button onClick={() => setConfirmDeleteId(null)} className="px-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">NO</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(p.id)} 
                        className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div 
            key={editingProduct?.id || 'new-product-modal'}
            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 border border-white/20 my-auto"
          >
             <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{editingProduct ? 'Update' : 'Register'} <span className="text-blue-600">Menu</span></h3>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Inventory Data Center</p>
               </div>
               <button onClick={() => { setIsModalOpen(false); setSaveError(null); }} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
             
             {saveError && (
               <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-center gap-3 text-rose-500">
                   <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <p className="text-[11px] font-bold uppercase tracking-wider">{saveError}</p>
                 </div>
                 <button 
                   type="button"
                   onClick={() => handleSave({ preventDefault: () => {} } as any)}
                   className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline text-left ml-8"
                 >
                   Coba Simpan Lagi
                 </button>
               </div>
             )}
             
             <form onSubmit={handleSave} className="space-y-8">
                <input name="id" hidden defaultValue={editingProduct?.id} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left: Image Upload */}
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Product Visual</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center group"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             </div>
                             <span className="text-white text-[9px] font-black uppercase tracking-widest">Ganti Foto</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-center p-6">
                          <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all shadow-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Ketuk untuk unggah<br/>foto produk (tanpa batas di form)</p>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input type="checkbox" name="isRecommended" id="isRec" defaultChecked={editingProduct?.isRecommended} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <label htmlFor="isRec" className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer select-none">Tandai sebagai Rekomendasi</label>
                    </div>

                    {imagePreview && (
                      <button 
                        type="button"
                        onClick={() => setImagePreview('')}
                        className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-rose-100 transition-all border border-rose-100"
                      >
                        Hapus Foto Produk
                      </button>
                    )}
                  </div>

                  {/* Right: Text Inputs */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipe Produk</label>
                      {adminProductType ? (
                        <div className="inline-flex items-center px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700">
                          {adminProductType.toUpperCase()}
                        </div>
                      ) : (
                        <select
                          value={selectedProductType}
                          onChange={(event) => setSelectedProductType(event.target.value as 'kiosk' | 'cv')}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-700 text-[11px] uppercase tracking-widest"
                        >
                          <option value="kiosk">KIOSK</option>
                          <option value="cv">CV</option>
                        </select>
                      )}
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-2 italic">*Tipe produk dipakai untuk memisahkan menu Kiosk dan CV</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Produk</label>
                      <input name="name" required defaultValue={editingProduct?.name} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-800 text-sm uppercase tracking-widest" placeholder="NAMA MENU" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kategori</label>
                        <select 
                          name="category" 
                          required 
                          defaultValue={filteredCategories.find(c => c.id === editingProduct?.category || c.name === editingProduct?.category)?.id || editingProduct?.category} 
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-slate-600 text-[11px] appearance-none uppercase tracking-widest"
                        >
                          {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Harga (IDR)</label>
                        <input name="price" type="number" required defaultValue={editingProduct?.price} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-blue-600 text-sm" placeholder="0" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Poin Cashback (Reward)</label>
                      <input name="cashbackReward" type="number" defaultValue={editingProduct?.cashbackReward || 0} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-black text-emerald-600 text-sm" placeholder="0" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-2 italic">*Poin yang didapat member saat membeli menu ini</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Deskripsi Produk</label>
                      <textarea name="description" rows={4} defaultValue={editingProduct?.description} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-medium text-slate-600 text-[13px] resize-none" placeholder="Tuliskan detail produk di sini..."></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-3xl font-black text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">Batal</button>
                   <button type="submit" disabled={isSaving} className="flex-2 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-[11px] px-10">
                     {isSaving ? 'Memproses...' : 'Simpan Data Produk'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

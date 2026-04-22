
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Member } from '../../types.ts';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';

interface Props {
  cart: CartItem[];
  member: Member | null;
  potentialPoints: number;
  products: Product[];
  categories: any[];
  onAddToCart: (p: Product | CartItem) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onClearCart: () => void;
  onOpenCart: () => void;
  onBack: () => void;
  total: number;
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";
const BRAND_LOGO_PATH = logoNgolab;

const normalizeCategoryId = (value: string | undefined | null) => String(value || '').toLowerCase().trim();
const isRecommendedCategory = (categoryId: string) => {
  const normalized = normalizeCategoryId(categoryId);
  return normalized === 'recommended' || normalized === 'andalan' || normalized === 'best';
};

const MenuScreen: React.FC<Props> = ({ cart, member, potentialPoints, products, categories, onAddToCart, onUpdateQty, onRemove, onClearCart, onOpenCart, onBack, total }) => {
  const [activeCategory, setActiveCategory] = useState(
    categories.find((c) => normalizeCategoryId(c?.id) === 'all')?.id || categories[0]?.id || 'all'
  );
  const [showBrandLogo, setShowBrandLogo] = useState(true);

  useEffect(() => {
    if (!categories?.length) return;
    const hasActiveCategory = categories.some((c) => normalizeCategoryId(c?.id) === normalizeCategoryId(activeCategory));
    if (!hasActiveCategory) {
      const allCategory = categories.find((c) => normalizeCategoryId(c?.id) === 'all');
      setActiveCategory(allCategory?.id || categories[0]?.id || 'all');
    }
  }, [categories, activeCategory]);

  const filteredProducts = useMemo(() => {
    const normalizedActive = normalizeCategoryId(activeCategory);
    if (normalizedActive === 'all') return products;
    if (isRecommendedCategory(normalizedActive)) {
      const recommendedProducts = products.filter((p) => Boolean(p.isRecommended));
      return recommendedProducts.length > 0 ? recommendedProducts : products;
    }

    const byCategory = products.filter((p) => normalizeCategoryId(p.category) === normalizedActive);
    return byCategory.length > 0 ? byCategory : products;
  }, [activeCategory, products]);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getProductQty = (productId: string) => {
    const item = cart.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="w-full h-full flex bg-white overflow-hidden text-slate-900 font-sans">
      
      {/* SIDEBAR - Ramping & Professional */}
      <div className="w-20 md:w-24 bg-[#F8FAFC] flex flex-col items-center z-20 shrink-0 border-r border-slate-200">
        <div className="w-full flex flex-col items-center py-5 gap-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:bg-orange-500 hover:text-white transition-all shadow-sm border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div className="w-12 h-12 overflow-hidden flex items-center justify-center">
            {showBrandLogo ? (
              <img
                src={BRAND_LOGO_PATH}
                alt="Logo"
                className="w-full h-full object-cover"
                onError={() => setShowBrandLogo(false)}
              />
            ) : (
              <span className="text-slate-500 font-black text-xl">N</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full overflow-y-auto no-scrollbar pt-2">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex flex-col items-center justify-center py-4 px-1 transition-all relative ${
                  isActive ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                  isActive ? 'bg-white text-orange-600' : 'bg-white text-slate-300'
                }`}>
                  <div className="w-6 h-6">{cat.icon}</div>
                </div>
                <span className={`text-[8px] uppercase tracking-tighter text-center leading-none font-black px-1 ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="px-8 py-5 border-b border-slate-50 flex items-end justify-between bg-white/80 backdrop-blur-md z-10">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-6 h-1 bg-orange-500 rounded-full" />
                 <p className="text-orange-500 font-black text-[8px] uppercase tracking-[0.4em]">Katalog Menu</p>
              </div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-none">
                {categories.find(c => c.id === activeCategory)?.name || 'Pilihan Kami'}
              </h2>
           </div>
           
           <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-widest">Cari Menu...</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pt-6 no-scrollbar bg-[#FCFDFE]">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-12">
            {filteredProducts.map(product => {
              const qty = getProductQty(product.id);
              const isSelected = qty > 0;
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => onAddToCart(product)}
                  className={`bg-white rounded-[1.8rem] p-3 shadow-sm border transition-all duration-300 flex flex-col relative cursor-pointer group active:scale-[0.97] ${
                    isSelected ? 'border-orange-500 ring-4 ring-orange-500/5' : 'border-slate-50 hover:border-slate-200'
                  }`}
                >
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 items-start pointer-events-none">
                    {product.isRecommended && (
                      <div className="bg-yellow-400 text-slate-950 text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        ⭐ BEST
                      </div>
                    )}
                    {Number(product.cashbackReward) > 0 && (
                      <div className="bg-emerald-500 text-white text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                        +{Number(product.cashbackReward).toLocaleString()} PTS
                      </div>
                    )}
                  </div>

                  {/* Image with subtle hover effect */}
                  <div className="relative w-full aspect-square rounded-[1.2rem] overflow-hidden mb-4 bg-slate-50 flex items-center justify-center border border-slate-50">
                    <img 
                      src={product.image || PLACEHOLDER_IMAGE} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={product.name} 
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 transition-colors duration-300" />
                  </div>
                  
                  <div className="flex-1 px-1 flex flex-col items-center text-center">
                    <h3 className="text-[13px] font-black text-slate-950 leading-tight mb-1 uppercase tracking-tight line-clamp-2 min-h-[2.2rem] flex items-center justify-center">
                      {product.name}
                    </h3>
                    <p className="text-[8px] text-slate-400 font-bold mb-4 leading-snug flex-1 line-clamp-2 uppercase opacity-60">
                      {product.description || "Bahan premium kualitas terbaik."}
                    </p>
                    
                    <div className="w-full flex flex-col items-center gap-2 mt-auto">
                       <span className="text-sm font-black text-slate-950 tracking-tighter">Rp {Number(product.price).toLocaleString()}</span>
                       
                       {isSelected ? (
                         <div 
                           className="w-full grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200"
                           onClick={(e) => e.stopPropagation()} // Prevent card click when using qty controls
                         >
                           <button 
                             onClick={() => onUpdateQty(product.id, -1)} 
                             className="h-8 bg-white text-slate-950 rounded-lg flex items-center justify-center border border-slate-200 active:scale-90 transition-all hover:text-red-500"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           </button>
                           <div className="flex items-center justify-center font-black text-xs text-slate-900">{qty}</div>
                           <button 
                             onClick={() => onAddToCart(product)} 
                             className="h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           </button>
                         </div>
                       ) : (
                         <div className="w-full py-2.5 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg group-hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Pesan
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SUMMARY SIDEBAR - Ramping */}
      <div className="w-[280px] md:w-[320px] bg-white border-l border-slate-100 flex flex-col shrink-0 z-30 shadow-xl">
        <header className="p-6 md:p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-slate-950 uppercase tracking-tighter">Pesanan</h3>
            <div className="bg-slate-900 px-3 py-1 rounded-full">
              <span className="text-white text-[8px] font-black uppercase tracking-widest">{itemCount} items</span>
            </div>
          </div>
          {member ? (
            <div className="flex items-center gap-2 mt-3 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest truncate">Hai, {member.name}</p>
            </div>
          ) : (
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Daftar Member & Dapatkan Promo</p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Kosong</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 animate-in slide-in-from-right-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    <img src={item.image || PLACEHOLDER_IMAGE} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1.5 truncate tracking-tight">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-orange-600">Rp {(item.price * item.quantity).toLocaleString()}</span>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                        <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 bg-white text-slate-950 rounded-md flex items-center justify-center shadow-sm active:scale-90 hover:text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <span className="text-[10px] font-black w-3 text-center">{item.quantity}</span>
                        <button onClick={() => onAddToCart(item)} className="w-6 h-6 bg-slate-950 text-white rounded-md flex items-center justify-center shadow-md active:scale-90 hover:bg-orange-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-[#FCFDFE] border-t border-slate-100 shadow-inner">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Total Bayar</p>
                <h2 className="text-2xl font-black text-slate-950 tracking-tighter">Rp {total.toLocaleString()}</h2>
              </div>
              {cart.length > 0 && (
                <button onClick={onClearCart} className="text-[9px] font-black text-slate-300 uppercase tracking-widest underline mb-1 hover:text-red-500">Reset</button>
              )}
            </div>
          </div>

          <button 
            onClick={onOpenCart}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-between px-6 transition-all active:scale-[0.98] ${
              cart.length > 0 ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 hover:bg-orange-600' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <span>Bayar</span>
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default MenuScreen;

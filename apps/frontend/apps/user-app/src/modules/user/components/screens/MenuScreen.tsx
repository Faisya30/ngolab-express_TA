import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Member } from '../../types.ts';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';
import BowlNoodlesAltIcon from '@iconify-react/boxicons/bowl-noodles-alt';
import DrinkIcon from '@iconify-react/pixelarticons/drop';
import CircleIcon from '@iconify-react/pixelarticons/circle';

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

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop';

const normalizeCategoryId = (value: string | undefined | null) =>
  String(value || '').toLowerCase().trim();

const isRecommendedCategory = (categoryId: string) => {
  const normalized = normalizeCategoryId(categoryId);
  return normalized === 'recommended' || normalized === 'andalan' || normalized === 'best';
};

const getCategoryIcon = (categoryName: string) => {
  const normalized = normalizeCategoryId(categoryName);

  if (normalized.includes('mie') || normalized.includes('yamin')) {
    return <BowlNoodlesAltIcon height="22" />;
  }

  if (normalized.includes('minuman')) {
    return <DrinkIcon height="22" />;
  }

  return <CircleIcon height="18" />;
};

const MenuScreen: React.FC<Props> = ({
  cart,
  member,
  products,
  categories,
  onAddToCart,
  onUpdateQty,
  onClearCart,
  onOpenCart,
  onBack,
  total,
}) => {
  const [activeCategory, setActiveCategory] = useState(
    categories.find((c) => normalizeCategoryId(c?.id) === 'all')?.id ||
    categories[0]?.id ||
    'all'
  );

  useEffect(() => {
    if (!categories?.length) return;

    const hasActiveCategory = categories.some(
      (c) => normalizeCategoryId(c?.id) === normalizeCategoryId(activeCategory)
    );

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

    const byCategory = products.filter(
      (p) => normalizeCategoryId(p.category) === normalizedActive
    );

    return byCategory.length > 0 ? byCategory : products;
  }, [activeCategory, products]);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getProductQty = (productId: string) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const activeName =
    normalizeCategoryId(activeCategory) === 'all'
      ? 'Semua Menu'
      : categories.find((c) => c.id === activeCategory)?.name || 'Semua Menu';

  return (
    <div className="w-full h-full flex bg-[#fbf7f2] overflow-hidden text-slate-950">
      <aside className="w-[96px] bg-[#07111f] text-white flex flex-col items-center shrink-0 z-30 shadow-2xl">
        <div className="w-full flex flex-col items-center pt-5 pb-5">
          <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-xl mb-6 p-3">
            <img
              src={logoNgolab}
              alt="Ngolab Express"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 w-full flex flex-col">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full min-h-[82px] flex flex-col items-center justify-center gap-2 transition-all relative ${isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}

                  <div className="w-7 h-7 flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </div>

                  <span className="text-[9px] font-black uppercase leading-none text-center px-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-8 pt-7 pb-5 bg-[#fbf7f2]">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onBack}
              className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-orange-100 active:scale-95 transition"
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wide">
                Kembali
              </span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-1 bg-orange-500 rounded-full" />
              <p className="text-orange-500 font-black text-[9px] uppercase tracking-[0.28em]">
                Katalog Menu
              </p>
            </div>

            <h1 className="text-[2.6rem] font-black uppercase leading-none tracking-tight">
              {activeName}
            </h1>
          </div>

          <div className="flex items-center gap-4 mt-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-5 py-3 flex items-center gap-2 border transition-all ${isActive
                    ? 'bg-white border-orange-500 text-orange-500 shadow-md'
                    : 'bg-white border-orange-50 text-slate-500 hover:border-orange-200'
                    }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wide">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-8 pb-24 no-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, index) => {
              const qty = getProductQty(product.id);
              const isSelected = qty > 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className={`group relative bg-white rounded-[1.6rem] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] border cursor-pointer active:scale-[0.98] transition-all ${isSelected
                    ? 'border-orange-500 ring-4 ring-orange-500/10'
                    : 'border-white hover:border-orange-200'
                    }`}
                >
                  <div className="relative aspect-square rounded-[1.2rem] overflow-hidden bg-orange-50 mb-4">
                    <img
                      src={product.image || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {(product.isRecommended || index === 0) && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white rounded-full px-3 py-1.5 flex items-center gap-1 shadow-lg">
                        <span className="text-[9px]">★</span>
                        <span className="text-[8px] font-black uppercase">Best Seller</span>
                      </div>
                    )}

                    {Number(product.cashbackReward) > 0 && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white rounded-full px-3 py-1.5 flex items-center gap-1 shadow-lg">
                        <span className="text-[8px] font-black uppercase">Premium</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md text-slate-400"
                    >
                      ♡
                    </button>
                  </div>

                  <div className="px-1">
                    <h3 className="text-[13px] font-black uppercase tracking-tight text-slate-950 line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-[10px] text-slate-400 font-semibold leading-snug line-clamp-2 min-h-[28px]">
                      {product.description || 'Menu favorit dengan bahan premium.'}
                    </p>

                    <p className="mt-3 text-orange-500 text-[15px] font-black">
                      Rp {Number(product.price).toLocaleString()}
                    </p>

                    {isSelected ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-full"
                      >
                        <button
                          onClick={() => onUpdateQty(product.id, -1)}
                          className="h-9 bg-white rounded-full font-black"
                        >
                          -
                        </button>

                        <div className="h-9 flex items-center justify-center font-black">
                          {qty}
                        </div>

                        <button
                          onClick={() => onAddToCart(product)}
                          className="h-9 bg-[#07111f] text-white rounded-full font-black"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 h-9 bg-[#07111f] group-hover:bg-orange-500 text-white rounded-full flex items-center justify-center gap-2 transition-all">
                        <span className="text-sm">+</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          Pesan
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-full px-7 py-3 shadow-xl border border-orange-50 flex items-center gap-3">
          <span className="text-slate-400">☝</span>
          <span className="text-[10px] font-bold text-slate-400">
            Geser ke bawah untuk melihat lebih banyak menu
          </span>
          <span className="text-orange-500">⌄</span>
        </div>
      </main>

      <aside className="w-[320px] bg-white border-l border-orange-50 flex flex-col shrink-0 z-40 shadow-2xl">
        <header className="p-7">
          <h2 className="text-2xl font-black uppercase tracking-tight">Pesanan</h2>

          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full border border-orange-300 text-orange-500">
            <span className="text-[9px] font-black uppercase">{itemCount} item</span>
          </div>

          {member && (
            <div className="mt-3 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-[10px] font-black text-emerald-700 uppercase">
                Hai, {member.name}
              </p>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 rounded-full bg-orange-50 flex items-center justify-center mb-5 text-slate-300">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                </svg>
              </div>
              <p className="text-[11px] font-black uppercase text-slate-400">
                Keranjang Kosong
              </p>
              <p className="text-[10px] text-slate-300 mt-1">
                Yuk, pilih menu favoritmu!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-orange-50"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase truncate">
                      {item.name}
                    </h4>

                    <p className="text-orange-500 text-[11px] font-black mt-1">
                      Rp {(item.price * item.quantity).toLocaleString()}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="w-7 h-7 bg-slate-100 rounded-full font-black"
                      >
                        -
                      </button>
                      <span className="text-xs font-black">{item.quantity}</span>
                      <button
                        onClick={() => onAddToCart(item)}
                        className="w-7 h-7 bg-[#07111f] text-white rounded-full font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-7 border-t border-orange-50 bg-white">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Total Bayar
          </p>

          <div className="flex items-end justify-between mt-1">
            <h2 className="text-3xl font-black">
              Rp <span className="text-orange-500">{total.toLocaleString()}</span>
            </h2>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[9px] text-red-400 font-black uppercase underline"
              >
                Reset
              </button>
            )}
          </div>

          <button
            onClick={onOpenCart}
            disabled={cart.length === 0}
            className={`mt-6 w-full rounded-2xl py-5 px-6 flex items-center justify-between uppercase font-black tracking-widest transition-all ${cart.length > 0
              ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/25 active:scale-95'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
          >
            <span>Bayar</span>
            <span>›</span>
          </button>
        </footer>
      </aside>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MenuScreen;
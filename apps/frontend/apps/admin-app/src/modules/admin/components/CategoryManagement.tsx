import React, { useState, useEffect, useMemo } from 'react';
import { Category } from '../../../types';
import { fetchFromSheet } from '@ngolab/shared-lib';

interface CategoryManagementProps {
  initialCategories: Category[];
  products: any[];
  onUpdate: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  initialCategories,
  products = [],
  onUpdate,
}) => {
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

  useEffect(() => {
    console.log('CATEGORIES:', initialCategories);
    console.log('PRODUCTS:', products);
  }, [initialCategories, products]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const getProductCount = (category: Category) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const categoryName = String(category.name || '').toLowerCase().trim();

  return safeProducts.filter((product: any) => {
    const productName = String(product.name || '').toLowerCase();

    if (categoryName.includes('mie')) {
      return productName.includes('mie') || productName.includes('yamin');
    }

    if (categoryName.includes('bakso')) {
      return productName.includes('bakso');
    }

    if (categoryName.includes('gorengan')) {
      return (
        productName.includes('goreng') ||
        productName.includes('pangsit') ||
        productName.includes('tahu') ||
        productName.includes('siomay') ||
        productName.includes('kerupuk')
      );
    }

    if (categoryName.includes('dorinku')) {
      return (
        productName.includes('ice') ||
        productName.includes('tea') ||
        productName.includes('juice') ||
        productName.includes('coffe') ||
        productName.includes('drink') ||
        productName.includes('jeruk')
      );
    }

    return false;
  }).length;
  };

  const executeDelete = async (id: string) => {
    if (!id) return;
    setIsDeleting(true);

    try {
      const result = await fetchFromSheet('deleteRow', {
        sheetName: 'Categories',
        id,
      });

      if (result && result.success) {
        onUpdate();
        setConfirmDeleteId(null);
      } else {
        alert(result?.error || 'Gagal menghapus kategori.');
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
      isActive: editingCategory ? editingCategory.isActive : true,
    };

    try {
      const result = await fetchFromSheet('saveCategory', {
        category: categoryData,
      });

      if (result.success) {
        onUpdate();
        setIsModalOpen(false);
        setEditingCategory(null);
      } else {
        alert(result?.error || 'Gagal menyimpan kategori.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const closeInlineForm = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const categoryVisual = (index: number) => {
    const visuals = [
      { icon: '🍜', bg: 'bg-orange-50', text: 'text-orange-500' },
      { icon: '🥤', bg: 'bg-emerald-50', text: 'text-emerald-500' },
      { icon: '🍱', bg: 'bg-amber-50', text: 'text-amber-500' },
      { icon: '🍰', bg: 'bg-purple-50', text: 'text-purple-500' },
      { icon: '📦', bg: 'bg-cyan-50', text: 'text-cyan-500' },
    ];

    return visuals[index % visuals.length];
  };

  const categoryDesc = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes('mie')) return 'Kategori mie dan olahan mie lainnya';
    if (lower.includes('bakso')) return 'Kategori bakso dan makanan berkuah';
    if (lower.includes('goreng')) return 'Aneka gorengan dan makanan ringan';
    if (lower.includes('minum')) return 'Semua minuman yang tersedia di kiosk';
    if (lower.includes('dessert')) return 'Aneka dessert dan makanan penutup';
    if (lower.includes('snack')) return 'Aneka makanan ringan dan snack';
    if (lower.includes('makan')) return 'Menu makanan berat dan makanan siap saji';

    return 'Kategori menu terminal Ngolab Express';
  };

  const renderInlineForm = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
            {editingCategory ? 'Update Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {editingCategory
              ? 'Ubah informasi kategori menu yang sudah tersedia.'
              : 'Buat kategori baru untuk mengelompokkan produk.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closeInlineForm}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition-all hover:bg-slate-200"
          >
            Batal
          </button>

          <button
            form="category-inline-form"
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-70"
          >
            {isSaving
              ? 'Menyimpan...'
              : editingCategory
              ? 'Simpan Perubahan'
              : 'Simpan Kategori'}
          </button>
        </div>
      </div>

      <form id="category-inline-form" onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Nama Kategori
            </label>

            <input
              name="name"
              required
              autoFocus
              defaultValue={editingCategory?.name}
              className="h-12 w-full rounded-xl border border-blue-300 bg-white px-4 text-sm font-bold uppercase text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:ring-4 focus:ring-blue-600/10"
              placeholder="Masukkan nama kategori"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Deskripsi Opsional
            </label>

            <textarea
              rows={3}
              disabled
              value={editingCategory ? categoryDesc(editingCategory.name) : ''}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 outline-none placeholder:text-slate-300"
              placeholder="Masukkan deskripsi kategori opsional"
            />
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Categories
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Kelola kategori produk dengan lebih mudah
          </p>
          <div className="mt-3 h-1 w-12 rounded-full bg-blue-600" />
        </div>

        <button
          onClick={openAddForm}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
          Add New Category
        </button>
      </div>

      {isModalOpen && renderInlineForm()}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Daftar Kategori
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Kelola semua kategori yang tersedia
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="w-20 px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  No
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nama Kategori
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Deskripsi
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Jumlah Produk
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-3xl">
                        📂
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Tidak Ada Kategori Ditemukan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, index) => {
                  const visual = categoryVisual(index);

                  return (
                    <tr
                      key={cat.id}
                      className={`transition-colors hover:bg-blue-50/20 ${
                        editingCategory?.id === cat.id && isModalOpen
                          ? 'bg-blue-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-center text-sm font-black text-slate-700">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${visual.bg} ${visual.text}`}
                          >
                            {visual.icon}
                          </div>

                          <div>
                            <h4 className="text-sm font-black uppercase text-slate-900">
                              {cat.name}
                            </h4>
                            <p className="mt-0.5 text-[10px] font-bold uppercase text-slate-400">
                              {cat.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="line-clamp-1 text-sm font-medium text-slate-500">
                          {categoryDesc(cat.name)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                          {getProductCount(cat)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditForm(cat)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                            title="Edit kategori"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {confirmDeleteId === cat.id ? (
                            <>
                              <button
                                onClick={() => executeDelete(cat.id)}
                                disabled={isDeleting}
                                className="h-9 rounded-xl bg-rose-500 px-3 text-[10px] font-black text-white transition-all hover:bg-rose-600"
                              >
                                {isDeleting ? '...' : 'OK'}
                              </button>

                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="h-9 rounded-xl bg-slate-100 px-3 text-[10px] font-black text-slate-500 transition-all hover:bg-slate-200"
                              >
                                NO
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(cat.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                              title="Hapus kategori"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2" />
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
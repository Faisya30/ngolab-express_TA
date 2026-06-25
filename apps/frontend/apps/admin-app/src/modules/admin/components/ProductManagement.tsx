import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Category } from '../../../types';
import { fetchFromSheet } from '@ngolab/shared-lib';
import { ProductType } from '../utils/productScope';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

type ProductWithType = Product & {
  code?: string | number;
  product_type?: 'kiosk' | 'cv' | string;
  image_url?: string;
  category_id?: string | number;
  cashbackReward?: number;
  cashback_reward?: number;
};

type CategoryWithType = Category & {
  product_type?: 'kiosk' | 'cv' | 'all' | string;
  productType?: 'kiosk' | 'cv' | 'all' | string;
};

function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/images/no-image.svg';

  if (imagePath.startsWith('/uploads/')) {
    return `${BACKEND_URL}${imagePath}`;
  }

  return imagePath || '/images/no-image.svg';
}

function isRecommendedValue(product: any): boolean {
  return (
    product?.isRecommended === true ||
    product?.isRecommended === 1 ||
    product?.isRecommended === '1' ||
    product?.is_recommended === true ||
    product?.is_recommended === 1 ||
    product?.is_recommended === '1'
  );
}

interface Props {
  initialProducts: Product[];
  categories: Category[];
  onUpdate: () => void;
  adminProductType: ProductType | null;
}

const ProductManagement: React.FC<Props> = ({
  initialProducts,
  categories,
  onUpdate,
  adminProductType,
}) => {
  const [products, setProducts] = useState<ProductWithType[]>(initialProducts as ProductWithType[]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithType | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<'kiosk' | 'cv'>('kiosk');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryName = (categoryValue: string | number | undefined | null): string => {
    if (!categoryValue) return '';

    const foundCategory = categories.find((cat) => {
      const c = cat as CategoryWithType;
      return String(c.id) === String(categoryValue) || String(c.name) === String(categoryValue);
    });

    return foundCategory?.name || String(categoryValue);
  };

  const compressImage = (file: File, maxWidth = 1280, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));

      reader.onload = () => {
        const img = new Image();

        img.onerror = () => reject(new Error('Gagal memproses gambar.'));

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(1, maxWidth / img.width);

          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Browser tidak mendukung kompresi gambar.'));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Gagal mengompres gambar.'));
                return;
              }

              const compressedFile = new File([blob], file.name, { type: mimeType });
              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const prepareImageForUpload = async (file: File): Promise<File> => {
    const imageFiles = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!imageFiles.includes(file.type)) return file;

    const targetSize = 1024 * 1024;

    if (file.size <= targetSize) return file;

    return compressImage(file, 1280, 0.85);
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/products/upload-image`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload gambar gagal');
    }

    return result.imageUrl;
  };

  useEffect(() => {
    setProducts(initialProducts as ProductWithType[]);
  }, [initialProducts]);

  useEffect(() => {
    if (isModalOpen) {
      setImagePreview(editingProduct?.image_url || editingProduct?.image || null);

      const productType =
        String(editingProduct?.product_type || '').toLowerCase() ||
        adminProductType ||
        'kiosk';

      setSelectedProductType(productType as 'kiosk' | 'cv');
    } else {
      setImagePreview(null);
    }
  }, [isModalOpen, editingProduct, adminProductType]);

  const filteredCategories = useMemo(() => {
    const currentType = selectedProductType || adminProductType || 'kiosk';

    return categories.filter((cat) => {
      const c = cat as CategoryWithType;
      const catType = String(c.product_type || c.productType || 'all').toLowerCase();

      return catType === currentType || catType === 'all';
    });
  }, [categories, selectedProductType, adminProductType]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const keyword = searchTerm.toLowerCase();

      const matchSearch =
        p.name.toLowerCase().includes(keyword) ||
        p.id.toLowerCase().includes(keyword);

      const matchCategory =
        selectedCategory === 'ALL' ||
        String(p.category) === String(selectedCategory) ||
        getCategoryName(p.category) === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory, categories]);

  const executeDelete = async (id: string) => {
    if (!id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/products/${id}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-role': 'admin',
          },
        }
      );

      const result = await response.json();

      console.log('[DELETE RESULT]', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menghapus produk');
      }

      setProducts((prev) =>
        prev.filter((product) => String(product.id) !== String(id))
      );

      setConfirmDeleteId(null);
      //onUpdate();
    } catch (error) {
      console.error('[DELETE PRODUCT ERROR]', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const maxUploadSize = 5 * 1024 * 1024;

    if (file.size > maxUploadSize) {
      setSaveError('Ukuran foto terlalu besar. Gunakan foto di bawah 5MB.');
      return;
    }

    setSaveError(null);

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    try {
      const preparedFile = await prepareImageForUpload(file);
      const imageUrl = await uploadImageToServer(preparedFile);
      setImagePreview(imageUrl);
    } catch (error: any) {
      URL.revokeObjectURL(objectUrl);
      setImagePreview(editingProduct?.image_url || editingProduct?.image || null);
      console.error('[❌ IMAGE UPLOAD ERROR]', error);
      setSaveError(error.message || 'Gagal mengupload foto. Coba file yang lain.');
    }
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setSaveError(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditForm = (product: ProductWithType) => {
    console.log('[EDIT PRODUCT]', product);

    setEditingProduct(product);
    setSaveError(null);
    setImagePreview(product.image_url || product.image || null);
    setIsModalOpen(true);
  };

  const closeInlineForm = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSaveError(null);
    setImagePreview(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveError(null);

    const formData = new FormData(e.currentTarget);
    const productId =
      editingProduct?.code ||
      editingProduct?.id ||
      `PROD-${Date.now()}`;
    const productTypeToSave = adminProductType || selectedProductType;

    const productData = {
      id: productId,
      name: ((formData.get('name') as string) || '').trim(),
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

    try {
      console.log('[EDITING PRODUCT]', editingProduct);
      console.log('[PRODUCT DATA]', productData);

      const result = await fetchFromSheet('saveProduct', {
        product: productData,
      });

      console.log('[✅ SAVE RESULT]', result);

      if (result && result.success) {
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

  const renderInlineForm = (mode: 'add' | 'edit') => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
            {mode === 'edit' ? 'Update' : 'Add New'} <span className="text-blue-600">Product</span>
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {mode === 'edit'
              ? 'Ubah data produk langsung dari daftar inventory'
              : 'Tambah produk baru ke dalam inventory'}
          </p>
        </div>

        <button
          type="button"
          onClick={closeInlineForm}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-500 transition-all hover:bg-slate-50"
        >
          Kembali
        </button>
      </div>

      {saveError && (
        <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-[11px] font-bold uppercase tracking-wider text-rose-500">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <input name="id" hidden defaultValue={editingProduct?.id} />

        <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">
            <img
              src={getImageUrl(imagePreview || editingProduct?.image_url || editingProduct?.image)}
              alt="Product"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/no-image.svg';
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-500">
                Active
              </span>
              <p className="truncate text-[10px] font-black uppercase tracking-wider text-slate-400">
                {editingProduct?.id || 'Produk Baru'}
              </p>
            </div>

            <h4 className="truncate text-base font-black uppercase text-slate-900">
              {editingProduct?.name || 'Produk Baru'}
            </h4>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {editingProduct?.description || 'Lengkapi data produk baru.'}
            </p>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Kategori</p>
              <p className="text-xs font-black uppercase text-slate-900">
                {getCategoryName(editingProduct?.category) || '-'}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">Price</p>
              <p className="text-xs font-black text-slate-900">
                Rp {Number(editingProduct?.price || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_220px_1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tipe Produk
              </label>

              {adminProductType ? (
                <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black uppercase text-slate-700">
                  {adminProductType.toUpperCase()}
                </div>
              ) : (
                <select
                  value={selectedProductType}
                  onChange={(event) =>
                    setSelectedProductType(event.target.value as 'kiosk' | 'cv')
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
                >
                  <option value="kiosk">KIOSK</option>
                  <option value="cv">CV</option>
                </select>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nama Produk
              </label>
              <input
                name="name"
                required
                defaultValue={editingProduct?.name}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
                placeholder="Masukkan nama produk"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Kategori
                </label>
                <select
                  name="category"
                  required
                  defaultValue={
                    filteredCategories.find(
                      (c) =>
                        String(c.id) === String(editingProduct?.category) ||
                        String(c.name) === String(editingProduct?.category)
                    )?.id ||
                    editingProduct?.category ||
                    ''
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Harga
                </label>
                <input
                  name="price"
                  type="number"
                  required
                  defaultValue={editingProduct?.price}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Poin Cashback
              </label>
              <input
  name="cashbackReward"
  type="number"
  defaultValue={
    editingProduct?.cashbackReward ??
    editingProduct?.cashback_reward ??
    0
  }
  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-emerald-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
  placeholder="0"
/>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Product Visual
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-57.5 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-300"
            >
              {imagePreview ? (
                <img src={getImageUrl(imagePreview)} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16l4-4a3 3 0 014 0l1 1 2-2a3 3 0 014 0l1 1M4 6h16M4 6v12h16V6" />
                    </svg>
                  </div>
                  <p className="text-xs font-black text-slate-500">
                    Upload foto produk
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    PNG, JPG maks. 2MB
                  </p>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-full rounded-xl bg-blue-50 py-3 text-[10px] font-black uppercase tracking-wider text-blue-600"
            >
              Ganti foto produk
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Deskripsi Produk
              </label>
              <textarea
                name="description"
                rows={8}
                defaultValue={editingProduct?.description}
                className="h-57.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/10"
                placeholder="Tuliskan detail produk di sini..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isRecommended"
                id={`isRec-${editingProduct?.id || 'new'}`}
                defaultChecked={isRecommendedValue(editingProduct)}
                className="h-4 w-4"
              />
              <label
                htmlFor={`isRec-${editingProduct?.id || 'new'}`}
                className="text-xs font-bold text-slate-500"
              >
                Tandai sebagai rekomendasi
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={closeInlineForm}
            className="rounded-xl bg-slate-100 px-7 py-3 text-xs font-black uppercase tracking-wider text-slate-500 transition-all hover:bg-slate-200"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-8 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
          >
            {isSaving
              ? 'Memproses...'
              : mode === 'edit'
                ? 'Simpan Perubahan'
                : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            Inventory <span className="text-blue-600">Master</span>
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Kelola produk & menu kiosk dengan lebih mudah
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
          Add New Product
        </button>
      </div>

      {!isModalOpen && (
        <button
          onClick={openAddForm}
          className="flex w-full items-center justify-between overflow-hidden rounded-2xl border border-dashed border-blue-300 bg-blue-50/30 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">
                Tambah produk baru
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Buat dan kelola produk menu terminal dengan mudah.
              </p>
            </div>
          </div>

          <span className="hidden rounded-xl border border-blue-200 bg-white px-5 py-2 text-xs font-black uppercase text-blue-600 md:inline-flex">
            Add New Product
          </span>
        </button>
      )}

      {isModalOpen && !editingProduct && renderInlineForm('add')}

      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="flex min-h-75 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-3xl">
              🍽️
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Tidak Ada Produk Ditemukan
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isEditing = editingProduct?.id === p.id && isModalOpen;

            return (
              <React.Fragment key={p.id}>
                {isEditing ? (
                  renderInlineForm('edit')
                ) : (
                  <div className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-50">
                      <img
                        src={getImageUrl(p.image_url || p.image)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={p.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/no-image.svg';
                        }}
                      />
                    </div>

                    <div className="hidden min-w-22 justify-center md:flex">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                        Active
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {p.id}
                      </p>
                      <h3 className="truncate text-base font-black uppercase text-slate-900">
                        {p.name}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                        {p.description || 'Tidak ada deskripsi untuk produk ini.'}
                      </p>
                    </div>

                    <div className="hidden min-w-33.75 items-center gap-3 lg:flex">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Kategori</p>
                        <p className="text-xs font-black uppercase text-slate-900">
                          {getCategoryName(p.category || p.category_id) || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="hidden min-w-30 items-center gap-3 xl:flex">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Price</p>
                        <p className="text-xs font-black text-slate-900">
                          Rp {Number(p.price).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(p)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => executeDelete(p.id)}
                            className="h-10 rounded-xl bg-rose-500 px-3 text-[10px] font-black text-white transition-all hover:bg-rose-600"
                          >
                            {isDeleting ? '...' : 'OK'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-10 rounded-xl bg-slate-100 px-3 text-[10px] font-black text-slate-500 transition-all hover:bg-slate-200"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="flex h-10 items-center gap-2 rounded-xl border border-rose-100 bg-white px-4 text-xs font-black text-rose-500 transition-all hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      <p className="text-xs font-semibold text-slate-500">
        Showing 1 to {filteredProducts.length} of {filteredProducts.length} products
      </p>
    </div>
  );
};

export default ProductManagement;
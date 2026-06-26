import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi, productApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Package, Search, Image as ImageIcon, X, ChevronDown, Check, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';

export default function Products() {
  const [activeTab, setActiveTab] = useState('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  // Get Shop ID
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;

  // Fetch Data
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: async () => (await productApi.getCategories(shopId)).data,
    enabled: !!shopId
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: async () => (await productApi.getProducts(shopId)).data,
    enabled: !!shopId
  });

  // Mutations
  const createCat = useMutation({
    mutationFn: (data) => productApi.createCategory(shopId, data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category created'); setIsModalOpen(false); }
  });
  const updateCat = useMutation({
    mutationFn: (data) => productApi.updateCategory(editingItem.categoryId, data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category updated'); setIsModalOpen(false); }
  });
  const deleteCat = useMutation({
    mutationFn: (id) => productApi.deleteCategory(id),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category deleted'); }
  });

  const createProd = useMutation({
    mutationFn: (data) => productApi.createProduct(shopId, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Product created'); setIsModalOpen(false); }
  });
  const updateProd = useMutation({
    mutationFn: (data) => productApi.updateProduct(editingItem.productId, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Product updated'); setIsModalOpen(false); }
  });
  const deleteProd = useMutation({
    mutationFn: (id) => productApi.deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Product deleted'); }
  });

  const openModal = (mode, item = null) => {
    setModalMode(mode);
    setEditingItem(item);
    setProductImages(item?.images || (item?.image ? [item.image] : []));
    setIsModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImages([...productImages, reader.result]);
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 pb-20 px-2 sm:px-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Menu</h1>
        <button onClick={() => openModal('create')} className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6">
          <Tabs.Trigger value="products" className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'products' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>Products</Tabs.Trigger>
          <Tabs.Trigger value="categories" className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>Categories</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="products">
          {loadingProducts ? <div className="text-center py-10">Loading...</div> : 
           products.length === 0 ? <EmptyState type="Product" onAdd={() => openModal('create')} /> : (
            <div className="grid grid-cols-1 gap-4">
              {products.map(prod => (
                <div key={prod.productId} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-4 items-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{prod.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prod.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-black text-primary-600">₹{prod.price}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${prod.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {prod.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openModal('edit', prod)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteProd.mutate(prod.productId)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="categories">
          {loadingCategories ? <div className="text-center py-10">Loading...</div> : 
           categories.length === 0 ? <EmptyState type="Category" onAdd={() => openModal('create')} /> : (
            <div className="grid grid-cols-1 gap-3">
              {categories.map(cat => (
                <div key={cat.categoryId} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                      <FolderTree className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                      <p className="text-xs text-gray-500">{products.filter(p => p.categoryId === cat.categoryId).length} products</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('edit', cat)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteCat.mutate(cat.categoryId)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-3xl z-50 p-6 overflow-y-auto w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' ? `Add ${activeTab === 'products' ? 'Product' : 'Category'}` : `Edit ${activeTab === 'products' ? 'Product' : 'Category'}`}
              </Dialog.Title>
              <Dialog.Close className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"><X className="w-5 h-5" /></Dialog.Close>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              
              if (activeTab === 'categories') {
                modalMode === 'create' ? createCat.mutate(data) : updateCat.mutate(data);
              } else {
                const finalData = { ...data, images: productImages, image: productImages[0] || '' };
                modalMode === 'create' ? createProd.mutate(finalData) : updateProd.mutate(finalData);
              }
            }} className="space-y-4">
              
              {activeTab === 'categories' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                    <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                    <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select name="categoryId" defaultValue={editingItem?.categoryId} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                      <input name="price" type="number" step="0.01" defaultValue={editingItem?.price} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select name="status" defaultValue={editingItem?.status || 'Available'} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none">
                        <option value="Available">Available</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea name="description" defaultValue={editingItem?.description} rows={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {productImages.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-700">
                          <img src={img} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setProductImages(productImages.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-600 transition-colors cursor-pointer">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                        {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                      </label>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={createCat.isPending || updateCat.isPending || createProd.isPending || updateProd.isPending} 
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition mt-6">
                Save {activeTab === 'products' ? 'Product' : 'Category'}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}

function EmptyState({ type, onAdd }) {
  return (
    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No {type}s Yet</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-[200px] mx-auto">Add your first {type.toLowerCase()} to get started.</p>
      <button onClick={onAdd} className="inline-flex items-center px-6 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold rounded-xl">
        <Plus className="w-5 h-5 mr-1" /> Add {type}
      </button>
    </div>
  );
}

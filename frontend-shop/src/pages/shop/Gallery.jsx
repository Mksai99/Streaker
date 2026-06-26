import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryApi, shopApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon, Loader2, ArrowLeft, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ShopGallery() {
  const qc = useQueryClient();
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;

  const { data: gallery = [], isLoading } = useQuery({
    queryKey: ['gallery', shopId],
    queryFn: async () => (await galleryApi.getGallery(shopId)).data,
    enabled: !!shopId
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const addMut = useMutation({
    mutationFn: (d) => galleryApi.addImage(shopId, d),
    onSuccess: () => { toast.success('Image added to gallery'); qc.invalidateQueries(['gallery', shopId]); },
    onError: (e) => toast.error(e.message)
  });

  const deleteMut = useMutation({
    mutationFn: (id) => galleryApi.deleteImage(shopId, id),
    onSuccess: () => { toast.success('Image removed'); qc.invalidateQueries(['gallery', shopId]); },
    onError: (e) => toast.error(e.message)
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      addMut.mutate({ url: reader.result, caption: 'New Image', displayOrder: gallery.length });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-6 relative">
      <div className="flex items-center gap-3 pt-2 px-1">
        <Link to="/shop/settings" className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shop Gallery</h1>
      </div>

      <div className="mx-1">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex flex-col items-center justify-center py-10 border-dashed border-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Photos</h3>
          <p className="text-gray-500 text-sm mb-6 text-center max-w-xs">Showcase your shop, menu, or products to customers.</p>
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || addMut.isPending}
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-2">
            {(isUploading || addMut.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Select Image</>}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {gallery.map((img) => (
              <motion.div key={img.imageId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-2xl overflow-hidden shadow-sm group aspect-square bg-gray-100 dark:bg-gray-800">
                <img src={img.url} alt="Gallery item" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => deleteMut.mutate(img.imageId)} className="p-3 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {gallery.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No images in your gallery yet.</p>
        )}
      </div>
    </div>
  );
}

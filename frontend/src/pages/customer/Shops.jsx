import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api'; // We'll need to make sure shopApi is available in frontend
import { motion } from 'framer-motion';
import { Store, MapPin, ChevronRight, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';

// Using direct API calls since we are in frontend
const getShops = async (params) => {
  const res = await api.get(`/shops?${new URLSearchParams(params)}`);
  return res.data;
};

export default function ShopsList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['shops', search, category],
    queryFn: () => getShops({ search, category })
  });

  const categories = ['cafe', 'restaurant', 'gym', 'retail', 'salon', 'other'];

  return (
    <div className="space-y-6 pb-24 px-2">
      <div className="pt-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Discover</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Find places to start your streak</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search shops..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border-none shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setCategory('')} 
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-colors ${category === '' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c)} 
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-colors capitalize ${category === c ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Shop List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : data?.shops?.length > 0 ? (
        <div className="grid gap-4">
          {data.shops.map((shop, i) => (
            <motion.div 
              key={shop.shopId} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/customer/shops/${shop.shopId}`)}
              className="bg-white dark:bg-gray-900 rounded-3xl p-4 flex gap-4 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{shop.name}</h3>
                <p className="text-xs text-gray-500 mt-1 capitalize">{shop.category}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 font-medium">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{shop.city || shop.address || 'Location unknown'}</span>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white">No shops found</h3>
          <p className="text-sm text-gray-500 mt-1">Try searching for something else.</p>
        </div>
      )}
    </div>
  );
}

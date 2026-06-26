import { useQuery } from '@tanstack/react-query';
import { shopApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Users, Search, Loader2, Flame, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ShopCustomers() {
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['shopCustomers', shopId, search, page],
    queryFn: async () => (await shopApi.getCustomers(shopId, { search, page, limit: 10 })).data,
    enabled: !!shopId
  });

  if (!shopId) return <div className="text-center py-20 px-4 bg-white dark:bg-gray-900 rounded-3xl mx-1"><Users className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Create a shop first.</p></div>;

  return (
    <div className="space-y-6 pb-6">
      
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Customers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{data?.pagination?.total || 0} total customers</p>
      </div>

      <div className="px-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : data?.customers?.length > 0 ? (
        <div className="space-y-3 px-1">
          {data.customers.map((c, i) => (
            <motion.div key={c.userId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform cursor-pointer">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {c.displayName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{c.displayName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{c.loyaltyLevel || 'bronze'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-gray-700">
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-500 font-bold text-lg"><Flame className="w-4 h-4 fill-orange-500" /> {c.currentStreak || 0}</span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Streak</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">{c.totalVisits || 0}</span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Visits</span>
                </div>
              </div>

            </motion.div>
          ))}

          {data.pagination?.pages > 1 && (
            <div className="flex items-center justify-between gap-4 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex-1 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-gray-900 shadow-sm disabled:opacity-50">Prev</button>
              <span className="text-sm font-bold text-gray-400">{page} / {data.pagination.pages}</span>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="flex-1 py-3 rounded-2xl text-sm font-bold bg-white dark:bg-gray-900 shadow-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl mx-1 shadow-sm">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Customers</h3>
          <p className="text-gray-500 text-sm">Customers will appear here when they scan your QR code.</p>
        </div>
      )}
    </div>
  );
}

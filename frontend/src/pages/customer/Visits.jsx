import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { visitApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, Loader2, Filter } from 'lucide-react';
import { useState } from 'react';
import { formatDate, formatTime } from '../../lib/utils';

export default function CustomerVisits() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['userVisits', user?.uid, period, page],
    queryFn: async () => (await visitApi.getUserVisits(user.uid, { period, page, limit: 15 })).data,
    enabled: !!user?.uid
  });

  if (isLoading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-6">
      
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">History</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Your timeline of visits</p>
      </div>

      {/* Modern Pill-shaped filtering */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {['', 'weekly', 'monthly', 'yearly'].map(p => {
          const isActive = period === p;
          return (
            <button key={p} onClick={() => { setPeriod(p); setPage(1); }}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm
              ${isActive 
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800'}`}>
              {p ? p : 'All Time'}
            </button>
          )
        })}
      </div>

      {/* Timeline Layout */}
      {data?.visits?.length > 0 ? (
        <div className="relative pl-6 mt-4">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-200 dark:bg-gray-800" />
          
          <div className="space-y-6">
            {data.visits.map((visit, i) => (
              <motion.div 
                key={visit.visitId || i} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="relative pl-6"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[-5px] top-4 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-gray-50 dark:ring-gray-950 z-10" />
                
                {/* Timeline Card */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1">{visit.shopName}</h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>{formatDate(visit.visitTime)}</span>
                        <span>•</span>
                        <span>{formatTime(visit.visitTime)}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 mx-1">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No History</h3>
          <p className="text-gray-500 text-sm">Visits will appear here like a timeline.</p>
        </div>
      )}

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-4 mt-6 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mx-1">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-50 dark:bg-gray-800 disabled:opacity-30">Prev</button>
          <span className="text-sm font-bold text-gray-400">{page} / {data.pagination.pages}</span>
          <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-50 dark:bg-gray-800 disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

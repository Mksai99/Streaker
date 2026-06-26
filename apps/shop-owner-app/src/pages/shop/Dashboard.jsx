import { useQuery } from '@tanstack/react-query';
import { shopApi, analyticsApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Gift, BarChart3, Loader2, Flame, ChevronRight, Store, Tag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function ShopDashboard() {
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['shopAnalytics', shopId], queryFn: async () => (await analyticsApi.getShopAnalytics(shopId)).data, enabled: !!shopId
  });

  if (isLoading || !shops) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (!shopId) return (
    <div className="text-center py-20 px-4 bg-white dark:bg-gray-900 rounded-3xl mx-1 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Store className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Streakify!</h3>
      <p className="text-gray-500 text-sm mb-6">Register your business to start managing customer loyalty.</p>
      <a href="/shop/register" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition">
        Register My Shop <ChevronRight className="w-5 h-5 ml-1" />
      </a>
    </div>
  );

  const stats = [
    { icon: TrendingUp, label: "Today's Visits", value: analytics?.todayVisits || 0, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
    { icon: Users, label: 'Customers', value: analytics?.totalCustomers || 0, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
    { icon: Flame, label: 'Active Streaks', value: analytics?.activeStreaks || 0, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
    { icon: Gift, label: 'Rewards Claimed', value: analytics?.rewardsRedeemed || 0, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
  ];

  return (
    <div className="space-y-6 pb-6">
      
      <div className="pt-2 px-1 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{shops[0]?.name}</p>
        </div>
        <div className="flex flex-col items-end bg-yellow-50 dark:bg-yellow-900/10 px-3 py-1.5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
          <div className="flex items-center gap-1">
            <span className="font-black text-yellow-600 dark:text-yellow-500">{shops[0]?.stats?.averageRating || 0}</span>
            <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <span className="text-[10px] font-bold text-yellow-700/60 dark:text-yellow-500/60 uppercase">{shops[0]?.stats?.totalReviews || 0} Reviews</span>
        </div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-2 gap-4 px-1">
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeUp} className={`p-5 ${s.bg} rounded-3xl border border-white/40 dark:border-gray-800 shadow-sm active:scale-95 transition-transform`}>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile Swipeable Charts Container */}
      <div className="space-y-4 px-1">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Daily Visits</h3>
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">Last 7 Days</span>
          </div>
          <div className="h-48 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyVisits || []}>
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="visits" fill="url(#barGrad)" radius={[4, 4, 4, 4]} barSize={24} />
                <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" />
                </linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Growth Trend</h3>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">+12%</span>
          </div>
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyVisits || []}>
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-1 mt-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <a href="/shop/products" className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Products</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </a>
          <a href="/shop/offers" className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Offers</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
          </a>
          <a href="/shop/rewards" className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-pink-500" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">Rewards</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
          </a>
        </div>
      </div>
      
    </div>
  );
}

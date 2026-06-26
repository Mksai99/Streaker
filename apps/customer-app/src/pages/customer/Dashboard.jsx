import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, visitApi, rewardApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Flame, Gift, Clock, MapPin, ChevronRight, Star, History, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getStreakEmoji, getLoyaltyBadge, getLoyaltyColor, formatDate } from '../../lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function CircularProgress({ streak, maxStreak = 30 }) {
  const progress = Math.min((streak / maxStreak) * 100, 100);
  const circumference = 2 * Math.PI * 110;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-64 h-64 mx-auto drop-shadow-2xl">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7b00" />
            <stop offset="50%" stopColor="#ff0055" />
            <stop offset="100%" stopColor="#aa00ff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100 dark:text-gray-800/80" />
        <circle cx="120" cy="120" r="110" fill="none" stroke="url(#streakGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1500 ease-out" filter="url(#glow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} className="text-4xl mb-1">{getStreakEmoji(streak)}</motion.div>
        <div className="flex items-baseline gap-1">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 tracking-tighter">
            {streak}
          </motion.span>
        </div>
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Day Streak</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, to }) {
  const navigate = useNavigate();
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(to)} className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    </motion.button>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data: analytics } = useQuery({ queryKey: ['customerAnalytics'], queryFn: async () => (await analyticsApi.getCustomerAnalytics()).data });
  const { data: visitsData } = useQuery({ queryKey: ['recentVisits'], queryFn: async () => (await visitApi.getUserVisits(user.uid, { limit: 3 })).data });
  const { data: rewards } = useQuery({ queryKey: ['userRewards'], queryFn: async () => (await rewardApi.getUserRewards()).data });

  const streak = analytics?.currentStreak || user?.currentStreak || 0;
  const level = user?.loyaltyLevel || 'bronze';
  const upcomingRewards = rewards?.filter(r => !r.eligible && !r.claimed).slice(0, 2) || [];

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
        
        {/* Header Badges */}
        <motion.div variants={fadeUp} className="flex justify-center mt-2">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
            <Star className={`w-4 h-4 ${level === 'diamond' ? 'text-blue-500' : level === 'gold' ? 'text-yellow-500' : level === 'silver' ? 'text-gray-400' : 'text-orange-600'}`} />
            <span className="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-gray-200">{level} Member</span>
          </div>
        </motion.div>

        {/* Big Circular Streak */}
        <motion.div variants={fadeUp} className="pt-4 pb-8 flex justify-center">
          <CircularProgress streak={streak} />
        </motion.div>

        {/* Quick Actions (Android style icon grid) */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-4 gap-4">
            <QuickAction icon={Gift} label="Rewards" color="bg-gradient-to-br from-pink-500 to-rose-500" to="/customer/rewards" />
            <QuickAction icon={History} label="History" color="bg-gradient-to-br from-blue-500 to-cyan-500" to="/customer/visits" />
            <QuickAction icon={MapPin} label="Shops" color="bg-gradient-to-br from-emerald-500 to-teal-500" to="/customer/shops" />
            <QuickAction icon={User} label="Profile" color="bg-gradient-to-br from-violet-500 to-purple-500" to="/customer/profile" />
          </div>
        </motion.div>

        {/* Upcoming Rewards (CRED style thin cards) */}
        {upcomingRewards.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Next Rewards</h3>
            </div>
            <div className="space-y-3">
              {upcomingRewards.map(reward => (
                <div key={reward.rewardId} className="relative overflow-hidden bg-gray-900 dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-indigo-500/30 to-transparent" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                      <Gift className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="font-bold">{reward.name}</h4>
                      <p className="text-xs text-gray-400">{reward.requiredStreak - streak} days left</p>
                    </div>
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-full border-4 border-white/10 flex items-center justify-center">
                     <span className="font-bold text-sm">{Math.round(reward.progress)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link to="/customer/visits" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center">
              All <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-gray-800">
            {visitsData?.visits?.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {visitsData.visits.map((visit, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{visit.shopName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(visit.visitTime)}</p>
                    </div>
                    <div className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 p-1.5 rounded-full">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white">No visits yet</p>
                <p className="text-sm text-gray-500 px-8 mt-1">Your recent visits will show up here.</p>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

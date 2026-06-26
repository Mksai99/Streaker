import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Loader2, Gift, Flame, Star, Info } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const iconMap = { welcome: Star, streak_milestone: Flame, reward_unlocked: Gift, reward_claimed: Check, reward_approved: CheckCheck, default: Bell };
const colorMap = { welcome: 'from-blue-500 to-indigo-500', streak_milestone: 'from-orange-500 to-red-500', reward_unlocked: 'from-amber-500 to-orange-500', reward_claimed: 'from-green-500 to-emerald-500', reward_approved: 'from-purple-500 to-pink-500', default: 'from-gray-400 to-gray-500' };

export default function CustomerNotifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: async () => (await notificationApi.getAll({})).data });
  const markRead = useMutation({ mutationFn: (id) => notificationApi.markAsRead(id), onSuccess: () => qc.invalidateQueries(['notifications']) });
  const markAll = useMutation({ mutationFn: () => notificationApi.markAllAsRead(), onSuccess: () => { qc.invalidateQueries(['notifications']); toast.success('All marked as read'); } });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} className="px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const Icon = iconMap[n.type] || iconMap.default;
            const color = colorMap[n.type] || colorMap.default;
            return (
              <motion.div key={n.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
                  ${n.read ? 'bg-white dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50' : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm'}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold ${n.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(n.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-500 text-sm">You'll be notified about streaks, rewards, and more.</p>
        </div>
      )}
    </div>
  );
}

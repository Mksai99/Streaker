import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Gift, Check, Loader2, Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function CustomerRewards() {
  const qc = useQueryClient();
  const { data: rewards, isLoading } = useQuery({ queryKey: ['userRewards'], queryFn: async () => (await rewardApi.getUserRewards()).data });

  const claimMutation = useMutation({
    mutationFn: (id) => rewardApi.claim(id),
    onSuccess: () => { toast.success('Reward claimed!'); qc.invalidateQueries(['userRewards']); },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) return <div className="flex items-center justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Rewards</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unlock exclusive perks with your streak</p>
      </div>

      {rewards?.length > 0 ? (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="space-y-5">
          {rewards.map((reward, i) => {
            const isEligible = reward.eligible && !reward.claimed;
            const isLocked = !reward.eligible && !reward.claimed;
            const isClaimed = reward.claimed;
            
            // Generate a random gradient for visuals based on index
            const gradients = [
              'from-rose-500 to-orange-500',
              'from-blue-600 to-indigo-600',
              'from-emerald-500 to-teal-500',
              'from-purple-600 to-fuchsia-600'
            ];
            const bgGrad = gradients[i % gradients.length];

            return (
              <motion.div key={reward.rewardId} variants={fadeUp}
                className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800"
              >
                {/* Visual Banner (Netflix/CRED style large visual area) */}
                <div className={`h-32 w-full bg-gradient-to-br ${bgGrad} relative p-6 flex flex-col justify-between overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                     <Gift className="w-32 h-32 text-white transform rotate-12" />
                  </div>
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                      {reward.shopName}
                    </span>
                    {isEligible && (
                      <span className="flex items-center gap-1 text-white text-xs font-bold bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                        <Sparkles className="w-3 h-3" /> Unlocked
                      </span>
                    )}
                  </div>
                  <h3 className="relative z-10 text-2xl font-black text-white drop-shadow-md tracking-tight leading-tight w-3/4">
                    {reward.name}
                  </h3>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-4 line-clamp-2">
                    {reward.description}
                  </p>

                  {/* Progress Bar */}
                  {!isClaimed && (
                    <div className="mb-5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        <span>{Math.round(reward.progress)}% Complete</span>
                        <span>{reward.requiredStreak} Days Total</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${reward.progress}%` }} 
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${bgGrad}`} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {isEligible ? (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => claimMutation.mutate(reward.rewardId)} 
                      disabled={claimMutation.isPending}
                      className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                    >
                      {claimMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Reward Now'}
                    </motion.button>
                  ) : isClaimed ? (
                    <div className="w-full py-3.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-green-200 dark:border-green-900/50">
                      <Check className="w-5 h-5" /> Reward Claimed
                    </div>
                  ) : (
                    <div className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" /> Keep your streak alive to unlock
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-24 px-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Rewards Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Visit partner shops to start earning exclusive rewards!</p>
        </div>
      )}
    </div>
  );
}

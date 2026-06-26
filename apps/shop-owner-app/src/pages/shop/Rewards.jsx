import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi, rewardApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Edit2, Trash2, Loader2, X, AlertCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getRewardTypeLabel } from '../../lib/utils';

export default function ShopRewards() {
  const qc = useQueryClient();
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;
  const { data, isLoading } = useQuery({ queryKey: ['shopRewards', shopId], queryFn: async () => (await rewardApi.getByShop(shopId, {})).data, enabled: !!shopId });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', requiredStreak: 7, rewardType: 'free_product', value: '' });

  const createMut = useMutation({ mutationFn: (d) => rewardApi.create(shopId, d), onSuccess: () => { toast.success('Reward created!'); qc.invalidateQueries(['shopRewards']); resetForm(); }, onError: (e) => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => rewardApi.update(id, d), onSuccess: () => { toast.success('Reward updated!'); qc.invalidateQueries(['shopRewards']); resetForm(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id) => rewardApi.delete(id), onSuccess: () => { toast.success('Reward deleted!'); qc.invalidateQueries(['shopRewards']); }, onError: (e) => toast.error(e.message) });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: '', description: '', requiredStreak: 7, rewardType: 'free_product', value: '' }); };
  const startEdit = (r) => { setForm({ name: r.name, description: r.description, requiredStreak: r.requiredStreak, rewardType: r.rewardType, value: r.value }); setEditId(r.rewardId); setShowForm(true); };
  const handleSubmit = (e) => { e.preventDefault(); editId ? updateMut.mutate({ id: editId, d: form }) : createMut.mutate(form); };

  if (!shopId) return <div className="text-center py-20 bg-white dark:bg-gray-900 mx-1 rounded-3xl"><Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Create a shop first.</p></div>;

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="pt-2 px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Rewards</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage loyalty incentives</p>
        </div>
      </div>

      {/* Rewards List */}
      {isLoading ? <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div> :
      data?.rewards?.length > 0 ? (
        <div className="space-y-4 px-1">
          {data.rewards.map((r, i) => (
            <motion.div key={r.rewardId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-inner">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{r.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{getRewardTypeLabel(r.rewardType)}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => { setForm({ name: r.name + ' (Copy)', description: r.description, requiredStreak: r.requiredStreak, rewardType: r.rewardType, value: r.value, image: r.image || '', maxClaims: r.maxClaims || '', active: r.active, expiresAt: r.expiresAt || '' }); setEditId(null); setShowForm(true); }} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full active:scale-90 transition-transform" title="Duplicate"><Copy className="w-4 h-4 text-indigo-500" /></button>
                  <button onClick={() => updateMut.mutate({ id: r.rewardId, d: { active: !r.active }})} className={`p-2 rounded-full active:scale-90 transition-transform ${r.active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} title={r.active ? 'Disable' : 'Enable'}>{r.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</button>
                  <button onClick={() => startEdit(r)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"><Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" /></button>
                  <button onClick={() => deleteMut.mutate(r.rewardId)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full active:scale-90 transition-transform"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{r.description}</p>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 flex flex-col items-center border border-gray-100 dark:border-gray-700/50">
                  <span className="text-lg font-black text-gray-900 dark:text-white">{r.requiredStreak}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Days Needed</span>
                </div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 flex flex-col items-center border border-gray-100 dark:border-gray-700/50">
                  <span className="text-lg font-black text-gray-900 dark:text-white">{r.totalClaimed || 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Claimed</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl mx-1 shadow-sm border border-gray-100 dark:border-gray-800">
          <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Rewards</h3>
          <p className="text-gray-500 text-sm">Add a reward to motivate your customers!</p>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => { resetForm(); setShowForm(true); }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Bottom Sheet Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={resetForm} />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-t-[2rem] z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-2 flex justify-center"><div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" /></div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editId ? 'Edit Reward' : 'New Reward'}</h2>
                  <button onClick={resetForm} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Reward Name</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" placeholder="e.g., Free Coffee" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Description</label>
                    <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" rows={3} placeholder="Details about the reward..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Streak Needed</label>
                      <input type="number" min="1" required value={form.requiredStreak} onChange={e => setForm({...form, requiredStreak: parseInt(e.target.value)})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-black text-center" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Type</label>
                      <select value={form.rewardType} onChange={e => setForm({...form, rewardType: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold">
                        <option value="free_product">Free Product</option>
                        <option value="percentage_discount">% Discount</option>
                        <option value="fixed_discount">Fixed Discount</option>
                        <option value="cashback">Cashback</option>
                        <option value="buy_one_get_one">Buy 1 Get 1</option>
                        <option value="coupon">Coupon</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Max Claims</label>
                      <input type="number" min="0" placeholder="Unlimited" value={form.maxClaims || ''} onChange={e => setForm({...form, maxClaims: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-black text-center" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Expires At</label>
                      <input type="date" value={form.expiresAt ? form.expiresAt.split('T')[0] : ''} onChange={e => setForm({...form, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" />
                    </div>
                  </div>
                  
                  <div className="pt-4 pb-8">
                    <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                      className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                      {(createMut.isPending || updateMut.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {editId ? 'Update Reward' : 'Save Reward'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

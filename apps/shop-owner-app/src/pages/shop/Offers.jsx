import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi, offerApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit2, Trash2, Loader2, X, Calendar, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopOffers() {
  const qc = useQueryClient();
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;
  const { data: offers = [], isLoading } = useQuery({ queryKey: ['shopOffers', shopId], queryFn: async () => (await offerApi.getByShop(shopId)).data, enabled: !!shopId });
  
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', couponCode: '', startDate: '', endDate: '', status: 'Active', terms: '' });

  const createMut = useMutation({ mutationFn: (d) => offerApi.create(shopId, d), onSuccess: () => { toast.success('Offer created!'); qc.invalidateQueries(['shopOffers']); resetForm(); }, onError: (e) => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, d }) => offerApi.update(id, d), onSuccess: () => { toast.success('Offer updated!'); qc.invalidateQueries(['shopOffers']); resetForm(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = useMutation({ mutationFn: (id) => offerApi.delete(id), onSuccess: () => { toast.success('Offer deleted!'); qc.invalidateQueries(['shopOffers']); }, onError: (e) => toast.error(e.message) });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ title: '', description: '', couponCode: '', startDate: '', endDate: '', status: 'Active', terms: '' }); };
  const startEdit = (o) => { setForm({ title: o.title, description: o.description, couponCode: o.couponCode, startDate: o.startDate ? o.startDate.split('T')[0] : '', endDate: o.endDate ? o.endDate.split('T')[0] : '', status: o.status, terms: o.terms }); setEditId(o.offerId); setShowForm(true); };
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    const d = { ...form, startDate: form.startDate ? new Date(form.startDate).toISOString() : null, endDate: form.endDate ? new Date(form.endDate).toISOString() : null };
    editId ? updateMut.mutate({ id: editId, d }) : createMut.mutate(d); 
  };

  if (!shopId) return <div className="text-center py-20 bg-white dark:bg-gray-900 mx-1 rounded-3xl"><Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Create a shop first.</p></div>;

  return (
    <div className="space-y-6 pb-24 relative px-2">
      <div className="pt-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Offers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Promotions & Discounts</p>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div> :
      offers.length > 0 ? (
        <div className="space-y-4">
          {offers.map((o, i) => (
            <motion.div key={o.offerId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
              
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${o.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {o.status}
                    </span>
                    {o.couponCode && (
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold font-mono border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> {o.couponCode}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(o)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteMut.mutate(o.offerId)} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">{o.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{o.description}</p>
                
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                  {o.endDate && (
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <Calendar className="w-4 h-4" /> 
                      Ends {new Date(o.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Offers</h3>
          <p className="text-gray-500 text-sm">Create an offer to attract customers.</p>
        </div>
      )}

      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { resetForm(); setShowForm(true); }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white z-40">
        <Plus className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={resetForm} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-t-[2rem] z-50 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-2 flex justify-center"><div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" /></div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editId ? 'Edit Offer' : 'New Offer'}</h2>
                  <button onClick={resetForm} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Title</label>
                    <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-semibold" placeholder="e.g., 20% Off Weekend" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Description</label>
                    <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Coupon Code (Opt)</label>
                      <input type="text" value={form.couponCode} onChange={e => setForm({...form, couponCode: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-mono" placeholder="SUMMER20" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold">
                        <option value="Active">Active</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Start Date</label>
                      <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">End Date</label>
                      <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" />
                    </div>
                  </div>
                  
                  <div className="pt-4 pb-8">
                    <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                      {(createMut.isPending || updateMut.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {editId ? 'Update Offer' : 'Save Offer'}
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

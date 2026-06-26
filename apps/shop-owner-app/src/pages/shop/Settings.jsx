import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Save, Loader2, Plus, ChevronRight, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ShopSettings() {
  const qc = useQueryClient();
  const { data: shops, isLoading } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shop = shops?.[0];
  const [form, setForm] = useState({ name: '', description: '', category: '', address: '', phone: '', email: '', website: '', coverImage: '', logo: '', ownerName: '', ownerMobile: '', instagram: '', facebook: '', whatsappNumber: '', openingTime: '', closingTime: '' });
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'cafe', address: '', phone: '', email: '', coverImage: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(0);

  useEffect(() => {
    if (shop) {
      setForm({ 
        name: shop.name || '', description: shop.description || '', category: shop.category || '', 
        address: shop.address || '', phone: shop.phone || '', email: shop.email || '', 
        website: shop.website || '', coverImage: shop.coverImage || '', logo: shop.logo || '',
        ownerName: shop.ownerName || '', ownerMobile: shop.ownerMobile || '',
        instagram: shop.instagram || '', facebook: shop.facebook || '', whatsappNumber: shop.whatsappNumber || '',
        openingTime: shop.openingTime || '', closingTime: shop.closingTime || ''
      });
      setGracePeriod(shop.streakRules?.gracePeriodDays || 0);
    }
  }, [shop]);

  const updateMut = useMutation({
    mutationFn: (d) => shopApi.update(shop.shopId, d),
    onSuccess: () => { toast.success('Settings saved!'); qc.invalidateQueries(['myShops']); },
    onError: (e) => toast.error(e.message)
  });

  const createMut = useMutation({
    mutationFn: (d) => shopApi.create(d),
    onSuccess: () => { toast.success('Shop created!'); qc.invalidateQueries(['myShops']); setShowCreate(false); },
    onError: (e) => toast.error(e.message)
  });

  const handleUpdate = (e) => { e.preventDefault(); updateMut.mutate({ ...form, streakRules: { gracePeriodDays: gracePeriod, maxVisitsPerDay: 1, minTimeBetweenVisits: 12 } }); };
  const handleCreate = (e) => { e.preventDefault(); createMut.mutate(createForm); };

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (!shop) return (
    <div className="space-y-6 pb-6">
      {!showCreate ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl mx-1 shadow-sm border border-gray-100 dark:border-gray-800">
          <Store className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Your Shop</h3>
          <p className="text-gray-500 text-sm mb-8 px-6">Set up your business profile to start managing loyalty streaks.</p>
          <button onClick={() => setShowCreate(true)} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold shadow-xl active:scale-95 transition-transform mx-auto flex items-center gap-2">
            <Plus className="w-5 h-5" /> Let's Go
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl mx-1 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">New Shop</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {[['Shop Name', 'name', 'text'], ['Description', 'description', 'text'], ['Address', 'address', 'text'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email'], ['Cover Image URL', 'coverImage', 'url']].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">{label}</label>
                <input type={type} required={['name', 'address'].includes(key)} value={createForm[key]} onChange={e => setCreateForm({...createForm, [key]: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Category</label>
              <select value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium">
                {['cafe', 'restaurant', 'gym', 'retail', 'salon', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={createMut.isPending}
              className="w-full py-4 mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg active:scale-95 transition-transform disabled:opacity-50 flex justify-center items-center gap-2">
              {createMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Shop'}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-6 relative">
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
      </div>

      {/* Feature Links */}
      <div className="mx-1 grid grid-cols-2 gap-4">
        <Link to="/shop/gallery" className="bg-indigo-600 rounded-3xl p-5 flex flex-col justify-between items-start shadow-md active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">Shop<br/>Gallery</h3>
            <p className="text-indigo-200 text-xs mt-1">Manage photos</p>
          </div>
        </Link>
        <Link to="/shop/reviews" className="bg-pink-600 rounded-3xl p-5 flex flex-col justify-between items-start shadow-md active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">Customer<br/>Reviews</h3>
            <p className="text-pink-200 text-xs mt-1">View & reply</p>
          </div>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-1">
        <form onSubmit={handleUpdate} className="space-y-6">
          
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-2">Basic Info</h2>
            {[['Shop Name', 'name', Store], ['Description', 'description', null], ['Cover Image URL', 'coverImage', null]].map(([label, key, Icon]) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">{label}</label>
                <div className="relative">
                  {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
                  <input type="text" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium`} />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium">
                {['cafe', 'restaurant', 'gym', 'retail', 'salon', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-2">Contact details</h2>
            {[['Address', 'address', MapPin], ['Phone', 'phone', Phone], ['Email', 'email', Mail], ['Website', 'website', Globe]].map(([label, key, Icon]) => (
              <div key={key}>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={key==='email'?'email':key==='phone'?'tel':'text'} placeholder={label} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium" />
                </div>
              </div>
            ))}
            
            {/* Live Map Preview */}
            {form.address && (
              <div className="mt-4 rounded-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-inner h-48 bg-gray-100 dark:bg-gray-800">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-2">Social & Online</h2>
            {[['Instagram', 'instagram', null], ['Facebook', 'facebook', null], ['WhatsApp Business', 'whatsappNumber', null], ['Website', 'website', Globe]].map(([label, key, Icon]) => (
              <div key={key}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">{label}</label>
                <div className="relative">
                  {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
                  <input type="text" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium`} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-2">Business Hours</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Opening Time</label>
                <input type="time" value={form.openingTime} onChange={e => setForm({...form, openingTime: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Closing Time</label>
                <input type="time" value={form.closingTime} onChange={e => setForm({...form, closingTime: e.target.value})}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-base font-medium" />
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {form.coverImage && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
               <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-4">Shop Preview</h2>
               <img src={form.coverImage} alt="Shop Cover" className="w-full h-48 object-cover rounded-2xl shadow-sm" onError={(e) => { e.target.style.display='none'; toast.error('Invalid image URL'); }} />
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 px-1 mb-4">Streak Rules</h2>
            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Grace Period (Days)</label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">{gracePeriod} days</span>
              </div>
              <input type="range" min="0" max="7" value={gracePeriod} onChange={e => setGracePeriod(parseInt(e.target.value) || 0)}
                className="w-full mt-2 accent-indigo-600" />
              <p className="text-xs text-gray-400 mt-2 px-1">Days a customer can miss before resetting their streak.</p>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={updateMut.isPending}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {updateMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

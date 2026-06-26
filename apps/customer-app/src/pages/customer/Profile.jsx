import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Moon, Sun, LogOut, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerProfile() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: user?.displayName || '', phone: user?.phone || '' });

  const updateMutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated');
      setEditing(false);
      qc.invalidateQueries(['profile']);
      window.location.reload(); // Simple reload to refresh auth context for demo
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const SettingRow = ({ icon: Icon, title, subtitle, onClick, right, danger }) => (
    <div 
      onClick={onClick} 
      className={`flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 last:border-0 ${onClick ? 'active:bg-gray-50 dark:active:bg-gray-800/50 cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-base font-bold ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right ? right : onClick ? <ChevronRight className="w-5 h-5 text-gray-300" /> : null}
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Account</h1>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mx-1">
        {!editing ? (
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-4 border-white dark:border-gray-900 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-500">
                {user?.displayName?.[0] || 'U'}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.displayName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <button onClick={() => setEditing(true)} className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-1 block">Full Name</label>
                <input type="text" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-sm focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-1 block">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-3 rounded-2xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 text-sm">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-3 rounded-2xl font-bold text-white bg-indigo-600 text-sm flex justify-center items-center">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Settings Groups */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 mx-1">
        
        <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <SettingRow icon={Mail} title="Email Address" subtitle={user?.email} right={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
          <SettingRow icon={Shield} title="Privacy & Security" subtitle="Passwords, 2FA" onClick={() => toast.info('Coming soon')} />
          <SettingRow icon={Bell} title="Notifications" subtitle="Push, Email alerts" onClick={() => toast.info('Coming soon')} />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <SettingRow icon={darkMode ? Sun : Moon} title="App Theme" subtitle={darkMode ? 'Dark Mode Active' : 'Light Mode Active'} onClick={toggleDarkMode} right={
            <div className="w-12 h-7 bg-indigo-600 rounded-full relative shadow-inner">
              <motion.div layout className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm ${darkMode ? 'right-1' : 'left-1'}`} />
            </div>
          } />
          <SettingRow icon={AlertCircle} title="Help & Support" subtitle="FAQs, Contact Us" onClick={() => toast.info('Coming soon')} />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <SettingRow icon={LogOut} title="Log Out" danger onClick={() => {
            logout();
            toast.success('Logged out successfully');
          }} />
        </div>

      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Flame, Mail, Lock, User, Eye, EyeOff, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await register({ displayName: form.displayName, email: form.email, password: form.password, role: 'shopOwner' });
      toast.success('Account created successfully!');
      navigate('/shop/registration');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative bg-white dark:bg-gray-950 shadow-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-900">
      <div className="flex-1 flex flex-col p-6 pb-12 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6 pt-4">
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Join Us</h1>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">Create your account</p>
            </div>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" required value={form.displayName} onChange={e => set('displayName', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Min 6 chars" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 active:scale-90">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" required value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="••••••••" />
              </div>
            </div>
            
            <button type="submit" disabled={loading}
              className="w-full py-4 mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 pt-2">
            Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold">Sign in</Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

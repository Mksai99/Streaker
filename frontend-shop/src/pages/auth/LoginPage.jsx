import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Mail, Lock, Loader2, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const role = 'shopOwner';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail({ email, password, role });
        toast.success('Login successful!');
      } else {
        if (!displayName) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        await registerWithEmail({ email, password, displayName, role });
        toast.success('Account created successfully!');
      }
      navigate('/shop/dashboard');
    } catch (err) {
      console.error('Auth Error:', err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await loginWithGoogle({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatar: user.photoURL,
        role,
      });

      toast.success('Login successful!');
      navigate('/shop/dashboard');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') return;
      toast.error(err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col p-6 pb-12 justify-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-7">
          
          <div className="text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/30"
            >
              <Store className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shop Login</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
                {isLogin ? 'Manage your store and customers' : 'Partner with us today'}
              </p>
            </div>
          </div>

          <motion.div className="space-y-5">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold text-[15px] shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-md hover:ring-gray-300 dark:hover:ring-gray-600 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GoogleIcon /> Continue with Google</>}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">or email</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Full Name</label>
                    <div className="relative mb-4">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required={!isLogin}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                        placeholder="John Doe" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ring-1 ring-gray-200 dark:ring-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                    placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <button type="button" onClick={() => setIsLogin(!isLogin)} disabled={loading} className="w-full text-center text-sm text-blue-500 dark:text-blue-400 font-semibold hover:text-blue-600 transition-colors">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>

            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Shop Owner Portal
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

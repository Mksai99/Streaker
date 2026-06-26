import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { motion } from 'framer-motion';
import { Flame, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Flame className="w-6 h-6 text-white" /></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Streakify</span>
        </div>
        {sent ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">We've sent a password reset link to <strong>{email}</strong></p>
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot password?</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" className="mt-6 text-sm text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to login</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { RefreshCw, Shield, ScanFace } from 'lucide-react';
import { useState } from 'react';

export default function CustomerQRCode() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const qrValue = user?.qrCode || `STREAKIFY_${user?.uid}_${Date.now()}`;
  
  // Fancy background based on loyalty
  const level = user?.loyaltyLevel || 'bronze';
  const cardGradient = 
    level === 'diamond' ? 'from-blue-600 via-indigo-600 to-purple-800' :
    level === 'gold' ? 'from-amber-400 via-orange-500 to-red-600' :
    level === 'silver' ? 'from-gray-400 via-gray-500 to-gray-700' :
    'from-emerald-500 via-teal-600 to-cyan-700';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 pb-6">
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Show to Scan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Hold your phone near the scanner</p>
      </motion.div>

      {/* Loyalty Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, rotateX: 10 }} 
        animate={{ opacity: 1, scale: 1, rotateX: 0 }} 
        transition={{ type: 'spring', bounce: 0.4 }}
        className={`w-full max-w-sm rounded-[2.5rem] bg-gradient-to-br ${cardGradient} p-1 shadow-2xl shadow-indigo-500/20`}
        style={{ perspective: 1000 }}
      >
        <div className="bg-gray-900 rounded-[2.4rem] p-6 relative overflow-hidden h-[460px] flex flex-col items-center justify-between">
          
          {/* Card Header */}
          <div className="w-full flex justify-between items-start z-10 relative">
            <div>
              <p className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-1">Member</p>
              <h2 className="text-white font-bold text-lg leading-none">{user?.displayName}</h2>
            </div>
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-white font-bold text-xs tracking-wider uppercase">{level}</span>
            </div>
          </div>

          {/* Glowing background behind QR */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl" />

          {/* QR Code Center */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative z-10 p-5 bg-white rounded-3xl shadow-2xl"
            id="qr-code-svg"
          >
            <QRCodeSVG 
              key={refreshKey} 
              value={qrValue} 
              size={200} 
              level="H" 
              includeMargin={false}
              bgColor="#ffffff" 
              fgColor="#000000"
            />
            
            {/* Center Logo in QR */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ScanFace className="w-8 h-8 text-indigo-600" />
            </div>
          </motion.div>

          {/* Card Footer */}
          <div className="w-full flex items-center justify-between z-10 relative mt-4">
            <div className="flex items-center gap-1.5 text-white/80">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium">Auto-refreshing</span>
            </div>
            <button 
              onClick={() => setRefreshKey(k => k + 1)} 
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>
          
        </div>
      </motion.div>
      
      {/* Tip text */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-gray-400 text-xs text-center px-8">
        This code updates securely. Never share a screenshot of your QR code.
      </motion.p>

    </div>
  );
}

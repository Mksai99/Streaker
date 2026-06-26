import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { shopApi, visitApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ScanLine, CheckCircle, XCircle, Loader2, Keyboard, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

export default function ShopScanner() {
  const { data: shops } = useQuery({ queryKey: ['myShops'], queryFn: async () => (await shopApi.getMyShops()).data });
  const shopId = shops?.[0]?.shopId;
  const [mode, setMode] = useState('manual'); 
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const scanMutation = useMutation({
    mutationFn: (qrData) => visitApi.scanQR({ qrData, shopId }),
    onSuccess: (data) => {
      setResult({ success: true, data: data.data });
      toast.success(data.data.message || 'Visit recorded!');
      setTimeout(() => setResult(null), 3000);
    },
    onError: (err) => {
      setResult({ success: false, error: err.message });
      toast.error(err.message);
      setTimeout(() => setResult(null), 3000);
    }
  });

  const html5QrCodeRef = useRef(null);

  const startCamera = () => {
    setMode('camera');
    setTimeout(() => {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!scanMutation.isPending) {
            setResult(null);
            scanMutation.mutate(decodedText);
            stopCamera();
            setMode('manual');
          }
        },
        (errorMessage) => {
          // Ignore parse errors, they happen continuously when no QR is in view
        }
      ).catch(err => {
        toast.error('Camera access denied. Use manual entry instead.');
        setMode('manual');
      });
    }, 100);
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
      }).catch(err => console.log('Error stopping camera', err));
    }
  };

  useEffect(() => () => stopCamera(), []);

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setResult(null);
    scanMutation.mutate(manualCode.trim());
    setManualCode('');
  };

  if (!shopId) return (
    <div className="text-center py-20 bg-white dark:bg-gray-900 mx-1 rounded-3xl"><ScanLine className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Create a shop first.</p></div>
  );

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Scan QR</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Record a customer's visit</p>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 mx-1 p-1 rounded-full flex relative">
        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-800 rounded-full shadow-sm transition-transform duration-300 ${mode === 'camera' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
        <button onClick={() => { stopCamera(); setMode('manual'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold z-10 transition-colors ${mode === 'manual' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          <Keyboard className="w-4 h-4" /> Manual
        </button>
        <button onClick={startCamera}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold z-10 transition-colors ${mode === 'camera' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          <Camera className="w-4 h-4" /> Camera
        </button>
      </div>

      <div className="mx-1">
        {mode === 'camera' ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-3xl bg-black shadow-2xl">
            <div id="reader" className="w-full h-full object-cover"></div>
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
              <div className="inline-block px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 text-xs font-bold uppercase tracking-wider border border-white/20">
                Position QR code in frame
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-indigo-500" />
            </div>
            <form onSubmit={handleManualScan} className="space-y-4">
              <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)}
                placeholder="STREAKIFY_..."
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-lg" />
              <button type="submit" disabled={scanMutation.isPending || !manualCode.trim()}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {scanMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Visit'}
              </button>
            </form>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-4 right-4 p-5 rounded-3xl border-2 z-50 shadow-2xl backdrop-blur-md
            ${result.success ? 'border-green-400 bg-green-50/95 dark:bg-green-900/95' : 'border-red-400 bg-red-50/95 dark:bg-red-900/95'}`}>
            <div className="flex items-center gap-3 mb-2">
              {result.success ? <CheckCircle className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
              <h3 className={`text-xl font-bold ${result.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                {result.success ? 'Success!' : 'Failed'}
              </h3>
            </div>
            {result.success ? (
              <div className="space-y-1">
                <p className="text-green-800 dark:text-green-200 font-medium">{result.data.message}</p>
                {result.data.streak && (
                  <p className="text-orange-600 dark:text-orange-400 font-bold">🔥 {result.data.streak.currentStreak} day streak</p>
                )}
              </div>
            ) : (
              <p className="text-red-800 dark:text-red-200 font-medium">{result.error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

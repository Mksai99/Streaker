import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, QrCode, Gift, ArrowRight, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const slides = [
  {
    id: 1,
    icon: Flame,
    title: 'Track Your Streaks',
    desc: 'Visit your favorite local spots daily and build massive streaks.',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 2,
    icon: QrCode,
    title: 'Scan & Go',
    desc: 'Simply show your personal QR code at the counter to record visits instantly.',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 3,
    icon: Gift,
    title: 'Unlock Rewards',
    desc: 'Earn free coffees, huge discounts, and VIP perks for your loyalty.',
    color: 'from-purple-400 to-pink-500'
  }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const SlideIcon = slides[currentSlide].icon;

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative bg-white dark:bg-gray-950 shadow-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-900">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 bg-gradient-to-br ${slides[currentSlide].color}`} />
      
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
        
        <div className="w-full flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Streakify</span>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="w-full h-64 relative flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${slides[currentSlide].color} flex items-center justify-center mb-8 shadow-2xl transform -rotate-6`}>
                <SlideIcon className="w-14 h-14 text-white transform rotate-6" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{slides[currentSlide].title}</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium px-4">{slides[currentSlide].desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Indicators */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-300 dark:bg-gray-800'}`} />
          ))}
        </div>

      </div>

      {/* Action Buttons */}
      <div className="p-6 pb-safe space-y-4 relative z-10 bg-gradient-to-t from-white via-white dark:from-gray-950 dark:via-gray-950 to-transparent">
        <Link to="/login" className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

    </div>
  );
}

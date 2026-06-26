import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, QrCode, Gift, History, User, Store, ScanLine, Users, Settings, LogOut
} from 'lucide-react';

const navConfig = {
  customer: [
    { to: '/customer/dashboard', icon: Home, label: 'Home' },
    { to: '/customer/rewards', icon: Gift, label: 'Rewards' },
    { to: '/customer/qr-code', icon: QrCode, label: 'Scan', center: true },
    { to: '/customer/visits', icon: History, label: 'History' },
    { to: '/customer/profile', icon: User, label: 'Profile' },
  ],
  shopOwner: [
    { to: '/shop/dashboard', icon: Home, label: 'Home' },
    { to: '/shop/rewards', icon: Gift, label: 'Rewards' },
    { to: '/shop/scanner', icon: ScanLine, label: 'Scan', center: true },
    { to: '/shop/customers', icon: Users, label: 'Users' },
    { to: '/shop/settings', icon: Settings, label: 'Shop' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: Home, label: 'Home' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/shops', icon: Store, label: 'Shops' },
  ],
};

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.3 };

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const items = navConfig[user?.role] || [];

  // PWA & Mobile Shell Setup
  useEffect(() => {
    // Add class to body to enforce background color
    document.body.className = 'bg-gray-100 dark:bg-black';
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto relative bg-gray-50 dark:bg-gray-950 shadow-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-900">
      
      {/* Top App Header (Native App Style) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Streakify</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-none mt-1">
              {user?.displayName?.split(' ')[0]}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
               <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-pink-500 font-bold text-sm">
                 {user?.displayName?.[0] || 'U'}
               </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="p-4"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex items-end justify-around px-2 py-2">
          {items.map((item, index) => {
            if (item.center) {
              return (
                <NavLink key={item.to} to={item.to} className="relative -top-4 flex flex-col items-center group">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-500 p-1 shadow-lg shadow-indigo-500/30 group-active:scale-95 transition-transform">
                    <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mt-1">{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors active:scale-95
                  ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`
                }>
                {({ isActive }) => (
                  <>
                    <motion.div
                      animate={{ y: isActive ? -2 : 0 }}
                      className="relative"
                    >
                      <item.icon className={`w-6 h-6 ${isActive ? 'fill-indigo-600/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                      {isActive && (
                        <motion.span layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                      )}
                    </motion.div>
                    <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

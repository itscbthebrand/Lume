import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, MessageCircle, ShoppingBag, Settings, User, Bell, Menu, LogOut, Shield, Share2, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../App';
import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import ShiPuChat from './AI/ShiPuChat';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, isModerator, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [websiteIcon, setWebsiteIcon] = useState('');

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        const res = await adminApi.getSetting('websiteIcon');
        setWebsiteIcon(res.data || '');
      } catch (err) {
        console.error('Failed to fetch icon:', err);
      }
    };
    fetchIcon();
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Share2, label: 'Shared with you', path: '/shared' },
    ...(user?.role === 'admin' || user?.role === 'owner' || user?.username === 'adi' ? [{ icon: Shield, label: 'Admin Dashboard', path: '/admin' }] : []),
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          {websiteIcon ? (
            <img src={websiteIcon} className="w-8 h-8 object-contain" alt="Lume" />
          ) : (
            <span className="text-2xl font-bold text-[#6f9cde] tracking-tight">Lume</span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/notifications')} className="p-2 hover:bg-gray-100 rounded-full">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-100 rounded-full">
            <MessageCircle className="w-6 h-6 text-gray-600" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-full">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Sidebar / Desktop Nav */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4">
          <div className="hidden md:block mb-8 px-2">
            <Link to="/" className="flex items-center gap-3">
              {websiteIcon ? (
                <img src={websiteIcon} className="w-10 h-10 object-contain" alt="Lume" />
              ) : (
                <span className="text-3xl font-bold text-[#6f9cde] tracking-tight">Lume</span>
              )}
            </Link>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-[#6f9cde]/10 text-[#6f9cde] font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("w-6 h-6", location.pathname === item.path ? "text-[#6f9cde]" : "text-gray-500")} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
            
            <div className="mt-4 flex items-center gap-3 px-2">
              <img
                src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      <ShiPuChat />

      {/* Desktop Right Sidebar (Trending/Suggestions) */}
      <aside className="hidden lg:block w-80 p-8 sticky top-0 h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
          <TrendingUp className="w-12 h-12 text-gray-100 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">Trending for you</h3>
          <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Nothing to show yet</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <Users className="w-12 h-12 text-gray-100 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">Suggested Users</h3>
          <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Nothing to show yet</p>
        </div>
      </aside>
    </div>
  );
}

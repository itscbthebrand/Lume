import { Bell, User, Heart, MessageSquare, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: 'like',
      user: { name: 'Adi', photo: 'https://picsum.photos/seed/adi/100' },
      content: 'liked your post about ShiPu AI',
      time: '2m ago',
      unread: true
    },
    {
      id: 2,
      type: 'follow',
      user: { name: 'Sarah', photo: 'https://picsum.photos/seed/sarah/100' },
      content: 'started following you',
      time: '15m ago',
      unread: true
    },
    {
      id: 3,
      type: 'comment',
      user: { name: 'John', photo: 'https://picsum.photos/seed/john/100' },
      content: 'commented: "This is amazing! 🔥"',
      time: '1h ago',
      unread: false
    },
    {
      id: 4,
      type: 'mention',
      user: { name: 'LumeTech', photo: 'https://picsum.photos/seed/lume/100' },
      content: 'mentioned you in a post',
      time: '3h ago',
      unread: false
    },
    {
      id: 5,
      type: 'system',
      user: { name: 'Lume', photo: null },
      content: 'Your account has been verified with a Gold Badge! ✨',
      time: '1d ago',
      unread: false
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'follow': return <User className="w-4 h-4 text-blue-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'mention': return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
      case 'system': return <Sparkles className="w-4 h-4 text-[#6f9cde]" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#6f9cde]/10 rounded-2xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#6f9cde]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-gray-500 font-medium">Stay updated with your activity</p>
          </div>
        </div>
        <button className="text-sm font-bold text-[#6f9cde] hover:underline">Mark all as read</button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group",
              notif.unread 
                ? "bg-white border-[#6f9cde]/20 shadow-md shadow-[#6f9cde]/5" 
                : "bg-white/50 border-gray-100 hover:bg-white hover:border-gray-200"
            )}
          >
            <div className="relative">
              <img 
                src={notif.user.photo || `https://ui-avatars.com/api/?name=${notif.user.name}&background=6f9cde&color=fff`} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" 
                alt={notif.user.name} 
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-50">
                {getIcon(notif.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 leading-tight">
                <span className="font-bold">{notif.user.name}</span>{' '}
                <span className="text-gray-600 font-medium">{notif.content}</span>
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{notif.time}</p>
            </div>

            {notif.unread && (
              <div className="w-2.5 h-2.5 bg-[#6f9cde] rounded-full shadow-lg shadow-[#6f9cde]/40" />
            )}
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No notifications yet</h3>
          <p className="text-gray-500">When you get notifications, they'll show up here.</p>
        </div>
      )}
    </div>
  );
}

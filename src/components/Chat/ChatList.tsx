import { useState, useEffect } from 'react';
import { chatApi, authApi } from '../../lib/api';
import { useAuth } from '../../App';
import { Chat, User } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageSquare, X, AtSign, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    const fetchChats = async () => {
      try {
        const res = await chatApi.getChats();
        setChats(res.data);
      } catch (err) {
        console.error('Failed to fetch chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user?.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (userSearchQuery.trim()) {
        setIsSearchingUsers(true);
        try {
          const res = await authApi.searchUsers(userSearchQuery);
          setUserSearchResults(res.data.filter((u: User) => u.id !== user?.id));
        } catch (err) {
          console.error('User search failed:', err);
        } finally {
          setIsSearchingUsers(false);
        }
      } else {
        setUserSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery, user?.id]);

  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await chatApi.startChat(targetUserId);
      navigate(`/messages/${res.data.id}`);
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)] flex flex-col">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Messages</h2>
        <button 
          onClick={() => setIsNewChatModalOpen(true)}
          className="p-2 bg-[#6f9cde]/10 text-[#6f9cde] rounded-xl hover:bg-[#6f9cde]/20 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-[#6f9cde]/5">
                <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                <button 
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or @username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#6f9cde]/20 transition-all outline-none"
                    autoFocus
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 no-scrollbar">
                  {isSearchingUsers ? (
                    <div className="py-10 text-center">
                      <div className="w-6 h-6 border-2 border-[#6f9cde] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Searching users...</p>
                    </div>
                  ) : userSearchResults.length > 0 ? (
                    userSearchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleStartChat(u.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.profilePhoto || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6f9cde&color=fff`}
                            className="w-10 h-10 rounded-full object-cover"
                            alt={u.username}
                          />
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-[10px] text-[#6f9cde] font-bold flex items-center gap-1">
                              <AtSign className="w-2.5 h-2.5" /> {u.username}
                            </p>
                          </div>
                        </div>
                        <div className="p-2 bg-[#6f9cde]/10 text-[#6f9cde] rounded-lg group-hover:bg-[#6f9cde] group-hover:text-white transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </button>
                    ))
                  ) : userSearchQuery ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-500">No users found.</p>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-500">Search for someone to start a chat!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#6f9cde]/20 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/messages/${chat.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={`https://ui-avatars.com/api/?name=Chat&background=6f9cde&color=fff`}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    alt="Chat"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-[#6f9cde] transition-colors">
                      {chat.type === 'direct' ? 'Direct Message' : 'Group Chat'}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate font-medium">
                    {chat.lastMessage?.content || 'Start a conversation...'}
                  </p>
                </div>
              </Link>
            ))}

            {chats.length === 0 && (
              <div className="text-center py-20 px-4">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No messages yet</h3>
                <p className="text-sm text-gray-500">Reach out to your friends and start a conversation!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

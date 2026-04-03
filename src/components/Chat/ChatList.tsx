import { useState, useEffect } from 'react';
import { chatApi } from '../../lib/api';
import { useAuth } from '../../App';
import { Chat } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)] flex flex-col">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Messages</h2>
        <button className="p-2 bg-[#6f9cde]/10 text-[#6f9cde] rounded-xl hover:bg-[#6f9cde]/20 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

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

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../../lib/api';
import { useAuth } from '../../App';
import { Message, Chat } from '../../types';
import { Send, Image, Mic, MoreVertical, ChevronLeft, Phone, Video, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function ChatWindow() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchChatData = async () => {
      try {
        const [chatRes, messagesRes] = await Promise.all([
          chatApi.getChat(chatId),
          chatApi.getMessages(chatId)
        ]);
        setChat(chatRes.data);
        setMessages(messagesRes.data);
      } catch (err) {
        console.error('Failed to fetch chat data:', err);
      } finally {
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    fetchChatData();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user?.id) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      const res = await chatApi.sendMessage(chatId, { content: messageContent });
      setMessages([...messages, res.data]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/messages')} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=Chat&background=6f9cde&color=fff`}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              alt="Chat"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">
              {chat?.type === 'direct' ? 'Direct Message' : 'Group Chat'}
            </h4>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-blue-50 text-[#6f9cde] rounded-xl transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-blue-50 text-[#6f9cde] rounded-xl transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 text-gray-400 rounded-xl transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm",
                    isMe 
                      ? "bg-[#6f9cde] text-white rounded-tr-none" 
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'Just now'}
                  </span>
                </motion.div>
              );
            })}
            <div ref={scrollRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button type="button" className="p-2.5 hover:bg-gray-100 text-gray-400 rounded-2xl transition-colors">
            <Image className="w-5 h-5" />
          </button>
          <button type="button" className="p-2.5 hover:bg-gray-100 text-gray-400 rounded-2xl transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#6f9cde]/20 transition-all outline-none"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#6f9cde] hover:bg-[#6f9cde]/10 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-[#6f9cde] text-white rounded-2xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

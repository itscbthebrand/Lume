import { useState, useEffect } from 'react';
import { Search, TrendingUp, Hash, Users, Sparkles, Image as ImageIcon, Play, MessageSquare, UserPlus, Mail, Phone, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { authApi } from '../lib/api';
import { User } from '../types';
import { Link } from 'react-router-dom';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const res = await authApi.searchUsers(searchQuery);
          setSearchResults(res.data);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleFollow = async (userId: string) => {
    try {
      await authApi.follow(userId);
      // Update local state if needed
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const categories = ['Trending', 'News', 'Sports', 'Entertainment', 'Technology', 'Gaming'];
  
  const trendingTopics = [
    { tag: '#LumeLaunch', posts: '125K', category: 'Technology' },
    { tag: '#ShiPuAI', posts: '89K', category: 'AI' },
    { tag: '#DhakaVibes', posts: '45K', category: 'Local' },
    { tag: '#Web3Future', posts: '32K', category: 'Tech' },
    { tag: '#CricketFever', posts: '156K', category: 'Sports' },
  ];

  const suggestedPosts = [
    { id: 1, image: 'https://picsum.photos/seed/exp1/400/400', type: 'image', likes: '12K' },
    { id: 2, image: 'https://picsum.photos/seed/exp2/400/400', type: 'video', likes: '8.5K' },
    { id: 3, image: 'https://picsum.photos/seed/exp3/400/400', type: 'image', likes: '15K' },
    { id: 4, image: 'https://picsum.photos/seed/exp4/400/400', type: 'image', likes: '9.2K' },
    { id: 5, image: 'https://picsum.photos/seed/exp5/400/400', type: 'video', likes: '22K' },
    { id: 6, image: 'https://picsum.photos/seed/exp6/400/400', type: 'image', likes: '11K' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/80 backdrop-blur-md py-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6f9cde] transition-colors" />
          <input
            type="text"
            placeholder="Search by name, @username, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none transition-all"
          />
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
            >
              {isSearching ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-[#6f9cde] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Searching Lume...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {searchResults.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6f9cde&color=fff`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          alt={user.username}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                            <span className="text-xs text-[#6f9cde] font-bold flex items-center gap-1">
                              <AtSign className="w-3 h-3" /> {user.username}
                            </span>
                            {user.email && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" /> {user.email}
                              </span>
                            )}
                            {user.phone && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleFollow(user.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6f9cde]/10 text-[#6f9cde] font-bold rounded-xl hover:bg-[#6f9cde] hover:text-white transition-all text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-medium">No users found matching your search.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
              activeCategory === cat
                ? "bg-[#6f9cde] text-white shadow-md shadow-[#6f9cde]/20"
                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <TrendingUp className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Trending Now</h2>
            <p className="text-sm text-gray-400 uppercase font-black tracking-widest">Nothing to show yet</p>
          </div>

          {/* Explore Grid */}
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <ImageIcon className="w-16 h-16 text-gray-100 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Explore Media</h2>
            <p className="text-sm text-gray-400 uppercase font-black tracking-widest">Nothing to show yet</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <Users className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Suggested for You</h3>
            <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Nothing to show yet</p>
          </div>

          <div className="bg-gradient-to-br from-[#6f9cde] to-[#8eb1e6] rounded-3xl p-6 text-white shadow-lg shadow-[#6f9cde]/20">
            <Sparkles className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-black mb-2 leading-tight">Try ShiPu AI Premium</h3>
            <p className="text-sm opacity-90 mb-4">Get advanced analysis, unlimited fact-checks, and exclusive AI avatars.</p>
            <button className="w-full py-3 bg-white text-[#6f9cde] font-black rounded-2xl shadow-sm hover:bg-gray-50 transition-all">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

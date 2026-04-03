import { useState, useEffect } from 'react';
import { Search, TrendingUp, Hash, Users, Sparkles, Image as ImageIcon, Play, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Trending');

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
            placeholder="Search Lume..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none transition-all"
          />
        </div>
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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#6f9cde]" />
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Trending Now</h2>
              </div>
              <button className="text-sm font-bold text-[#6f9cde] hover:underline">View All</button>
            </div>
            
            <div className="space-y-5">
              {trendingTopics.map((topic, i) => (
                <motion.div
                  key={topic.tag}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[#6f9cde]/10 transition-colors">
                      <Hash className="w-5 h-5 text-gray-400 group-hover:text-[#6f9cde]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-[#6f9cde] transition-colors">{topic.tag}</p>
                      <p className="text-xs text-gray-400 font-medium">{topic.category} • {topic.posts} posts</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Explore Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestedPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
              >
                <img src={post.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Explore" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                    <Sparkles className="w-3 h-3" />
                    {post.likes}
                  </div>
                </div>
                {post.type === 'video' && (
                  <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white">
                    <Play className="w-3 h-3 fill-current" />
                  </div>
                )}
                {post.type === 'image' && (
                  <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white">
                    <ImageIcon className="w-3 h-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6f9cde]" />
              Suggested for You
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={`https://picsum.photos/seed/user${i}/100`} className="w-10 h-10 rounded-full object-cover" alt="User" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">User {i}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Followed by Friend</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-[#6f9cde] hover:underline">Follow</button>
                </div>
              ))}
            </div>
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

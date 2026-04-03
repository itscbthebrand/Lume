import { useState, useEffect } from 'react';
import { postApi } from '../lib/api';
import PostCard from './PostCard';
import { Share2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SharedFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedPosts = async () => {
      try {
        const res = await postApi.getSharedPosts();
        setPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch shared posts:', err);
        setError('Failed to load shared content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#6f9cde] font-bold uppercase tracking-widest text-xs">Loading shared content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-[#6f9cde]/10 rounded-2xl flex items-center justify-center">
          <Share2 className="w-6 h-6 text-[#6f9cde]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Shared with you</h2>
          <p className="text-sm text-gray-500 font-medium">Content shared directly with you by friends</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {posts.length > 0 ? (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No shared content yet</h3>
              <p className="text-gray-500 max-w-xs mx-auto">When friends share posts directly with you, they'll appear here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

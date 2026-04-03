import { useState, useEffect } from 'react';
import { postApi } from '../lib/api';
import { useAuth } from '../App';
import { Post } from '../types';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import Stories from './Stories';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'personalized' | 'discovery' | 'friends'>('personalized');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await postApi.getPosts();
        setPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [feedType, user?.id]);

  // Simulated EdgeRank scoring
  const calculatePostScore = (post: Post, currentUserId?: string) => {
    let score = 0;
    const now = Date.now();
    const postTime = post.createdAt ? new Date(post.createdAt).getTime() : now;
    const hoursOld = (now - postTime) / (1000 * 60 * 60);

    // Time decay
    score += Math.max(0, 100 - hoursOld * 2);

    // Engagement weight
    score += (post.reactionCount || 0) * 2;
    score += (post.commentCount || 0) * 5;
    score += (post.shareCount || 0) * 10;

    return score;
  };

  return (
    <div className="space-y-6">
      {/* Feed Switcher */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 sticky top-[-1px] md:top-0 z-40">
        {[
          { id: 'personalized', label: 'For You', icon: Sparkles },
          { id: 'discovery', label: 'Discovery', icon: TrendingUp },
          { id: 'friends', label: 'Friends', icon: Users },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setFeedType(type.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              feedType === type.id
                ? "bg-[#6f9cde] text-white shadow-md shadow-[#6f9cde]/20"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <type.icon className="w-4 h-4" />
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      <Stories />

      <CreatePost />

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {posts.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                <Sparkles className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No posts yet</h3>
              <p className="text-gray-500">Be the first to light up the feed!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

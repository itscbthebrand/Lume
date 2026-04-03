import { useState, useEffect, useRef } from 'react';
import { Post, ReactionType } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, ShieldCheck, BadgeCheck, Globe, Users, Lock, Lightbulb, Search, MapPin, X, AlertCircle, CheckCircle2, Smile, Edit3, Trash2, Send, Link as LinkIcon, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { factCheckPost, askShiPuAI } from '../lib/gemini';
import { postApi } from '../lib/api';
import { useAuth } from '../App';
import ReactMarkdown from 'react-markdown';

interface PostCardProps {
  post: Post;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  love: '❤️',
  care: '🫂',
  haha: '😂',
  sad: '😢',
  wow: '😮',
  angry: '😡',
  smile: '🙂'
};

export default function PostCard({ post: initialPost }: PostCardProps) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(post.aiSummary || null);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null);
  const [isFake, setIsFake] = useState<boolean | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userReaction = post.reactions?.find(r => r.userId === user?.id);

  useEffect(() => {
    if (post.type === 'question' && !post.aiAnswer && !aiResponse) {
      handleAIAsk();
    }
  }, [post.type, post.aiAnswer]);

  const handleFactCheck = async () => {
    setIsFactChecking(true);
    setShowAI(true);
    try {
      const result = await factCheckPost(post.content);
      setFactCheckResult(result);
      setIsFake(result.toLowerCase().includes('fake') || result.toLowerCase().includes('misleading') || result.toLowerCase().includes('unverified'));
    } catch (err) {
      console.error(err);
    } finally {
      setIsFactChecking(false);
    }
  };

  const handleAIAsk = async () => {
    setShowAI(true);
    if (aiResponse) return;
    try {
      const prompt = post.type === 'question' 
        ? `Provide a comprehensive and helpful answer to this question: "${post.content}"`
        : `Analyze this post and provide a concise summary and insights: "${post.content}"`;
      const result = await askShiPuAI(prompt);
      setAiResponse(result);
      // Save summary to post data
      await postApi.saveSummary(post.id, result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReact = async (type: ReactionType) => {
    try {
      const res = await postApi.react(post.id, type);
      setPost(res.data);
      setShowReactions(false);
    } catch (err) {
      console.error(err);
    }
  };

  const onTouchStart = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactions(true);
    }, 500);
  };

  const onTouchEnd = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      await postApi.delete(post.id);
      window.location.reload(); // Simple way to refresh feed
    } catch (err) {
      console.error(err);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await postApi.update(post.id, { content: editContent });
      setPost(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update post');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      // Assuming a comment API exists or I should add it
      const res = await postApi.comment(post.id, commentText);
      setPost(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.isAnonymous ? `https://ui-avatars.com/api/?name=Anon+User&background=333&color=fff` : (post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=6f9cde&color=fff`)}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              alt={post.authorName}
            />
            {!post.isAnonymous && post.authorVerificationStatus && post.authorVerificationStatus !== 'none' && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <BadgeCheck className={cn("w-4 h-4", post.authorVerificationStatus === 'gold' ? "text-yellow-500" : "text-[#6f9cde]")} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-gray-900 hover:underline cursor-pointer">
                {post.isAnonymous ? (post.anonymousNickname || 'Anonymous User') : post.authorName}
              </h4>
              {post.authorUsername === 'adi' && <ShieldCheck className="w-4 h-4 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}</span>
              <span>•</span>
              {post.audience === 'public' && <Globe className="w-3 h-3" />}
              {post.audience === 'friends' && <Users className="w-3 h-3" />}
              {post.audience === 'private' && <Lock className="w-3 h-3" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAIAsk}
            className="p-2 hover:bg-purple-50 rounded-full text-purple-500 transition-colors"
            title="ShiPu AI Summary"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  <LinkIcon className="w-4 h-4" />
                  Copy Link
                </button>
                {(user?.id === post.authorUid || user?.role === 'admin' || user?.role === 'owner') && (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                      <Edit3 className="w-4 h-4" />
                      Edit Post
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                      Delete Post
                    </button>
                  </>
                )}
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  <AlertCircle className="w-4 h-4" />
                  Report Post
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="px-6 pb-4 relative">
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl z-[60]"
            >
              <Check className="w-3 h-3 text-green-400" />
              Link Copied!
            </motion.div>
          )}
        </AnimatePresence>
        {isFake === true && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Reality Check: Potential Misinformation</p>
              <p className="text-xs text-red-600 mt-0.5">ShiPu AI has flagged this post as potentially containing unverified or misleading claims. See the analysis below for correct information.</p>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-800 outline-none focus:ring-2 focus:ring-[#6f9cde]/20 resize-none min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-4 py-2 text-sm font-bold bg-[#6f9cde] text-white rounded-xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] transition-all">
                Update
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
        
        {post.media && post.media.length > 0 && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100">
            {post.media.map((m, i) => (
              <img key={i} src={m.url} alt="Post media" className="w-full object-cover max-h-[500px]" />
            ))}
          </div>
        )}

        {/* AI Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleAIAsk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            ShiPu AI Summary
          </button>
          <button
            onClick={handleFactCheck}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Auto Fact-Check
          </button>
          {isFake !== null && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
              isFake ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            )}>
              {isFake ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isFake ? 'Potential Misinformation' : 'Verified Information'}
            </div>
          )}
          {post.location && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold hover:bg-green-100 transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              {post.location.name}
            </button>
          )}
        </div>

        {/* AI Response Panel */}
        <AnimatePresence>
          {(showAI || post.aiSummary) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#6f9cde]" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#6f9cde] rounded-xl flex items-center justify-center shadow-sm">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">ShiPu AI</span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {isFactChecking ? 'Fact-checking...' : (factCheckResult ? 'Reality Check' : 'Analysis')}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowAI(false); setFactCheckResult(null); setAiResponse(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed">
                {isFactChecking ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <div className="w-8 h-8 border-3 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Searching Google Data...</span>
                  </div>
                ) : (
                  <ReactMarkdown>{factCheckResult || aiResponse || post.aiSummary || 'Thinking...'}</ReactMarkdown>
                )}
              </div>

              {(factCheckResult || aiResponse || post.aiSummary) && !isFactChecking && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3" />
                  Always verify information independently
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between relative">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onMouseDown={onTouchStart}
              onMouseUp={onTouchEnd}
              onMouseLeave={onTouchEnd}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onClick={() => handleReact('love')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                userReaction ? "bg-red-50 text-red-500" : "hover:bg-gray-50 text-gray-500"
              )}
            >
              {userReaction ? (
                <span className="text-xl">{REACTION_EMOJIS[userReaction.type]}</span>
              ) : (
                <Heart className="w-5 h-5" />
              )}
              <span className="text-sm font-bold">{post.reactionCount}</span>
            </button>

            {/* Reaction Picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -50, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute bottom-full left-0 bg-white rounded-full shadow-2xl border border-gray-100 p-1.5 flex items-center gap-1 z-50"
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform"
                      title={type}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-500 rounded-xl transition-all">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{post.commentCount}</span>
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-500 rounded-xl transition-all">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-bold">{post.shareCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 border-t border-gray-50 bg-gray-50/30"
          >
            <div className="pt-4 space-y-4">
              {/* Comment Input */}
              <form onSubmit={handleComment} className="flex items-center gap-3">
                <img 
                  src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff`} 
                  className="w-8 h-8 rounded-full object-cover" 
                  alt="My Profile" 
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6f9cde]/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim() || isCommenting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6f9cde] disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Comment List */}
              <div className="space-y-4 mt-4">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}&background=6f9cde&color=fff`} className="w-8 h-8 rounded-full object-cover" alt={comment.authorName} />
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-900">{comment.authorName}</p>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 ml-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <p className="text-center text-xs text-gray-400 py-4">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

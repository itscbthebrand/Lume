import { useState, useEffect, useRef } from 'react';
import { Post, ReactionType, Comment } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, ShieldCheck, BadgeCheck, Globe, Users, Lock, Lightbulb, Search, MapPin, X, AlertCircle, CheckCircle2, Smile, Edit3, Trash2, Send, Link as LinkIcon, Check, ThumbsUp, Laugh, Heart as HeartIcon, Star, Frown, MoreVertical, ChevronRight, BarChart2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { factCheckPost, askShiPuAI } from '../lib/gemini';
import { postApi, authApi } from '../lib/api';
import { useAuth } from '../App';
import ReactMarkdown from 'react-markdown';
import Mentions from './Mentions';
import { Link } from 'react-router-dom';

const REACTION_TYPES_LIST = [
  { type: 'love', icon: HeartIcon, color: 'text-red-500', label: 'Love' },
  { type: 'haha', icon: Laugh, color: 'text-yellow-500', label: 'Haha' },
  { type: 'wow', icon: Star, color: 'text-purple-500', label: 'Wow' },
  { type: 'sad', icon: Frown, color: 'text-orange-500', label: 'Sad' },
  { type: 'angry', icon: AlertCircle, color: 'text-red-600', label: 'Angry' },
  { type: 'smile', icon: Smile, color: 'text-green-500', label: 'Smile' },
  { type: 'care', icon: Heart, color: 'text-pink-500', label: 'Care' },
];

const REACTION_TYPES: ReactionType[] = ['love', 'care', 'haha', 'sad', 'wow', 'angry', 'smile'];

interface PostCardProps {
  post: Post;
}

import { ReactionIcon } from './ReactionIcons';

export default function PostCard({ post: initialPost, onUpdate }: { post: Post; onUpdate?: (post: Post) => void }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(post.aiSummary || null);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<string | null>(null);
  const [isFake, setIsFake] = useState<boolean | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showReactionViewer, setShowReactionViewer] = useState(false);
  const [reactors, setReactors] = useState<any[]>([]);
  const [isLoadingReactors, setIsLoadingReactors] = useState(false);
  const reactionTimeoutRef = useRef<any>(null);

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
      onUpdate?.(res.data);
      setShowReactions(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReactors = async () => {
    setIsLoadingReactors(true);
    try {
      const res = await postApi.getReactions(post.id);
      setReactors(res.data);
      setShowReactionViewer(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingReactors(false);
    }
  };

  const handleVote = async (optionId: string) => {
    try {
      const res = await postApi.votePoll(post.id, optionId);
      setPost(res.data);
      onUpdate?.(res.data);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleCommentReact = async (commentId: string, type: string) => {
    try {
      const res = await postApi.reactToComment(post.id, commentId, type as any);
      setPost(res.data);
      onUpdate?.(res.data);
    } catch (err) {
      console.error('Failed to react to comment:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await postApi.comment(post.id, commentText);
      setPost(res.data);
      onUpdate?.(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Failed to comment:', err);
    } finally {
      setIsCommenting(false);
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

  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link 
            key={i} 
            to={`/profile/${username}`}
            className="text-[#6f9cde] font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={post.isAnonymous ? `https://ui-avatars.com/api/?name=Anon+User&background=333&color=fff` : (post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=6f9cde&color=fff`)}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
              alt={post.authorName}
            />
            {!post.isAnonymous && post.authorVerificationStatus && post.authorVerificationStatus !== 'none' && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                <BadgeCheck className={cn("w-3.5 h-3.5", post.authorVerificationStatus === 'gold' ? "text-yellow-500" : "text-[#6f9cde]")} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-gray-900 hover:text-[#6f9cde] transition-colors cursor-pointer truncate">
                {post.isAnonymous ? (post.anonymousNickname || 'Anonymous User') : post.authorName}
              </h4>
              {post.authorUsername === 'adi' && <ShieldCheck className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}</span>
              <span className="text-gray-300">•</span>
              {post.audience === 'public' && <Globe className="w-2.5 h-2.5" />}
              {post.audience === 'friends' && <Users className="w-2.5 h-2.5" />}
              {post.audience === 'private' && <Lock className="w-2.5 h-2.5" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleAIAsk}
            className="p-2 hover:bg-purple-50 rounded-full text-purple-400 hover:text-purple-600 transition-all"
            title="ShiPu AI Summary"
          >
            <Lightbulb className="w-4.5 h-4.5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  Copy Link
                </button>
                {(user?.id === post.authorUid || user?.role === 'admin' || user?.role === 'owner') && (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Edit3 className="w-4 h-4 text-gray-400" />
                      Edit Post
                    </button>
                    <button onClick={handleDelete} disabled={isDeleting} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Delete Post
                    </button>
                  </>
                )}
                <div className="h-px bg-gray-100 my-1" />
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
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
    <div className="px-5 pb-4 relative">
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 shadow-xl z-[60]"
            >
              <Check className="w-3 h-3 text-green-400" />
              Link Copied!
            </motion.div>
          )}
        </AnimatePresence>
        {isFake === true && (
          <div className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-red-700">Reality Check: Potential Misinformation</p>
              <p className="text-[11px] text-red-600/80 mt-0.5 leading-normal">ShiPu AI has flagged this post as potentially containing unverified or misleading claims. See the analysis below for correct information.</p>
            </div>
          </div>
        )}
        
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-800 outline-none focus:ring-2 focus:ring-[#6f9cde]/20 resize-none min-h-[100px] text-[15px]"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-4 py-1.5 text-sm font-medium bg-[#6f9cde] text-white rounded-lg shadow-sm hover:bg-[#5a86c7] transition-all">
                Update
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
            {renderContent(post.content)}
          </div>
        )}

        {post.type === 'poll' && post.pollData && (
          <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">{post.pollData.question}</h4>
            <div className="space-y-2">
              {post.pollData.options.map((option) => {
                const hasVoted = post.pollData?.options.some(opt => opt.votes.includes(user?.id || ''));
                const voteCount = option.votes.length;
                const percentage = post.pollData?.totalVotes ? Math.round((voteCount / post.pollData.totalVotes) * 100) : 0;
                const isMyVote = option.votes.includes(user?.id || '');

                return (
                  <button
                    key={option.id}
                    onClick={() => !hasVoted && handleVote(option.id)}
                    disabled={hasVoted}
                    className={cn(
                      "w-full relative h-10 rounded-xl overflow-hidden border transition-all text-left px-4",
                      hasVoted ? "cursor-default" : "hover:border-[#6f9cde] hover:bg-white",
                      isMyVote ? "border-[#6f9cde] bg-[#6f9cde]/5" : "border-gray-200 bg-white"
                    )}
                  >
                    <div 
                      className={cn(
                        "absolute left-0 top-0 h-full transition-all duration-1000",
                        isMyVote ? "bg-[#6f9cde]/20" : "bg-gray-100"
                      )}
                      style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                    />
                    <div className="relative flex items-center justify-between h-full text-sm">
                      <span className={cn("font-bold", isMyVote ? "text-[#6f9cde]" : "text-gray-700")}>
                        {option.text}
                        {isMyVote && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2" />}
                      </span>
                      {hasVoted && (
                        <span className="text-xs font-black text-gray-500">{percentage}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">
              <span>{post.pollData.totalVotes || 0} votes</span>
              <span>Ends {formatDistanceToNow(new Date(post.pollData.expiresAt), { addSuffix: true })}</span>
            </div>
          </div>
        )}
        
        {post.media && post.media.length > 0 && (
          <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
            {post.media.map((m, i) => (
              <img key={i} src={m.url} alt="Post media" className="w-full object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500" />
            ))}
          </div>
        )}

        {/* AI Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleAIAsk}
            className="flex items-center gap-1.5 px-2.5 py-1.25 bg-purple-50/80 text-purple-600 rounded-lg text-[11px] font-semibold hover:bg-purple-100 transition-colors border border-purple-100/50"
          >
            <Lightbulb className="w-3 h-3" />
            ShiPu AI Summary
          </button>
          <button
            onClick={handleFactCheck}
            className="flex items-center gap-1.5 px-2.5 py-1.25 bg-blue-50/80 text-blue-600 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition-colors border border-blue-100/50"
          >
            <Search className="w-3 h-3" />
            Auto Fact-Check
          </button>
          {isFake !== null && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.25 rounded-lg text-[11px] font-semibold border",
              isFake ? "bg-red-50/80 text-red-600 border-red-100/50" : "bg-green-50/80 text-green-600 border-green-100/50"
            )}>
              {isFake ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {isFake ? 'Potential Misinformation' : 'Verified Information'}
            </div>
          )}
          {post.location && (
            <button className="flex items-center gap-1.5 px-2.5 py-1.25 bg-gray-50 text-gray-600 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors border border-gray-200/50">
              <MapPin className="w-3 h-3" />
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
              className="mt-4 bg-gray-50/80 rounded-xl p-4 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#6f9cde]" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#6f9cde] rounded-lg flex items-center justify-center shadow-sm">
                    <Lightbulb className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-gray-900">ShiPu AI</span>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {isFactChecking ? 'Fact-checking...' : (factCheckResult ? 'Reality Check' : 'Analysis')}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowAI(false); setFactCheckResult(null); setAiResponse(null); }} className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="text-[13px] text-gray-700 prose prose-sm max-w-none leading-relaxed">
                {isFactChecking ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <div className="w-6 h-6 border-2 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Searching Google Data...</span>
                  </div>
                ) : (
                  <ReactMarkdown>{factCheckResult || aiResponse || post.aiSummary || 'Thinking...'}</ReactMarkdown>
                )}
              </div>

              {(factCheckResult || aiResponse || post.aiSummary) && !isFactChecking && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Always verify information independently
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="px-3 py-2 border-t border-gray-50 flex items-center justify-between relative">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onMouseDown={onTouchStart}
              onMouseUp={onTouchEnd}
              onMouseLeave={onTouchEnd}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onClick={() => handleReact('love')}
              onDoubleClick={fetchReactors}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                userReaction ? "bg-red-50 text-red-500" : "hover:bg-gray-50 text-gray-500"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={userReaction?.type || 'none'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {userReaction ? (
                    <ReactionIcon type={userReaction.type} className="w-5 h-5" />
                  ) : (
                    <Heart className="w-4.5 h-4.5" />
                  )}
                </motion.div>
              </AnimatePresence>
              <span className="text-[13px] font-semibold">
                {post.reactionCount}
              </span>
            </button>

            {/* Reaction Picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -45, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="absolute bottom-full left-0 bg-white rounded-full shadow-xl border border-gray-100 p-1 flex items-center gap-0.5 z-50"
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {REACTION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className="w-9 h-9 flex items-center justify-center hover:scale-125 transition-transform"
                      title={type}
                    >
                      <ReactionIcon type={type} className="w-7 h-7" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-500 rounded-lg transition-all">
            <MessageCircle className="w-4.5 h-4.5" />
            <span className="text-[13px] font-semibold">{post.commentCount}</span>
          </button>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-500 rounded-lg transition-all">
          <Share2 className="w-4.5 h-4.5" />
          <span className="text-[13px] font-semibold">{post.shareCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 border-t border-gray-50 bg-gray-50/20"
          >
            <div className="pt-4 space-y-4">
              {/* Comment Input */}
              <form onSubmit={handleComment} className="flex items-center gap-3">
                <img 
                  src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff`} 
                  className="w-7 h-7 rounded-full object-cover shadow-sm" 
                  alt="My Profile" 
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-lg px-3.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-[#6f9cde]/20 transition-all shadow-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim() || isCommenting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6f9cde] disabled:opacity-50 hover:scale-110 transition-transform"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Comment List */}
              <div className="space-y-3 mt-4">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5 group/comment">
                    <img src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}&background=6f9cde&color=fff`} className="w-7 h-7 rounded-full object-cover shrink-0" alt={comment.authorName} />
                    <div className="flex-1 min-w-0">
                      <div className="bg-white p-2.5 rounded-xl rounded-tl-none border border-gray-100 shadow-sm relative">
                        <p className="text-[11px] font-bold text-gray-900 truncate">{comment.authorName}</p>
                        <p className="text-[13px] text-gray-700 mt-0.5 leading-normal">{renderContent(comment.content)}</p>
                        
                        {/* Comment Reactions */}
                        {comment.reactionCount > 0 && (
                          <div className="absolute -bottom-2 -right-1 flex items-center bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-gray-50 gap-0.5">
                            {comment.reactions.slice(0, 3).map((r, i) => (
                              <ReactionIcon key={i} type={r.type} className="w-2.5 h-2.5" />
                            ))}
                            <span className="text-[9px] font-black text-gray-500 ml-0.5">{comment.reactionCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                        <button 
                          onClick={() => handleCommentReact(comment.id, 'love')}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider hover:text-[#6f9cde] transition-colors",
                            comment.reactions?.some(r => r.userId === user?.id) ? "text-[#6f9cde]" : "text-gray-400"
                          )}
                        >
                          Like
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-100 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Nothing to show yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Reaction Viewer Modal */}
      <AnimatePresence>
        {showReactionViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Users className="w-5 h-5 text-[#6f9cde]" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Reactions</h3>
                </div>
                <button onClick={() => setShowReactionViewer(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {reactors.length > 0 ? (
                  reactors.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <img 
                          src={r.photo || `https://ui-avatars.com/api/?name=${r.name}&background=6f9cde&color=fff`} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt="" 
                        />
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#6f9cde] transition-colors">
                            {r.name}
                          </p>
                          <p className="text-xs text-gray-500">@{r.username}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-50">
                        <ReactionIcon type={r.type} className="w-5 h-5" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Smile className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No reactions yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReactionUserItem({ userId, type }: { userId: string; type: string }) {
  const [user, setUser] = useState<any>(null);
  const Icon = REACTION_TYPES_LIST.find(r => r.type === type)?.icon || ThumbsUp;
  const color = REACTION_TYPES_LIST.find(r => r.type === type)?.color || 'text-blue-500';

  useEffect(() => {
    authApi.getUserById(userId).then(res => setUser(res.data));
  }, [userId]);

  if (!user) return <div className="h-16 bg-gray-50 animate-pulse rounded-2xl" />;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
      <div className="flex items-center gap-3">
        <img 
          src={user.profilePhoto || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6f9cde&color=fff`} 
          className="w-10 h-10 rounded-full object-cover" 
          alt="" 
        />
        <div>
          <p className="font-bold text-gray-900 group-hover:text-[#6f9cde] transition-colors">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
      </div>
      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-gray-50", color)}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

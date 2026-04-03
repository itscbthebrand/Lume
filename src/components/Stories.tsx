import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Send, Eye } from 'lucide-react';
import { useAuth } from '../App';
import { storyApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ReactionType, Story } from '../types';

const REACTION_EMOJIS: Record<ReactionType, string> = {
  love: '❤️',
  care: '🫂',
  haha: '😂',
  sad: '😢',
  wow: '😮',
  angry: '😡',
  smile: '🙂'
};

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedStoryIndex !== null) {
      const story = stories[selectedStoryIndex];
      if (story && story.authorId !== user?.id) {
        handleView(story.id);
      }
    }
  }, [selectedStoryIndex]);

  const fetchStories = async () => {
    try {
      const res = await storyApi.getStories();
      setStories(res.data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  const handleView = async (storyId: string) => {
    try {
      await storyApi.view(storyId);
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const mediaType = file.type.startsWith('video') ? 'video' : 'image';
        await storyApi.createStory({ media: base64, mediaType });
        fetchStories();
      } catch (err) {
        console.error('Failed to upload story:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReact = async (storyId: string, type: ReactionType) => {
    try {
      await storyApi.react(storyId, type);
      fetchStories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || selectedStoryIndex === null || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await storyApi.reply(stories[selectedStoryIndex].id, replyText);
      setReplyText('');
      // Show success toast or something?
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Group stories by author for the list view
  const uniqueAuthors = Array.from(new Set(stories.map(s => s.authorId)));
  const displayStories = uniqueAuthors.map(authorId => {
    return stories.find(s => s.authorId === authorId)!;
  });

  const currentStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;
  const isAuthor = currentStory?.authorId === user?.id;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
      {/* Add Story Button */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full p-1 border-2 border-dashed border-gray-300 flex items-center justify-center transition-all group-hover:border-[#6f9cde] group-hover:bg-[#6f9cde]/5">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#6f9cde]" />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>
        <span className="text-[10px] font-bold text-gray-500 text-center">Add Story</span>
      </div>

      {displayStories.map((story, index) => (
        <div 
          key={story.id} 
          onClick={() => {
            setSelectedStoryIndex(stories.findIndex(s => s.id === story.id));
            setShowViewers(false);
          }}
          className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-1 border-2 border-[#6f9cde] transition-transform group-hover:scale-105">
              <img
                src={story.authorPhoto || `https://ui-avatars.com/api/?name=${story.authorName}&background=6f9cde&color=fff`}
                className="w-full h-full rounded-full object-cover"
                alt={story.authorName}
              />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-600 truncate w-16 text-center">
            {story.authorId === user?.id ? 'Your Story' : story.authorName.split(' ')[0]}
          </span>
        </div>
      ))}

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedStoryIndex !== null && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <button 
              onClick={() => setSelectedStoryIndex(null)}
              className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full z-[110]"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                {stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: i === selectedStoryIndex ? '100%' : (i < selectedStoryIndex ? '100%' : '0%') }}
                      transition={{ duration: i === selectedStoryIndex ? 5 : 0, ease: 'linear' }}
                      onAnimationComplete={() => {
                        if (i === selectedStoryIndex && selectedStoryIndex < stories.length - 1) {
                          setSelectedStoryIndex(selectedStoryIndex + 1);
                        } else if (i === selectedStoryIndex && selectedStoryIndex === stories.length - 1) {
                          setSelectedStoryIndex(null);
                        }
                      }}
                      className="h-full bg-white"
                    />
                  </div>
                ))}
              </div>

              {/* Author Info */}
              <div className="absolute top-8 left-4 flex items-center gap-3 z-10">
                <img 
                  src={currentStory.authorPhoto || `https://ui-avatars.com/api/?name=${currentStory.authorName}&background=6f9cde&color=fff`} 
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  alt=""
                />
                <div>
                  <p className="text-white font-bold text-sm shadow-sm">{currentStory.authorName}</p>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Media */}
              <div className="flex-1 relative">
                {currentStory.mediaType === 'video' ? (
                  <video 
                    src={currentStory.media} 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={currentStory.media} 
                    className="w-full h-full object-cover"
                    alt="Story"
                  />
                )}

                {/* Navigation */}
                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start p-4 cursor-pointer" onClick={() => setSelectedStoryIndex(prev => prev! > 0 ? prev! - 1 : prev)}>
                  <ChevronLeft className="w-8 h-8 text-white/50 opacity-0 hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end p-4 cursor-pointer" onClick={() => setSelectedStoryIndex(prev => prev! < stories.length - 1 ? prev! + 1 : null)}>
                  <ChevronRight className="w-8 h-8 text-white/50 opacity-0 hover:opacity-100 transition-opacity" />
                </div>

                {/* Viewers List Overlay */}
                <AnimatePresence>
                  {showViewers && isAuthor && (
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="absolute inset-x-0 bottom-0 top-20 bg-white rounded-t-3xl z-50 p-6 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Viewers</h3>
                        <button onClick={() => setShowViewers(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {currentStory.viewers && currentStory.viewers.length > 0 ? (
                          currentStory.viewers.map((viewer) => (
                            <div key={viewer.id} className="flex items-center gap-3">
                              <img 
                                src={viewer.photo || `https://ui-avatars.com/api/?name=${viewer.name}&background=6f9cde&color=fff`} 
                                className="w-10 h-10 rounded-full object-cover"
                                alt=""
                              />
                              <span className="font-bold text-gray-900">{viewer.name}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-10 font-medium">No views yet</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer: Reactions & Reply or Viewers Button */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pt-10">
                {isAuthor ? (
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowViewers(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-bold hover:bg-white/30 transition-all"
                    >
                      <Eye className="w-5 h-5" />
                      <span>{currentStory.viewers?.length || 0} Views</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
                      {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => (
                        <button
                          key={type}
                          onClick={() => handleReact(currentStory.id, type)}
                          className="w-10 h-10 flex-shrink-0 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleReply} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reply to story..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSendingReply}
                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

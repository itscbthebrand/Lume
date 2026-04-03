import { useState, useRef } from 'react';
import { postApi } from '../lib/api';
import { useAuth } from '../App';
import { Image, Video, FileText, BarChart2, Smile, MapPin, Globe, Users, Lock, Send, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function CreatePost() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState<'public' | 'friends' | 'private'>('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [media, setMedia] = useState<File[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'poll' | 'question'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMedia(prev => [...prev, ...files]);
    if (files.length > 0) {
      const type = files[0].type.startsWith('video') ? 'video' : 'image';
      setPostType(type);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    // Allow posting if there's content OR media OR it's a poll with options
    const hasContent = content.trim().length > 0;
    const hasMedia = media.length > 0;
    const hasPoll = postType === 'poll' && pollOptions.filter(o => o.trim()).length >= 2;
    
    if (!hasContent && !hasMedia && !hasPoll) return;
    
    setLoading(true);

    try {
      const mediaData = await Promise.all(media.map(async (file) => ({
        url: await readFileAsBase64(file),
        type: file.type.startsWith('video') ? 'video' : 'image' as any
      })));

      const postData: any = {
        content,
        type: postType,
        audience,
        isAnonymous,
        media: mediaData,
      };

      if (postType === 'poll') {
        postData.pollData = {
          options: pollOptions.filter(o => o.trim()).map(o => ({ text: o, votes: [] })),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      }

      await postApi.createPost(postData);

      setContent('');
      setMedia([]);
      setPostType('text');
      setPollOptions(['', '']);
      setIsExpanded(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <div className="p-4">
        <div className="flex gap-3">
          <img
            src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff`}
            className="w-10 h-10 rounded-full object-cover"
            alt="User"
          />
          <div className="flex-1">
            <textarea
              placeholder={postType === 'question' ? "Ask a question..." : `What's on your mind, ${user?.firstName}?`}
              value={content}
              onFocus={() => setIsExpanded(true)}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl p-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#6f9cde]/20 transition-all resize-none min-h-[48px]"
              rows={isExpanded ? 4 : 1}
            />
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Poll Options */}
              {postType === 'poll' && (
                <div className="space-y-2 px-2">
                  {pollOptions.map((option, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[i] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs font-bold text-[#6f9cde] hover:underline px-2"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Audience & Anonymous Toggle */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border-none focus:ring-0 cursor-pointer"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="private">Only Me</option>
                  </select>
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                      isAnonymous ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    Post Anonymously
                  </button>
                </div>
              </div>

              {/* Media Preview */}
              {media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 px-2">
                  {media.map((file, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      {file.type.startsWith('video') ? (
                        <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      ) : (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                      )}
                      <button
                        onClick={() => {
                          const newMedia = media.filter((_, idx) => idx !== i);
                          setMedia(newMedia);
                          if (newMedia.length === 0) setPostType('text');
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <button onClick={() => fileInputRef.current?.click()} className={cn("p-2 rounded-xl transition-colors", postType === 'image' ? "bg-blue-50 text-blue-500" : "hover:bg-blue-50 text-blue-500")}>
                    <Image className="w-5 h-5" />
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className={cn("p-2 rounded-xl transition-colors", postType === 'video' ? "bg-purple-50 text-purple-500" : "hover:bg-purple-50 text-purple-500")}>
                    <Video className="w-5 h-5" />
                  </button>
                  <button onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')} className={cn("p-2 rounded-xl transition-colors", postType === 'poll' ? "bg-green-50 text-green-500" : "hover:bg-green-50 text-green-500")}>
                    <BarChart2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setPostType(postType === 'question' ? 'text' : 'question')} className={cn("p-2 rounded-xl transition-colors", postType === 'question' ? "bg-yellow-50 text-yellow-500" : "hover:bg-yellow-50 text-yellow-500")}>
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setMedia([]);
                      setPostType('text');
                      setPollOptions(['', '']);
                    }}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || (!content.trim() && media.length === 0 && (postType !== 'poll' || pollOptions.filter(o => o.trim()).length < 2))}
                    className="px-6 py-2 bg-[#6f9cde] text-white font-bold rounded-xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
    </div>
  );
}

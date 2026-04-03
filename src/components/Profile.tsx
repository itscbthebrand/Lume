import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi, postApi } from '../lib/api';
import { useAuth } from '../App';
import { User, Post } from '../types';
import PostCard from './PostCard';
import MyFiles from './MyFiles';
import { Camera, Edit3, MapPin, Calendar, Briefcase, GraduationCap, BadgeCheck, ShieldCheck, X, Save, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '../lib/utils';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'files'>('posts');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    work: '',
    education: '',
    profilePhoto: '',
    coverPhoto: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!username) return;

    const fetchUser = async () => {
      try {
        const res = await authApi.getUser(username);
        setUser(res.data);
        setIsFollowing(res.data.followers?.includes(currentUser?.id || '') || false);
        if (currentUser?.id === res.data.id) {
          setEditForm({
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            bio: res.data.bio || '',
            work: res.data.work || '',
            education: res.data.education || '',
            profilePhoto: res.data.profilePhoto || '',
            coverPhoto: res.data.coverPhoto || ''
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      }
    };

    fetchUser();
  }, [username, currentUser?.id]);

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    try {
      await authApi.follow(user.id);
      setIsFollowing(!isFollowing);
      // Update local user state to reflect follower count change
      setUser(prev => {
        if (!prev) return null;
        const followers = isFollowing 
          ? prev.followers?.filter(id => id !== currentUser.id) || []
          : [...(prev.followers || []), currentUser.id];
        return { ...prev, followers };
      });
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchPosts = async () => {
      try {
        const res = await authApi.getUserPosts(user.id);
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile(editForm);
      setUser(res.data);
      if (currentUser?.id === res.data.id) {
        setCurrentUser(res.data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500">The user you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header / Cover */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-48 md:h-64 bg-gradient-to-r from-[#6f9cde] to-[#a5c1eb] relative group/cover">
          {(user?.coverPhoto || editForm.coverPhoto) && <img src={isEditing ? editForm.coverPhoto : user?.coverPhoto} className="w-full h-full object-cover" alt="Cover" />}
          {currentUser?.id === user?.id && (
            <button 
              onClick={() => {
                if (!isEditing) setIsEditing(true);
                setTimeout(() => coverInputRef.current?.click(), 100);
              }} 
              className="absolute bottom-4 right-4 p-2.5 bg-white/90 text-gray-900 rounded-xl shadow-lg backdrop-blur-md hover:bg-white transition-all z-10 flex items-center gap-2 text-sm font-bold"
            >
              <Camera className="w-5 h-5 text-[#6f9cde]" />
              <span>{isEditing ? 'Change Cover' : 'Edit Cover'}</span>
            </button>
          )}
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20 mb-4">
            <div className="relative group/profile">
              <img
                src={isEditing ? (editForm.profilePhoto || `https://ui-avatars.com/api/?name=${editForm.firstName}+${editForm.lastName}&background=6f9cde&color=fff&size=200`) : (user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff&size=200`)}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                alt="Profile"
              />
              {user && user.verificationStatus !== 'none' && (
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-md">
                  <BadgeCheck className={cn("w-6 h-6", user.verificationStatus === 'gold' ? "text-yellow-500" : "text-[#6f9cde]")} />
                </div>
              )}
              {currentUser?.id === user?.id && (
                <button 
                  onClick={() => {
                    if (!isEditing) setIsEditing(true);
                    setTimeout(() => profileInputRef.current?.click(), 100);
                  }}
                  className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover/profile:opacity-100 transition-opacity"
                >
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  {user?.firstName} {user?.lastName}
                </h1>
                {user?.role === 'owner' && <ShieldCheck className="w-6 h-6 text-yellow-500" />}
              </div>
              <p className="text-gray-500 font-medium">@{user?.username}</p>
            </div>
            <div className="flex gap-2">
              {currentUser?.id === user?.id ? (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all",
                    isEditing ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg shadow-[#6f9cde]/20",
                      isFollowing 
                        ? "bg-gray-100 text-gray-900 hover:bg-gray-200" 
                        : "bg-[#6f9cde] text-white hover:bg-[#5a86c7]"
                    )}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="px-4 py-2.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 max-w-2xl bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    value={editForm.firstName} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={editForm.lastName} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
                <textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none resize-none h-24"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Work</label>
                  <input 
                    type="text" 
                    value={editForm.work} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, work: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Education</label>
                  <input 
                    type="text" 
                    value={editForm.education} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#6f9cde] text-white font-bold rounded-xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 max-w-2xl leading-relaxed">{user?.bio || 'No bio yet.'}</p>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-50">
                {user?.work && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>Works at <span className="font-bold text-gray-900">{user.work}</span></span>
                  </div>
                )}
                {user?.education && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span>Studied at <span className="font-bold text-gray-900">{user.education}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>From <span className="font-bold text-gray-900">Dhaka, Bangladesh</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Joined <span className="font-bold text-gray-900">{user?.createdAt ? formatDate(new Date(user.createdAt).getTime()) : 'Recently'}</span></span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-gray-50 px-6">
          <button 
            onClick={() => setActiveTab('posts')}
            className={cn(
              "px-6 py-4 text-sm font-bold transition-all border-b-2",
              activeTab === 'posts' ? "border-[#6f9cde] text-[#6f9cde]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Posts
          </button>
          {currentUser?.id === user?.id && (
            <button 
              onClick={() => setActiveTab('files')}
              className={cn(
                "px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
                activeTab === 'files' ? "border-[#6f9cde] text-[#6f9cde]" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="w-4 h-4" />
              Files
            </button>
          )}
        </div>
      </div>

      {/* Profile Feed */}
      {activeTab === 'posts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-gray-100" />)}
            </div>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} />)
          )}
          {posts.length === 0 && !loading && (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <p className="text-gray-500 font-medium">No posts to show.</p>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img src={`https://picsum.photos/seed/${user?.username}${i}/200`} className="w-full h-full object-cover" alt="User photo" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Friends</h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center">
                  <img src={`https://picsum.photos/seed/friend${i}/100`} className="w-full aspect-square rounded-xl object-cover mb-2" alt="Friend" />
                  <p className="text-[10px] font-bold text-gray-900 truncate">Friend Name</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <MyFiles />
      )}

      {/* Hidden Inputs */}
      <input type="file" ref={profileInputRef} onChange={(e) => handleFileChange(e, 'profilePhoto')} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'coverPhoto')} accept="image/*" className="hidden" />
    </div>
  );
}



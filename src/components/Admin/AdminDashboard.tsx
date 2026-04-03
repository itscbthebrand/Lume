import { useState, useEffect } from 'react';
import { adminApi, postApi } from '../../lib/api';
import { useAuth } from '../../App';
import { User, Post } from '../../types';
import { Shield, Users, FileText, AlertTriangle, CheckCircle, XCircle, BarChart, Settings, Lock, Unlock, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate } from '../../lib/utils';

export default function AdminDashboard() {
  const { user, isOwner, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'reports' | 'analytics' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [websiteIcon, setWebsiteIcon] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, postsRes, settingsRes] = await Promise.all([
          adminApi.getUsers(),
          postApi.getPosts(),
          adminApi.getSetting('websiteIcon')
        ]);
        setUsers(usersRes.data);
        setPosts(postsRes.data);
        setWebsiteIcon(settingsRes.data || '');
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateIcon = async () => {
    if (!isOwner) return;
    try {
      await adminApi.updateSetting('websiteIcon', websiteIcon);
      alert('Website icon updated successfully!');
    } catch (err) {
      console.error('Failed to update icon:', err);
    }
  };

  const handleToggleLock = async (targetUser: User) => {
    if (!isAdmin) return;
    try {
      const res = await adminApi.lockUser(targetUser.id);
      setUsers(users.map(u => u.id === targetUser.id ? res.data : u));
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const handleVerify = async (targetUser: User, status: 'blue' | 'gold' | 'none') => {
    if (!isAdmin) return;
    try {
      const res = await adminApi.verifyUser(targetUser.id, status);
      setUsers(users.map(u => u.id === targetUser.id ? res.data : u));
    } catch (err) {
      console.error('Failed to verify user:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) return;
    try {
      await adminApi.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[calc(100vh-120px)] flex flex-col">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-[#6f9cde]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6f9cde] rounded-xl flex items-center justify-center shadow-lg shadow-[#6f9cde]/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Admin Master Panel</h2>
            <p className="text-xs font-bold text-[#6f9cde] uppercase tracking-widest">
              {isOwner ? 'Owner Access' : 'Administrator Access'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-r border-gray-50 p-4 space-y-1">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'posts', label: 'Content Moderation', icon: FileText },
            { id: 'reports', label: 'Reported Items', icon: AlertTriangle },
            { id: 'analytics', label: 'System Analytics', icon: BarChart },
            ...(isOwner ? [{ id: 'settings', label: 'Master Settings', icon: Settings }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-[#6f9cde] text-white shadow-md shadow-[#6f9cde]/20"
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Registered Users ({users.length})</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#6f9cde]/20 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th className="pb-4 px-2">User</th>
                      <th className="pb-4 px-2">Role</th>
                      <th className="pb-4 px-2">Status</th>
                      <th className="pb-4 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.profilePhoto || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=6f9cde&color=fff`}
                              className="w-10 h-10 rounded-full object-cover"
                              alt="User"
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-500">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-1 rounded-md",
                            u.role === 'owner' ? "bg-yellow-100 text-yellow-700" :
                            u.role === 'admin' ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            {u.isLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                            {u.verificationStatus !== 'none' && <BadgeCheck className={cn("w-3.5 h-3.5", u.verificationStatus === 'gold' ? "text-yellow-500" : "text-blue-500")} />}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleLock(u)}
                              className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                              title={u.isLocked ? "Unlock Account" : "Lock Account"}
                            >
                              {u.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleVerify(u, u.verificationStatus === 'none' ? 'blue' : 'none')}
                              className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                              title="Toggle Verification"
                            >
                              <BadgeCheck className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Content Moderation</h3>
              <div className="grid grid-cols-1 gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">@{post.authorUsername}</p>
                        <p className="text-xs text-gray-500 truncate">{post.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">System Health & Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Users', value: users.length, color: 'bg-blue-500' },
                  { label: 'Total Posts', value: posts.length, color: 'bg-purple-500' },
                  { label: 'Active Reports', value: 0, color: 'bg-red-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                    <div className={cn("h-1 w-12 rounded-full mt-4", stat.color)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && isOwner && (
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Master System Settings</h3>
              
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Website Icon URL</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={websiteIcon}
                      onChange={(e) => setWebsiteIcon(e.target.value)}
                      placeholder="https://example.com/icon.png"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20"
                    />
                    <button
                      onClick={handleUpdateIcon}
                      className="px-6 py-3 bg-[#6f9cde] text-white font-bold rounded-xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] transition-all"
                    >
                      Save Icon
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">This will update the Lume logo across the entire platform.</p>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h4 className="font-bold text-gray-900 mb-4">Platform Maintenance</h4>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all">
                      Enable Maintenance Mode
                    </button>
                    <button className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">
                      Clear System Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

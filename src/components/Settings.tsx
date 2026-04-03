import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { Shield, Bell, Lock, User, Eye, Trash2, HelpCircle, Info, Save, Loader2, Camera, BadgeCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { authApi } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginActivity, setLoginActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    work: user?.work || '',
    education: user?.education || '',
    profilePhoto: user?.profilePhoto || '',
    coverPhoto: user?.coverPhoto || ''
  });

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchLoginActivity = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await authApi.getLoginActivity();
      setLoginActivity(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'security') {
      fetchLoginActivity();
    }
  }, [activeSection]);

  const handleVerificationRequest = async () => {
    setIsVerifying(true);
    try {
      await authApi.requestVerification();
      setUser(prev => prev ? { ...prev, pendingVerification: true } : null);
      alert('Verification request sent to admins!');
    } catch (err) {
      console.error(err);
      alert('Failed to send verification request.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrivacyToggle = async (field: 'isPrivate' | 'twoFactorEnabled', value: boolean) => {
    try {
      const res = await authApi.updatePrivacy({ [field]: value });
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sections = [
    { id: 'account', label: 'Account Settings', icon: User },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile(formData);
      setUser(res.data);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[calc(100vh-120px)] flex flex-col md:flex-row">
      <div className="w-full md:w-64 border-r border-gray-50 p-4 space-y-1">
        <h2 className="px-4 py-4 text-xl font-black text-gray-900 tracking-tight">Settings</h2>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeSection === section.id
                ? "bg-[#6f9cde] text-white shadow-md shadow-[#6f9cde]/20"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <section.icon className="w-5 h-5" />
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-8">
        {activeSection === 'account' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#6f9cde] text-white font-bold rounded-xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] disabled:opacity-50 transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            {/* Photo Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Photo</label>
                <div className="relative w-32 h-32">
                  <img 
                    src={formData.profilePhoto || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=6f9cde&color=fff&size=200`} 
                    className="w-full h-full rounded-full object-cover border-4 border-gray-50 shadow-sm"
                    alt="Profile"
                  />
                  <button 
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-[#6f9cde] hover:bg-gray-50 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cover Photo</label>
                <div className="relative h-40 bg-gray-100 rounded-2xl overflow-hidden group border-2 border-dashed border-gray-200">
                  {formData.coverPhoto ? (
                    <img src={formData.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">No cover photo</span>
                    </div>
                  )}
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold uppercase tracking-widest">Change Cover</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">First Name</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Name</label>
                <input 
                  type="text" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Username</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bio</label>
                <textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20 h-24 resize-none" 
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Work</label>
                <input 
                  type="text" 
                  value={formData.work} 
                  onChange={(e) => setFormData(prev => ({ ...prev, work: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Education</label>
                <input 
                  type="text" 
                  value={formData.education} 
                  onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#6f9cde]/20" 
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50">
              <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all">
                  <Lock className="w-4 h-4" />
                  Deactivate Account
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy & Security</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Lock className="w-5 h-5 text-[#6f9cde]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Private Account</p>
                    <p className="text-xs text-gray-500">Only approved followers can see your posts.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handlePrivacyToggle('isPrivate', !user?.isPrivate)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    user?.isPrivate ? "bg-[#6f9cde]" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                    user?.isPrivate ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Shield className="w-5 h-5 text-[#6f9cde]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handlePrivacyToggle('twoFactorEnabled', !user?.twoFactorEnabled)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    user?.twoFactorEnabled ? "bg-[#6f9cde]" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                    user?.twoFactorEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <BadgeCheck className="w-5 h-5 text-[#6f9cde]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Request Verification</p>
                    <p className="text-xs text-gray-500">Get a blue checkmark on your profile.</p>
                  </div>
                </div>
                <button 
                  onClick={handleVerificationRequest}
                  disabled={isVerifying || user?.pendingVerification || user?.verificationStatus !== 'none'}
                  className="px-4 py-1.5 bg-[#6f9cde] text-white text-xs font-bold rounded-lg shadow-md disabled:opacity-50"
                >
                  {user?.verificationStatus !== 'none' ? 'Verified' : user?.pendingVerification ? 'Pending' : 'Request'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Login Activity</h4>
              </div>
              <div className="space-y-2">
                {loginActivity.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{session.device}</p>
                          {session.isCurrent && <span className="text-[10px] font-black text-green-500 uppercase">Current</span>}
                        </div>
                        <p className="text-xs text-gray-500">{session.location} • {session.ip}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Last active: {formatDistanceToNow(new Date(session.lastActive))} ago</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={profileInputRef} onChange={(e) => handleFileChange(e, 'profilePhoto')} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'coverPhoto')} accept="image/*" className="hidden" />
    </div>
  );
}

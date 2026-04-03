import { useState } from 'react';
import { authApi } from '../../lib/api';
import { useAuth } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function Onboarding() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      await authApi.updateProfile({
        bio,
        gender,
      });
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#6f9cde]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-[#6f9cde]" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to Lume!</h1>
          <p className="text-gray-500">Let's set up your profile to get started.</p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-white shadow-md overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6f9cde&color=fff&size=128`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="mt-2 text-sm font-bold text-[#6f9cde]">Upload Profile Photo</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
              <textarea
                placeholder="Tell the world about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6f9cde] focus:border-transparent transition-all outline-none resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female', 'LGBTQIA+', 'rather not say'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-bold border transition-all",
                      gender === g 
                        ? "bg-[#6f9cde] text-white border-[#6f9cde] shadow-md shadow-[#6f9cde]/20" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#6f9cde]"
                    )}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full py-4 bg-[#6f9cde] text-white font-bold rounded-2xl shadow-lg shadow-[#6f9cde]/30 hover:bg-[#5a86c7] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
}

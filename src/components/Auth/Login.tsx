import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../lib/api';
import { useAuth } from '../../App';
import { LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // Email, Username, or Phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [guestName, setGuestName] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ identifier, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name for your guest account.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.guestLogin(guestName);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      console.error('Guest login error:', err);
      setError(err.response?.data?.message || 'Failed to login as guest.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Google login is temporarily disabled while we migrate to MongoDB. Please use username/password.');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#6f9cde] mb-2 tracking-tight">Lume</h1>
          <p className="text-gray-500">Welcome back to your digital light.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {!showGuestInput ? (
            <>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username, Email, or Phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6f9cde] focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6f9cde] focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert('Password recovery via security questions or secret passkey code is coming soon!')}
                  className="text-sm text-[#6f9cde] font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#6f9cde] text-white font-bold rounded-2xl shadow-lg shadow-[#6f9cde]/30 hover:bg-[#5a86c7] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
                Sign In
              </button>

              <button
                type="button"
                onClick={() => setShowGuestInput(true)}
                className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                Continue as Guest
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6f9cde] focus:border-transparent transition-all outline-none"
                  required
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-4 bg-[#6f9cde] text-white font-bold rounded-2xl shadow-lg shadow-[#6f9cde]/30 hover:bg-[#5a86c7] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Start as Guest'}
              </button>
              <button
                type="button"
                onClick={() => setShowGuestInput(false)}
                className="w-full text-sm text-gray-500 font-bold hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-6 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#6f9cde] font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

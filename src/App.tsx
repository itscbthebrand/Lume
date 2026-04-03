import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { authApi } from './lib/api';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Onboarding from './components/Auth/Onboarding';
import Feed from './components/Feed';
import Profile from './components/Profile';
import ChatList from './components/Chat/ChatList';
import ChatWindow from './components/Chat/ChatWindow';
import AdminDashboard from './components/Admin/AdminDashboard';
import Explore from './components/Explore';
import Notifications from './components/Notifications';
import Marketplace from './components/Marketplace';
import Settings from './components/Settings';
import Layout from './components/Layout';
import SharedFeed from './components/SharedFeed';
import MyFiles from './components/MyFiles';
import NotFound from './components/NotFound';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isOwner: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isModerator: false,
  isOwner: false,
  login: () => {},
  logout: () => {},
  setUser: () => null,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('lume_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('lume_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('lume_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('lume_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#6f9cde] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#6f9cde] font-medium">Lume is lighting up...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: user?.role === 'admin' || user?.role === 'owner' || user?.username === 'adi',
      isModerator: user?.role === 'moderator',
      isOwner: user?.role === 'owner' || user?.username === 'adi',
      login, 
      logout,
      setUser
    }}>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          <Route path="/onboarding" element={user && !user.bio ? <Onboarding /> : <Navigate to="/" />} />
          
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/messages" element={<ChatList />} />
            <Route path="/messages/:chatId" element={<ChatWindow />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/shared" element={<SharedFeed />} />
            <Route path="/files" element={<MyFiles />} />
            <Route path="/settings" element={<Settings />} />
            {(user?.role === 'moderator' || user?.role === 'admin' || user?.role === 'owner' || user?.username === 'adi') && <Route path="/admin/*" element={<AdminDashboard />} />}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

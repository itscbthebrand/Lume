import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-[#6f9cde] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for has faded away.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#6f9cde] text-white font-bold rounded-2xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

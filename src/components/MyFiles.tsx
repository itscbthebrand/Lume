import { useState, useEffect } from 'react';
import { authApi } from '../lib/api';
import { FileText, Image as ImageIcon, Video, Download, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function MyFiles() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await authApi.getMyFiles();
        setFiles(res.data);
      } catch (err) {
        console.error('Failed to fetch files:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const filteredFiles = files.filter(f => 
    f.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#6f9cde] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Files</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6f9cde]/20 transition-all w-64"
          />
        </div>
      </div>

      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group"
            >
              <div className="aspect-square rounded-xl bg-gray-50 mb-4 overflow-hidden relative">
                {file.type === 'video' ? (
                  <video src={file.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={file.url} className="w-full h-full object-cover" alt="" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <a href={file.url} download className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {file.type === 'video' ? <Video className="w-4 h-4 text-purple-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                  <span className="text-sm font-bold text-gray-900 capitalize">{file.type}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>From {file.source}</span>
                  <span>{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <FileText className="w-16 h-16 text-gray-100 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No files found</p>
        </div>
      )}
    </div>
  );
}

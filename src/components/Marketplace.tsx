export default function Marketplace() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-[#6f9cde]" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Lume Marketplace</h2>
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          Buy and sell items within your local community. This feature is coming soon to your region.
        </p>
        <button className="mt-6 px-8 py-3 bg-[#6f9cde] text-white font-bold rounded-2xl shadow-lg shadow-[#6f9cde]/20 hover:bg-[#5a86c7] transition-all">
          List an Item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer">
            <div className="aspect-square bg-gray-100 relative">
              <img src={`https://picsum.photos/seed/item${i}/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Item" />
              <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-black text-gray-900">
                ${(Math.random() * 100).toFixed(2)}
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-gray-900 truncate">Modern Gadget {i}</p>
              <p className="text-xs text-gray-500">Dhaka, Bangladesh</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ShoppingBag } from 'lucide-react';

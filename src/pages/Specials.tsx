import { useState, useEffect } from "react";
import { Reveal } from "../components/Reveal";
import { Bell, Flame, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getMenuItems } from "../api/client";

export function Specials() {
  const { addToCart } = useCart();
  const [specialItems, setSpecialItems] = useState<any[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  const getQty = (itemId: string) => qtyMap[itemId] || 1;
  
  const adjustQty = (itemId: string, direction: number) => {
    const current = getQty(itemId);
    const updated = current + direction;
    if (updated >= 1) {
      setQtyMap(prev => ({ ...prev, [itemId]: updated }));
    }
  };

  useEffect(() => {
    const fetchSpecials = async () => {
      const allItems = await getMenuItems();
      // Shuffle array and pick first 5
      const shuffled = [...allItems].sort(() => 0.5 - Math.random());
      setSpecialItems(shuffled.slice(0, 5));
    };
    fetchSpecials();
  }, []);

  return (
    <div className="w-full pt-8 md:pt-12 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal className="text-center mb-16">
          <h2 className="text-gold-500 text-sm tracking-[0.2em] uppercase mb-4">Exclusive Offerings</h2>
          <h3 className="heading-serif text-4xl md:text-5xl text-white">Captain's Notice Board & Specials</h3>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Notice Board */}
          <div className="lg:col-span-5 relative">
            <Reveal className="h-full">
              <div className="glass-panel p-8 md:p-10 rounded-2xl h-full flex flex-col items-start justify-start border-l-4 border-l-gold-500 bg-gradient-to-br from-gold-500/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Bell className="w-32 h-32 text-gold-500" />
                </div>
                <div className="relative z-10 w-full">
                  <h2 className="text-gold-500 text-sm tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                     <Bell className="w-4 h-4 animate-pulse rounded-full" /> Captain's Notice Board
                  </h2>
                  <h3 className="heading-serif text-3xl md:text-4xl text-white mb-6">Canteen Status & Updates</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4 pb-6 border-b border-white/10">
                      <div className="mt-1 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                      <div>
                        <h4 className="text-white font-medium mb-1 tracking-wide">Live Music Fridays</h4>
                        <p className="text-gray-400 text-sm">Join us every Friday evening for soft jazz and acoustic performances at the lounge terminal.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                      <div>
                        <h4 className="text-white font-medium mb-1 tracking-wide">New Destinations Added</h4>
                        <p className="text-gray-400 text-sm">We've just updated our menu with culinary delights inspired by our recent Canteens to Tokyo and Paris.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Special Menu Items */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2} className="h-full">
              <div className="flex items-center gap-3 mb-8">
                <Flame className="w-6 h-6 text-gold-500" />
                <h3 className="heading-serif text-3xl text-white">Today's Special Menu</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {specialItems.map((item, i) => {
                  const qty = getQty(item.id);
                  const totalPrice = item.price * qty;
                  return (
                    <div key={i} className="glass-panel p-6 rounded-xl transition-colors group border border-white/5 hover:border-gold-500/30 flex flex-col relative overflow-hidden">
                      <div className="absolute inset-0 bg-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <h4 className="text-white font-medium group-hover:text-gold-400 transition-colors uppercase tracking-wide text-sm pr-4">{item.name}</h4>
                        <span className="text-gold-500 text-sm font-semibold shrink-0">₹{item.price}</span>
                      </div>
                      <p className="text-gray-400 text-sm font-light leading-relaxed mb-4 flex-grow relative z-10">{item.description}</p>
                      
                      {/* Quantity Controller with Live Dynamic Price Calculation */}
                      <div className="flex items-center justify-between mb-4 bg-slate-950/40 p-2.5 rounded-lg border border-white/5 relative z-10">
                        <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Quantity</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => adjustQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 active:scale-90 select-none transition-all cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-mono font-black text-white w-4 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => adjustQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-305 border border-white/10 active:scale-90 select-none transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3 text-right text-xs relative z-10 select-none">
                        <span className="text-[10px] text-slate-400 font-bold tracking-wide">Total Price:</span>
                        <span className="font-mono font-black text-gold-400">₹{totalPrice}/-</span>
                      </div>
                      
                      <button
                        disabled={true}
                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: qty })}
                        className="mt-auto w-full py-2 bg-white/5 text-gray-500 rounded border border-gray-500/30 flex items-center justify-center gap-2 transition-all text-xs tracking-wider uppercase cursor-not-allowed relative z-10"
                      >
                        <Plus className="w-4 h-4" /> Temporarily Closed
                      </button>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  X, 
  AlertTriangle, 
  Gift, 
  Check, 
  Coins 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getMenuCategories } from '../../api/client';

interface Offer {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  categoryId: string; // apply only to some category or 'all'
  isActive: boolean;
  description: string;
}

const initialOffers: Offer[] = [
  { id: '1', code: 'FIRSTFLYER', discountType: 'percentage', discountValue: 15, minSpend: 499, categoryId: 'all', isActive: true, description: '15% discount on all gourmet dishes for new members.' },
  { id: '2', code: 'SPICYDINING', discountType: 'fixed', discountValue: 100, minSpend: 750, categoryId: 'veg-curries', isActive: true, description: 'Flat ₹100 Off on delicious veg culinary curries!' },
  { id: '3', code: 'SWEETCanteen', discountType: 'percentage', discountValue: 20, minSpend: 300, categoryId: 'sweet', isActive: false, description: 'Satisfy sweet cravings with 20% flat savings.' },
];

export function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // New coupon state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minSpend, setMinSpend] = useState('499');
  const [appliedCategory, setAppliedCategory] = useState('all');
  const [description, setDescription] = useState('');

  // Custom delete confirmation modal state
  const [deleteConfirmOffer, setDeleteConfirmOffer] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const catsObj = await getMenuCategories();
      setCategories(catsObj);

      const stored = localStorage.getItem('kvr_offers');
      if (stored) {
        setOffers(JSON.parse(stored));
      } else {
        setOffers(initialOffers);
        localStorage.setItem('kvr_offers', JSON.stringify(initialOffers));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveOffersToStorage = (updatedList: Offer[]) => {
    setOffers(updatedList);
    localStorage.setItem('kvr_offers', JSON.stringify(updatedList));
  };

  const handleToggleActive = (id: string) => {
    const updated = offers.map(off => {
      if (off.id === id) {
        const nextState = !off.isActive;
        toast.success(`Discount code "${off.code}" is now ${nextState ? "activated" : "deactivated"}.`);
        return { ...off, isActive: nextState };
      }
      return off;
    });
    saveOffersToStorage(updated);
  };

  const handleDelete = (id: string, codeStr: string) => {
    setDeleteConfirmOffer({ id, code: codeStr });
  };

  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      toast.error("Please specify a valid alphanumeric code.");
      return;
    }

    if (offers.some(o => o.code === cleanCode)) {
      toast.error(`The voucher code "${cleanCode}" already exists.`);
      return;
    }

    const newOffer: Offer = {
      id: Date.now().toString(),
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue) || 10,
      minSpend: Number(minSpend) || 0,
      categoryId: appliedCategory,
      isActive: true,
      description: description || `${discountType === 'percentage' ? discountValue + '%' : '₹' + discountValue} off premium Canteen select options.`
    };

    const nextList = [newOffer, ...offers];
    saveOffersToStorage(nextList);
    toast.success(`Coupon "${cleanCode}" published successfully.`);
    setIsAddOpen(false);

    // reset fields
    setCode('');
    setDiscountValue('15');
    setMinSpend('499');
    setDescription('');
    setAppliedCategory('all');
  };

  if (loading) return <div className="text-white p-8">Loading Canteen vouchers database...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl gap-4">
        <div>
          <span className="text-gold-500 text-xs font-mono tracking-widest uppercase mb-1 block">Canteen sales promotions</span>
          <h3 className="text-3xl font-serif text-white">Campaign coupons & Offers</h3>
          <p className="text-gray-400 text-sm mt-1">Configure coupon campaigns, customize discount values, and drive steward sales.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Main Campaign List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(off => {
          const matchedCat = categories.find(c => c.id === off.categoryId);
          return (
            <div 
              key={off.id} 
              className={`border rounded-2xl p-5 bg-slate-900 transition-all ${
                off.isActive 
                  ? 'border-gold-500/30 ring-1 ring-gold-550/10' 
                  : 'border-white/5 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                  <Percent className="w-4 h-4 text-gold-500" />
                  <span className="font-mono text-white text-base font-bold tracking-wider">{off.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(off.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {off.isActive ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                      <span>Live</span>
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                      <span>Paused</span>
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </button>
              </div>

              <div className="my-4 space-y-1.5">
                <p className="text-2xl font-bold text-white">
                  {off.discountType === 'percentage' ? `${off.discountValue}% Off` : `₹${off.discountValue} Off`}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">{off.description}</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1 text-[11px] text-gray-400 font-mono">
                <div className="flex justify-between">
                  <span>Minimum Threshold:</span>
                  <span className="text-white font-bold">₹{off.minSpend}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scope Filter:</span>
                  <span className="text-gold-500 font-bold capitalize">
                    {off.categoryId === 'all' ? 'Universal Canteen food' : (matchedCat ? matchedCat.name : off.categoryId)}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleDelete(off.id, off.code)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}

        {offers.length === 0 && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-10 text-center col-span-3 text-gray-500">
            <Gift className="w-12 h-12 text-yellow-500/50 mx-auto mb-3" />
            <h4 className="text-white text-base font-serif mb-1">No offers launched</h4>
            <p className="text-xs">Create your first companion checkout discount code using the campaign button above.</p>
          </div>
        )}
      </div>

      {/* CREATE OFFER DIALOG MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-b-white/10">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold-500" />
                Launch Coupon Promotion
              </h4>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-white bg-white/5 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Canteen Coupon Code *</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. MONSOON25"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500 text-sm uppercase font-mono tracking-widest font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Discount rate type</label>
                  <select 
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Value *</label>
                  <input 
                    type="number" 
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    placeholder="15"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Applied Category Scope</label>
                  <select 
                    value={appliedCategory}
                    onChange={(e) => setAppliedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-gold-500 text-sm cursor-pointer"
                  >
                    <option value="all">Apply to All Foods</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Minimum Order Cost (INR)</label>
                  <input 
                    type="number" 
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="499"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500 outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Promotional Campaign Pitch</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Save flat 20% on satisfying drinks..."
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-gold-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-gray-400 border border-transparent px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm hover:bg-gold-400 transition-all cursor-pointer"
                >
                  Confirm live voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE STATE-BASED DELETION CONFIRMATION DIALOG FOR COUPONS */}
      {deleteConfirmOffer !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <h4 className="text-lg font-serif text-white font-medium">Delete Discount Coupon</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete coupon code <strong className="text-white">"{deleteConfirmOffer.code}"</strong>? Customers will no longer be able to apply this voucher.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOffer(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = deleteConfirmOffer;
                  setDeleteConfirmOffer(null);
                  const filtered = offers.filter(off => off.id !== item.id);
                  saveOffersToStorage(filtered);
                  toast.success("Coupon code deleted.");
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

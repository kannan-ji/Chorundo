import { CheckCircle2, History, KeyRound, QrCode, Ticket, User, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Kitchen, MealClaim } from '../types';

interface KitchenDashboardProps {
  kitchens: Kitchen[];
  claims: MealClaim[];
  onRedeemCode: (code: string, kitchenId: string) => boolean | string;
  onLogWalkIn: (kitchenId: string) => boolean;
  initialKitchenId?: string | null;
}

export default function KitchenDashboard({
  kitchens,
  claims,
  onRedeemCode,
  onLogWalkIn,
  initialKitchenId = null,
}: KitchenDashboardProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState<string>(initialKitchenId || kitchens[0]?.id || '');
  const [inputCode, setInputCode] = useState<string>('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; msg: string } | null>(null);

  React.useEffect(() => {
    if (initialKitchenId) {
      setSelectedKitchenId(initialKitchenId);
    }
  }, [initialKitchenId]);

  const activeKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];

  // Codes claimed specifically at this kitchen
  const kitchenClaims = claims.filter(c => c.kitchenId === selectedKitchenId);

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const codeToVerify = inputCode.trim().toUpperCase();

    if (!codeToVerify) return;

    const result = onRedeemCode(codeToVerify, selectedKitchenId);

    if (result === true) {
      setFeedback({
        status: 'success',
        msg: `Code '${codeToVerify}' verified successfully! Place one fresh Sadhya on the plantain leaf.`,
      });
      setInputCode('');
    } else {
      setFeedback({
        status: 'error',
        msg: typeof result === 'string' ? result : 'Invalid code or assigned to a different kitchen.',
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleWalkInTrigger = () => {
    setFeedback(null);
    const success = onLogWalkIn(selectedKitchenId);

    if (success) {
      setFeedback({
        status: 'success',
        msg: 'Walk-In Athithi Service logged! Served one hot meal successfully. Deducted from prepaid pool.',
      });
    } else {
      setFeedback({
        status: 'error',
        msg: 'Prepaid pool exhausted. Ask local donors to sponsor meals for this kitchen!',
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* 1. VERIFICATION PANEL (Left Column: 7 Units) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-150 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Partner Kitchen Console</h2>
              <p className="text-xs text-slate-500">Scan digital vouchers or log walk-in guests directly</p>
            </div>

            {/* Select active kitchen node */}
            <select
              value={selectedKitchenId}
              onChange={(e) => setSelectedKitchenId(e.target.value)}
              className="bg-slate-100 border border-slate-205 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
            >
              {kitchens.map(k => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick status cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl">
              <span className="text-[10px] font-mono text-blue-800 uppercase tracking-wider font-extrabold">Prepaid Pool Available</span>
              <p className="text-2xl font-black text-blue-900 mt-1 font-mono">
                {activeKitchen.sponsoredCount} Meals
              </p>
              <p className="text-[10.5px] text-blue-700 leading-normal mt-1">
                Funded by digital donors. Ready to be served.
              </p>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100/60 p-4 rounded-2xl font-sans">
              <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider font-extrabold">Total Served Lifetime</span>
              <p className="text-2xl font-black text-emerald-900 mt-1 font-mono">
                {activeKitchen.claimedCount} Plates
              </p>
              <p className="text-[10.5px] text-emerald-700 leading-normal mt-1">
                Plates placed with love and dignity on banana leaves.
              </p>
            </div>
          </div>

          {/* Verification Code Submission */}
          <form onSubmit={handleRedeemSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Enter Digital Voucher Code:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. CH-293810"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-350 focus:border-blue-500 focus:bg-white rounded-xl px-10 py-3 text-sm font-semibold text-slate-800 font-mono tracking-widest uppercase focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-blue-100"
                >
                  Verify Code
                </button>
              </div>
            </div>
          </form>

          {/* Feedback messages */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                feedback.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {feedback.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  {feedback.status === 'success' ? 'Verification OK' : 'Verification FAILURE'}
                </span>
                <p className="leading-relaxed">{feedback.msg}</p>
              </div>
            </motion.div>
          )}

          {/* Walk-In Offline Guest Panel (CRITICAL BARRIER-FREE COMPLIANCE 3.2.2) */}
          <div className="border-t border-slate-150 pt-5 mt-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Walk-In Athithi Service (Dignity First)
            </h3>
            <p className="text-xs text-slate-500 leading-normal mb-4">
              If an athithi does not have a phone or digital literacy, they can approach the kitchen counter showing your **chorundo? Green Plantain Leaf sign**. Serve them a meal and click the ledger button below to deduct 1 prepaid meal directly on their behalf. No questions, no codes.
            </p>

            <button
              onClick={handleWalkInTrigger}
              disabled={activeKitchen.sponsoredCount <= 0}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:opacity-50 active:scale-98 text-white font-semibold text-xs p-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <User className="w-4 h-4" />
              Log Walk-In Athithi & Claim 1 Meal
            </button>
          </div>
        </div>
      </div>

      {/* 2. ACTIVITY QUEUE LOG FOR RESTAURANT (Right Column: 5 Units) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-blue-600" />
              kitchen transaction history
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {activeKitchen.name.split(' ')[0]}
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {kitchenClaims.length === 0 ? (
              <div className="border border-dashed border-slate-200 py-12 rounded-2xl text-center text-slate-450">
                <Ticket className="w-7 h-7 mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-xs font-semibold">No recent claims at this spot</p>
                <p className="text-[10px] mt-0.5">Voucher codes or walk-ins logged will show up here.</p>
              </div>
            ) : (
              [...kitchenClaims].reverse().map((c) => (
                <div
                  key={c.id}
                  className={`p-3 border rounded-2xl transition-all ${
                    c.status === 'redeemed'
                      ? 'bg-emerald-50/10 border-slate-200/60'
                      : 'bg-amber-50/20 border-amber-100/65 animate-pulse'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-slate-700 block">
                      {c.code}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded ${
                        c.status === 'redeemed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-550 border-t border-slate-100/50 pt-2 font-medium">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-705">
                      {c.isWalkIn ? (
                        <>
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          Walk-In (No Phone)
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                          Digital Voucher
                        </>
                      )}
                    </span>
                    <span className="font-mono text-slate-400">
                      {c.claimedAt
                        ? new Date(c.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Integration tip box for user */}
        <div className="bg-blue-50/50 border border-blue-200/50 p-5 rounded-3xl">
          <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide mb-1">Easy Kitchen Onboarding</h4>
          <p className="text-[11px] text-blue-800 leading-normal">
            Our onboarding is lightweight. Kitchens don't need dedicated integration servers — they just use this web portal or a physical printed ledger chart with pre-assigned meal tickets to track walk-ins. Perfectly designed for local mom-and-pop eateries!
          </p>
        </div>
      </div>
    </div>
  );
}

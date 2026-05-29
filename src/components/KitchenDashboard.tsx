import { CheckCircle2, History, KeyRound, QrCode, Ticket, User, XCircle, Building } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Kitchen, MealClaim } from '../types';

interface KitchenDashboardProps {
  kitchens: Kitchen[];
  claims: MealClaim[];
  onRedeemCode: (code: string, kitchenId: string) => boolean | string;
  onLogWalkIn: (kitchenId: string) => boolean;
  initialKitchenId?: string | null;
  onBackToHome?: () => void;
  activeKitchenName?: string;
}

export default function KitchenDashboard({
  kitchens,
  claims,
  onRedeemCode,
  onLogWalkIn,
  initialKitchenId = null,
  onBackToHome,
  activeKitchenName,
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* 0. KITCHEN CUSTOM TOP NAV BAR */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="bg-slate-50 hover:bg-slate-100 font-sans text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-2xl text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>← Home</span>
            </button>
          )}
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Building / Kitchen icon representing active counter */}
          <div className="relative shrink-0 select-none">
            <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
            <div className="relative w-11 h-11 rounded-full bg-emerald-700 ring-2 ring-emerald-50 border border-white flex items-center justify-center text-white font-bold shadow-md">
              <Building className="w-5 h-5 text-emerald-100" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[9px] font-mono font-black uppercase tracking-widest border border-emerald-100 rounded-full px-2 py-0.5 animate-pulse">
              kitchen terminal
            </span>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 mt-0.5 flex items-center gap-1.5 font-sans">
              {activeKitchenName || activeKitchen.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            secure merchant checkouts • no setup cost
          </span>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. VERIFICATION PANEL (Left Column: 7 Units) */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
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
                className="bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
              <div className="bg-emerald-50/55 border border-emerald-100/40 p-4 rounded-2xl animate-pulse">
                <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider font-extrabold">Prepaid Pool Available</span>
                <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                  {activeKitchen.sponsoredCount} Meals
                </p>
                <p className="text-[10.5px] text-slate-500 leading-normal mt-1 font-sans">
                  Funded by digital donors. Ready to serve.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-extrabold">Total Served Lifetime</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {activeKitchen.claimedCount} Plates
                </p>
                <p className="text-[10.5px] text-slate-500 leading-normal mt-1 font-sans">
                  Plates served with love and dignity.
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
                      className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-10 py-3 text-sm font-semibold text-slate-800 font-mono tracking-widest uppercase focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-100"
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
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
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

            {/* Walk-In Offline Guest Panel (CRITICAL BARRIER-FREE COMPLIANCE) */}
            <div className="border-t border-slate-150 pt-5 mt-5">
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
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
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <History className="w-4.5 h-4.5 text-emerald-700" />
                kitchen transaction history
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                {activeKitchen.name.split(' ')[0]}
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {kitchenClaims.length === 0 ? (
                <div className="border border-dashed border-slate-200 py-12 rounded-2xl text-center text-slate-400">
                  <Ticket className="w-7 h-7 mx-auto mb-2 text-slate-350 animate-pulse" />
                  <p className="text-xs font-semibold">No recent claims at this spot</p>
                  <p className="text-[10px] mt-0.5">Voucher codes or walk-ins logged will show up here.</p>
                </div>
              ) : (
                [...kitchenClaims].reverse().map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 border rounded-2xl transition-all bg-emerald-50/5 border-slate-200/70`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-xs uppercase tracking-wider font-mono text-slate-705 block">
                        {c.code}
                      </span>
                      <span
                        className={`text-[9.5px] uppercase tracking-widest font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-[10.5px] text-slate-500 border-t border-slate-100/50 pt-2 font-medium">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        {c.isWalkIn ? (
                          <>
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            Walk-In (No Phone)
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{c.seekerName || 'Digital Voucher'}</span>
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
          <div className="bg-emerald-50/40 border border-emerald-100/70 p-5 rounded-3xl">
            <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wide mb-1">Easy Kitchen Onboarding</h4>
            <p className="text-[11px] text-slate-600 leading-normal font-sans">
              Our onboarding is lightweight. Kitchens don't need dedicated integration servers — they just use this web portal or a physical printed ledger chart with pre-assigned meal tickets to track walk-ins without any barriers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

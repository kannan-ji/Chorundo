import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, LogIn, Heart, CheckCircle, ShieldCheck, HelpCircle, FileText, MapPin, Sparkles, Building } from 'lucide-react';

interface DetailsViewProps {
  type: 'donor' | 'kitchen';
  onBack: () => void;
  onLoginClick: (role: 'donor' | 'kitchen') => void;
  onRegisterClick?: (role: 'donor' | 'kitchen') => void;
}

export default function DetailsView({ type, onBack, onLoginClick, onRegisterClick }: DetailsViewProps) {
  const isDonor = type === 'donor';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-[#FAF9F6] border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-full transition-all cursor-pointer self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </button>

      {isDonor ? (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
              <Heart className="w-6 h-6 fill-emerald-500 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 lowercase tracking-tight">
                being a chorundo sponsor?
              </h2>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                100% meal-traceability & absolute dignity
              </p>
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-4 text-xs md:text-sm text-slate-650 leading-relaxed font-sans mb-8">
            <p>
              In traditional Malayalam culture, <span className="italic font-sans font-black text-emerald-800">"chorundo?"</span> is more than a daily greeting. It represents the highest expression of kinship and care—asking a guest, traveler, or neighbor if they have eaten.
            </p>
            <p>
              When you donate to chorundo?, your money is not lost in administrative overhead or complex infrastructure. Instead, **every single rupee** directly funds hot meals served on raw plantain leaves at authentic local neighborhood eateries (our Partner Kitchens).
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Dignified & Anonymous
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Athithis do not queue for handouts or expose their private identities. They generate normal-looking restaurant ticket codes on their phone, or kitchens record simple walk-ins in physical ledger charts for elders.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Live Transparency Ledger
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Inspect complete transaction timelines anytime. See exactly which kitchen received your funded Sadhyas, how many are still pending, and the moment they are successfully claimed by patrons.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Hyper-Local Support
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Select specific restaurants in Keralam (Aluva, Kochi, Trivandrum, Kozhikode) that you wish to fund. Keep your local junction and high street flourishing during testing times!
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                Fair Kitchen Pricing
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Each meal price is set by the partner kitchen to cover their specific operating costs. This ensures small family eateries can sustain the program without running at a loss.
              </p>
            </div>
          </div>

          {/* Call to actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-200/60 pt-6">
            <button
              onClick={() => onLoginClick('donor')}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Donor Login
            </button>
            <button
              onClick={() => onLoginClick('donor')} // We can open unified login which will have both tabs
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-98 text-xs font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Sign Up as New Donor
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
              <Building className="w-6 h-6 text-emerald-600 fill-emerald-100/50" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 lowercase tracking-tight">
                become a partner kitchen<span className="text-emerald-600">.</span>
              </h2>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                lightweight counter logins for local small restaurants
              </p>
            </div>
          </div>

          {/* Description Text */}
          <div className="space-y-4 text-xs md:text-sm text-slate-650 leading-relaxed font-sans mb-8">
            <p>
              Are you a local restaurant owner in Keralam? Join chorundo?'s zero-cost hospitality network. Sponsoring citizens buy meal vouchers, and your kitchen directly serves hot food to patrons. We reimburse you **fully and instantly** for every voucher redeemed or walk-in logged!
            </p>
            <p>
              We designed chorundo? with mom-and-pop local eateries or small junction tea-stalls in mind. No expensive integration scripts, no API requirements. Simply log into this portal on phone browser, or print pre-assigned paper sheets if you don't use digital counters!
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Zero Platform Fees
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                We take zero commissions or cuts. If a donor funds ₹120 (3 meals) for your kitchen, ₹120 goes to your business ledger. Period.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Easy Walk-In Mode
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                If an elderly or device-less traveler walks in, you can directly tap "Log Walk-In & Claim" behind the counter to use the sponsored pool, logging the meal in 1 click!
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Guaranteed Weekly Pay
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                All claims are securely verified on our transparent public ledger. Settlements are made on Friday evenings directly to bank/UPI.
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200/80 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Build Local Goodwill
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Become a beloved sanctuary in your junction. Attract other paying customer traffic while doing magnificent, compassionate work.
              </p>
            </div>
          </div>

          {/* Call to actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-200/60 pt-6">
            <button
              onClick={() => onLoginClick('kitchen')}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Kitchen Console Login
            </button>
            <button
              onClick={() => onLoginClick('kitchen')} // we can open same portal
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-98 text-xs font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Register Your Restaurant
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

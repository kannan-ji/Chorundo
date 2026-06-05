import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, X } from 'lucide-react';

interface KitchenSettingsProps {
  activeSettingsTab: 'identity' | 'security' | 'profile' | null;
  setActiveSettingsTab: (tab: 'identity' | 'security' | 'profile' | null) => void;
  tempKitchenBankAcc: string;
  setTempKitchenBankAcc: (val: string) => void;
  tempKitchenIfsc: string;
  setTempKitchenIfsc: (val: string) => void;
  payoutMethod: 'instant' | 'weekly';
  setPayoutMethod: (val: 'instant' | 'weekly') => void;
  tempPin: string;
  setTempPin: (val: string) => void;
  passkeyRequired: boolean;
  setPasskeyRequired: (val: boolean) => void;
  scanAutoVerify: boolean;
  setScanAutoVerify: (val: boolean) => void;
  tempKitchenName: string;
  setTempKitchenName: (val: string) => void;
  tempKitchenMealDesc: string;
  setTempKitchenMealDesc: (val: string) => void;
  tempKitchenPhone: string;
  setTempKitchenPhone: (val: string) => void;
  tempKitchenAddress: string;
  setTempKitchenAddress: (val: string) => void;
  selectedKitchenId: string;
  setKitchenOverrides: React.Dispatch<React.SetStateAction<Record<string, { name: string; address: string; phone: string; mealDescription: string }>>>;
}

export function KitchenSettings({
  activeSettingsTab,
  setActiveSettingsTab,
  tempKitchenBankAcc,
  setTempKitchenBankAcc,
  tempKitchenIfsc,
  setTempKitchenIfsc,
  payoutMethod,
  setPayoutMethod,
  tempPin,
  setTempPin,
  passkeyRequired,
  setPasskeyRequired,
  scanAutoVerify,
  setScanAutoVerify,
  tempKitchenName,
  setTempKitchenName,
  tempKitchenMealDesc,
  setTempKitchenMealDesc,
  tempKitchenPhone,
  setTempKitchenPhone,
  tempKitchenAddress,
  setTempKitchenAddress,
  selectedKitchenId,
  setKitchenOverrides,
}: KitchenSettingsProps) {
  return (
    <AnimatePresence>
      {activeSettingsTab !== null && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveSettingsTab(null)}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-[9992] cursor-pointer"
          />

          {/* Modal Dialog container matching the gorgeous theme */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[9993] flex flex-col overflow-hidden max-h-[90vh] border border-slate-101"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <SettingsIcon className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950 font-sans">
                    {activeSettingsTab === 'identity' && 'Payouts & Banking'}
                    {activeSettingsTab === 'security' && 'Security & Access'}
                    {activeSettingsTab === 'profile' && 'Kitchen Profile'}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {activeSettingsTab === 'identity' && 'Configure Settlement Settings'}
                    {activeSettingsTab === 'security' && 'Manage Claim Passkeys'}
                    {activeSettingsTab === 'profile' && 'Configure Counter Coordinates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSettingsTab(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body for Identity */}
            {activeSettingsTab === 'identity' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveSettingsTab(null);
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Merchant Bank Account No. / UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKitchenBankAcc}
                    onChange={(e) => setTempKitchenBankAcc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-801 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Active UPI IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKitchenIfsc}
                    onChange={(e) => setTempKitchenIfsc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-emerald-801 font-mono tracking-wider focus:outline-none"
                  />
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5 select-none animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-bold text-emerald-950 font-sans">Payout Settlement Type</span>
                    <span className="text-[7.5px] font-mono font-black uppercase tracking-widest text-emerald-801 border border-emerald-250 bg-white px-2 py-0.5 rounded-md">
                      Direct Account
                    </span>
                  </div>
                  <div className="flex gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('instant')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        payoutMethod === 'instant'
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-605 border-slate-250 hover:bg-slate-50'
                      }`}
                    >
                      ⚡ UPI Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('weekly')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        payoutMethod === 'weekly'
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-605 border-slate-250 hover:bg-slate-50'
                      }`}
                    >
                      🗓️ Batch Weekly
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[98] transition-all font-sans font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer text-center"
                >
                  Save Banking Changes
                </button>
              </form>
            )}

            {/* Form Body for Security */}
            {activeSettingsTab === 'security' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveSettingsTab(null);
                }}
                className="p-6 space-y-5 overflow-y-auto"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Counter Claim Verification PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={tempPin}
                    onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1em] bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm font-black text-slate-801 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[8.5px] text-slate-400 leading-normal text-center font-sans">
                    Required by staff to clear offline or custom manual walk-in redemptions.
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 border border-slate-205 rounded-2xl text-xs select-none">
                  <span className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-widest block">Counter Safety Rules</span>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-801 text-[10.5px] font-sans">Device Passkey Gate</p>
                      <p className="text-[8.5px] text-slate-400 font-sans">Require supervisor credential to exit browser mode</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={passkeyRequired}
                      onChange={(e) => setPasskeyRequired(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>

                  <div className="w-full border-t border-slate-200" />

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-801 text-[10.5px] font-sans">Auto-Clear Scans</p>
                      <p className="text-[8.5px] text-slate-400 font-sans">Instantly redeem QR claims without confirmation click</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={scanAutoVerify}
                      onChange={(e) => setScanAutoVerify(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 active:scale-[98] transition-all font-sans font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer text-center"
                >
                  Save Security Code
                </button>
              </form>
            )}

            {/* Form Body for Profile */}
            {activeSettingsTab === 'profile' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Save to local active overrides
                  setKitchenOverrides((prev: any) => ({
                    ...prev,
                    [selectedKitchenId]: {
                      name: tempKitchenName,
                      address: tempKitchenAddress,
                      phone: tempKitchenPhone,
                      mealDescription: tempKitchenMealDesc
                    }
                  }));
                  setActiveSettingsTab(null);
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Kitchen Terminal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKitchenName}
                    onChange={(e) => setTempKitchenName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-801 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Signature Sadhya Composition
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKitchenMealDesc}
                    onChange={(e) => setTempKitchenMealDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-801 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                  <p className="text-[8.5px] text-slate-400 leading-normal font-sans">
                    Detailed on seeker-facing meal claim receipts (e.g. 14 traditional side curries, Payasam).
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Counter Hotline
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKitchenPhone}
                    onChange={(e) => setTempKitchenPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-801 font-medium focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-500">
                    Counter Physical Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tempKitchenAddress}
                    onChange={(e) => setTempKitchenAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-801 font-medium focus:outline-none font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all font-sans font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer text-center"
                >
                  Save Profile Changes
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

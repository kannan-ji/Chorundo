import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Heart, Utensils, Lock, ShieldCheck, Mail, Phone, UserCheck, Chrome } from 'lucide-react';
import { Role } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: Role | 'guest', userDisplayName: string, targetId?: string) => void;
  initialRoleTab?: Role | 'guest';
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, initialRoleTab = 'guest' }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<Role | 'guest'>(initialRoleTab);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedKitchenId, setSelectedKitchenId] = useState('kitchen-1'); // Default for kitchen login
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRoleTab);
    }
  }, [isOpen, initialRoleTab]);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    // Simulate real OAuth verification delay
    setTimeout(() => {
      setIsGoogleLoading(false);
      let randomName = '';
      if (activeTab === 'donor') {
        const firstNames = ['Hari', 'Meera', 'Kiran', 'Devika', 'Siddharth', 'Anjali', 'Gautam'];
        const lastNames = ['Nair', 'Menon', 'Pillai', 'Rao', 'Varma', 'Kurup'];
        const f = firstNames[Math.floor(Math.random() * firstNames.length)];
        const l = lastNames[Math.floor(Math.random() * lastNames.length)];
        randomName = `${f} ${l} (Google)`;
      } else if (activeTab === 'kitchen') {
        randomName = 'Authorized Chef Staff';
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('chorundo_seeker_date');
        const storedUsername = localStorage.getItem('chorundo_seeker_username');
        if (storedDate === todayStr && storedUsername) {
          randomName = storedUsername;
        } else {
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          randomName = `athithi-${randomNum}`;
          localStorage.setItem('chorundo_seeker_date', todayStr);
          localStorage.setItem('chorundo_seeker_username', randomName);
        }
      }
      onLoginSuccess(activeTab, randomName);
      onClose();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let displayName = name.trim();
    if (!displayName) {
      if (activeTab === 'guest') {
        const todayStr = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('chorundo_seeker_date');
        const storedUsername = localStorage.getItem('chorundo_seeker_username');
        if (storedDate === todayStr && storedUsername) {
          displayName = storedUsername;
        } else {
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          displayName = `athithi-${randomNum}`;
          localStorage.setItem('chorundo_seeker_date', todayStr);
          localStorage.setItem('chorundo_seeker_username', displayName);
        }
      } else if (activeTab === 'donor') {
        displayName = 'Anonymous Donor';
      } else {
        displayName = 'Kitchen Staff';
      }
    }
    
    // Simulate successful login/registration
    if (activeTab === 'kitchen') {
      onLoginSuccess('kitchen', displayName, selectedKitchenId);
    } else if (activeTab === 'donor') {
      onLoginSuccess('donor', displayName);
    } else {
      onLoginSuccess('guest', displayName);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-[#FAF9F6] border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-emerald-800 p-6 text-white text-center relative">
            <button
              onClick={onClose}
              id="close-login-modal"
              className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold font-serif lowercase tracking-tight">
              chorundo?
            </h3>
            <p className="text-[11px] text-emerald-200 uppercase tracking-wider mt-1 font-mono">
              dignity-first community nourishment
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-1">
            <button
              onClick={() => { setActiveTab('guest'); setIsSignUp(false); }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-650 cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-white shadow-sm text-emerald-800 border border-slate-200/80'
                  : 'hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Athithi
            </button>
            <button
              onClick={() => { setActiveTab('donor'); setIsSignUp(false); }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-650 cursor-pointer ${
                activeTab === 'donor'
                  ? 'bg-white shadow-sm text-emerald-800 border border-slate-200/80'
                  : 'hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Donor
            </button>
            <button
              onClick={() => { setActiveTab('kitchen'); setIsSignUp(false); }}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-slate-650 cursor-pointer ${
                activeTab === 'kitchen'
                  ? 'bg-white shadow-sm text-emerald-800 border border-slate-200/80'
                  : 'hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              Kitchen
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="text-center pb-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
                {activeTab === 'guest' ? 'athithi terminal' : activeTab === 'donor' ? 'donor terminal' : 'partner kitchen terminal'}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                {activeTab === 'guest' && "Claim nourishing meals. No digital tracking to preserve pure dignity."}
                {activeTab === 'donor' && "Track sponsored Sadhyas and fund kitchens."}
                {activeTab === 'kitchen' && "Scan vouchers, log walk-in guests, and manage your kitchen leaf balance."}
              </p>
            </div>

            {/* Input fields */}
            {activeTab === 'guest' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Display Nickname (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Athithi, Friend"
                      className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Phone for SMS ticket (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 font-sans"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                    Used only to send you the voucher code via SMS dynamically. No data is stored or tracked.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'donor' && (
              <div className="space-y-3">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold ${!isSignUp ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-550'}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold ${isSignUp ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-550'}`}
                  >
                    Sign Up
                  </button>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Full Name
                    </label>
                    <div className="relative font-sans">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul G. Nair"
                        className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <div className="relative font-sans">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Passcode
                  </label>
                  <div className="relative font-sans">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type={showPwd ? 'text' : 'password'}
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kitchen' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Select Your Registered Kitchen
                  </label>
                  <select
                    value={selectedKitchenId}
                    onChange={(e) => setSelectedKitchenId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                  >
                    <option value="kitchen-1">Janakeeya Oottupura (Aluva)</option>
                    <option value="kitchen-2">Thanal Malabar Eatery (Kochi)</option>
                    <option value="kitchen-3">Sadhya Bhavan Social (Trivandrum)</option>
                    <option value="kitchen-4">Malaya Green Leaf Mess (Kozhikode)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Kitchen Passcode
                  </label>
                  <div className="relative font-sans">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="•••••• (Enter any key for testing)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-250 animate-pulse" />
              {activeTab === 'guest'
                ? 'Get Ticket'
                : activeTab === 'donor'
                ? isSignUp
                  ? 'Sign Up & Pay Sages'
                  : 'Sponsor Login'
                : 'Authenticate Kitchen Counter'}
            </button>

            {/* Google Authentication Section for Donor */}
            {activeTab === 'donor' && (
              <div className="space-y-3 pt-1">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-[#FAF9F6] px-2 font-mono">
                    or
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className={`w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isGoogleLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin mr-1" />
                  ) : (
                    <Chrome className="w-4 h-4 text-[#4285F4] animate-pulse" />
                  )}
                  {isGoogleLoading ? 'Connecting to Google Accounts...' : 'Continue with Google'}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

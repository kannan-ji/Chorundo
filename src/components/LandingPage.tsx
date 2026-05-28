import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Compass, Shield, ArrowRight, Smartphone, BookOpen, Clock, Mail, Phone, MapPin, Sparkles, LogIn, ChevronDown, Check, Globe, Menu, X } from 'lucide-react';
import { Kitchen } from '../types';
import CustomLandingMap from './CustomLandingMap';
import DetailsView from './DetailsView';
import keralaSadhyaMeal from '../assets/images/kerala_sadhya_meal_1779889824503.png';

interface LandingPageProps {
  kitchens: Kitchen[];
  onOpenLogin: (roleTab?: 'guest' | 'donor' | 'kitchen') => void;
  onSelectKitchenFromMap: (kitchen: Kitchen) => void;
  onEnterDashboard: (role: 'guest' | 'donor' | 'kitchen') => void;
  userCoords: { lat: number; lng: number };
  setUserCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
}

export default function LandingPage({
  kitchens,
  onOpenLogin,
  onSelectKitchenFromMap,
  onEnterDashboard,
  userCoords,
  setUserCoords,
}: LandingPageProps) {
  const [mapLocked, setMapLocked] = useState(true);
  const [activeDetail, setActiveDetail] = useState<'donor' | 'kitchen' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Form state for custom Contact section
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // References for scrolling smoothly to sections
  const refGuest = useRef<HTMLDivElement>(null);
  const refDonor = useRef<HTMLDivElement>(null);
  const refKitchen = useRef<HTMLDivElement>(null);
  const refAbout = useRef<HTMLDivElement>(null);
  const refContact = useRef<HTMLDivElement>(null);

  const handleScrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setContactSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans antialiased">
      
      {/* 1. STICKY NAVBAR */}
      <nav id="navbar" className="sticky top-0 z-45 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/60 px-4 md:px-8 h-16 flex items-center">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveDetail(null)}>
            <div className="w-8 h-8 bg-emerald-700 rounded-xl flex items-center justify-center p-0.5 shadow-md shadow-emerald-250">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight text-emerald-950 font-serif lowercase leading-none block">
                chorundo?
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650 tracking-wide uppercase">
            <button onClick={() => { setActiveDetail(null); handleScrollTo(refGuest); }} className="hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-0 p-0 outline-none leading-none">Athithi</button>
            <button onClick={() => { setActiveDetail(null); handleScrollTo(refDonor); }} className="hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-0 p-0 outline-none leading-none">Donor</button>
            <button onClick={() => { setActiveDetail(null); handleScrollTo(refKitchen); }} className="hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-0 p-0 outline-none leading-none">Partner Kitchen</button>
            <button onClick={() => { setActiveDetail(null); handleScrollTo(refAbout); }} className="hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-0 p-0 outline-none leading-none">About Story</button>
            <button onClick={() => { setActiveDetail(null); handleScrollTo(refContact); }} className="hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-0 p-0 outline-none leading-none">Contact US</button>
          </div>

          {/* Action CTAs & Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            <a
              href="#/playground"
              className="hidden sm:flex h-9 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider px-3 rounded-xl border border-amber-200 transition-all shadow-sm items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>Interactive Playground</span>
            </a>
            <button
              onClick={() => onOpenLogin('guest')}
              className="hidden sm:flex h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] uppercase tracking-wide px-4 rounded-xl border border-transparent transition-all shadow-sm active:scale-97 cursor-pointer items-center justify-center gap-1.5 leading-none"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Portal */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-16 left-0 w-full bg-[#FAF9F6] border-b border-slate-200/60 md:hidden overflow-hidden z-40 shadow-xl"
            >
              <div className="p-6 space-y-4 flex flex-col items-start translate-y-0">
                <button 
                  onClick={() => { setActiveDetail(null); handleScrollTo(refGuest); setIsMenuOpen(false); }} 
                  className="w-full text-left text-sm font-bold text-slate-700 uppercase tracking-widest py-2 active:text-emerald-700"
                >
                  Athithi
                </button>
                <button 
                  onClick={() => { setActiveDetail(null); handleScrollTo(refDonor); setIsMenuOpen(false); }} 
                  className="w-full text-left text-sm font-bold text-slate-700 uppercase tracking-widest py-2 active:text-emerald-700"
                >
                  Donor
                </button>
                <button 
                  onClick={() => { setActiveDetail(null); handleScrollTo(refKitchen); setIsMenuOpen(false); }} 
                  className="w-full text-left text-sm font-bold text-slate-700 uppercase tracking-widest py-2 active:text-emerald-700"
                >
                  Partner Kitchen
                </button>
                <button 
                  onClick={() => { setActiveDetail(null); handleScrollTo(refAbout); setIsMenuOpen(false); }} 
                  className="w-full text-left text-sm font-bold text-slate-700 uppercase tracking-widest py-2 active:text-emerald-700"
                >
                  About Story
                </button>
                <button 
                  onClick={() => { setActiveDetail(null); handleScrollTo(refContact); setIsMenuOpen(false); }} 
                  className="w-full text-left text-sm font-bold text-slate-700 uppercase tracking-widest py-2 active:text-emerald-700"
                >
                  Contact US
                </button>
                
                <div className="pt-4 border-t border-slate-100 w-full grid grid-cols-2 gap-3">
                  <a
                    href="#/playground"
                    className="flex h-11 bg-amber-50 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider px-3 rounded-xl border border-amber-200 items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Interactive Playground</span>
                  </a>
                  <button
                    onClick={() => { 
                      onOpenLogin('guest');
                      setIsMenuOpen(false);
                    }}
                    className="flex h-11 bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wide px-3 rounded-xl items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login / Sign Up</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Header Context Banner (Only when no detail panel is open) */}
      <AnimatePresence mode="wait">
        {activeDetail ? (
          <div className="py-8 px-4 max-w-6xl mx-auto">
            <DetailsView
              type={activeDetail}
              onBack={() => setActiveDetail(null)}
              onLoginClick={(role) => onOpenLogin(role === 'donor' ? 'donor' : 'kitchen')}
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 md:px-6 pt-6"
          >
            {/* 2. DYNAMIC LIVE COMPASS MAP CONTAINER */}
            <div className="mt-4 mb-12">
              <CustomLandingMap
                kitchens={kitchens}
                isLocked={mapLocked}
                onUnlockHungry={() => {
                  setMapLocked(false);
                  // Auto simulate Aluva coordinates to make sure the user finds a kitchen within 1km instantly!
                  setUserCoords({ lat: 10.1075, lng: 76.3542 });
                }}
                onUnlockSponsor={() => {
                  setMapLocked(false);
                  onOpenLogin('donor');
                }}
                onKitchenClick={(k) => {
                  // Direct Athithi interaction: when user clicks a spot, take them to signup/login
                  onSelectKitchenFromMap(k);
                }}
                userCoords={userCoords}
                setUserCoords={setUserCoords}
              />
            </div>

            {/* Top Introductory Header Badge */}
            <div className="text-center py-4 max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-widest uppercase border border-emerald-100 rounded-full px-3 py-1 font-mono mb-3 animate-pulse">
                <Sparkles className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                Kerala's Food-Dignity Campaign
              </span>
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-slate-800 tracking-tight lowercase leading-none">
                the warm hospitality of a <span className="text-emerald-700 font-extrabold italic font-serif">heartful</span> meal.
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-sans mt-3 leading-relaxed max-w-xl mx-auto">
                No complex servers, no commission margins, and absolute athithi privacy. chorundo makes local eateries in Kerala a sanctuary of mutual care.
              </p>
            </div>

            {/* SCROLL SECTIONS MARKERS CONTAINER */}
            <div className="space-y-24 pb-12">
              
              {/* SECTION: ATHITHI */}
              <div ref={refGuest} id="guest-section" className="scroll-mt-20 border-t border-slate-200/80 pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">Athithi</span>
                  </div>
                  <h3 className="text-2xl md:text-3.5xl font-bold font-serif text-slate-800 lowercase tracking-tight">
                    get a warm meal. completely anonymous.
                  </h3>
                  <div className="text-xs md:text-sm text-slate-650 space-y-3 leading-relaxed">
                    <p>
                      If you are in Aluva, Kochi, Trivandrum, or Kozhikode and need nutrition, chorundo registers you anonymously. No biometric scan and no complex documentation required.
                    </p>
                    <p>
                      Enter a friendly display nickname, inspect the live leaves count on our locator map, and generate a dynamic digital voucher code. Present it to the counter cashier for fresh Sadhya rice & curries!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">Digital SMS Ticket</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">Protected Integrity</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenLogin('guest')}
                    className="mt-2 w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                  >
                    Get meal token
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Aesthetic graphical card for seeker */}
                <div className="md:col-span-5 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="h-56 bg-emerald-800 rounded-2xl overflow-hidden relative border border-emerald-900 shadow-inner">
                    <img 
                      className="w-full h-full object-cover opacity-70 mix-blend-overlay" 
                      src={keralaSadhyaMeal} 
                      alt="Traditional Kerala Meal" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sponsors pre-fund warm meals for any number of people. Cashiers redeem codes securely. Food is a right, not a privilege.
                    </p>
                  </div>
                </div>
              </div>


              {/* SECTION: SPONSOR / DONOR */}
              <div ref={refDonor} id="donor-section" className="scroll-mt-20 border-t border-slate-200/80 pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Aesthetic card for donor */}
                <div className="md:col-span-5 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4 order-last md:order-first">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        Kitchen-set pricing
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        Variable ₹30 – ₹55
                      </span>
                    </div>
 
                    <div className="space-y-2">
                       <div className="flex items-center justify-between bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl text-xs">
                        <span className="font-semibold text-slate-700">Standard Meals / Sadhya</span>
                        <span className="text-emerald-700 font-bold">Varies</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl text-xs">
                        <span className="font-semibold text-slate-700">Side items & Curries</span>
                        <span className="text-emerald-700 font-bold">Kitchen Choice</span>
                      </div>
                      <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl text-[10px]">
                        <p className="text-emerald-900/70 font-sans italic">
                          Prices are fixed by partner kitchens to match their local operating costs.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50/40 border border-emerald-200/30 p-4 rounded-2.5xl">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-800 font-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      100% trace guarantee
                    </span>
                    <p className="text-[10px] text-emerald-900/80 mt-1 leading-normal">
                      Every sponsor receives a message logging exactly when and where their meals were presented on clay counters.
                    </p>
                  </div>
                </div>

                {/* Text section for donor */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">Donor</span>
                  </div>
                  <h3 className="text-2xl md:text-3.5xl font-bold font-serif text-slate-800 lowercase tracking-tight">
                    nourish your junction. zero admin cuts.
                  </h3>
                  <div className="text-xs md:text-sm text-slate-650 space-y-3 leading-relaxed">
                    <p>
                      Are you a resident, expat or well-wisher? Track which partner kitchens are running out of sponsored meals and step in instantly to support them. 
                    </p>
                    <p>
                      Each kitchen sets their own meal price and composition based on local market costs. Watch the public ledger update in real-time as kitchens serve diners off their food account balances.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                    <button
                      onClick={() => onOpenLogin('donor')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                    >
                      Sponsor meal(s)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveDetail('donor')}
                      className="bg-white border border-slate-200 text-slate-705 hover:bg-slate-50 font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-98"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      Know More
                    </button>
                  </div>
                </div>

              </div>


              {/* SECTION: PARTNER KITCHEN */}
              <div ref={refKitchen} id="kitchen-section" className="scroll-mt-20 border-t border-slate-200/80 pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">Partner Kitchen</span>
                  </div>
                  <h3 className="text-2xl md:text-3.5xl font-bold font-serif text-slate-800 lowercase tracking-tight">
                    join as partner kitchen. easy counter logins.
                  </h3>
                  <div className="text-xs md:text-sm text-slate-650 space-y-3 leading-relaxed">
                    <p>
                      We believe neighborhood tea-shops, mom-and-pop cafes and small mess-counters are the backbone of community nourishment. 
                    </p>
                    <p>
                      We do not charge kitchens for signing up. Simply take our online portal, scan guest QR/voucher codes, or tap "Log Walk-In" to use active sponsorships for devices-less elder neighbors on plantain leaves!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                    <button
                      onClick={() => onOpenLogin('kitchen')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                    >
                      Kitchen Console Login
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveDetail('kitchen')}
                      className="bg-white border border-slate-200 text-slate-705 hover:bg-slate-50 font-semibold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-98"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      Know More
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="border border-slate-150 p-4 rounded-2xl bg-emerald-50/25 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span className="font-bold text-xs uppercase tracking-wider font-mono">lightweight counters</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
                      <li>Use any smartphone browser to check ledger balances.</li>
                      <li>One-click verification of unique code tickets.</li>
                      <li>Direct UPI/Bank settlements every Friday afternoon.</li>
                    </ul>
                  </div>
                </div>
              </div>


              {/* SECTION: ABOUT STORY */}
              <div ref={refAbout} id="about-section" className="scroll-mt-20 border-t border-slate-200/80 pt-16">
                <div className="max-w-3xl mx-auto space-y-6 text-left md:text-center flex flex-col items-start md:items-center">
                  <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">Our Story</span>
                  <h3 className="text-2xl md:text-4xl font-bold font-serif text-slate-800 lowercase tracking-tight">
                    it all starts in kerala's hearts.
                  </h3>
                  <div className="space-y-6 text-left md:text-center">
                    <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-sans">
                      chorundo? translates literally in Malayalam to <span className="italic font-semibold text-emerald-800">"Did you have meal?"</span>. It is the signature question heard at the front door of every home across the state—rooted in a collective code that no stranger, worker, or neighbor should experience hunger.
                    </p>
                    <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-sans">
                      With soaring costs and dynamic struggles, our neighborhood junctions remain vulnerable. We created chorundo? to link citizen solidarity directly to localized dining tables. No marketing overhead, no database synchronization dependencies, and complete transparent traceability.
                    </p>
                    <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-sans border-t border-dashed border-emerald-100/80 pt-4 mt-2">
                      Our philosophy is directly inspired by <span className="font-semibold text-emerald-800">Operation Sulaimani</span>—the legendary district-wide food-dignity initiative pioneered in Kozhikode (Calicut), Kerala. Much like that groundbreaking community-funded program, chorundo? believes in ensuring no neighbor goes hungry, preserving absolute privacy and dignity without public queues or identifying those in need. We stand on the shoulders of this timeless vision, keeping Kerala's custom of infinite hospitality alive in the digital age.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-left font-mono">
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl">
                      <span className="block text-2xl font-serif font-black text-emerald-800">100%</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-1 font-bold">to eateries</span>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl">
                      <span className="block text-2xl font-serif font-black text-emerald-800">0%</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-1 font-bold">Comm cuts</span>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl">
                      <span className="block text-2xl font-serif font-black text-emerald-800">4+</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-1 font-bold">Kerala Zones</span>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl">
                      <span className="block text-2xl font-serif font-black text-emerald-800">100%</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-1 font-bold">Privacy first</span>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION: CONTACT US */}
              <div ref={refContact} id="contact-section" className="scroll-mt-20 border-t border-slate-200/80 pt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Information contact columns */}
                <div className="md:col-span-5 space-y-4">
                  <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">Contact US</span>
                  <h3 className="text-2xl font-bold font-serif text-slate-800 lowercase tracking-tight">
                    reach the chorundo team.
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Have questions about restaurant sign-ups, bulk CSR allocations, or local volunteering around Aluva junction? Please drop us a line!
                  </p>
                  
                  <div className="space-y-3.5 pt-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-700">support@chorundo.domain</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-700">company phone number</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-700">Town Hall Civil Road, Aluva, Kerala</span>
                    </div>
                  </div>
                </div>

                {/* Form column */}
                <div className="md:col-span-7 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                  {contactSuccess ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-inner">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-800">Inquiry Received beautifully!</h4>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-normal">
                        Our neighborhood team near Aluva Town hall will reach back to your email address shortly. Thank you for caring!
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Your Name</label>
                          <input
                            required
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="e.g. Anand Sharma"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Email address</label>
                          <input
                            required
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="e.g. anand@outlook.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Your Enquiry</label>
                        <textarea
                          required
                          rows={4}
                          value={contactMsg}
                          onChange={(e) => setContactMsg(e.target.value)}
                          placeholder="e.g. We possess a small traditional tea-shop near Kochi Metro and would love to register as a partner kitchen..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-semibold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Send Message to Counter
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="mt-16 py-12 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-emerald-700 rounded-xl flex items-center justify-center p-0.5 shadow-md shadow-emerald-250">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight text-emerald-950 font-serif lowercase leading-none block">
                chorundo?
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            chorundo? is an open-source movement bringing transparent dignity to community hunger alleviation across Kerala. Designed and built with traditional Malayalam hospitality principles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] text-slate-400 font-mono tracking-wider uppercase font-black">
            <span>Clean Architecture</span>
            <span>·</span>
            <span>Zero Platform Comm Cuts</span>
            <span>·</span>
            <span>Malayalam Traditional Hospitality</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { INITIAL_KITCHENS } from './data';
import { Kitchen, Donation, MealClaim, Role } from './types';
import BrandingHeader from './components/BrandingHeader';
import RoleSelector from './components/RoleSelector';
import SeekerDashboard from './components/SeekerDashboard';
import DonorDashboard from './components/DonorDashboard';
import KitchenDashboard from './components/KitchenDashboard';
import LandingPage from './components/LandingPage';
import LoginModal from './components/LoginModal';
import { Sparkles, Heart, HelpCircle, Flame, LogOut, UserCheck, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [claims, setClaims] = useState<MealClaim[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>('seeker');

  // Custom user sessions/authentication states
  const [currentView, setCurrentView] = useState<'landing' | 'playground' | 'guest-dashboard' | 'donor-dashboard' | 'kitchen-dashboard'>('landing');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'guest' | 'donor' | 'kitchen'>('guest');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [activeKitchenId, setActiveKitchenId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 10.1075, lng: 76.3542 });

  // Load baseline on startup
  useEffect(() => {
    // Force public landing page by default on clean initial entry, ignoring stale playground hashes
    if (window.location.hash === '#/playground') {
      window.location.hash = '';
    }

    const savedKitchens = localStorage.getItem('chorundo_kitchens');
    const savedDonations = localStorage.getItem('chorundo_donations');
    const savedClaims = localStorage.getItem('chorundo_claims');

    if (savedKitchens) {
      try {
        const parsed = JSON.parse(savedKitchens);
        if (Array.isArray(parsed) && parsed.length < 50) {
          setKitchens(INITIAL_KITCHENS);
          localStorage.setItem('chorundo_kitchens', JSON.stringify(INITIAL_KITCHENS));
        } else {
          setKitchens(parsed);
        }
      } catch (e) {
        setKitchens(INITIAL_KITCHENS);
        localStorage.setItem('chorundo_kitchens', JSON.stringify(INITIAL_KITCHENS));
      }
    } else {
      setKitchens(INITIAL_KITCHENS);
      localStorage.setItem('chorundo_kitchens', JSON.stringify(INITIAL_KITCHENS));
    }

    if (savedDonations) {
      setDonations(JSON.parse(savedDonations));
    } else {
      // Seed beautiful introductory donations to make the ledger appear active
      const seedDonations: Donation[] = [
        {
          id: 'seed-don-1',
          kitchenId: 'kitchen-3',
          kitchenName: 'Sadhya Bhavan Social Kitchen',
          amount: 500, // 10 meals * 50
          mealsCount: 10,
          donorName: 'Rahul G. Nair',
          message: 'Grateful to help! A warm meal on a green leaf brings absolute happiness.',
          timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        },
        {
          id: 'seed-don-2',
          kitchenId: 'kitchen-1',
          kitchenName: 'Janakeeya Oottupura (Community Kitchen)',
          amount: 175, // 5 meals * 35
          mealsCount: 5,
          donorName: 'Karthika Pillai',
          message: 'Doing wonderful work, team! Let us ensure no neighbor sleeps hungry.',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'seed-don-3',
          kitchenId: 'kitchen-2',
          kitchenName: 'Thanal Malabar Eatery',
          amount: 135, // 3 meals * 45
          mealsCount: 3,
          donorName: 'Dr. Joseph Kurian',
          message: 'Pleased to support our Kozhikode junction community.',
          timestamp: new Date(Date.now() - 360000).toISOString(), // 6 minutes ago
        }
      ];
      setDonations(seedDonations);
      localStorage.setItem('chorundo_donations', JSON.stringify(seedDonations));
    }

    if (savedClaims) {
      setClaims(JSON.parse(savedClaims));
    } else {
      setClaims([]);
    }
  }, []);

  // Sync hash links for simple single-page routing representation
  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === '#/playground') {
        setCurrentView('playground');
      } else if (window.location.hash === '#/guest-dashboard') {
        setCurrentView(loggedInUser ? 'guest-dashboard' : 'landing');
      } else if (window.location.hash === '#/donor-dashboard') {
        setCurrentView(loggedInUser ? 'donor-dashboard' : 'landing');
      } else if (window.location.hash === '#/kitchen-dashboard') {
        setCurrentView(loggedInUser ? 'kitchen-dashboard' : 'landing');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', syncHash);
    syncHash(); // Initial check
    return () => window.removeEventListener('hashchange', syncHash);
  }, [loggedInUser]);

  // Save states to localstorage whenever mutated
  const persistState = (newKitchens: Kitchen[], newDonations: Donation[], newClaims: MealClaim[]) => {
    setKitchens(newKitchens);
    setDonations(newDonations);
    setClaims(newClaims);
    localStorage.setItem('chorundo_kitchens', JSON.stringify(newKitchens));
    localStorage.setItem('chorundo_donations', JSON.stringify(newDonations));
    localStorage.setItem('chorundo_claims', JSON.stringify(newClaims));
  };

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  // Athithi flow: Generate and claim voucher code
  const handleCreateClaim = (kitchenId: string, seekerName?: string) => {
    // 0. Limit to strictly only one pending ticket at a time
    const hasActivePending = claims.some((c) => c.status === 'pending');
    if (hasActivePending) return;

    const targetKitchen = kitchens.find((k) => k.id === kitchenId);
    if (!targetKitchen || targetKitchen.sponsoredCount <= 0) return;

    // 1. Generate unique code
    const uniqueNum = Math.floor(100000 + Math.random() * 900000);
    const code = `CH-${uniqueNum}`;

    // 2. Build meal claim object
    const newClaim: MealClaim = {
      id: `claim-${Date.now()}`,
      kitchenId,
      kitchenName: targetKitchen.name,
      code,
      status: 'pending',
      timestamp: new Date().toISOString(),
      isWalkIn: false,
      seekerName: seekerName || 'Athithi',
    };

    // 3. Update kitchen sponsored count table
    const updatedKitchens = kitchens.map((k) =>
      k.id === kitchenId ? { ...k, sponsoredCount: k.sponsoredCount - 1 } : k
    );

    const updatedClaims = [...claims, newClaim];
    persistState(updatedKitchens, donations, updatedClaims);
  };

  // Athithi flow: Release/Cancel voucher code back to public pool
  const handleCancelClaim = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;

    // Return the meal to the kitchen count
    const updatedKitchens = kitchens.map((k) =>
      k.id === claim.kitchenId ? { ...k, sponsoredCount: k.sponsoredCount + 1 } : k
    );

    const updatedClaims = claims.filter((c) => c.id !== claimId);
    persistState(updatedKitchens, donations, updatedClaims);
  };

  // Donor flow: Sponsor meals pre-pay checkpoint
  const handleSponsorMeals = (
    kitchenId: string,
    mealsCount: number,
    donorName: string,
    message?: string
  ) => {
    const targetKitchen = kitchens.find((k) => k.id === kitchenId);
    if (!targetKitchen) return;

    // 1. Log donation
    const newDonation: Donation = {
      id: `donation-${Date.now()}`,
      kitchenId,
      kitchenName: targetKitchen.name,
      amount: mealsCount * targetKitchen.mealPrice, // kitchen-specific pricing
      mealsCount,
      donorName,
      message,
      timestamp: new Date().toISOString(),
    };

    // 2. Increment active sponsorships on kitchen
    const updatedKitchens = kitchens.map((k) =>
      k.id === kitchenId ? { ...k, sponsoredCount: k.sponsoredCount + mealsCount } : k
    );

    const updatedDonations = [newDonation, ...donations];
    persistState(updatedKitchens, updatedDonations, claims);
  };

  // Kitchen Manager flow: Enter voucher code and claim food
  const handleRedeemCode = (code: string, kitchenId: string): boolean | string => {
    // Find voucher matching code, kitchen, and status pending
    const activeClaim = claims.find(
      (c) => c.code === code && c.kitchenId === kitchenId && c.status === 'pending'
    );

    if (!activeClaim) {
      return 'Voucher code invalid, expired, or registered to a different kitchen counter.';
    }

    // Mark the voucher as redeemed
    const updatedClaims = claims.map((c) =>
      c.code === code ? { ...c, status: 'redeemed' as const, claimedAt: new Date().toISOString() } : c
    );

    // Update actual kitchen served count
    const updatedKitchens = kitchens.map((k) =>
      k.id === kitchenId ? { ...k, claimedCount: k.claimedCount + 1 } : k
    );

    persistState(updatedKitchens, donations, updatedClaims);
    return true;
  };

  // Kitchen Manager flow: Log Walk-in Athithi (No digital footprint, direct support 3.2.2)
  const handleLogWalkIn = (kitchenId: string): boolean => {
    const targetKitchen = kitchens.find((k) => k.id === kitchenId);
    if (!targetKitchen || targetKitchen.sponsoredCount <= 0) return false;

    // 1. Create walk-in claim
    const newClaim: MealClaim = {
      id: `claim-${Date.now()}`,
      kitchenId,
      kitchenName: targetKitchen.name,
      code: 'OFFLINE-WALKIN',
      status: 'redeemed',
      timestamp: new Date().toISOString(),
      claimedAt: new Date().toISOString(),
      isWalkIn: true,
    };

    // 2. Decrement sponsored pool & increment claimed count
    const updatedKitchens = kitchens.map((k) =>
      k.id === kitchenId
        ? {
            ...k,
            sponsoredCount: k.sponsoredCount - 1,
            claimedCount: k.claimedCount + 1,
          }
        : k
    );

    const updatedClaims = [...claims, newClaim];
    persistState(updatedKitchens, donations, updatedClaims);
    return true;
  };

  // Athithi map click login funnel
  const handleSelectKitchenFromMap = (kitchen: Kitchen) => {
    setActiveKitchenId(kitchen.id);
    setLoginTab('guest');
    setLoginModalOpen(true);
  };

  // Portal Authentication Handler
  const handleLoginSuccess = (role: Role | 'guest', userDisplayName: string, targetId?: string) => {
    setLoggedInUser(userDisplayName);
    if (role === 'guest') {
      window.location.hash = '#/guest-dashboard';
      setCurrentView('guest-dashboard');
    } else if (role === 'donor') {
      window.location.hash = '#/donor-dashboard';
      setCurrentView('donor-dashboard');
    } else if (role === 'kitchen') {
      if (targetId) setActiveKitchenId(targetId);
      window.location.hash = '#/kitchen-dashboard';
      setCurrentView('kitchen-dashboard');
    }
  };

  // Standard Logout
  const handleLogout = () => {
    setLoggedInUser(null);
    setActiveKitchenId(null);
    window.location.hash = '';
    setCurrentView('landing');
  };

  // Active unclaimed voucher count for role selector badge indication
  const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length;

  if (kitchens.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-650 font-sans">Loading chorundo? Kerala Hospitality...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans antialiased selection:bg-emerald-250">
      
      {/* View routing controller logic */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* 1. VISITOR PUBLIC HOMEPAGE */}
          {currentView === 'landing' && (
            <LandingPage
              kitchens={kitchens}
              onOpenLogin={(roleTab) => {
                if (roleTab) setLoginTab(roleTab);
                setLoginModalOpen(true);
              }}
              onSelectKitchenFromMap={handleSelectKitchenFromMap}
              onEnterDashboard={(role) => {
                setLoginTab(role === 'guest' ? 'guest' : role);
                setLoginModalOpen(true);
              }}
              userCoords={userCoords}
              setUserCoords={setUserCoords}
            />
          )}

          {/* 2. ADMIN REUSABLE SIMULATOR PLAYGROUND */}
          {currentView === 'playground' && (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16">
              {/* Back out button to public homescreen */}
              <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-3xl gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <p className="text-xs text-emerald-900 font-semibold font-sans">
                    You are in the **Administrative Simulator Playground**. Test all 3 user roles, claims, and settlements together!
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.location.hash = '';
                    setCurrentView('landing');
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-all shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-auto"
                >
                  ← Return to Public Website
                </button>
              </div>

              <BrandingHeader />

              <RoleSelector
                currentRole={currentRole}
                onRoleChange={setCurrentRole}
                seekerCodeCount={pendingClaimsCount}
              />

              <div className="mt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentRole}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentRole === 'seeker' && (
                      <SeekerDashboard
                        kitchens={kitchens}
                        claims={claims.filter((c) => c.status === 'pending')}
                        onCreateClaim={handleCreateClaim}
                        onCancelClaim={handleCancelClaim}
                        onBackToHome={() => { window.location.hash = ''; setCurrentView('landing'); }}
                      />
                    )}

                    {currentRole === 'donor' && (
                      <DonorDashboard
                        kitchens={kitchens}
                        donations={donations}
                        onSponsorMeals={handleSponsorMeals}
                        onBackToHome={() => { window.location.hash = ''; setCurrentView('landing'); }}
                        donorName="Playground Sponsor"
                      />
                    )}

                    {currentRole === 'kitchen' && (
                      <KitchenDashboard
                        kitchens={kitchens}
                        claims={claims}
                        onRedeemCode={handleRedeemCode}
                        onLogWalkIn={handleLogWalkIn}
                        initialKitchenId={activeKitchenId}
                        onBackToHome={() => { window.location.hash = ''; setCurrentView('landing'); }}
                        activeKitchenName={kitchens.find(k => k.id === activeKitchenId)?.name || 'Playground Kitchen Partner'}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <footer className="mt-16 pt-8 border-t border-slate-200 text-center max-w-2xl mx-auto">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>chorundo? is an open-source community platform empowering citizens & neighborhood kitchens.</span>
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-center gap-1.5 flex-wrap">
                  <span>Clean Architecture</span>
                  <span>·</span>
                  <span>No-Database Local Cache</span>
                  <span>·</span>
                  <span>Zero-Sponsorship Fees</span>
                  <span>·</span>
                  <span>Malayalam Traditional Hospitality</span>
                </div>
              </footer>
            </div>
          )}

          {/* 3. AUTHENTICATED SEEKER/GUEST */}
          {currentView === 'guest-dashboard' && (
            <div className="pb-16 w-full">
              <SeekerDashboard
                kitchens={kitchens}
                claims={claims.filter((c) => c.status === 'pending')}
                onCreateClaim={handleCreateClaim}
                onCancelClaim={handleCancelClaim}
                initialKitchenId={activeKitchenId}
                onBackToHome={handleLogout}
                isStandalone={true}
              />
            </div>
          )}

          {/* 4. AUTHENTICATED SPONSOR/DONOR */}
          {currentView === 'donor-dashboard' && (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16">
              <DonorDashboard
                kitchens={kitchens}
                donations={donations}
                onSponsorMeals={handleSponsorMeals}
                onBackToHome={handleLogout}
                donorName={loggedInUser || 'Sponsor Partner'}
              />
            </div>
          )}

          {/* 5. AUTHENTICATED PARTNER KITCHEN */}
          {currentView === 'kitchen-dashboard' && (
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16">
              <KitchenDashboard
                kitchens={kitchens}
                claims={claims}
                onRedeemCode={handleRedeemCode}
                onLogWalkIn={handleLogWalkIn}
                initialKitchenId={activeKitchenId}
                onBackToHome={handleLogout}
                activeKitchenName={kitchens.find(k => k.id === activeKitchenId)?.name || 'Partner Kitchen'}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Unified Quick Access Portal Dialog */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRoleTab={loginTab}
      />

    </div>
  );
}

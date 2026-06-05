import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  Heart, 
  Landmark as LandmarkIcon, 
  Leaf, 
  MapPin, 
  Navigation, 
  Phone, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  Users, 
  X,
  Utensils,
  Award,
  History,
  Activity,
  Flame,
  Coins,
  TrendingUp,
  AlertTriangle,
  Sparkle,
  Bell,
  FileText,
  Printer,
  Download,
  Pencil
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Donation, Kitchen } from '../types';
import { calculateDistance } from '../data';

interface DonorDashboardProps {
  kitchens: Kitchen[];
  donations: Donation[];
  onSponsorMeals: (kitchenId: string, mealsCount: number, donorName: string, message?: string) => void;
  onBackToHome?: () => void;
  donorName?: string;
  isStandalone?: boolean;
}

export default function DonorDashboard({ 
  kitchens, 
  donations, 
  onSponsorMeals,
  onBackToHome,
  donorName,
  isStandalone = false,
}: DonorDashboardProps) {
  // Navigation and Layout coordinates (retained for true distance calculation)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.1064,
    lng: 76.3534, // Default Aluva/Kochi Metro coordinates
  });
  
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(kitchens[0]?.id || null);
  const [pinnedKitchenId, setPinnedKitchenId] = useState<string | null>(kitchens[0]?.id || null);
  
  // Pagination & Mobile View Tab Switching
  const [displayCount, setDisplayCount] = useState(15);
  const [mobileNavTab, setMobileNavTab] = useState<'quick_actions' | 'explore' | 'profile'>('quick_actions');
  const [isLedgerDrawerOpen, setIsLedgerDrawerOpen] = useState(false);

  // Patron Notification Schema
  interface PatronNotification {
    id: string;
    type: 'urgency' | 'success' | 'claim' | 'info';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }

  // Live Notifications State
  const [notifications, setNotifications] = useState<PatronNotification[]>([
    {
      id: 'notif-1',
      type: 'info',
      title: 'Welcome, Direct-Aid Patron',
      message: 'Secure community meals directly onto kitchen registers. Seeking diners can request them safely and quickly.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'urgency',
      title: 'Critical Stock Deficit',
      message: 'Sri Muruga Cafe is at 0 available meals of traditional Kerala breakfast, please consider sponsoring.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: false,
    },
    {
      id: 'notif-3',
      type: 'claim',
      title: 'Warm Meal Safely Claimed! 🍲',
      message: 'A hot combo breakfast you sponsored earlier has been requested by a local guest at Aluva Transit Area.',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      read: false,
    },
  ]);

  // Track previous states to discover real modifications happening in the playground or accounts
  const prevDonationsRef = useRef<Donation[]>(donations);
  const prevKitchensRef = useRef<Kitchen[]>(kitchens);

  // Active sync for newly added donations
  useEffect(() => {
    const prevIds = new Set(prevDonationsRef.current.map(d => d.id));
    const newSponsorships = donations.filter(d => !prevIds.has(d.id));

    if (newSponsorships.length > 0) {
      const newNotifs: PatronNotification[] = newSponsorships.map(newDon => ({
        id: `notif-don-${newDon.id}-${Date.now()}`,
        type: 'success',
        title: 'New Sponsorship Registered! 💚',
        message: `${newDon.donorName || 'A generous neighbor'} sponsored ${newDon.mealsCount} meals at ${newDon.kitchenName || 'a partner kitchen'} (₹${newDon.amount}).`,
        timestamp: newDon.timestamp || new Date().toISOString(),
        read: false,
      }));

      setNotifications(prev => [...newNotifs, ...prev]);
    }
    prevDonationsRef.current = donations;
  }, [donations]);

  // Active sync for claimed and requested meal actions
  useEffect(() => {
    const prevMap = new Map<string, Kitchen>(prevKitchensRef.current.map(k => [k.id, k]));
    const newActions: PatronNotification[] = [];

    kitchens.forEach(curr => {
      const prev = prevMap.get(curr.id);
      if (prev) {
        // Issue claimed count increase (means kitchen actually served a meal)
        if (curr.claimedCount > prev.claimedCount) {
          const diff = curr.claimedCount - prev.claimedCount;
          newActions.push({
            id: `notif-claimed-${curr.id}-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: 'Warm Meal Served! 🍲',
            message: `${diff} sponsored meal${diff > 1 ? 's' : ''} successfully served at ${curr.name} to our community guests.`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
        // Issue sponsored count reduction (means seeker claimed or booked a meal voucher from the pool)
        else if (curr.sponsoredCount < prev.sponsoredCount) {
          const diff = prev.sponsoredCount - curr.sponsoredCount;
          newActions.push({
            id: `notif-seeker-claim-${curr.id}-${Date.now()}-${Math.random()}`,
            type: 'claim',
            title: 'Meal Voucher Requested! 🧡',
            message: `A registered seeker has safely requested ${diff} meal voucher${diff > 1 ? 's' : ''} from the pool at ${curr.name}.`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });

    if (newActions.length > 0) {
      setNotifications(prev => [...newActions, ...prev]);
    }
    prevKitchensRef.current = kitchens;
  }, [kitchens]);

  // Mark all notifications as read helper
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Sponsoring payment flows (Local to each card expansion)
  const [mealsCount, setMealsCount] = useState<number>(5);
  const [customMeals, setCustomMeals] = useState<string>('');
  const [inputDonorName, setInputDonorName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // User Profile States
  const [activeDonorName, setActiveDonorName] = useState(donorName || 'Anonymous Neighbor');
  const [activeDonorEmail, setActiveDonorEmail] = useState('patron@example.com');
  const [activeDonorPhone, setActiveDonorPhone] = useState('+91 98765 43210');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [tempName, setTempName] = useState(activeDonorName);
  const [tempEmail, setTempEmail] = useState(activeDonorEmail);
  const [tempPhone, setTempPhone] = useState(activeDonorPhone);

  useEffect(() => {
    if (donorName) {
      setActiveDonorName(donorName);
    }
  }, [donorName]);

  useEffect(() => {
    if (isEditingProfile) {
      setTempName(activeDonorName);
      setTempEmail(activeDonorEmail);
      setTempPhone(activeDonorPhone);
    }
  }, [isEditingProfile, activeDonorName, activeDonorEmail, activeDonorPhone]);
  
  // Payment states
  const [sponsoringKitchenId, setSponsoringKitchenId] = useState<string | null>(null);
  const [sponsorSuccessId, setSponsorSuccessId] = useState<string | null>(null);

  // State variables needed for filters, dashboard tabs, and direct-aid bundles
  const [rightPanelTab, setRightPanelTab] = useState<'impact' | 'smart' | 'urgency'>('impact');
  const [activeFilter, setActiveFilter] = useState<'all' | 'needy' | 'popular' | 'nearby'>('all');
  
  const [bundleSize, setBundleSize] = useState<number>(25);
  const [customBundleCount, setCustomBundleCount] = useState<string>('');
  const [bundleSponsoring, setBundleSponsoring] = useState(false);
  const [bundleStep, setBundleStep] = useState<string | null>(null);
  const [bundleSuccess, setBundleSuccess] = useState(false);
  const [urgencyDisplayCount, setUrgencyDisplayCount] = useState(5);
  const [historyDisplayCount, setHistoryDisplayCount] = useState(10);


  // Tax Receipt generation states
  const [selectedReceiptForTax, setSelectedReceiptForTax] = useState<Donation | null>(null);
  const [showConsolidatedTaxReceipt, setShowConsolidatedTaxReceipt] = useState(false);
  const [donorPan, setDonorPan] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [customLegalName, setCustomLegalName] = useState('');
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);

  // Modal and drawer trigger states
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isEditingPaymentTax, setIsEditingPaymentTax] = useState(false);

  // Temporary payment settings states
  const [tempPan, setTempPan] = useState(donorPan);
  const [tempAddress, setTempAddress] = useState(donorAddress);
  const [tempUPI, setTempUPI] = useState('donor@okhdfc');
  const [tempCard, setTempCard] = useState('•••• •••• •••• 4581');

  useEffect(() => {
    if (isEditingPaymentTax) {
      setTempPan(donorPan);
      setTempAddress(donorAddress);
    }
  }, [isEditingPaymentTax, donorPan, donorAddress]);

  // Sync custom name when modal opens
  useEffect(() => {
    if (selectedReceiptForTax) {
      setCustomLegalName(selectedReceiptForTax.donorName || activeDonorName);
    } else if (showConsolidatedTaxReceipt) {
      setCustomLegalName(activeDonorName);
    }
  }, [selectedReceiptForTax, showConsolidatedTaxReceipt, activeDonorName]);

  // Dynamic soundless number to words helper for IRS/Income Tax validation
  const convertNumberToWords = (amount: number): string => {
    const sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
      dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"],
      tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const handleBelowHundred = (n: number): string => {
      if (n < 10) return sglDigit[n];
      if (n < 20) return dblDigit[n - 10];
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return tensPlace[tens] + (ones > 0 ? " " + sglDigit[ones] : "");
    };

    if (amount === 0) return "Zero Rupees Only";

    let result = "";
    let temp = amount;

    if (temp >= 10000000) {
      const cr = Math.floor(temp / 10000000);
      result += handleBelowHundred(cr) + " Crore ";
      temp %= 10000000;
    }

    if (temp >= 100000) {
      const lk = Math.floor(temp / 100000);
      result += handleBelowHundred(lk) + " Lakh ";
      temp %= 100000;
    }

    if (temp >= 1000) {
      const th = Math.floor(temp / 1000);
      result += handleBelowHundred(th) + " Thousand ";
      temp %= 1000;
    }

    if (temp >= 100) {
      const hn = Math.floor(temp / 100);
      result += sglDigit[hn] + " Hundred ";
      temp %= 100;
    }

    if (temp > 0) {
      if (result !== "") result += "and ";
      result += handleBelowHundred(temp);
    }

    return result.trim() + " Rupees Only";
  };

  // Actual download simulation of full-formatted certificate text file
  const handleDownloadReceipt = (amount: number, dateStr: string, serialNo: string) => {
    const certificateText = `-----------------------------------------------------------
ATITHI DIRECT-AID DIGITAL KITCHEN TRUST SPECIAL TAX PROGRAM
     80G CONTRIBUTION EXEMPTION & INCOMING RECEIPTS SLIP
-----------------------------------------------------------
Registration Authority: Joint Trust NGO Division of Kerala State
Standard Verification URL: https://atithi.net/certificates
Unique Serial Token: ${serialNo}
Date Issued: ${dateStr}
Exemption Status: Approved for 50% Tax Deduction, Sec 80G(5)(vi)

DONOR (SPONSOR) PARTICULARS:
----------------------------
Legal Full Name: ${customLegalName || 'Atithi Patron Neighbor'}
Permanent Account Number (PAN): ${donorPan || 'N/A - PENDING'}
Residential Mailing Location: ${donorAddress || 'N/A - PROV'}

CONTRIBUTION HISTORIC HIGHLIGHTS:
---------------------------------
Total Funded: INR ₹${amount.toLocaleString()}
Audited Text Representation: ${convertNumberToWords(amount)}
Sourced Through: Atithi Live Register Pipelines
Volume Delivered: ${amount / 40} standard Kerala breakfast elements

NGO DONEES (ATITHI CENTRALIZED ACCOUNT):
----------------------------------------
Ecosystem Integrity Verification: Verified - 100% direct register deposit rate.
Secure System Hash Seal: sha256-${Math.random().toString(36).substring(2, 12).toUpperCase()}

Thank you for ensuring beautiful, dignity-centric direct food aid is distributed
efficiently with total transparent oversight!
-----------------------------------------------------------
K. Ramachandran, Finance Trustee Atithi Division.
`;

    const element = document.createElement("a");
    const file = new Blob([certificateText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Atithi_TaxReceipt_${serialNo}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setReceiptDownloaded(true);
  };

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);

  // Distance computation & sorting list
  const kitchensWithDistance = useMemo(() => {
    return kitchens.map(k => {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng);
      return { ...k, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [kitchens, userCoords]);

  // Filter and sort local search terms and active list categories
  const filteredKitchens = useMemo(() => {
    let result = kitchensWithDistance.filter(k => {
      const term = searchTerm.toLowerCase();
      return (
        k.name.toLowerCase().includes(term) ||
        k.cuisine.toLowerCase().includes(term) ||
        k.address.toLowerCase().includes(term)
      );
    });

    if (activeFilter === 'needy') {
      // Prioritize kitchens running critical or low on active meals, lowest stock at top
      result = [...result].sort((a, b) => a.sponsoredCount - b.sponsoredCount);
    } else if (activeFilter === 'popular') {
      // Prioritize high claim volume
      result = [...result].sort((a, b) => b.claimedCount - a.claimedCount);
    } else if (activeFilter === 'nearby') {
      // Filter within 5km radius, sorted by proximity
      result = result.filter(k => k.distanceKm <= 5);
    }

    return result;
  }, [kitchensWithDistance, searchTerm, activeFilter]);

  // Pin selected kitchen to top
  const orderedKitchens = useMemo(() => {
    const list = [...filteredKitchens];
    if (pinnedKitchenId) {
      const pinnedIdx = list.findIndex(k => k.id === pinnedKitchenId);
      if (pinnedIdx >= displayCount && pinnedIdx !== -1) {
        const [pinnedItem] = list.splice(pinnedIdx, 1);
        list.unshift(pinnedItem);
      }
    }
    return list;
  }, [filteredKitchens, pinnedKitchenId, displayCount]);

  const displayedKitchens = useMemo(() => {
    return orderedKitchens.slice(0, displayCount);
  }, [orderedKitchens, displayCount]);

  // Scroll to active card when selection changes
  useEffect(() => {
    if (!selectedKitchenId) {
      lastSelectedIdRef.current = null;
      return;
    }

    if (selectedKitchenId === lastSelectedIdRef.current) {
      return; // Do not scroll if selected kitchen didn't change
    }

    const index = orderedKitchens.findIndex(k => k.id === selectedKitchenId);
    if (index !== -1) {
      lastSelectedIdRef.current = selectedKitchenId;
      let isPaginationUpdated = false;
      if (index >= displayCount) {
        setDisplayCount(index + 1);
        isPaginationUpdated = true;
      }

      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(`donor-eatery-card-${selectedKitchenId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, isPaginationUpdated ? 300 : 100);

      return () => clearTimeout(scrollTimeout);
    }
  }, [selectedKitchenId, orderedKitchens, displayCount]);

  // Reset page pagination on search string and filter changes
  useEffect(() => {
    setDisplayCount(15);

    // Auto-select the top item of the new filtered list to ensure a card is always open (Path B)
    if (filteredKitchens.length > 0) {
      setSelectedKitchenId(filteredKitchens[0].id);
      setPinnedKitchenId(null);
    } else {
      setSelectedKitchenId(null);
      setPinnedKitchenId(null);
    }

    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, activeFilter]);

  // Reset payment inline states when user switches selecting target spots
  useEffect(() => {
    setMealsCount(5);
    setCustomMeals('');
    setInputDonorName('');
    setMessage('');
    setSponsorSuccessId(null);
    setSponsoringKitchenId(null);
  }, [selectedKitchenId]);

  // Handle body scrolling lock when slideout drawer is active
  useEffect(() => {
    if (isLedgerDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLedgerDrawerOpen]);

  // Request browser live GPS
  const requestLiveGPS = () => {
    setIsLoadingGPS(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setIsLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingGPS(false);
      },
      (error) => {
        setGpsError('Could not retrieve coordinates. Using default Aluva center.');
        setIsLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Checkout and sponsor simulation mechanics
  const handleSponsorClick = (kitchenId: string, mealCostUnit: number) => {
    const count = mealsCount === 0 ? parseInt(customMeals) || 0 : mealsCount;
    if (count <= 0) return;

    setSponsoringKitchenId(kitchenId);

    setTimeout(() => {
      onSponsorMeals(
        kitchenId,
        count,
        inputDonorName.trim() || activeDonorName,
        message.trim() || undefined
      );
      setSponsoringKitchenId(null);
      setSponsorSuccessId(kitchenId);

      // Add success notification
      const targetKitchen = kitchens.find(k => k.id === kitchenId);
      const kitchenName = targetKitchen ? targetKitchen.name : 'Partner Kitchen';
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          type: 'success',
          title: 'Pre-Funding Successful! 🎉',
          message: `Successfully sponsored ${count} warm meals at ${kitchenName}. Your transaction has been logged.`,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev
      ]);

      // Clean form fields for future payments
      setInputDonorName('');
      setMessage('');
      setCustomMeals('');
    }, 1800);
  };

  // Prepay / Sponsor meals for multiple kitchens in a smart bundle allocation
  const handleSmartBundleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(customBundleCount) || bundleSize;
    if (count <= 0) return;

    setBundleSponsoring(true);
    setBundleSuccess(false);

    // Identify target kitchens sorted by highest need (ascending order of existing sponsored count)
    const needyTargets = [...kitchensWithDistance]
      .sort((a, b) => a.sponsoredCount - b.sponsoredCount)
      .slice(0, 5); // Distribute among top 5 needy kitchens

    if (needyTargets.length === 0) {
      setBundleSponsoring(false);
      return;
    }

    // Allocate meals evenly
    const baseShare = Math.floor(count / needyTargets.length);
    const remainder = count % needyTargets.length;
    
    // Simulate step-by-step progress for visual feedback
    for (let i = 0; i < needyTargets.length; i++) {
      const target = needyTargets[i];
      const mealsToAllocate = baseShare + (i < remainder ? 1 : 0);
      
      if (mealsToAllocate <= 0) continue;
      
      setBundleStep(`Sending ${mealsToAllocate} meals to ${target.name}...`);
      
      // Short visual pause
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Execute global callback for each target
      onSponsorMeals(
        target.id,
        mealsToAllocate,
        inputDonorName.trim() || activeDonorName,
        message.trim() || "Distributed via Direct-Aid Smart Allocation Bundle"
      );
    }

    setBundleStep("Completing smart allocation package...");
    await new Promise((resolve) => setTimeout(resolve, 600));

    setBundleStep(null);
    setBundleSponsoring(false);
    setBundleSuccess(true);
    setCustomBundleCount('');
    setInputDonorName('');
    setMessage('');

    // Add smart allocation notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        type: 'success',
        title: 'Smart Bundle Dispatched! 🚀',
        message: `Distributed ${count} meals evenly across the top 5 lowest-stock kitchens in the sector.`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev
    ]);
  };

  // Compute overall ledger metrics
  const totalSponsorshipsCount = useMemo(() => {
    return donations.reduce((sum, d) => sum + d.mealsCount, 0);
  }, [donations]);

  const totalSponsorshipsAmount = useMemo(() => {
    return donations.reduce((sum, d) => sum + d.amount, 0);
  }, [donations]);

  // Calculate sorted latest donations for visual historical timeline inside Drawer
  const sortedPastDonations = useMemo(() => {
    return [...donations]
      .filter(d => d.donorName === activeDonorName)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [donations, activeDonorName]);

  const renderContributionHistory = () => (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 animate-none">
            <History className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-850">Donation Highlights</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Recent sponsorships and actions</p>
          </div>
        </div>
        <span className="font-mono text-[9px] bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-2.5 py-1">
          {sortedPastDonations.length} total actions
        </span>
      </div>

      <div className="divide-y divide-slate-100 select-text leading-relaxed text-xs">
        {sortedPastDonations.length === 0 ? (
          <div className="text-center py-12 select-none text-slate-400 font-sans">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-755">No sponsorships completed yet</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto font-light leading-normal">
              Sponsor any individual partner eatery from the grid list or the Smart Allocator to see live certified receipts.
            </p>
          </div>
        ) : (
          <>
          {sortedPastDonations.slice(0, historyDisplayCount).map((d, idx) => (
            <div key={d.id} className={`py-4 flex flex-col sm:flex-row gap-4 items-start justify-between ${idx === 0 ? 'pt-0' : ''}`}>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                  <h4 className="font-extrabold text-slate-800 text-[12.5px] leading-none">{d.kitchenName}</h4>
                  <span className="font-mono text-[9px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                    {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-light">
                  Deposited <strong className="font-semibold text-emerald-800">{d.mealsCount} active meals</strong>. Direct check sum <span className="font-mono">₹{d.amount}</span> cleared.
                </p>

                {d.message && (
                  <div className="p-2 border border-emerald-100/60 bg-emerald-50/15 text-emerald-950 rounded-xl text-[10.5px] italic font-medium">
                    "{d.message}"
                  </div>
                )}
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0 w-full sm:w-auto select-none">
                <span className="text-[11px] font-mono font-black text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl block text-center">
                  ₹{d.amount} funded
                </span>
                <span className="text-[8px] font-mono text-emerald-700 font-extrabold tracking-wider bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md block text-center uppercase">
                  ✓ INSTANT CLEARING
                </span>
              </div>
            </div>
          ))}
          {sortedPastDonations.length > historyDisplayCount && (
            <div className="pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryDisplayCount(prev => prev + 10)}
                className="bg-slate-50 hover:bg-slate-100 text-[10.5px] font-bold text-slate-600 border border-slate-200/80 rounded-xl py-2 w-full text-center cursor-pointer block"
              >
                Show More History (+{Math.min(sortedPastDonations.length - historyDisplayCount, 10)} remaining)
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );

  // Render Layout
  return (
    <div className={`min-h-screen bg-slate-50/60 pb-28 md:pb-16 font-sans ${isStandalone ? 'pt-24' : 'pt-4'}`}>
      
      {/* 1. DONOR/PATRON CUSTOM TOP NAV BAR & CONTROLS CONTAINER */}
      <div className={
        isStandalone
          ? "fixed top-0 inset-x-0 w-full z-[8000] bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-center shadow-xs"
          : "max-w-7xl mx-auto px-4 md:px-6 mb-6"
      }>
        <div className={isStandalone ? "w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4" : "bg-white border border-slate-200/80 px-4 py-3.5 rounded-3xl shadow-sm flex items-center justify-between gap-4 w-full"}>
          {/* Left branding segment */}
          <div className="flex items-center gap-2 md:gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="bg-slate-50 hover:bg-slate-100 font-sans text-slate-705 hover:text-slate-900 px-3 py-2 rounded-2xl text-[11px] font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Malayalam Letter Vowel 'ദ' Avatar representing Daanam (Giving / Patron) */}
            <div className="relative shrink-0 select-none">
              <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
              <div className="relative w-9 h-9 rounded-full bg-emerald-700 ring-2 ring-emerald-50 border border-white flex items-center justify-center text-white font-bold shadow-md">
                <span className="text-xs font-serif font-black" title="ദ - Daanam (Donation)">ദ</span>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8px] font-mono font-black uppercase tracking-widest border border-emerald-100 rounded-full px-2 py-0.5">
                patron console
              </span>
              <h2 className="text-xs font-bold tracking-tight text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                {activeDonorName}
              </h2>
            </div>
          </div>

          {/* Right active stats segment */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden lg:inline-block bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
              100% direct • zero fees
            </span>

            {/* NEW PATRON NOTIFICATION HUB BUTTON */}
            <button
              onClick={() => {
                setIsLedgerDrawerOpen(true);
              }}
              id="donor-notifications-toggle-btn"
              className={`relative p-2.5 md:px-4 md:py-2.5 rounded-full md:rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                notifications.some(n => !n.read)
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-850 shadow-md ring-2 ring-emerald-100'
                  : 'bg-white hover:bg-slate-50 text-slate-707 border-slate-300 shadow-xs'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'text-white fill-white' : 'text-slate-400'}`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 rounded-full border border-white flex items-center justify-center text-[8px] font-black font-sans text-white animate-bounce-slow">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Notifications</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-75 hidden md:block ${isLedgerDrawerOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ==================== LEFT SIDE PANE (Donor Profile & Core Stats) ==================== */}
        <div className={`w-full lg:w-[320px] xl:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-24 ${mobileNavTab === 'profile' ? 'block' : 'hidden md:block'}`}>

          {/* Profile Card & Badge */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <span className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/5 rounded-full" />
            <div className="flex items-center gap-3.5 relative">
              <div className="relative shrink-0 select-none">
                <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                  <Heart className="w-5.5 h-5.5 fill-white text-emerald-100" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8.5px] font-mono font-black uppercase tracking-widest border border-emerald-100/60 rounded-lg px-2 py-0.5">
                  patron active
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-800 font-mono truncate mt-1">
                  {activeDonorName}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Direct Aid Pioneer ID: #ALV-77</p>
                
                {/* Interactive Edit Profile Button */}
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium font-mono uppercase tracking-wider text-[8px]">Reputation level</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-[9px]">
                  <Award className="w-3 h-3 text-emerald-600" /> Atithi Hero
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Funding counters) & Tax Invoice Generation */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-[0.03] text-emerald-950 pointer-events-none select-none">
              <FileText className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-2 select-none mb-1.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                Donation Highlights
              </p>
            </div>

            {/* Quick Metrics split inside single card */}
            <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-slate-100">
              <div className="select-none">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Funded Meals</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                  <span className="text-sm font-black font-mono text-slate-800">{totalSponsorshipsCount} meals</span>
                </div>
              </div>

              <div className="select-none">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block font-mono">Direct Backed</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
                  <span className="text-sm font-black font-mono text-slate-800">₹{totalSponsorshipsAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Settings Options Menu */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs select-none">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                 <Heart className="w-3.5 h-3.5 text-emerald-600" /> Account Settings
               </h4>
             </div>
             <div className="divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800">Identity & Contact</h5>
                      <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">Manage your public patron profile</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPaymentTax(true)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800">Payment & Tax Methods</h5>
                      <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">Secure payment linkage and PAN details</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                      <History className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800">Sponsorship History</h5>
                      <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">Explore your-full contribution ledger</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
             </div>
          </div>

        </div>

        {/* ==================== RIGHT CONTENT PANE (Fully scrollable interactive layers) ==================== */}
        <div className={`flex-1 w-full space-y-8 min-w-0 ${mobileNavTab !== 'profile' ? 'block' : 'hidden md:block'}`}>
          
          {/* ECOSYSTEM COLUMN LAYOUT (Widescreen 2-column, Mobile tabbed) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* COLUMN A: QUICK ACTIONS & ALERTS (Left column on desktop, quick actions tab on mobile) */}
            <div className={`space-y-6 ${mobileNavTab === 'quick_actions' ? 'block' : 'hidden lg:block'}`}>
              
              {/* STACKED CARD 1: DIRECT-AID SMART BUNDLE ALLOCATOR */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-1 select-none">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                  <Sparkle className="w-5 h-5 animate-spin-slow text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-805 leading-tight text-slate-800">Direct-Aid Smart Bundle</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automated deficit balance mitigation</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-550 leading-relaxed font-light select-none text-slate-500">
                No preference? Our direct algorithm automatically loops and allocates your chosen meals count evenly to the <span className="font-semibold text-emerald-800">top 5 kitchens running lowest on active food stock</span> right now.
              </p>

              {/* Success, processing, or form status logic */}
              {bundleSuccess ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center select-none space-y-2">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-650">
                    <Check className="w-5 h-5 stroke-[3.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-950">Allocation Bundle Complete!</h4>
                  <p className="text-[10px] text-emerald-800 leading-normal font-light">
                    Your allocation has finished processing. Check the Direct Session logs in the next card blocks below to view receipts.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBundleSuccess(false)}
                    className="mt-2 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900 px-3.5 py-1.5 rounded-lg hover:bg-slate-850"
                  >
                    Load New Bundle System
                  </button>
                </div>
              ) : bundleSponsoring ? (
                <div className="p-5 border border-dashed border-slate-200 rounded-2xl text-center space-y-3.5 select-none animate-pulse">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin mx-auto" />
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 font-sans">Executing sequential thread checks...</h5>
                    <div className="text-[9px] font-mono text-emerald-800 mt-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 max-w-full truncate inline-block">
                      {bundleStep || 'Scanning global ledger pools...'}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSmartBundleSubmit} className="space-y-4">
                  <div>
                    <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black mb-2 select-none">Standard Allocation Pool (meals)</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[25, 50, 100, 250].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => {
                            setBundleSize(num);
                            setCustomBundleCount('');
                          }}
                          className={`py-2 px-1 rounded-xl border transition-all text-center cursor-pointer font-mono text-xs ${
                            bundleSize === num && !customBundleCount
                              ? 'border-emerald-600 bg-emerald-50/40 font-black text-emerald-950'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                          }`}
                        >
                          <span className="block font-sans font-bold text-[10px]">{num} Meals</span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">₹{num * 40}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-1 border border-slate-250/70 bg-white p-1 rounded-xl">
                      <span className="text-[9px] text-slate-400 pl-1.5">Custom volume loop:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          placeholder="e.g. 150"
                          value={customBundleCount}
                          min="1"
                          onChange={(e) => setCustomBundleCount(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center font-mono font-bold text-xs w-16 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                        <span className="text-[8.5px] font-mono text-slate-404 uppercase pr-1.5">meals</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Allocation Info Summary panel */}
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-2xl select-none text-[9.5px] text-emerald-800 leading-normal space-y-1">
                    <p className="font-extrabold text-emerald-950 flex items-center gap-1 font-mono uppercase text-[8px] tracking-wider mb-1">
                      smart distribution forecast
                    </p>
                    <p>• Allocates <span className="font-bold underline">{Math.floor((parseInt(customBundleCount) || bundleSize) / 5)} meals</span> directly to top 5 lowest-stock locations.</p>
                    <p>• Simulated net cost: <span className="font-bold font-mono">₹{(parseInt(customBundleCount) || bundleSize) * 40}</span> at direct cost rates (₹40/meal).</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] p-3 rounded-xl transition-all shadow-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Sparkle className="w-4 h-4 shrink-0 animate-spin-slow" />
                    <span>SPONSOR SMART BUNDLE (₹{(parseInt(customBundleCount) || bundleSize) * 40})</span>
                  </button>
                </form>
              )}
            </div>

            {/* COLUMN B: CRITICAL URGENCY RADAR */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-1 select-none">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
                  <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-950 leading-tight text-slate-800 font-sans">Critical Urgency Radar</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-mono">Real-time depletion alerts</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed font-light select-none">
                The radar shows partner kitchens whose food reserves are under <span className="font-semibold text-rose-700 bg-rose-50 px-1 py-0.5 rounded-sm">10 pieces</span>. Intervene immediately to restore standard food security.
              </p>

              {/* Urgency List */}
              <div className="space-y-2.5 pr-1 font-sans text-left">
                {kitchensWithDistance.filter(k => k.sponsoredCount < 10).length === 0 ? (
                  <div className="border border-dashed border-slate-200 p-6 rounded-2xl text-center select-none text-slate-400">
                    <Check className="w-8 h-8 text-emerald-600 bg-emerald-50 rounded-full p-2 mx-auto mb-2" />
                    <h5 className="text-[11px] font-bold text-slate-800">Ecosystem Stock Safe!</h5>
                    <p className="text-[9.5px] text-slate-450 leading-relaxed mt-0.5">
                      Excellent, all our kitchen spots have 10+ available meals prepaid. No critical deficiencies detected.
                    </p>
                  </div>
                ) : (
                  <>
                  {kitchensWithDistance
                    .filter(k => k.sponsoredCount < 10)
                    .sort((a,b) => a.sponsoredCount - b.sponsoredCount)
                    .slice(0, urgencyDisplayCount)
                    .map((k) => {
                      const count = k.sponsoredCount;
                      const isCritSelection = count <= 2;
                      return (
                        <div
                          key={k.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCritSelection 
                              ? 'border-red-100 bg-red-50/20 hover:border-red-200' 
                              : 'border-slate-100 bg-slate-50/40 hover:border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <h5 className="text-xs font-bold text-slate-800 truncate leading-snug">{k.name}</h5>
                            
                            <div className="flex items-center gap-2 select-none">
                              <span className="text-[8px] font-mono text-slate-405 block tracking-wide font-medium">Stock levels:</span>
                              <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isCritSelection ? 'bg-red-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${Math.max(10, (count / 10) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md ${
                              isCritSelection ? 'bg-red-50 text-red-700 font-black animate-pulse' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {count} plates
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                // Switch mobile view tab to 'explore' to unveil the partner grid
                                setMobileNavTab('explore');
                                // Force set the selected kitchen id to expand its details
                                setSelectedKitchenId(k.id);
                                // Scroll smoothly to the target card
                                setTimeout(() => {
                                  const ele = document.getElementById(`donor-eatery-card-${k.id}`);
                                  if (ele) {
                                    ele.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 200);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[8px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-3xs cursor-pointer transition-all active:scale-95"
                            >
                              Fund Spot
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {kitchensWithDistance.filter(k => k.sponsoredCount < 10).length > urgencyDisplayCount && (
                      <div className="pt-2 pb-4 shrink-0">
                        <button
                          onClick={() => setUrgencyDisplayCount(prev => prev + 5)}
                          className="bg-slate-50 hover:bg-slate-100 text-[10.5px] font-bold text-slate-600 border border-slate-200/80 rounded-xl py-2 w-full text-center cursor-pointer block"
                        >
                          Show More Eateries (+{Math.min(kitchensWithDistance.filter(k => k.sponsoredCount < 10).length - urgencyDisplayCount, 5)} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div> {/* Close Critical Urgency Radar Card */}

          </div> {/* Close COLUMN A wrapper */}

          {/* COLUMN B: LOCAL PARTNER DIRECTORY (Right column on desktop, explore tab on mobile) */}
          <div className={`space-y-4 ${mobileNavTab === 'explore' ? 'block' : 'hidden lg:block'}`}>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/50 select-none">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Local Partner Directory
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5 font-sans font-medium">Select a spot to prepay individual meals</p>
              </div>

              {/* Proximity live coordinates */}
              <button
                type="button"
                onClick={requestLiveGPS}
                disabled={isLoadingGPS}
                className="text-[10px] text-emerald-700 font-extrabold hover:text-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-xl self-start sm:self-auto transition-all"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLoadingGPS ? 'animate-spin' : ''}`} />
                <span>{isLoadingGPS ? 'Locating...' : 'Sync GPS Proximity'}</span>
              </button>
            </div>

            {/* Search Container & Category Filter Pills */}
            <div className="space-y-4">
              {/* Live search string */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter kitchen name, cuisine specialties, specific address landmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-md"
                  >
                    Clear Match
                  </button>
                )}
              </div>

              {/* Scrollable Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  All Spots
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('needy')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'needy'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-100 hover:text-amber-700'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${activeFilter === 'needy' ? 'text-white' : 'text-amber-500'}`} />
                  Most Needy First
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('popular')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'popular'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className={`w-3.5 h-3.5 ${activeFilter === 'popular' ? 'text-white' : 'text-emerald-600'}`} />
                  Popular Volume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('nearby')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'nearby'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-500 border border-slate-200/60 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${activeFilter === 'nearby' ? 'text-white' : 'text-emerald-600'}`} />
                  Within 5km
                </button>
              </div>
            </div>

            {/* Grid display layout: stacked single column on desktop & mobile, nice dual column on full-width tablet */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4 items-start font-sans">
              {displayedKitchens.length === 0 ? (
                <div className="bg-white border border-slate-200/60 p-8 rounded-3xl text-center text-slate-450 col-span-full">
                  <Users className="w-10 h-10 text-slate-350 mx-auto mb-2 stroke-[1.2]" />
                  <p className="text-xs font-semibold">No kitchen partners found matching the active search filters.</p>
                  <button
                    onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}
                    className="mt-3 text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors tracking-wider px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Reset Directory Filters
                  </button>
                </div>
              ) : (
                displayedKitchens.map((k) => {
                  const isSelected = selectedKitchenId === k.id;
                  const unitCostPrice = k.mealPrice || 40;
                  const activeVolume = mealsCount === 0 ? parseInt(customMeals) || 0 : mealsCount;
                  const totalSumDue = activeVolume * unitCostPrice;

                  return (
                    <div
                      key={k.id}
                      id={`donor-eatery-card-${k.id}`}
                      onClick={() => {
                        setSelectedKitchenId(selectedKitchenId === k.id ? null : k.id);
                        setPinnedKitchenId(null);
                      }}
                      className={`font-sans rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-white ring-2 ring-emerald-50 shadow-md'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="p-4 space-y-3">
                        {/* Header metadata row */}
                        <div className="flex items-center justify-between gap-1 text-[10.5px] select-none">
                          <span className="font-mono font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {k.distanceKm.toFixed(2)} km
                          </span>

                          {/* Stocks thermostatic warning indicator */}
                          {(() => {
                            const count = k.sponsoredCount;
                            if (count === 0) {
                              return (
                                <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 font-mono">
                                  0 meals available
                                </span>
                              );
                            } else if (count < 10) {
                              return (
                                <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono animate-pulse">
                                  {count} meals left (low stock!)
                                </span>
                              );
                            } else {
                              return (
                                <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/60 font-mono">
                                  {count} meals ready
                                </span>
                              );
                            }
                          })()}
                        </div>

                        {/* Title and Specialties */}
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-snug line-clamp-1">{k.name}</h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-tight">{k.address}</p>
                          <p className="text-[10px] text-slate-600 font-bold font-mono tracking-wide mt-2">{k.cuisine} • ₹{k.mealPrice}/meal</p>
                        </div>

                        {/* Malayalam message banner overlay if expanded */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-slate-100 pt-3 flex flex-col gap-3.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="h-20 w-full rounded-2xl overflow-hidden relative select-none">
                                <img
                                  src={k.image}
                                  alt={k.name}
                                  className="w-full h-full object-cover opacity-90"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2.5">
                                  <p className="text-[10.5px] text-white font-serif leading-tight font-light">{k.mealDescription}</p>
                                </div>
                              </div>

                              <div className="text-[10px] text-slate-500 space-y-1">
                                <p className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-50 select-all">
                                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Phone: {k.phone}</span>
                                </p>
                                <p className="text-[9px] text-slate-400 pl-5 select-none">{k.claimedCount} meals served completely free of cost to local guests at this kitchen.</p>
                              </div>

                              {/* Form simulator */}
                              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-3 relative overflow-hidden">
                                
                                {sponsorSuccessId === k.id ? (
                                  <div className="py-4 flex flex-col items-center justify-center text-center select-none">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2 text-emerald-600 shadow-3xs border border-emerald-200">
                                      <Check className="w-5 h-5 stroke-[3]" />
                                    </div>
                                    <h4 className="text-[11px] font-bold text-slate-850 tracking-tight">Direct Deposit Complete!</h4>
                                    <p className="text-[9.5px] text-emerald-800 mt-1 max-w-[210px] mx-auto leading-normal">
                                      Meals registered successfully onto the register. Seekers can request them instantly.
                                    </p>
                                  </div>
                                ) : sponsoringKitchenId === k.id ? (
                                  <div className="py-6 flex flex-col items-center justify-center text-center select-none animate-pulse">
                                    <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-2" />
                                    <h4 className="text-[10px] font-bold text-slate-700 font-mono uppercase tracking-wider">syncing upi check...</h4>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black mb-1.5">Contribution quantum</span>
                                      <div className="grid grid-cols-4 gap-1">
                                        {[1, 5, 10, 20].map((num) => (
                                          <button
                                            type="button"
                                            key={num}
                                            onClick={() => {
                                              setMealsCount(num);
                                              setCustomMeals('');
                                            }}
                                            className={`py-1.5 px-0.5 rounded-xl border transition-all text-center cursor-pointer text-[10px] font-mono ${
                                              mealsCount === num
                                                ? 'border-emerald-600 bg-emerald-50/45 font-black text-emerald-950'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                          >
                                            <span className="block font-sans font-bold text-[10px]">{num} Meal</span>
                                            <span className="text-[8px] text-slate-400 mt-0.5 block">₹{num * unitCostPrice}</span>
                                          </button>
                                        ))}
                                      </div>

                                      {/* Custom numeric quantity */}
                                      <div className="mt-1.5 flex items-center justify-between gap-1 border border-slate-200 bg-white p-1 rounded-xl">
                                        <span className="text-[9px] text-slate-450 pl-1">Or custom sum:</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <input
                                            type="number"
                                            placeholder="50"
                                            value={customMeals}
                                            min="1"
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                              setMealsCount(0);
                                              setCustomMeals(e.target.value);
                                            }}
                                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-center font-mono font-bold text-xs w-16 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                                          />
                                          <span className="text-[8.5px] font-mono text-slate-450 uppercase pr-1">meals</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Blessing metadata */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <span className="block text-[7.5px] font-mono text-slate-400 uppercase tracking-widest font-black mb-0.5">Signature</span>
                                        <input
                                          type="text"
                                          placeholder={activeDonorName}
                                          value={inputDonorName}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => setInputDonorName(e.target.value)}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9.5px] text-slate-800 focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <span className="block text-[7.5px] font-mono text-slate-405 uppercase tracking-widest font-black mb-0.5">Blessing</span>
                                        <input
                                          type="text"
                                          placeholder="Direct food support."
                                          value={message}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => setMessage(e.target.value)}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9.5px] text-slate-800 focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    {/* Action Trigger */}
                                    <button
                                      type="button"
                                      disabled={activeVolume <= 0}
                                      onClick={() => handleSponsorClick(k.id, unitCostPrice)}
                                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10.5px] font-mono p-2.5 rounded-xl shadow-xs transition-all tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                    >
                                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                                      <span>PREPAY {activeVolume === 1 ? '1 MEAL' : `${activeVolume} MEALS`} (₹{totalSumDue})</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Footer interaction bar */}
                      <div className="bg-slate-50 border-t border-slate-100/60 px-4 py-2 flex items-center justify-between text-[9px] select-none tracking-wide text-slate-400">
                        <span className="font-semibold uppercase font-mono">{k.rating} ★ Rating</span>
                        {!isSelected && (
                          <span className="text-emerald-700 hover:text-emerald-950 flex items-center gap-1 font-black uppercase font-mono">
                            Prepay
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Load more pager */}
            {filteredKitchens.length > displayCount && !searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setDisplayCount((prev) => prev + 15);
                }}
                className="w-full py-3 text-[11px] font-black uppercase text-center text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors shadow-3xs tracking-wider"
              >
                Show More Partner Locations
              </button>
            )}
          </div>

        </div>

      </div>

      </div>

      {/* 2. PATRON NOTIFICATION & IMPACT HUB OVERLAY / SLIDEOUT DRAWER */}
      <AnimatePresence>
        {isLedgerDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLedgerDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900 z-[9990] cursor-pointer"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
                          className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Bell className="w-5 h-5 fill-emerald-100" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-950">Notifications</h3>
                    <p className="text-[11px] font-mono text-slate-400">real-time activity logs</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLedgerDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* NOTIFICATIONS HUB FEED */}
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between text-xs pb-1 select-none text-slate-400">
                  <span className="font-mono text-[9px] font-black uppercase tracking-wider">Live System Logs</span>
                  {notifications.some(n => !n.read) && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-emerald-700 hover:text-emerald-900 text-[10px] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Bell className="w-8 h-8 text-slate-350 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold">No alerts or notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      // Accents depending on type
                      const isUnread = !item.read;
                      let bgClass = 'bg-slate-50 border-slate-200';
                      let iconEl = <Bell className="w-4 h-4 text-slate-500" />;
                      let tagLabel = 'info';
                      let tagClass = 'bg-slate-100 text-slate-707 border-slate-200';

                      if (item.type === 'urgency') {
                        bgClass = isUnread ? 'bg-red-50/70 border-red-200/80' : 'bg-white border-slate-200/80';
                        iconEl = <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />;
                        tagLabel = 'deficit alert';
                        tagClass = 'bg-red-50 text-red-700 border-red-100';
                      } else if (item.type === 'success') {
                        bgClass = isUnread ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200/80';
                        iconEl = <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />;
                        tagLabel = 'receipt';
                        tagClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      } else if (item.type === 'claim') {
                        bgClass = isUnread ? 'bg-teal-50/55 border-teal-200' : 'bg-white border-slate-200/80';
                        iconEl = <Heart className="w-4 h-4 text-teal-600 fill-teal-100" />;
                        tagLabel = 'live claim';
                        tagClass = 'bg-teal-50 text-teal-850 border-teal-100';
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            // Read single alert
                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                          }}
                          className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden text-xs space-y-2 select-text ${bgClass} ${
                            isUnread ? 'shadow-xs ring-1 ring-emerald-500/10' : ''
                          }`}
                        >
                          {/* Unread circle badge */}
                          {isUnread && (
                            <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-emerald-600" />
                          )}

                          <div className="flex items-center gap-2">
                            <div className="shrink-0">{iconEl}</div>
                            <div className="flex items-center gap-1.5 min-w-0 pr-4">
                              <h4 className="font-extrabold text-slate-800 truncate select-all">{item.title}</h4>
                              <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${tagClass}`}>
                                {tagLabel}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed font-light">{item.message}</p>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100/60 font-medium">
                            <span>Atithi Live Network</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2.5 EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditingProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              id="edit-profile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9995]"
            />

            {/* Modal Content */}
            <motion.div
              id="edit-profile-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[9996] flex flex-col overflow-hidden max-h-[90vh] border border-slate-100"
            >
              {/* Header */}
              <div id="edit-profile-modal-header" className="flex items-center justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Heart className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-950 font-sans">Edit Partner Profile</h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Secure Local Patron Credentials</p>
                  </div>
                </div>
                <button
                  id="edit-profile-close-btn"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form 
                id="edit-profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveDonorName(tempName);
                  setActiveDonorEmail(tempEmail);
                  setActiveDonorPhone(tempPhone);
                  setIsEditingProfile(false);
                  
                  // Also add a little virtual notice inside the alerts
                  setNotifications(prev => [
                    {
                      id: `notif-profile-${Date.now()}`,
                      type: 'success',
                      title: 'Profile Updated! 💚',
                      message: `Your patron configuration was locally customized to ${tempName || 'Anonymous Partner'}.`,
                      timestamp: new Date().toISOString(),
                      read: false,
                    },
                    ...prev
                  ]);
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-1">
                  <label htmlFor="edit-profile-name-input" className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-450">
                    Public Patron Name
                  </label>
                  <input
                    id="edit-profile-name-input"
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="E.g. Rahul G. Nair"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                  <p className="text-[8.5px] text-slate-400 leading-normal">
                    This name will appear on public registers and sponsored meal certifications.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-profile-email-input" className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-450">
                    Primary Email
                  </label>
                  <input
                    id="edit-profile-email-input"
                    type="email"
                    required
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="patron@example.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="edit-profile-phone-input" className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-405">
                    Contact Phone
                  </label>
                  <input
                    id="edit-profile-phone-input"
                    type="text"
                    required
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    id="edit-profile-cancel-btn"
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="edit-profile-save-btn"
                    type="submit"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2.6 PAYMENT & TAX METHODS MODAL */}
      <AnimatePresence>
        {isEditingPaymentTax && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingPaymentTax(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9995]"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[9996] flex flex-col overflow-hidden max-h-[90vh] border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <ShieldCheck className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-950 font-sans">Payment & Tax Methods</h3>
                    <p className="text-[10px] font-mono text-slate-404 uppercase tracking-wider">Configure payment linkage & PAN</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPaymentTax(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-450 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setDonorPan(tempPan);
                  setDonorAddress(tempAddress);
                  setNotifications(prev => [
                    {
                      id: `notif-tax-${Date.now()}`,
                      type: 'success',
                      title: 'Payment & Tax Profile Updated! 🪙',
                      message: `Your billing address and PAN info (${tempPan || 'N/A'}) were locally saved.`,
                      timestamp: new Date().toISOString(),
                      read: false,
                    },
                    ...prev
                  ]);
                  setIsEditingPaymentTax(false);
                }}
                className="p-6 space-y-4 overflow-y-auto font-sans text-left"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-400">
                    PAN (Permanent Account Number)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={tempPan}
                    onChange={(e) => setTempPan(e.target.value.toUpperCase())}
                    placeholder="Enter 10-Digit PAN (e.g. ABCDE1234F)"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                  {tempPan && tempPan.length < 10 && (
                    <p className="text-[8.5px] text-amber-600 font-semibold font-sans">10-Digit PAN required for Indian tax declarations</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-black uppercase tracking-widest block text-slate-400">
                    Billing / Legal Address
                  </label>
                  <textarea
                    rows={2}
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    placeholder="Enter full legal address for tax exemption receipts"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                {/* Simulated Payment Linkage block */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 select-none">
                  <h4 className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Linked Payment Instruments
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl text-xs">
                      <div className="flex items-center gap-2 font-sans">
                        <div className="p-1 bg-slate-50 border border-slate-201 rounded text-slate-600 text-[10px] font-mono font-bold leading-none">
                          UPI
                        </div>
                        <span className="font-semibold text-slate-705 font-mono tracking-tight text-[11px]">{tempUPI}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newUpi = prompt("Enter new default UPI ID (e.g. name@okhdfc):", tempUPI);
                          if (newUpi) setTempUPI(newUpi);
                        }}
                        className="text-[9.5px] text-emerald-700 hover:text-emerald-800 font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl text-xs">
                      <div className="flex items-center gap-2 font-sans">
                        <div className="p-1 bg-slate-50 border border-slate-201 rounded text-slate-600 text-[10px] font-mono font-bold leading-none">
                          CARD
                        </div>
                        <span className="font-semibold text-slate-705 font-mono tracking-tight text-[11px]">{tempCard}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCard = prompt("Enter card suffix (e.g. •••• •••• •••• 1234):", tempCard);
                          if (newCard) setTempCard(newCard);
                        }}
                        className="text-[9.5px] text-emerald-700 hover:text-emerald-800 font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingPaymentTax(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Methods</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2.7 CONTRIBUTION LEDGER / HISTORY SIDE DRAWER */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900 z-[9990] cursor-pointer"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200 font-sans text-left"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <History className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-950">Sponsorship History</h3>
                    <p className="text-[11px] font-mono text-slate-400">your complete contribution ledger</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action area: Dynamic Tax invoice downloads */}
              {sortedPastDonations.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl flex items-center justify-between gap-3 select-none">
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-bold text-slate-800">Section 80G Tax Invoice</h5>
                    <p className="text-[9.5px] text-slate-400 leading-none font-medium">Generate dynamic certificate for this session</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHistoryDrawerOpen(false);
                      setSelectedReceiptForTax(null);
                      setShowConsolidatedTaxReceipt(true);
                      setReceiptDownloaded(false);
                    }}
                    className="flex shrink-0 items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9.5px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all shadow-3xs cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Get 80G Receipts</span>
                  </button>
                </div>
              )}

              {/* Ledger list scroll space */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {renderContributionHistory()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. TAX RECEIPT & 80G EXEMPTION MODAL */}
      <AnimatePresence>
        {(showConsolidatedTaxReceipt || selectedReceiptForTax) && (
          (() => {
            const isConsolidated = showConsolidatedTaxReceipt;
            const amount = isConsolidated ? totalSponsorshipsAmount : (selectedReceiptForTax?.amount || 0);
            const meals = isConsolidated ? totalSponsorshipsCount : (selectedReceiptForTax?.mealsCount || 0);
            const dateStr = isConsolidated ? new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : (selectedReceiptForTax ? new Date(selectedReceiptForTax.timestamp).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : '');
            const sourceName = isConsolidated ? 'Consolidated Session Sponsorships' : (selectedReceiptForTax?.kitchenName || 'Partner Kitchen Alliance');
            const receiptId = isConsolidated ? 'SESS-' + Date.now().toString().slice(-6) : (selectedReceiptForTax?.id.slice(-6) || 'N/A').toUpperCase();
            const serialNo = `AT-80G-2026-${receiptId}`;

            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowConsolidatedTaxReceipt(false);
                    setSelectedReceiptForTax(null);
                  }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-55 flex items-center justify-center p-4"
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl shadow-2xl z-56 flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-slate-100"
                >
                  {/* Left Column: Form Info */}
                  <div className="w-full md:w-5/12 p-6 bg-slate-50 border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-5">
                      <div className="flex justify-between items-center md:block space-y-1">
                        <div>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black font-mono px-2 py-0.5 rounded-md border border-emerald-200 tracking-wider uppercase">
                            80G Exempt Program
                          </span>
                          <h3 className="text-lg font-black text-slate-800 mt-2 tracking-tight">Tax Receipt</h3>
                        </div>
                        <button
                          onClick={() => {
                            setShowConsolidatedTaxReceipt(false);
                            setSelectedReceiptForTax(null);
                          }}
                          className="md:hidden p-1.5 rounded-full hover:bg-slate-200 text-slate-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                        Atithi is partnering with certified direct-aid kitchen networks. Provide your legal credentials to dynamically generate a compliant Indian Section 80G tax clearance receipt.
                      </p>

                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Legal Name (For Certificate)</label>
                          <input
                            type="text"
                            value={customLegalName}
                            onChange={(e) => setCustomLegalName(e.target.value)}
                            placeholder="Full Name as per PAN Card"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-550 font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex justify-between">
                            <span>PAN Number</span>
                            {donorPan && donorPan.length < 10 && <span className="text-[9px] text-amber-600 font-sans font-semibold normal-case">10-Digit PAN Required</span>}
                          </label>
                          <input
                            type="text"
                            value={donorPan}
                            onChange={(e) => setDonorPan(e.target.value.toUpperCase().slice(0, 10))}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-550 uppercase font-bold tracking-wider"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Mailing Address</label>
                          <textarea
                            value={donorAddress}
                            onChange={(e) => setDonorAddress(e.target.value)}
                            placeholder="Complete residential or corporate address"
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-550 font-light resize-none leading-normal"
                          />
                        </div>
                      </div>

                      {/* Exemption details note */}
                      <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-3 text-[10px] text-emerald-950 font-light space-y-1 select-none">
                        <div className="flex gap-1.5 items-center font-bold text-emerald-800 mb-0.5">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>50% Deduction Clearance</span>
                        </div>
                        Atithi Direct-Aid digital transfers bypass intermediary administration overheads. 100% of your sponsor fund was successfully deposited directly onto client registers.
                      </div>
                    </div>

                    <div className="hidden md:block select-none mt-6">
                      <div className="text-[9px] text-slate-400 font-mono">
                        Secured Identity Seal • Atithi Global Core Network ID: 6468-Atithi
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Physical Paper Exemption Certificate */}
                  <div className="w-full md:w-7/12 p-6 flex flex-col justify-between overflow-y-auto bg-slate-100 max-h-[50vh] md:max-h-none">
                    <div className="flex justify-between items-center select-none mb-3">
                      <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">Official Certificate Preview</h4>
                      <button
                        onClick={() => {
                          setShowConsolidatedTaxReceipt(false);
                          setSelectedReceiptForTax(null);
                        }}
                        className="hidden md:block p-1 bg-white hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exemption Certificate Paper */}
                    <div 
                      id="printed-80g-certificate"
                      className="bg-[#FCFBF8] border-4 border-double border-emerald-700/60 rounded-xl p-5 shadow-md flex-1 text-slate-800 space-y-3 relative overflow-hidden font-serif select-text cursor-default"
                    >
                      {/* Watermark Logo symbol */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600/3 text-[220px] font-black pointer-events-none select-none font-sans">
                        ദ
                      </div>

                      <div className="flex justify-between items-start border-b border-slate-200 pb-2.5 relative select-none">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="h-4 w-4 bg-emerald-700 text-white rounded-md flex items-center justify-center font-sans font-black text-[10px]">ദ</span>
                            <span className="font-sans font-bold text-[10px] tracking-widest text-emerald-900">ATITHI FOUNDATION</span>
                          </div>
                          <p className="font-sans text-[8px] text-slate-400 mt-0.5 tracking-wide">Joint Direct-Aid Kitchen Trust Division</p>
                        </div>
                        <div className="text-right font-sans">
                          <span className="block bg-emerald-800 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">SEC 80G COMPLIANT</span>
                          <span className="block text-[7px] text-slate-400 mt-1 font-mono">{serialNo}</span>
                        </div>
                      </div>

                      <div className="text-center py-1 space-y-1 select-none">
                        <h4 className="text-[12px] font-black font-sans tracking-wide uppercase text-emerald-950">CERTIFICATE OF DONATION</h4>
                        <p className="text-[8px] font-sans text-slate-450 tracking-normal italic">Issued under Section 80G(5)(vi) of the Income Tax Act, 1961</p>
                      </div>

                      <div className="text-[10px] md:text-[10.5px] leading-relaxed font-light space-y-2 text-justify select-text">
                        <p>
                          This is to acknowledge with deep gratitude the donation of a sum of{' '}
                          <span className="font-bold border-b border-dashed border-slate-300 pb-0.5 px-0.5 font-sans">₹{amount.toLocaleString()}</span>{' '}
                          (<span className="font-bold italic text-[9.5px]">{convertNumberToWords(amount)}</span>) from{' '}
                          <span className="font-extrabold border-b border-dashed border-slate-300 pb-0.5 px-1 font-sans text-emerald-950">
                            {customLegalName || 'Anonymous Sponsor'}
                          </span>.
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1.5 font-sans text-[9px] text-slate-550 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider">Donor Permanent Account No (PAN)</span>
                            <span className="font-bold text-slate-800 font-mono tracking-wider">{donorPan || 'PENDING VALID PAN'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider">Date of contribution</span>
                            <span className="font-bold text-slate-800 font-mono">{dateStr}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider">Billing/mailing details</span>
                            <span className="font-medium text-slate-800 leading-tight block truncate uppercase select-all">{donorAddress || 'PENDING RESIDENTIAL ADDRESS'}</span>
                          </div>
                          <div>
                            <span className="text-slate-440 block text-[8px] uppercase tracking-wider">Target Kitchen Channel</span>
                            <span className="font-bold text-slate-800 truncate block">{sourceName}</span>
                          </div>
                          <div>
                            <span className="text-slate-440 block text-[8px] uppercase tracking-wider">Equivalent volume</span>
                            <span className="font-bold text-slate-800 font-mono text-emerald-800">{meals} SPREAD MEALS DISPATCHED</span>
                          </div>
                        </div>

                        <p className="text-[7.5px] font-sans leading-normal text-slate-400 pt-1 select-none text-left">
                          * Note: Certified digital receipt validates 100% immediate delivery rate. Exemptions are verified directly by IT systems upon matching of PAN and Atithi Social Welfare filings. All contributions are subject to Indian income tax rules.
                        </p>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-slate-100 select-none">
                        <div>
                          <div className="bg-emerald-50/75 border border-emerald-100 rounded p-1 text-[7px] text-emerald-800 font-sans max-w-[170px] leading-tight">
                            <span className="font-black block uppercase tracking-wider">Cryptographic Signature Seal</span>
                            <span className="font-mono text-[6px] block truncate select-all">sha256:7bc52df85e{receiptId.toLowerCase()}</span>
                          </div>
                        </div>
                        <div className="text-center font-sans tracking-wide">
                          <div className="font-serif text-emerald-850 font-bold text-sm tracking-widest italic select-none">
                            K. Ramachandran
                          </div>
                          <span className="text-[7px] block font-extrabold uppercase text-slate-400 mt-0.5 tracking-wider border-t border-slate-150 pt-0.5 font-sans">Finance Trustee, Atithi</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action bar */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleDownloadReceipt(amount, dateStr, serialNo)}
                        disabled={!donorPan || donorPan.length < 10}
                        className={`flex-1 font-sans text-[11px] font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          (!donorPan || donorPan.length < 10) 
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{receiptDownloaded ? 'Downloaded (.txt Receipt)' : 'Download Exemption Slip'}</span>
                      </button>

                      <button
                        onClick={() => {
                          window.print();
                        }}
                        disabled={!donorPan || donorPan.length < 10}
                        className={`px-4 py-2.5 font-sans text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                          (!donorPan || donorPan.length < 10)
                            ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-transparent'
                            : 'border-slate-300 hover:bg-white text-slate-700 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 bg-slate-50'
                        }`}
                        title="Print this receipt directly from browser"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>

                    {receiptDownloaded && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="text-[9px] text-center font-sans font-bold text-emerald-700 mt-2"
                      >
                        ✓ Exemption Slip downloaded successfully! Verify with your filing officer.
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </>
            );
          })()
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[9000] md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          <button 
            type="button"
            onClick={() => setMobileNavTab('quick_actions')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full ${mobileNavTab === 'quick_actions' ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">actions</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200" />
          
          <button 
            type="button"
            onClick={() => setMobileNavTab('explore')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full ${mobileNavTab === 'explore' ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">eateries</span>
          </button>

          <div className="w-px h-8 bg-slate-200" />
          
          <button 
            type="button"
            onClick={() => setMobileNavTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full ${mobileNavTab === 'profile' ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}

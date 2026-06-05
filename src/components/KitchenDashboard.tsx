import { CheckCircle2, History, KeyRound, QrCode, Ticket, User, XCircle, Building, Bell, ChevronDown, ChevronRight, Award, ShieldCheck, FileText, Pencil, ArrowLeft, MoreVertical, Settings as SettingsIcon, X, Check, Camera, Heart, Calendar, Zap, RefreshCw, AlertCircle, Sparkles, Gift } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Kitchen, MealClaim, Donation } from '../types';
import { SwipeButton } from './SwipeButton';
import { VoucherQRScanner } from './VoucherQRScanner';

// Local Date helper functions
const getLocalDateString = (dateObj: Date): string => {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
};

const isSameDay = (itemDateStringOrNum: string | number | Date, filterDateStr: string): boolean => {
  try {
    const itemDate = new Date(itemDateStringOrNum);
    return getLocalDateString(itemDate) === filterDateStr;
  } catch (err) {
    return false;
  }
};

interface KitchenDashboardProps {
  kitchens: Kitchen[];
  claims: MealClaim[];
  donations: Donation[];
  onRedeemCode: (code: string, kitchenId: string) => boolean | string;
  onLogWalkIn: (kitchenId: string) => boolean;
  initialKitchenId?: string | null;
  onBackToHome?: () => void;
  activeKitchenName?: string;
  isStandalone?: boolean;
}

export default function KitchenDashboard({
  kitchens,
  claims,
  donations,
  onRedeemCode,
  onLogWalkIn,
  initialKitchenId = null,
  onBackToHome,
  activeKitchenName,
  isStandalone = false,
}: KitchenDashboardProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState<string>(initialKitchenId || kitchens[0]?.id || '');
  const [inputCode, setInputCode] = useState<string>('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; msg: string } | null>(null);
  const [mobileNavTab, setMobileNavTab] = useState<'terminal' | 'meals' | 'donations' | 'profile'>('terminal');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  // Terminal Tab Option B: Segmented Control (Digital Voucher vs. Walk-In Service)
  const [activeTerminalTab, setActiveTerminalTab] = useState<'voucher' | 'walkin'>('voucher');

  // Inline camera states & scheduler
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(10);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'scanning' | 'error' | 'permission_denied'>('idle');
  const inlineScannerRef = React.useRef<Html5Qrcode | null>(null);

  // Calendar filtering states (Default view are set to 'today')
  const [claimsDateFilterMode, setClaimsDateFilterMode] = useState<'all' | 'today' | 'custom'>('today');
  const [claimsCustomFilterDate, setClaimsCustomFilterDate] = useState<string>(getLocalDateString(new Date()));
  const [isClaimsCalendarOpen, setIsClaimsCalendarOpen] = useState<boolean>(false);

  const [donationsDateFilterMode, setDonationsDateFilterMode] = useState<'all' | 'today' | 'custom'>('today');
  const [donationsCustomFilterDate, setDonationsCustomFilterDate] = useState<string>(getLocalDateString(new Date()));
  const [isDonationsCalendarOpen, setIsDonationsCalendarOpen] = useState<boolean>(false);

  // Kitchen Settings Overlay States
  const [activeSettingsTab, setActiveSettingsTab] = useState<'identity' | 'security' | 'profile' | null>(null);
  
  // Kitchen Identity Edit Fields (Temporary states for form interaction)
  const [tempKitchenName, setTempKitchenName] = useState('');
  const [tempKitchenAddress, setTempKitchenAddress] = useState('');
  const [tempKitchenPhone, setTempKitchenPhone] = useState('');
  const [tempKitchenMealDesc, setTempKitchenMealDesc] = useState('');
  const [tempKitchenBankAcc, setTempKitchenBankAcc] = useState('MRCH-IN-SBI-009230582');
  const [tempKitchenIfsc, setTempKitchenIfsc] = useState('SBIN0008542');
  const [payoutMethod, setPayoutMethod] = useState<'instant' | 'weekly'>('instant');

  // Security Access Edit Fields
  const [tempPin, setTempPin] = useState('4920');
  const [passkeyRequired, setPasskeyRequired] = useState(true);
  const [scanAutoVerify, setScanAutoVerify] = useState(false);

  // Reports Generation States
  const [reportType, setReportType] = useState<'gst' | 'muster' | 'daily'>('daily');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  // Local active kitchen modifications state
  const [kitchenOverrides, setKitchenOverrides] = useState<Record<string, { name: string; address: string; phone: string; mealDescription: string }>>({});

  const openSettingsTab = (tab: 'identity' | 'security' | 'profile') => {
    setActiveSettingsTab(tab);
    const rawKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];
    const override = kitchenOverrides[rawKitchen?.id || ''];
    setTempKitchenName(override?.name ?? rawKitchen?.name ?? '');
    setTempKitchenAddress(override?.address ?? rawKitchen?.address ?? '');
    setTempKitchenPhone(override?.phone ?? rawKitchen?.phone ?? '');
    setTempKitchenMealDesc(override?.mealDescription ?? rawKitchen?.mealDescription ?? '');
    setReportSuccessMessage(null);
  };

  React.useEffect(() => {
    if (initialKitchenId) {
      setSelectedKitchenId(initialKitchenId);
    }
  }, [initialKitchenId]);

  React.useEffect(() => {
    if (isNotificationsOpen || activeSettingsTab) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNotificationsOpen, activeSettingsTab]);

  const rawActiveKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];
  const activeKitchenOverride = kitchenOverrides[rawActiveKitchen?.id || ''];
  const activeKitchen = rawActiveKitchen ? {
    ...rawActiveKitchen,
    name: activeKitchenOverride?.name ?? rawActiveKitchen.name,
    address: activeKitchenOverride?.address ?? rawActiveKitchen.address,
    phone: activeKitchenOverride?.phone ?? rawActiveKitchen.phone,
    mealDescription: activeKitchenOverride?.mealDescription ?? rawActiveKitchen.mealDescription,
  } : rawActiveKitchen;

  // Codes claimed specifically at this kitchen
  const kitchenClaims = claims.filter(c => c.kitchenId.trim().toLowerCase() === selectedKitchenId.trim().toLowerCase());

  // Donations received specifically at this kitchen
  const kitchenDonations = donations.filter(d => d.kitchenId.trim().toLowerCase() === selectedKitchenId.trim().toLowerCase());

  // Claims filtered by selected date
  const filteredClaims = React.useMemo(() => {
    if (claimsDateFilterMode === 'all') {
      return kitchenClaims;
    } else if (claimsDateFilterMode === 'today') {
      const todayStr = getLocalDateString(new Date());
      return kitchenClaims.filter(c => isSameDay(c.claimedAt || c.timestamp, todayStr));
    } else {
      return kitchenClaims.filter(c => isSameDay(c.claimedAt || c.timestamp, claimsCustomFilterDate));
    }
  }, [kitchenClaims, claimsDateFilterMode, claimsCustomFilterDate]);

  // Donations filtered by selected date
  const filteredDonations = React.useMemo(() => {
    if (donationsDateFilterMode === 'all') {
      return kitchenDonations;
    } else if (donationsDateFilterMode === 'today') {
      const todayStr = getLocalDateString(new Date());
      return kitchenDonations.filter(d => isSameDay(d.timestamp, todayStr));
    } else {
      return kitchenDonations.filter(d => isSameDay(d.timestamp, donationsCustomFilterDate));
    }
  }, [kitchenDonations, donationsDateFilterMode, donationsCustomFilterDate]);

  const notifications = React.useMemo(() => {
    const list = [
      {
        id: 'note-milestone',
        type: 'milestone',
        title: 'Outstanding Service!',
        desc: `Congratulations! ${activeKitchen?.name || 'Your kitchen'} has served over ${activeKitchen?.claimedCount ? activeKitchen.claimedCount + 120 : 150} meals with high dignity.`,
        time: 'Just now',
        unread: !readNotificationIds.includes('note-milestone'),
        icon: <Award className="w-4 h-4 text-amber-500" />
      },
      {
        id: 'note-donation-1',
        type: 'donation',
        title: 'New Sponsorship Received',
        desc: `Community donors sponsored 10 fresh Sadhyas for your slot. Prepaid pool updated to ${activeKitchen?.sponsoredCount || 0} meals.`,
        time: '5 mins ago',
        unread: !readNotificationIds.includes('note-donation-1'),
        icon: <Ticket className="w-4 h-4 text-emerald-500" />
      },
      {
        id: 'note-donation-2',
        type: 'donation',
        title: 'BENEFACTOR SUPPORT',
        desc: 'An anonymous donor added +5 standard plates to support seekers during rush hours.',
        time: '2 hours ago',
        unread: !readNotificationIds.includes('note-donation-2'),
        icon: <Ticket className="w-4 h-4 text-teal-500" />
      }
    ];

    // Add recent dynamic claims to notifications
    kitchenClaims.slice(-3).forEach((claim, idx) => {
      list.unshift({
        id: `claim-${claim.id}-${idx}`,
        type: 'claim',
        title: claim.isWalkIn ? 'Walk-In Guest Serviced' : 'Voucher Claim Verified',
        desc: claim.isWalkIn 
          ? `Logged 1 walk-in guest directly under your kitchen counter.` 
          : `Code ${claim.code} verified. Served hot meal to seeker.`,
        time: claim.claimedAt 
          ? new Date(claim.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recently',
        unread: !readNotificationIds.includes(`claim-${claim.id}-${idx}`),
        icon: <CheckCircle2 className="w-4 h-4 text-sky-500" />
      });
    });

    return list;
  }, [selectedKitchenId, activeKitchen, kitchenClaims, readNotificationIds]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setReadNotificationIds(notifications.map(n => n.id));
  };

  const handleNotificationClick = (id: string) => {
    if (!readNotificationIds.includes(id)) {
      setReadNotificationIds([...readNotificationIds, id]);
    }
  };

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

  const handleQRScanSuccess = (code: string) => {
    const codeToVerify = code.trim().toUpperCase();
    setInputCode(codeToVerify);
    setFeedback(null);

    const result = onRedeemCode(codeToVerify, selectedKitchenId);

    if (result === true) {
      setFeedback({
        status: 'success',
        msg: `QR Code '${codeToVerify}' scanned & verified successfully! Place one fresh Sadhya on the plantain leaf immediately.`,
      });
      setInputCode('');
    } else {
      setFeedback({
        status: 'error',
        msg: typeof result === 'string' ? result : 'Scan Error: Code invalid or assigned to a different kitchen.',
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleWakeUpCamera = () => {
    setCountdown(10);
    setIsCameraActive(true);
  };

  const startInlineCamera = async () => {
    setCameraState('starting');
    setTimeout(async () => {
      try {
        if (inlineScannerRef.current) {
          try {
            if (inlineScannerRef.current.isScanning) {
              await inlineScannerRef.current.stop();
            }
          } catch (_) {}
          inlineScannerRef.current = null;
        }

        const container = document.getElementById("inline-sadhya-qr-reader");
        if (!container) {
          return;
        }

        const scanner = new Html5Qrcode("inline-sadhya-qr-reader");
        inlineScannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            handleQRScanSuccess(decodedText);
            setCountdown(10);
          },
          () => {}
        );
        setCameraState('scanning');
      } catch (err: any) {
        console.warn("Inline camera start issue:", err);
        setCameraState('permission_denied');
      }
    }, 150);
  };

  const stopInlineCamera = async () => {
    if (inlineScannerRef.current) {
      try {
        if (inlineScannerRef.current.isScanning) {
          await inlineScannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Stop inline camera issue:", e);
      } finally {
        inlineScannerRef.current = null;
      }
    }
  };

  React.useEffect(() => {
    if (isCameraActive && activeTerminalTab === 'voucher') {
      startInlineCamera();
    } else {
      stopInlineCamera();
      setCameraState('idle');
    }
    return () => {
      stopInlineCamera();
    };
  }, [isCameraActive, selectedKitchenId, activeTerminalTab]);

  React.useEffect(() => {
    let intervalId: any;
    if (isCameraActive && activeTerminalTab === 'voucher' && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCameraActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCameraActive, countdown, activeTerminalTab]);

  React.useEffect(() => {
    setFeedback(null);
  }, [activeTerminalTab]);

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
    <div className={`min-h-screen bg-slate-50/50 pb-28 md:pb-8 font-sans ${isStandalone ? 'pt-24' : 'pt-4'}`}>
      {/* ==================== 1. CUSTOM TOP NAV BAR & CONTROLS CONTAINER ==================== */}
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

            {/* Malayalam Letter Consonant 'ക' Avatar representing Kada/Kitchen */}
            <div className="relative shrink-0 select-none">
              <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
              <div className="relative w-9 h-9 rounded-full bg-emerald-700 ring-2 ring-emerald-50 border border-white flex items-center justify-center text-white font-bold shadow-md">
                <span className="text-xs font-serif font-black" title="ക - Kada (Kitchen)">ക</span>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8px] font-mono font-black uppercase tracking-widest border border-emerald-100 rounded-full px-2 py-0.5 animate-pulse">
                kitchen terminal
              </span>
              <h2 className="text-xs font-bold tracking-tight text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                {activeKitchenName || activeKitchen.name}
              </h2>
            </div>
          </div>

          {/* Right active stats segment */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden lg:inline-block bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
              merchant gateway • real-time
            </span>

            {/* KITCHEN NOTIFICATIONS BELL BUTTON (Slide-out design like Donor Dashboard) */}
            <button
              onClick={() => {
                setIsNotificationsOpen(true);
              }}
              id="kitchen-notifications-btn"
              className={`relative p-2.5 md:px-4 md:py-2.5 rounded-full md:rounded-2xl text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                unreadCount > 0
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-850 shadow-md ring-2 ring-emerald-100'
                  : 'bg-white hover:bg-slate-50 text-slate-707 border-slate-300 shadow-xs'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-white fill-white' : 'text-slate-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 rounded-full border border-white flex items-center justify-center text-[8px] font-black font-sans text-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-sans">Notifications</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-75 hidden md:block ${isNotificationsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ==================== LEFT SIDE PANE (Kitchen Identity & Stats) ==================== */}
        <div className={`w-full lg:w-[320px] xl:w-[350px] shrink-0 space-y-6 lg:sticky lg:top-24 ${mobileNavTab === 'profile' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Identity Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-3.5 relative">
              <div className="relative shrink-0 select-none">
                <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                  <Building className="w-5.5 h-5.5 text-emerald-100" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8.5px] font-mono font-black uppercase tracking-widest border border-emerald-100/60 rounded-lg px-2 py-0.5 animate-pulse">
                  Terminal Online
                </span>
                <h2 className="text-sm font-bold tracking-tight text-slate-800 font-mono truncate mt-1">
                  {activeKitchenName || activeKitchen.name}
                </h2>
                <div className="mt-1 bg-slate-100 border border-slate-200 py-1 px-2.5 rounded-lg text-left inline-block">
                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider">ID: </span>
                  <span className="text-[10px] font-mono font-bold text-slate-800">{selectedKitchenId.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Combined Card - Option A */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 border border-emerald-555 rounded-3xl p-5 text-white relative overflow-hidden group shadow-md select-none">
            <div className="absolute -right-6 -bottom-6 opacity-[0.08] group-hover:scale-105 transition-transform duration-500">
              <Ticket className="w-32 h-32 rotate-12 text-white" />
            </div>

            {/* Top segment: Prepaid Pool */}
            <div className="pb-4">
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-150/80 block">Active Prepaid Pool</span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-black font-mono leading-none tracking-tight">{activeKitchen.sponsoredCount}</span>
                <span className="text-[10px] font-bold text-emerald-100/90 font-mono tracking-wider uppercase">Meals Remaining</span>
              </div>
              <p className="text-[10px] text-emerald-100/80 mt-2 font-medium leading-relaxed font-sans">
                Available to be served immediately to verified seekers or walk-ins.
              </p>
            </div>

            {/* Elegant thin divider */}
            <div className="border-t border-emerald-500/40 my-1" />

            {/* Bottom segment: Lifetime Impact */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-150/80 block">Lifetime Impact</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-black font-mono leading-none">{activeKitchen.claimedCount}</span>
                  <span className="text-[9px] font-bold text-emerald-100/90 uppercase font-mono ml-1">Served</span>
                </div>
              </div>

              <div className="flex-1 max-w-[120px] space-y-1 text-right">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-200 block">Performance Rate</span>
                <div className="w-full bg-emerald-950/40 h-1.5 rounded-full overflow-hidden border border-emerald-500/10">
                  <div className="bg-emerald-300 h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Account & Settings Menu */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs select-none">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5" /> Account Settings
              </h4>
            </div>
            <div className="divide-y divide-slate-100 font-sans">
              {[
                { id: 'identity', title: 'Identity & Payouts', icon: <Building />, desc: 'Manage banking and location details' },
                { id: 'security', title: 'Security & Access', icon: <ShieldCheck />, desc: 'Voucher PIN and device management' },
                { id: 'profile', title: 'Kitchen Profile', icon: <Heart />, desc: 'Manage dine coordinates and sadhya composition' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => openSettingsTab(item.id as 'identity' | 'security' | 'profile')}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800">{item.title}</h5>
                      <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* ==================== RIGHT CONTENT PANE (Operations Hub) ==================== */}
        <div className={`flex-grow w-full min-w-0 ${mobileNavTab !== 'profile' ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* COLUMN 1: Voucher Redemption Terminal & Received Donations */}
            <div className={`${(mobileNavTab === 'terminal' || mobileNavTab === 'donations') ? 'block' : 'hidden lg:block'} space-y-6`}>
                     {/* Sadhya Service & Counter Terminal */}
              <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col min-h-[460px] ${mobileNavTab === 'terminal' ? 'block' : 'hidden lg:block'}`}>
                <div className="flex flex-col gap-4 mb-6 select-none pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-100">
                      <Zap className="w-5 h-5 text-emerald-600 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 leading-tight">Sadhya Counter Terminal</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Support digital codes or offline walk-ins</p>
                    </div>
                  </div>

                  {/* Segmented Control Selector placed under the title */}
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-400 w-full sm:max-w-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('voucher')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeTerminalTab === 'voucher'
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                          : 'text-slate-500 hover:text-slate-700 font-bold'
                      }`}
                    >
                      <QrCode className={`w-3.5 h-3.5 ${activeTerminalTab === 'voucher' ? 'text-emerald-600' : ''}`} />
                      <span>Digital Voucher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTerminalTab('walkin')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeTerminalTab === 'walkin'
                          ? 'bg-white text-amber-800 shadow-sm border border-slate-200/60'
                          : 'text-slate-500 hover:text-slate-700 font-bold'
                      }`}
                    >
                      <User className={`w-3.5 h-3.5 ${activeTerminalTab === 'walkin' ? 'text-amber-600' : ''}`} />
                      <span>Walk-In Service</span>
                    </button>
                  </div>
                </div>

                {/* Tab Contents Frame */}
                <div className="flex-1 flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {activeTerminalTab === 'voucher' ? (
                      <motion.div
                        key="voucher-panel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-5"
                      >
                        {/* Prominent Embedded Camera View */}
                        <div className="relative w-full aspect-video sm:h-48 bg-slate-950 rounded-2xl overflow-hidden border border-slate-850 shadow-inner flex flex-col items-center justify-center shrink-0 group">
                          {isCameraActive ? (
                            <div className="absolute inset-0 w-full h-full">
                              {/* Simulated scan highlights */}
                              <div className="absolute top-4 left-4 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl z-12 pointer-events-none" />
                              <div className="absolute top-4 right-4 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr z-12 pointer-events-none" />
                              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl z-12 pointer-events-none" />
                              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br z-12 pointer-events-none" />

                              {cameraState === 'scanning' && (
                                <div className="absolute inset-x-8 h-0.5 bg-emerald-400/80 shadow shadow-emerald-400/80 animate-bounce top-1/3 z-10 pointer-events-none" />
                              )}

                              <div
                                id="inline-sadhya-qr-reader"
                                className={`w-full h-full object-cover transition-opacity duration-300 ${
                                  cameraState === 'scanning' ? 'opacity-100' : 'opacity-0 absolute scale-0 pointer-events-none'
                                }`}
                              />

                              {cameraState === 'starting' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/80 text-slate-350 text-center select-none z-10 font-sans">
                                  <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin mb-2" />
                                  <p className="text-[9.5px] uppercase font-bold tracking-wider font-mono">Camera initializing...</p>
                                </div>
                              )}

                              {cameraState === 'permission_denied' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-350 text-center select-none z-10 font-sans">
                                  <div className="p-2 bg-red-500/10 text-red-400 rounded-xl mb-1.5 border border-red-500/10">
                                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                                  </div>
                                  <h4 className="text-[9.5px] font-black text-rose-450 uppercase tracking-wider mb-0.5">Sandbox restriction</h4>
                                  <p className="text-[8.5px] text-slate-400 leading-normal max-w-[210px]">
                                    Preview camera access blocked by browser environment. Use the click-simulator at the bottom.
                                  </p>
                                </div>
                              )}

                              {/* Countdown Badge overlay */}
                              <div className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur-xs text-[8px] font-mono font-black uppercase text-emerald-400 tracking-widest px-2 py-1 rounded-md border border-slate-850 flex items-center gap-1 z-22 select-none">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                                Expires in {countdown}s
                              </div>
                            </div>
                          ) : (
                            /* Covered Sleep Mode Overlay */
                            <button
                              type="button"
                              onClick={handleWakeUpCamera}
                              className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-150 cursor-pointer hover:bg-slate-900/95 font-sans focus:outline-none focus:ring-0"
                            >
                              <div className="p-3 bg-slate-900 border border-slate-800 text-emerald-400 rounded-2xl group-hover:scale-105 transition-all">
                                <QrCode className="w-6 h-6 text-emerald-400 animate-pulse" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-slate-200 tracking-wide">Tap to Scan QR Code</p>
                                <p className="text-[9px] text-slate-500 font-medium tracking-wide mt-1">Camera asleep • Tap anywhere to activate</p>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Separator with "or" in the middle */}
                        <div className="relative my-4 select-none">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 font-semibold text-slate-400 tracking-widest text-[9.5px] font-mono">or</span>
                          </div>
                        </div>

                        {/* Verification Code Submission */}
                        <form onSubmit={handleRedeemSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                              Enter Digital Voucher Code
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="relative flex-1">
                                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  maxLength={12}
                                  placeholder="e.g. CH-293810"
                                  value={inputCode}
                                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-11 py-3 text-sm font-bold text-slate-800 font-mono tracking-[0.2em] uppercase focus:outline-none transition-all"
                                />
                              </div>
                              
                              <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-100 flex items-center justify-center gap-2 shrink-0 select-none"
                              >
                                <span>Verify</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Developer / Evaluation Companion Quick Simulator */}
                        {claims.filter(c => c.status === 'pending' && !c.isWalkIn).length > 0 && (
                          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl select-none">
                            <span className="text-[8.5px] font-mono font-black uppercase tracking-wider text-slate-400 block mb-1.5">⚡ Instant simulator presets</span>
                            <div className="flex flex-wrap gap-1.5">
                              {claims
                                .filter(c => c.status === 'pending' && !c.isWalkIn)
                                .slice(0, 3)
                                .map((claim) => (
                                  <button
                                    type="button"
                                    key={claim.id}
                                    onClick={() => handleQRScanSuccess(claim.code)}
                                    className="bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 font-mono text-[9px] text-slate-700 hover:text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                  >
                                    Scan {claim.code} ⚡
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="walkin-panel"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-6 py-4 relative"
                      >
                        <div className="absolute right-0 bottom-4 translate-x-4 opacity-[0.03] text-slate-900 pointer-events-none select-none">
                          <User className="w-32 h-32" />
                        </div>

                        <div>
                          <h5 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1.5">Barrier-free Offline Walk-In</h5>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                            Serve a warm plate first, then swipe below to register. One hot meal is deducted securely from the active prepaid pool. 
                          </p>
                          <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-800/90 font-medium font-sans leading-relaxed">
                            💡 **Zero access barriers, full dignity.** Ideal for seekers who do not have a smart device or internet connectivity.
                          </div>
                        </div>

                        <div className="pt-2">
                          <SwipeButton
                            onSwipe={handleWalkInTrigger}
                            disabled={activeKitchen.sponsoredCount <= 0}
                            label="Swipe right to Register Walk-In"
                            disabledLabel="Pool Exhausted (No Prepaid Meals)"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Universal Feedback messages */}
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl flex items-start gap-3 border mt-4 ${
                          feedback.status === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        {feedback.status === 'success' ? (
                          <div className="p-1.5 bg-emerald-100 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-rose-100 rounded-lg shrink-0">
                            <XCircle className="w-4.5 h-4.5 text-rose-700" />
                          </div>
                        )}
                        <div className="text-[11px] font-sans">
                          <span className="font-black uppercase tracking-widest block mb-0.5">
                            {feedback.status === 'success' ? 'Terminal Result: OK' : 'Terminal Result: DENIED'}
                          </span>
                          <p className="leading-relaxed opacity-90">{feedback.msg}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Received Donations Panel */}
              <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col ${mobileNavTab === 'donations' ? 'block' : 'hidden lg:block'}`}>
                <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                      <Heart className="w-4.5 h-4.5 text-rose-600 fill-rose-100" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 leading-tight">Received Donations</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Prepaid food sponsorships received by your counter</p>
                    </div>
                  </div>

                  {/* Interactive Calendar Segment */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDonationsCalendarOpen(!isDonationsCalendarOpen)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold ${
                        donationsDateFilterMode !== 'all'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250 ring-2 ring-emerald-50'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-700 border-slate-200'
                      }`}
                      title="Date Filter ledger calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {donationsDateFilterMode === 'all' && 'All Time'}
                        {donationsDateFilterMode === 'today' && 'Today'}
                        {donationsDateFilterMode === 'custom' && 'Selected Date'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isDonationsCalendarOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 p-3 bg-white border border-slate-200 shadow-xl rounded-2xl z-[8500] w-60 text-left font-sans space-y-2.5"
                        >
                          <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 mb-1 flex items-center justify-between">
                            <span>Filter Received Donations</span>
                            <button 
                              type="button" 
                              onClick={() => setIsDonationsCalendarOpen(false)} 
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDonationsDateFilterMode('all');
                                setIsDonationsCalendarOpen(false);
                              }}
                              className={`px-3 py-1.5 text-left text-[11px] rounded-lg font-bold transition-all ${
                                donationsDateFilterMode === 'all'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              Show All Time
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDonationsDateFilterMode('today');
                                setIsDonationsCalendarOpen(false);
                              }}
                              className={`px-3 py-1.5 text-left text-[11px] rounded-lg font-bold transition-all ${
                                donationsDateFilterMode === 'today'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'hover:bg-slate-100 text-slate-705'
                              }`}
                            >
                              Show Today Only
                            </button>
                          </div>

                          <div className="border-t border-slate-100 pt-2 space-y-1">
                            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black block">Or Select Specific Date</span>
                            <input
                              type="date"
                              value={donationsCustomFilterDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setDonationsCustomFilterDate(e.target.value);
                                  setDonationsDateFilterMode('custom');
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-3.5 pr-1">
                  {filteredDonations.length === 0 ? (
                    <div className="border border-dashed border-slate-200 py-10 rounded-2xl text-center text-slate-400 bg-slate-50/40">
                      <Heart className="w-8 h-8 mx-auto mb-2.5 text-slate-200" />
                      <p className="text-xs font-bold text-slate-600">No sponsorships yet</p>
                      <p className="text-[9px] mt-0.5 font-sans leading-normal max-w-[240px] mx-auto">
                        Spread the word to local donors to seed your prepaid pool!
                      </p>
                    </div>
                  ) : (
                    [...filteredDonations].reverse().map((d) => (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={d.id}
                        className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-extrabold text-slate-800 leading-none">
                              {d.donorName || 'Anonymous Sponsor'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-sans mt-1">
                              {new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                              {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100/60 rounded-xl text-emerald-800 font-bold select-none text-[10px] font-mono leading-none">
                              +{d.mealsCount} {d.mealsCount === 1 ? 'Sadhya' : 'Sadhyas'}
                            </span>
                          </div>
                        </div>
                        {d.message && (
                          <p className="text-[10.5px] text-slate-600 italic bg-white border border-slate-200/60 px-3 py-2 rounded-xl mt-2.5 font-sans leading-relaxed">
                            "{d.message}"
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Claimed Meals */}
            <div className={`${mobileNavTab === 'meals' ? 'block' : 'hidden lg:block'} space-y-6`}>
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-50 rounded-xl text-slate-700 border border-slate-200">
                      <History className="w-4.5 h-4.5 text-slate-650" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 leading-tight">Claimed Meals</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Recent claims ledger at this terminal</p>
                    </div>
                  </div>

                  {/* Interactive Calendar Segment */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsClaimsCalendarOpen(!isClaimsCalendarOpen)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold ${
                        claimsDateFilterMode !== 'all'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250 ring-2 ring-emerald-50'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-700 border-slate-200'
                      }`}
                      title="Date Filter claims calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {claimsDateFilterMode === 'all' && 'All Time'}
                        {claimsDateFilterMode === 'today' && 'Today'}
                        {claimsDateFilterMode === 'custom' && 'Selected Date'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isClaimsCalendarOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 p-3 bg-white border border-slate-200 shadow-xl rounded-2xl z-[8500] w-60 text-left font-sans space-y-2.5"
                        >
                          <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 mb-1 flex items-center justify-between">
                            <span>Filter Claimed Meals</span>
                            <button 
                              type="button" 
                              onClick={() => setIsClaimsCalendarOpen(false)} 
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setClaimsDateFilterMode('all');
                                setIsClaimsCalendarOpen(false);
                              }}
                              className={`px-3 py-1.5 text-left text-[11px] rounded-lg font-bold transition-all ${
                                claimsDateFilterMode === 'all'
                                  ? 'bg-emerald-50 text-emerald-805 text-emerald-800'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              Show All Time
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setClaimsDateFilterMode('today');
                                setIsClaimsCalendarOpen(false);
                              }}
                              className={`px-3 py-1.5 text-left text-[11px] rounded-lg font-bold transition-all ${
                                claimsDateFilterMode === 'today'
                                  ? 'bg-emerald-50 text-emerald-805 text-emerald-800'
                                  : 'hover:bg-slate-100 text-slate-705'
                              }`}
                            >
                              Show Today Only
                            </button>
                          </div>

                          <div className="border-t border-slate-100 pt-2 space-y-1">
                            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-black block">Or Select Specific Date</span>
                            <input
                              type="date"
                              value={claimsCustomFilterDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setClaimsCustomFilterDate(e.target.value);
                                  setClaimsDateFilterMode('custom');
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pr-1 pb-2">
                  {filteredClaims.length === 0 ? (
                    <div className="col-span-full border border-dashed border-slate-200 py-16 rounded-3xl text-center text-slate-400 bg-slate-50/30">
                      <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-xs font-bold text-slate-600">No matching claims recorded</p>
                      <p className="text-[10px] mt-1 font-sans">Claimed vouchers for your filter selection will appear here.</p>
                    </div>
                  ) : (
                    [...filteredClaims].reverse().map((c) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={c.id}
                        className="p-4 border border-slate-200/70 rounded-2xl bg-white hover:border-emerald-250 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="text-xs font-black font-mono text-slate-800 tracking-widest">
                            {c.code}
                          </span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-[9px] font-black uppercase text-emerald-700 font-sans">{c.status}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                             {c.isWalkIn ? (
                               <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                 <User className="w-3.5 h-3.5 text-amber-605 text-amber-600" />
                               </div>
                             ) : (
                               <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                 <User className="w-3.5 h-3.5 text-emerald-605 text-emerald-600" />
                               </div>
                             )}
                             <div className="min-w-0">
                               <p className="text-[10px] font-bold text-slate-800 leading-none truncate font-sans">
                                 {c.isWalkIn ? 'Walk-In Guest' : (c.seekerName || 'Digital Athithi')}
                               </p>
                               <p className="text-[9px] text-slate-400 font-sans mt-0.5">Meal Claimed</p>
                             </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                            {c.claimedAt
                              ? new Date(c.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>        </div>

          </div>
        </div>

      {/* 2. KITCHEN NOTIFICATION & LOG HUB OVERLAY / SLIDEOUT DRAWER */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-slate-900 z-[9990] cursor-pointer"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <Bell className="w-5 h-5 fill-emerald-100 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wide">Kitchen Alerts</h3>
                    <p className="text-[10px] font-mono text-slate-400">real-time counter updates</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* NOTIFICATIONS HUB FEED */}
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex items-center justify-between text-xs pb-1 select-none text-slate-400">
                  <span className="font-mono text-[9px] font-black uppercase tracking-wider">Live Register Stream</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-emerald-700 hover:text-emerald-950 text-[10px] font-extrabold hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0"
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Bell className="w-8 h-8 text-slate-350 mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-semibold">No alerts or notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const isUnread = item.unread;
                      let bgClass = 'bg-white border-slate-200/80 hover:bg-slate-50/50';
                      let tagLabel = item.type;
                      let tagClass = 'bg-slate-100 text-slate-707 border-slate-205';

                      if (item.type === 'milestone') {
                        bgClass = isUnread ? 'bg-amber-50/40 border-amber-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                        tagLabel = 'milestone success';
                        tagClass = 'bg-amber-50 text-amber-800 border-amber-100';
                      } else if (item.type === 'donation') {
                        bgClass = isUnread ? 'bg-emerald-50/40 border-emerald-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                        tagLabel = 'community sponsor';
                        tagClass = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                      } else if (item.type === 'claim') {
                        bgClass = isUnread ? 'bg-sky-50/40 border-sky-200/70' : 'bg-white border-slate-200/80 hover:bg-slate-50';
                        tagLabel = 'active claim';
                        tagClass = 'bg-sky-50 text-sky-850 border-sky-100';
                      }

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item.id)}
                          className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden text-xs select-text cursor-pointer ${bgClass} ${
                            isUnread ? 'shadow-3xs ring-1 ring-emerald-500/10' : ''
                          }`}
                        >
                          {/* Unread dot indicator */}
                          {isUnread && (
                            <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                          )}

                          <div className="flex items-center gap-2 mb-2 select-none">
                            <div className="p-1 rounded-lg bg-slate-50 border border-slate-100">
                              {item.icon}
                            </div>
                            <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${tagClass}`}>
                              {tagLabel}
                            </span>
                            <span className="text-[9px] font-sans font-medium text-slate-400 ml-auto mr-3">
                              {item.time}
                            </span>
                          </div>

                          <h5 className={`text-[11.5px] tracking-tight ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                            {item.title}
                          </h5>
                          
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-100 mt-4 text-center select-none bg-slate-50/30 rounded-2xl p-3">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">
                  Sadhya Registry Terminal Secured
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== SETTINGS OVERLAYS ==================== */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[9993] flex flex-col overflow-hidden max-h-[90vh] border border-slate-100"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-emerald-800 font-mono tracking-wider focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5 select-none animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-emerald-950 font-sans">Payout Settlement Type</span>
                      <span className="text-[7.5px] font-mono font-black uppercase tracking-widest text-emerald-800 border border-emerald-250 bg-white px-2 py-0.5 rounded-md">
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
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all font-sans font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer text-center"
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
                      className="w-full text-center tracking-[1em] bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <p className="text-[8.5px] text-slate-400 leading-normal text-center">
                      Required by staff to clear offline or custom manual walk-in redemptions.
                    </p>
                  </div>

                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs select-none">
                    <span className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-widest block">Counter Safety Rules</span>
                    
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-[10.5px]">Device Passkey Gate</p>
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
                        <p className="font-bold text-slate-800 text-[10.5px]">Auto-Clear Scans</p>
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
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all font-sans font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer text-center"
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
                    setKitchenOverrides(prev => ({
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                    <p className="text-[8.5px] text-slate-400 leading-normal">
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none font-sans"
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
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none font-sans resize-none"
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

      <VoucherQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleQRScanSuccess}
        pendingClaims={claims}
      />

      {/* ==================== BOTTOM NAVIGATION (Mobile Only) ==================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[9000] lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] font-sans">
        <div className="flex justify-around items-center h-16">
          <button
            type="button"
            onClick={() => setMobileNavTab('terminal')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-all ${
              mobileNavTab === 'terminal' ? 'text-emerald-700 bg-emerald-50/50 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Terminal</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 shrink-0" />
          
          <button
            type="button"
            onClick={() => setMobileNavTab('meals')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-all ${
              mobileNavTab === 'meals' ? 'text-emerald-700 bg-emerald-50/50 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Meals</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 shrink-0" />
          
          <button
            type="button"
            onClick={() => setMobileNavTab('donations')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-all ${
              mobileNavTab === 'donations' ? 'text-emerald-700 bg-emerald-50/50 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Donations</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 shrink-0" />
          
          <button
            type="button"
            onClick={() => setMobileNavTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full cursor-pointer transition-all ${
              mobileNavTab === 'profile' ? 'text-emerald-700 bg-emerald-50/50 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

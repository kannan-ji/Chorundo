import { Compass, Info, MapPin, Navigation, Phone, RotateCcw, ShieldCheck, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { calculateDistance } from '../data';
import { Kitchen, MealClaim } from '../types';

interface SeekerDashboardProps {
  kitchens: Kitchen[];
  claims: MealClaim[];
  onCreateClaim: (kitchenId: string) => void;
  onCancelClaim: (claimId: string) => void;
  initialKitchenId?: string | null;
}

export default function SeekerDashboard({
  kitchens,
  claims,
  onCreateClaim,
  onCancelClaim,
  initialKitchenId = null,
}: SeekerDashboardProps) {
  // User's default or simulated GPS
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.1064,
    lng: 76.3534, // Default Aluva/Kochi Metro coordinates
  });
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(initialKitchenId || kitchens[0]?.id || null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'nearby'>('all');

  useEffect(() => {
    if (initialKitchenId) {
      setSelectedKitchenId(initialKitchenId);
    }
  }, [initialKitchenId]);

  const selectedKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];

  // Try to geolocate the user
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
        setGpsError('Could not retrieve details. Using fallback area coordinates.');
        setIsLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Sync available list with location distance
  const kitchensWithDistance = kitchens.map(k => {
    const dist = calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng);
    return { ...k, distanceKm: dist };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  // Filter kitchens
  const filteredKitchens = kitchensWithDistance.filter(k => {
    if (activeFilter === 'available') return k.sponsoredCount > 0;
    if (activeFilter === 'nearby') return k.distanceKm < 50; // arbitrary near criteria
    return true;
  });

  // Calculate coordinates in the Mock Map container box (width: 320, height: 260)
  // We want to map latitude & longitude ranges to SVG coordinate bounds (10% to 90% space)
  const getMapCoordinates = (lat: number, lng: number) => {
    // Find min/max in current dataset to scale map beautifully
    const lats = [userCoords.lat, ...kitchens.map(k => k.lat)];
    const lngs = [userCoords.lng, ...kitchens.map(k => k.lng)];
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    // Output range: x [40, 280], y [40, 220]
    const x = 40 + ((lng - minLng) / lngRange) * 240;
    // Note: higher latitude = higher up on screen (lower Y SVG coordinate)
    const y = 220 - ((lat - minLat) / latRange) * 180;

    return { x, y };
  };

  const userSvgPos = getMapCoordinates(userCoords.lat, userCoords.lng);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* 1. KITCHENS & MAP SELECTOR (Left Column: 7 Units) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Athithi Counter Locator</h2>
              <p className="text-xs text-slate-500">Locating warm meals sponsored by our community</p>
            </div>

             <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'available', 'nearby'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider capitalize cursor-pointer transition-all ${
                    activeFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'available' ? 'With Meals' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
            <div className="text-blue-700 bg-white p-2 rounded-xl shadow-sm">
              <Compass className={`w-5 h-5 ${isLoadingGPS ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-blue-900 flex flex-wrap items-center gap-1.5">
                <span className="text-blue-600 font-bold uppercase tracking-wider">Your Device Location:</span>
                Lat: {userCoords.lat.toFixed(4)}, Lng: {userCoords.lng.toFixed(4)}
              </p>
              <p className="text-[11px] text-blue-800 leading-normal">
                {gpsError ? (
                  <span className="text-red-650 font-medium">{gpsError}</span>
                ) : (
                  'Distances are live. Click the button to sync with your actual smartphone GPS.'
                )}
              </p>
            </div>
            <button
              onClick={requestLiveGPS}
              disabled={isLoadingGPS}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-blue-100"
            >
              {isLoadingGPS ? 'Locating...' : 'Sync Live GPS'}
            </button>
          </div>
        </div>

        {/* Dynamic Map Board */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              live chorundo? radar map
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-150 px-2 py-0.5 rounded-full font-mono">
              Scale 1:1 Georeferenced
            </span>
          </div>

          <div className="relative w-full aspect-video md:aspect-[2.2/1] bg-blue-50/10 border border-blue-100/30 rounded-2xl overflow-hidden shadow-inner">
            {/* SVG Grid & Plantain Leaf Accents back */}
            <svg viewBox="0 0 320 200" className="w-full h-full absolute inset-0 select-none pointer-events-none">
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Plantain leaves drawn in watermarks */}
              <path d="M-20,180 Q80,150 160,210 Q40,240 -20,180" fill="rgba(16,185,129,0.02)" />
              <path d="M350,20 Q240,40 180,-30 Q280,-40 350,20" fill="rgba(16,185,129,0.02)" />

              {/* Draw Route Line if a kitchen is selected */}
              {selectedKitchen && (
                (() => {
                  const kitchenPos = getMapCoordinates(selectedKitchen.lat, selectedKitchen.lng);
                  return (
                    <>
                      {/* Dotted path leading to kitchen */}
                      <motion.path
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        d={`M ${userSvgPos.x} ${userSvgPos.y} Q ${(userSvgPos.x + kitchenPos.x) / 2} ${(userSvgPos.y + kitchenPos.y) / 2 - 20} ${kitchenPos.x} ${kitchenPos.y}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="6,4"
                      />
                      {/* Compass range circle */}
                      <circle
                        cx={userSvgPos.x}
                        cy={userSvgPos.y}
                        r={calculateDistance(userCoords.lat, userCoords.lng, selectedKitchen.lat, selectedKitchen.lng) * 45}
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.15)"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        className="animate-spin"
                        style={{ transformOrigin: `${userSvgPos.x}px ${userSvgPos.y}px`, animationDuration: '30s' }}
                      />
                    </>
                  );
                })()
              )}
            </svg>

            {/* Render User Node marker on top of SVG */}
            <div
              style={{ left: `${(userSvgPos.x / 320) * 100}%`, top: `${(userSvgPos.y / 200) * 100}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-25 group cursor-default"
            >
              <div className="relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500/40 opacity-75 animate-ping" />
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-md">
                  ★
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Your Spot
                </div>
              </div>
            </div>

            {/* Render Kitchen Pins */}
            {filteredKitchens.map((k) => {
              const pos = getMapCoordinates(k.lat, k.lng);
              const isSelected = selectedKitchenId === k.id;
              const hasMeals = k.sponsoredCount > 0;

              return (
                <div
                  key={k.id}
                  style={{ left: `${(pos.x / 320) * 100}%`, top: `${(pos.y / 200) * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setSelectedKitchenId(k.id)}
                    className="relative cursor-pointer group focus:outline-none"
                  >
                    {/* Visual glowing aura for kitchens with high sponsorships */}
                    {hasMeals && (
                      <span className={`absolute -inset-2.5 rounded-full ${isSelected ? 'bg-emerald-300/30' : 'bg-emerald-200/10'} animate-pulse`} />
                    )}

                    {/* Plantain leaf custom Pin */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                        isSelected
                          ? 'bg-emerald-600 border-white scale-110 rotate-12 z-30'
                          : hasMeals
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 hover:border-emerald-700'
                          : 'bg-slate-100 border-slate-300 text-slate-450 opacity-75'
                      }`}
                    >
                      <svg viewBox="0 0 100 100" className={`w-5 h-5 ${isSelected ? 'fill-white stroke-white' : 'fill-emerald-600 stroke-emerald-600'}`}>
                        <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                      </svg>
                    </div>

                    {/* Miniature badge count of meals */}
                    <div
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black ${
                        isSelected
                          ? 'bg-amber-600 border-white text-white'
                          : hasMeals
                          ? 'bg-emerald-500 border-emerald-100 text-white shadow-sm'
                          : 'bg-slate-400 border-slate-100 text-white'
                      }`}
                    >
                      {k.sponsoredCount}
                    </div>

                    {/* Text header label in bubble hover tool */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-[10px] font-bold text-slate-900 px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-40 flex items-center gap-1 pointer-events-none">
                      <span>{k.name}</span>
                      <span className="text-emerald-600 font-black">({k.sponsoredCount} meals)</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kitchen cards table/deck */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredKitchens.map((k) => {
            const isSelected = selectedKitchenId === k.id;
            const hasMeals = k.sponsoredCount > 0;

            return (
              <div
                key={k.id}
                onClick={() => setSelectedKitchenId(k.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      {k.distanceKm.toFixed(2)} km away
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        hasMeals ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700 font-bold'
                      }`}
                    >
                      {hasMeals ? `${k.sponsoredCount} meals sponsored` : '0 meals sponsored'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{k.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{k.address}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2">
                  <span className="text-[11px] text-slate-500 font-semibold">{k.cuisine}</span>
                  <span className="text-[11px] text-amber-500 font-black">★ {k.rating}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SPECIFIC KITCHEN & CLAIM (Right Column: 5 Units) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Selected Kitchen Details block */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="h-28 bg-emerald-800 relative">
            <img
              src={selectedKitchen.image}
              alt={selectedKitchen.name}
              className="w-full h-full object-cover opacity-80 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="bg-emerald-900/60 uppercase tracking-widest font-mono text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                {selectedKitchen.cuisine}
              </span>
              <h2 className="text-lg font-serif font-bold mt-1 tracking-tight leading-tight drop-shadow-xs">
                {selectedKitchen.name}
              </h2>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedKitchen.address}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedKitchen.phone}
                </p>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="text-xs font-bold text-amber-600">★ {selectedKitchen.rating} / 5</span>
                <p className="text-[10px] text-slate-400 mt-1">{selectedKitchen.claimedCount} meals served</p>
              </div>
            </div>

            {/* Meal pool meter */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Meals Sponsored Active:</span>
                <span className="text-lg font-black text-emerald-600">{selectedKitchen.sponsoredCount} Available</span>
              </div>

              {/* Progress bar representing ratio */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (selectedKitchen.sponsoredCount / 30) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                {selectedKitchen.sponsoredCount > 0
                  ? 'Each sponsored meal contains traditional warm Rice (Choru), Curry Sambar, Pickles, and Thoran vegetables served on an eco-friendly plantain leaf.'
                  : '⚠️ Currently, out of sponsored meals. You can notify a donor or sponsor some meals yourself under the Donor tab to reload this kitchen!'}
              </p>
            </div>

            {/* Action buttons */}
            {claims.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex gap-2">
                <Info className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-950">Active Ticket Limit Active</p>
                  <p className="mt-1 leading-normal text-amber-800">
                    You currently hold 1 pending ticket (**{claims[0].code}**). To ensure fair community access, you are limited to holding one active ticket at a time.
                  </p>
                  <p className="mt-2 font-semibold text-amber-950">
                    Please redeem or release your current ticket below to generate another one.
                  </p>
                </div>
              </div>
            ) : selectedKitchen.sponsoredCount > 0 ? (
              <button
                onClick={() => onCreateClaim(selectedKitchen.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-semibold p-4 rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Ticket className="w-4.5 h-4.5" />
                Claim Pre-Paid Meal Code
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex gap-2">
                <Info className="w-5 h-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">Waiting for Sponsors</p>
                  <p className="mt-0.5 leading-normal text-amber-800">
                    Sadhya social projects run on live local pre-payments. Switch roles to the "Donor" view above to pre-pay a meal, or ask a neighboring donor in Aluva/Kochi to load Sadhya Bhavan!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guest without Phone guidelines (CRITICAL EXPLICIT REQUIREMENT 3.2.2) */}
        <div className="bg-emerald-950 text-emerald-50 border-t-4 border-emerald-500 p-5 rounded-3xl shadow-md">
          <div className="flex gap-3">
            {/* Minimal SVG of a green banana leaf emblem directly */}
            <div className="w-12 h-12 shrink-0 bg-white/10 rounded-full flex items-center justify-center p-1.5">
              <svg viewBox="0 0 100 100" className="w-9 h-9 fill-emerald-400">
                <path d="M50 12 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 12 Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                No Phone? No Device?
                <span className="bg-emerald-500 text-emerald-950 font-sans font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Community Banner
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200 leading-relaxed mt-1">
                Our partner kitchens are prominently marked with the **chorundo? Green Plantain Leaf Signboard** on their front doors.
              </p>
              <ul className="list-disc pl-4 mt-2 text-[11px] text-emerald-200 space-y-1">
                <li>Walk directory up to any partner kitchen showing the green banner.</li>
                <li>Simply request a meal at the counter.</li>
                <li>The staff will check their physical pre-paid ledger and serve you immediately — no device or QR code required.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Active claims section */}
        {claims.length > 0 && (
          <div className="bg-white border-2 border-dashed border-emerald-300 p-5 rounded-3xl shadow-sm">
            <h3 className="text-xs font-mono font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Ticket className="w-4 h-4 text-emerald-600" />
              your active athithi voucher
            </h3>

            <div className="space-y-3.5">
              {claims.map(claim => (
                <div key={claim.id} className="bg-emerald-50/40 border border-emerald-100/60 p-4 rounded-2xl relative overflow-hidden">
                  {/* Decorative corner cutouts representing a physical ticket */}
                  <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-white border-r border-emerald-100" />
                  <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-white border-l border-emerald-100" />

                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">{claim.kitchenName}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Voucher generated just now</p>
                    </div>
                    <span className="bg-emerald-600/10 text-emerald-800 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                      ready to claim
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">verification code</p>
                      <p className="text-lg font-black font-mono text-emerald-700 tracking-wider select-all">
                        {claim.code}
                      </p>
                    </div>

                    <button
                      onClick={() => onCancelClaim(claim.id)}
                      className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 active:scale-95 text-[10px] font-bold text-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Release Meal Pool
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Provide this code to the billing staff at the restaurant to receive your dining tray.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

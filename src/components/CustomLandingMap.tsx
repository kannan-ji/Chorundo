import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Compass, Search, Navigation, Info, Unlock, Eye, Sparkles, Smile, RefreshCw, AlertCircle } from 'lucide-react';
import { Kitchen } from '../types';
import { calculateDistance } from '../data';

interface CustomLandingMapProps {
  kitchens: Kitchen[];
  isLocked: boolean; // True to represent blurred overlay above map
  onUnlockHungry: () => void;
  onUnlockSponsor: () => void;
  onKitchenClick: (kitchen: Kitchen) => void;
  userCoords: { lat: number; lng: number };
  setUserCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
}

export default function CustomLandingMap({
  kitchens,
  isLocked,
  onUnlockHungry,
  onUnlockSponsor,
  onKitchenClick,
  userCoords,
  setUserCoords,
}: CustomLandingMapProps) {
  const [zoomLevel, setZoomLevel] = useState(14);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(1.0); // 1 km radius default
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Pre-set Kochi/Kerala coordinate presets for interactive testing
  const presets = [
    { name: 'Aluva Civil Junction (Near Janakeeya Spot)', lat: 10.1075, lng: 76.3542 },
    { name: 'Kochi Vyttila Hub (Near Thanal Eatery)', lat: 9.9725, lng: 76.3160 },
    { name: 'Trivandrum Palayam (Near Sadhya Bhavan)', lat: 8.5065, lng: 76.9538 },
    { name: 'Kozhikode Beach/Railway Rd (Near Malaya green)', lat: 11.2505, lng: 75.7812 },
    { name: 'Generic Kerala Spot (No Meals Nearby)', lat: 10.5276, lng: 76.2144 },
  ];

  // Geolocation trigger
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      setAlertMsg("Your browser does not support geolocation. Please use our Kerala presets below!");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        setAlertMsg(null);
      },
      (error) => {
        setIsLocating(false);
        setAlertMsg("Permission denied/could not resolve GPS. Simulating standard Aluva center.");
        setUserCoords({ lat: 10.1075, lng: 76.3542 }); // Fallback back to Aluva
      },
      { timeout: 7000 }
    );
  };

  // Find nearest kitchens in search radius
  const nearKitchens = kitchens.filter((k) => {
    const dist = calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng);
    return dist <= radiusKm;
  });

  // Automatically update helpful reminders of the 1km radius rule
  useEffect(() => {
    if (!isLocked) {
      if (nearKitchens.length > 0) {
        setAlertMsg(null);
      } else {
        setAlertMsg(`No active meal spots found within ${radiusKm}km of your coordinates. You can select an Aluva/Kochi preset from the dropdown below to instantly simulate nearby spaces!`);
      }
    }
  }, [userCoords, radiusKm, isLocked]);

  // Convert coordinate degrees to interactive SVG map space (2D Georeferenced Projection representation)
  // Centered relative to current userCoords
  const getRelativePosition = (lat: number, lng: number) => {
    // 1 lat degree is roughly 111 km, 1 lng degree is roughly 109 km in Kerala
    // Map bounds represents roughly ~3km width & height at zoom 14
    const scaleFactor = 150000 / (17 - zoomLevel); 
    const dx = (lng - userCoords.lng) * scaleFactor;
    const dy = (userCoords.lat - lat) * scaleFactor;

    // SVG center is at (150, 100)
    return {
      x: 150 + dx,
      y: 100 + dy,
    };
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden min-h-[480px]">
      
      {/* 1. BLURRED OVERLAY RESTING ABOVE THE MAP */}
      {isLocked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 border border-white/10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="bg-white/95 max-w-lg p-8 rounded-3xl shadow-2xl text-center border border-slate-200"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-800 border border-emerald-100 shadow-inner">
              <svg viewBox="0 0 100 100" className="w-8 h-8 fill-emerald-600 stroke-emerald-600 animate-pulse">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
            </div>
            
            <h2 id="hero-question" className="text-2xl md:text-3xl font-serif font-black text-emerald-950 lowercase tracking-tight mb-2">
              are you hungry?
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed font-sans">
              if your leaf is full, sponsor a warm meal for a neighbor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onUnlockHungry}
                className="bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-semibold text-xs py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4.5 h-4.5 text-emerald-100" />
                I am Hungry
              </button>
              <button
                onClick={onUnlockSponsor}
                className="bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-semibold text-xs py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smile className="w-4.5 h-4.5 text-amber-100" />
                Sponsor meal(s)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. LIVE INTERACTIVE CUSTOM GOOGLE MAP IF UNLOCKED */}
      
      {/* Real Maps Look and Feel Banner Controls */}
      <div className="bg-white border-b border-slate-200/60 p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-500 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          </div>
          <span className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider">
            chorundo? Compass Map (customised vector)
          </span>
        </div>

        {/* Action Widgets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Location Preset:</span>
            <select
              value={presets.find(p => Math.abs(p.lat - userCoords.lat) < 0.005)?.name || 'Custom'}
              onChange={(e) => {
                const found = presets.find(p => p.name === e.target.value);
                if (found) {
                  setUserCoords({ lat: found.lat, lng: found.lng });
                  setAlertMsg(null);
                }
              }}
              className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-sans font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {presets.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
              <option value="Custom" disabled>Manual / GPS location</option>
            </select>
          </div>

          <button
            onClick={handleGPSDetect}
            disabled={isLocating}
            className="bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 text-emerald-800 border border-emerald-200/50 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'GPS...' : 'My Location'}
          </button>
        </div>
      </div>

      {/* Map Interactive Grid Canvas */}
      <div className="relative w-full aspect-[2.1/1] overflow-hidden bg-[#e5e9f0]" style={{ height: '420px' }}>
        
        {/* SVG Cartesian Vector Layer representing standard Kerala grid */}
        <svg viewBox="0 0 300 200" className="w-full h-full absolute inset-0 select-none">
          {/* Subtle maps patterns */}
          <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill="#f4f7f6" />
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e1e8e5" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Kochi Metro line & bypass road drawing references */}
          <path d="M-10,130 C50,120 180,100 310,120" fill="none" stroke="#d5dcda" strokeWidth="8" strokeLinecap="round" />
          <path d="M-10,130 C50,120 180,100 310,120" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
          
          <path d="M120,-10 C140,80 150,130 130,210" fill="none" stroke="#d5dcda" strokeWidth="10" strokeLinecap="round" />
          <path d="M120,-10 C140,80 150,130 130,210" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />

          {/* Backwater element watermark in Kochi */}
          <path d="M10,210 C80,190 110,140 100,80 C90,20 40,40 10,-10 Z" fill="#cbe3f0" opacity="0.8" />

          {/* 1 Km Radius Circle centered around the user location */}
          <circle
            cx="150"
            cy="100"
            r={50 * radiusKm} // ~50px corresponds to 1km radius
            fill="rgba(16, 185, 129, 0.08)"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4,3"
            id="radius-circle"
            className="animate-pulse"
          />

          {/* Direct dotted compass paths to nearby kitchens */}
          {nearKitchens.map((k) => {
            const relativePos = getRelativePosition(k.lat, k.lng);
            // Only draw lines if within container bounds
            if (relativePos.x >= 0 && relativePos.x <= 300 && relativePos.y >= 0 && relativePos.y <= 200) {
              return (
                <line
                  key={`line-${k.id}`}
                  x1="150"
                  y1="100"
                  x2={relativePos.x}
                  y2={relativePos.y}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
              );
            }
            return null;
          })}
        </svg>

        {/* 3. HTML MARKERS LAYER ON TOP OF CANVAS */}
        
        {/* User Centered Node */}
        <div
          style={{ left: '50%', top: '50%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-default"
        >
          <div className="relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/30 opacity-75 animate-ping" />
            <div className="w-7 h-7 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
              <MapPin className="w-4 h-4 text-white fill-white/10" />
            </div>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-slate-900 border border-slate-700/50 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-100 transition-opacity">
              My Spot ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
            </div>
          </div>
        </div>

        {/* Plantain Leaf Kitchen Spots */}
        {kitchens.map((k) => {
          const rPos = getRelativePosition(k.lat, k.lng);
          const isNearby = nearKitchens.some(nk => nk.id === k.id);

          // Render only if within realistic visual boundaries
          if (rPos.x < -20 || rPos.x > 320 || rPos.y < -20 || rPos.y > 220) return null;

          return (
            <div
              key={`marker-${k.id}`}
              style={{ left: `${(rPos.x / 300) * 100}%`, top: `${(rPos.y / 200) * 100}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <button
                onClick={() => onKitchenClick(k)}
                id={`kitchen-marker-${k.id}`}
                className={`relative cursor-pointer group focus:outline-none flex flex-col items-center ${
                  !isNearby && !isLocked ? 'opacity-40 hover:opacity-80 transition-all' : ''
                }`}
              >
                {/* Aura pulse for restaurants with meal balance */}
                {k.sponsoredCount > 0 && isNearby && (
                  <span className="absolute -inset-3 rounded-full bg-emerald-300/35 opacity-75 animate-pulse" />
                )}

                {/* Customized marker matching exact brand leaf icon */}
                <div
                  className={`w-9.5 h-9.5 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                    isNearby
                      ? 'bg-emerald-650 border-white text-white scale-105 hover:scale-110'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}
                >
                  <svg viewBox="0 0 100 100" className="w-5.5 h-5.5 fill-white stroke-white">
                    <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                  </svg>
                </div>

                {/* Meal counter badge on marker */}
                <span
                  className={`absolute -top-1.5 -right-1 w-5 h-5 rounded-full border border-white text-[9px] font-black flex items-center justify-center text-white ${
                    k.sponsoredCount > 0 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                >
                  {k.sponsoredCount}
                </span>

                {/* Tooltip detail tag */}
                <div className="absolute top-11 bg-white border border-slate-200/80 px-2 py-1 rounded-lg shadow-lg text-[10px] font-bold text-slate-800 whitespace-nowrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-40 flex items-center gap-1.5">
                  <span className="text-slate-800 font-sans">{k.name.split(' ')[0]}</span>
                  <span className="text-emerald-700 font-mono">({k.sponsoredCount} 🍃)</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Detail list footer below preview */}
      <div className="bg-white border-t border-slate-200/60 p-4 font-sans text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            <p className="text-slate-600 leading-normal">
              {isLocked ? (
                <span>Unlock the map with the button overlay to center coordinates and find meals.</span>
              ) : nearKitchens.length > 0 ? (
                <span>
                  Found **{nearKitchens.length}** chorundo? meal spot(s) within **{radiusKm}km** of your current spot! Click any marker to proceed.
                </span>
              ) : (
                <span className="text-amber-800 font-medium">
                  We found 0 meal spots within 1km. Explore Kerala presets above to simulate active junctions!
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">set radius:</span>
            <div className="flex gap-1.5">
              {[0.5, 1.0, 3.0, 50.0].map((r) => (
                <button
                  key={`rad-${r}`}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                    radiusKm === r
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-slate-50 text-slate-650 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {r === 50 ? 'Kerala All' : `${r}km`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {alertMsg && !isLocked && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-150-none border-l-4 border-l-blue-600 text-blue-900 rounded-xl flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4.5 h-4.5 text-blue-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px] font-medium">{alertMsg}</span>
          </div>
        )}
      </div>

    </div>
  );
}

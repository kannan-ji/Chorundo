import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Compass, Navigation, Info, Smile, AlertCircle } from 'lucide-react';
import { Kitchen } from '../types';
import { calculateDistance } from '../data';
import L from 'leaflet';

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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const kitchensLayerRef = useRef<L.LayerGroup | null>(null);

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
        setAlertMsg("Permission denied or failed to resolve GPS. Simulating standard Aluva center.");
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
        setAlertMsg(`No active meal spots found within ${radiusKm}km of your coordinates. You can adjust the radius below to scan a wider area!`);
      }
    }
  }, [userCoords, radiusKm, isLocked]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create leaflet map
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([userCoords.lat, userCoords.lng], zoomLevel);

      // CARTO Voyager tiles - neat light vector styling perfect for clean custom apps
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Attribution
      L.control.attribution({
        position: 'bottomleft',
        prefix: 'Chorundo? | © OpenStreetMap Contributors'
      }).addTo(map);

      // Custom Zoom Control placed at bottom right (cleaner)
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      kitchensLayerRef.current = L.layerGroup().addTo(map);

      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });

      // Recalculate size across multiple frames to resolve any layout shift or image/font latency
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
      setTimeout(() => map.invalidateSize(), 1000);
      setTimeout(() => map.invalidateSize(), 2000);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        kitchensLayerRef.current = null;
        userMarkerRef.current = null;
        userCircleRef.current = null;
      }
    };
  }, []);

  // Update zoom
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.getZoom() !== zoomLevel) {
      mapInstanceRef.current.setZoom(zoomLevel);
    }
  }, [zoomLevel]);

  // Invalidate Map size when blur lock shifts (prevents leaflet half rendering bug)
  useEffect(() => {
    if (!isLocked && mapInstanceRef.current) {
      // Trigger multiple size updates over the transition window
      const map = mapInstanceRef.current;
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 500);
      setTimeout(() => map.invalidateSize(), 1000);
    }
  }, [isLocked]);

  // Coordinate center adjustment & view flying
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], zoomLevel, {
        animate: true,
      });
    }
  }, [userCoords.lat, userCoords.lng]);

  // Sync user coordinate node and radius circle circle boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Custom pulse node user marker SVG
    const userIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-8 w-8 rounded-full bg-emerald-500/30 opacity-75 animate-ping"></span>
          <div class="w-8 h-8 bg-emerald-700 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-white">
              <circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.1" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    }

    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      userCircleRef.current.setRadius(radiusKm * 1000);
    } else {
      userCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusKm * 1000,
        fillColor: '#047857',
        fillOpacity: 0.05,
        color: '#047857',
        weight: 1.5,
        dashArray: '5, 4',
      }).addTo(map);
    }
  }, [userCoords, radiusKm]);

  // Sync active kitchen pins with SVG badges containing available leaf counts
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = kitchensLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    kitchens.forEach((k) => {
      const isNearby = nearKitchens.some(nk => nk.id === k.id);
      const leavesCount = k.sponsoredCount;

      const kitchenIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center select-none pointer-events-auto" style="width: 140px; text-align: center;">
            <!-- Leaves / Meal balance bubble -->
            <div class="bg-white px-2 py-0.5 rounded-full border ${isNearby ? 'border-emerald-300' : 'border-slate-300'} shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transform transition-transform group-hover:scale-105 duration-200">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 fill-emerald-700 stroke-none shrink-0">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono text-emerald-800">${leavesCount}</span>
            </div>
            
            <!-- Pin pointing node -->
            <div class="relative flex items-center justify-center mb-0.5">
              ${leavesCount > 0 && isNearby && !isLocked ? '<span class="absolute -inset-2 rounded-full bg-emerald-400/30 opacity-75 animate-pulse"></span>' : ''}
              
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                isNearby && !isLocked
                  ? 'bg-emerald-700 border-white text-white' 
                  : 'bg-slate-405 border-slate-350 text-slate-500 opacity-60'
              }">
                <svg viewBox="0 0 100 100" class="w-3.5 h-3.5 fill-current stroke-none">
                  <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                </svg>
              </div>
            </div>
            
            <!-- Permanent High-Contrast Label -->
            <div class="bg-slate-900/95 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-md border border-slate-800 text-center whitespace-nowrap max-w-[130px] truncate">
              ${k.name}
            </div>
          </div>
        `,
        className: '',
        iconSize: [140, 100],
        iconAnchor: [70, 50]
      });

      const marker = L.marker([k.lat, k.lng], { icon: kitchenIcon });
      
      marker.on('click', () => {
        if (!isLocked) {
          onKitchenClick(k);
        }
      });
      
      marker.addTo(layer);
    });
  }, [kitchens, nearKitchens, userCoords, isLocked]);

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
      {/* 3. LEAFLET CONTAINER CANVAS */}
      <div className="relative w-full overflow-hidden bg-[#EFECE6] z-0" style={{ height: '420px' }}>
        <div 
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>

      {/* 4. DETAILS FOOTER AND DISTANCE RADIUS SELECTORS */}
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
                  We found 0 meal spots within 1km of this location. Try choosing a larger radius below to scan wider!
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

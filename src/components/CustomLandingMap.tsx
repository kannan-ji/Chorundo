import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Compass, Navigation, Info, Smile, AlertCircle, Maximize, Minimize, ChevronDown } from 'lucide-react';
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
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [pinsTrigger, setPinsTrigger] = useState(0);

  // Disable main body page scroll when map fullscreen dashboard is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('map-fullscreen-body-active');
    } else {
      document.body.classList.remove('map-fullscreen-body-active');
    }
    return () => {
      document.body.classList.remove('map-fullscreen-body-active');
    };
  }, [isFullscreen]);

  // Pre-set Kochi/Kerala coordinate presets for interactive testing
  const presets = [
    { name: 'Aluva Civil Junction (Near Janakeeya Spot)', lat: 10.1075, lng: 76.3542 },
    { name: 'Kochi Vyttila Hub (Near Thanal Eatery)', lat: 9.9725, lng: 76.3160 },
    { name: 'Trivandrum Palayam (Near Sadhya Bhavan)', lat: 8.5065, lng: 76.9538 },
    { name: 'Kozhikode Beach/Railway Rd (Near Malaya green)', lat: 11.2505, lng: 75.7812 },
    { name: 'Generic Kerala Spot (No Meals Nearby)', lat: 10.5276, lng: 76.2144 },
  ];

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const kitchensLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const timeoutsRef = useRef<any[]>([]);

  // Keep latest coords and zoom in refs to avoid rebuilding initMap callback
  const userCoordsRef = useRef(userCoords);
  const zoomLevelRef = useRef(zoomLevel);

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Safe timeout helper that removes itself from registry and runs safely
  const safeTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  // Component unmount cleanup safeguard
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

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

  const kitchensWithMeals = kitchens.filter((k) => k.sponsoredCount > 0);

  // Leaflet instantiation helper
  const initMap = (container: HTMLDivElement) => {
    if (mapInstanceRef.current) return;

    // Create leaflet map
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userCoordsRef.current.lat, userCoordsRef.current.lng], zoomLevelRef.current);

    map.on('click', () => {
      setSelectedKitchenId(null);
    });

    // CARTO Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution
    L.control.attribution({
      position: 'bottomleft',
      prefix: 'Chorundo? | © OpenStreetMap Contributors'
    }).addTo(map);

    // Zoom scale marker
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    kitchensLayerRef.current = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    setMapReady(true);
    setPinsTrigger(prev => prev + 1);

    // Flush transitions to prevent tile grey gaps using safeTimeout
    safeTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 50);
    safeTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 150);
    safeTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 300);
    safeTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 600);
  };

  // Leaflet teardown helper
  const cleanupMap = () => {
    // Clear all pending timeouts to prevent asynchronous post-destruction crashes
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Chorundo map destruction handled gracefully:", err);
      }
      mapInstanceRef.current = null;
    }
    kitchensLayerRef.current = null;
    userMarkerRef.current = null;
    userCircleRef.current = null;
    setMapReady(false);
  };

  // Callback ref to manage mount / unmount of container safely across portal jumps
  const mapRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      mapContainerRef.current = el;
      initMap(el);
    } else {
      cleanupMap();
      mapContainerRef.current = null;
    }
  }, []);

  // Update map zoom level state sync
  useEffect(() => {
    if (mapInstanceRef.current && mapReady && mapInstanceRef.current.getZoom() !== zoomLevel) {
      mapInstanceRef.current.setZoom(zoomLevel);
    }
  }, [zoomLevel, mapReady]);

  // Invalidate Map size when shifts occur
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && mapReady) {
      map.invalidateSize();
      const t1 = safeTimeout(() => {
        if (mapInstanceRef.current === map) {
          map.invalidateSize();
          setPinsTrigger(prev => prev + 1);
        }
      }, 50);
      const t2 = safeTimeout(() => {
        if (mapInstanceRef.current === map) {
          map.invalidateSize();
          setPinsTrigger(prev => prev + 1);
        }
      }, 150);
      const t3 = safeTimeout(() => {
        if (mapInstanceRef.current === map) {
          map.invalidateSize();
          setPinsTrigger(prev => prev + 1);
        }
      }, 300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isLocked, isFullscreen, mapReady]);

  // Coordinate center tracking view flight updates
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], zoomLevel, {
        animate: true,
      });
    }
  }, [userCoords.lat, userCoords.lng, mapReady]);

  // Sync user pulse point and bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

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

    if (userMarkerRef.current && userMarkerRef.current.getElement() && (userMarkerRef.current as any)._map === map) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove();
        } catch (e) {}
      }
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    }

    if (userCircleRef.current) {
      try {
        userCircleRef.current.remove();
        userCircleRef.current = null;
      } catch (e) {}
    }
  }, [userCoords, mapReady, pinsTrigger]);

  // Sync kitchen markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = kitchensLayerRef.current;
    if (!map || !layer || !mapReady) return;

    layer.clearLayers();
    markersRef.current = {};

    kitchens.forEach((k) => {
      const isSelected = selectedKitchenId === k.id;
      const leavesCount = k.sponsoredCount;
      const hasMeals = leavesCount > 0;

      const getKitchenIconHtml = (isSelectedVal: boolean) => {
        return `
          <div class="relative flex flex-col items-center select-none pointer-events-auto" style="width: 140px; text-align: center;">
            ${isSelectedVal ? `
            <div class="bg-white px-2 py-0.5 rounded-full border border-orange-400 shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transform scale-105">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 fill-orange-600 stroke-none shrink-0 animate-bounce">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono text-orange-900">${leavesCount}</span>
            </div>
            ` : `
            <div class="bg-white px-2 py-0.5 rounded-full border ${hasMeals ? 'border-emerald-300' : 'border-slate-300'} shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transition-transform duration-200 hover:scale-105">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 ${hasMeals ? 'fill-emerald-700' : 'fill-slate-400'} stroke-none shrink-0">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono ${hasMeals ? 'text-emerald-800' : 'text-slate-500'}">${leavesCount}</span>
            </div>
            `}
            
            <div class="relative flex items-center justify-center mb-0.5">
              ${isSelectedVal ? '<span class="absolute -inset-2.5 rounded-full bg-orange-400/30 opacity-75 animate-ping"></span>' : hasMeals ? '<span class="absolute -inset-1.5 rounded-full bg-emerald-400/20 opacity-75 animate-pulse"></span>' : ''}
              
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                isSelectedVal
                  ? 'bg-orange-600 border-white text-white scale-110' 
                  : hasMeals
                  ? 'bg-emerald-700 border-white text-white' 
                  : 'bg-slate-400 border-slate-300 text-slate-500 opacity-60'
              }">
                <svg viewBox="0 0 100 100" class="w-3.5 h-3.5 fill-current stroke-none">
                  <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                </svg>
              </div>
            </div>
            
            <div class="${isSelectedVal ? 'bg-orange-700 text-white border-orange-900 shadow-md ring-2 ring-white scale-105' : 'bg-slate-900/95 text-white border-slate-800 shadow'} text-[9.5px] font-bold px-1.5 py-0.5 rounded border text-center whitespace-nowrap max-w-[130px] truncate transition-all">
              ${k.name}
            </div>
          </div>
        `;
      };

      const kitchenIcon = L.divIcon({
        html: getKitchenIconHtml(isSelected),
        className: '',
        iconSize: [140, 100],
        iconAnchor: [70, 50]
      });

      const marker = L.marker([k.lat, k.lng], { icon: kitchenIcon });
      markersRef.current[k.id] = marker;
      
      if (!isLocked) {
        const dist = calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng);
        const popupContent = `
          <div class="p-1 font-sans min-w-[210px]" style="font-family: system-ui, -apple-system, sans-serif;">
            <div style="width: 100%; height: 95px; overflow: hidden; border-radius: 10px; margin-bottom: 8px; position: relative; background-color: #f1f5f9;">
              <img src="${k.image}" referrerpolicy="no-referrer" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';" />
              <span style="position: absolute; bottom: 6px; right: 6px; background-color: rgba(15, 23, 42, 0.85); color: #fbbf24; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                ★ ${k.rating.toFixed(1)}
              </span>
            </div>
            
            <h4 class="font-bold text-xs text-slate-900 mb-0.5 leading-snug" style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${k.name}">${k.name}</h4>
            
            <p class="text-[11px] text-slate-500 font-semibold mb-2.5 flex items-center gap-1" style="margin: 0 0 10px 0; font-size: 10.5px; font-weight: 500; color: #64748b; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px; color: #94a3b8;" class="shrink-0">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>${dist.toFixed(2)} km away • ${k.cuisine}</span>
            </p>

            ${!hasMeals ? `
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="width: 14px; height: 14px; margin-top: 1px;" class="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style="font-size: 10px; font-weight: 600; color: #991b1b; line-height: 1.3;">Not serving free meals currently (0 available)</span>
            </div>
            ` : ''}
            
            <div class="flex flex-col gap-1.5" style="display: flex; flex-direction: column; gap: 6px;">
              ${hasMeals ? `
              <button id="pop-meal-btn-${k.id}" style="width: 100%; background-color: #047857; color: white; border: 0; padding: 7px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background-color 0.15s ease; box-shadow: 0 2px 4px rgba(4, 120, 87, 0.2);" onmouseover="this.style.backgroundColor='#065f46'" onmouseout="this.style.backgroundColor='#047857'">
                Get a Meal
              </button>
              ` : `
              <button disabled style="width: 100%; background-color: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; padding: 7px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: not-allowed;">
                Out of Stock
              </button>
              `}
              <a href="https://www.google.com/maps/search/?api=1&query=${k.lat},${k.lng}" target="_blank" rel="noopener noreferrer" style="width: 100%; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; display: inline-block; box-sizing: border-box; transition: background-color 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.backgroundColor='#e2e8f0'" onmouseout="this.style.backgroundColor='#f1f5f9'">
                Navigate
              </a>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-leaflet-popup',
          offset: L.point(0, -10)
        });

        marker.on('popupopen', (e) => {
          setSelectedKitchenId(k.id);
          const popup = e.popup;
          const container = popup.getElement();
          if (container) {
            const btn = container.querySelector(`#pop-meal-btn-${k.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                onKitchenClick(k);
              });
            }
          }
        });
      }
      
      marker.addTo(layer);
    });
  }, [kitchens, userCoords, isLocked, mapReady, pinsTrigger]);

  // Update marker icons dynamically on selection to keep popups intact
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    kitchens.forEach((k) => {
      const marker = markersRef.current[k.id];
      if (!marker) return;

      const isSelected = selectedKitchenId === k.id;
      const leavesCount = k.sponsoredCount;
      const hasMeals = leavesCount > 0;

      const updatedIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center select-none pointer-events-auto" style="width: 140px; text-align: center;">
            ${isSelected ? `
            <div class="bg-white px-2 py-0.5 rounded-full border border-orange-400 shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transform scale-105">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 fill-orange-600 stroke-none shrink-0 animate-bounce">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono text-orange-900">${leavesCount}</span>
            </div>
            ` : `
            <div class="bg-white px-2 py-0.5 rounded-full border ${hasMeals ? 'border-emerald-300' : 'border-slate-300'} shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transition-transform duration-200 hover:scale-105">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 ${hasMeals ? 'fill-emerald-700' : 'fill-slate-400'} stroke-none shrink-0">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono ${hasMeals ? 'text-emerald-800' : 'text-slate-500'}">${leavesCount}</span>
            </div>
            `}
            
            <div class="relative flex items-center justify-center mb-0.5">
              ${isSelected ? '<span class="absolute -inset-2.5 rounded-full bg-orange-400/30 opacity-75 animate-ping"></span>' : hasMeals ? '<span class="absolute -inset-1.5 rounded-full bg-emerald-400/20 opacity-75 animate-pulse"></span>' : ''}
              
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                isSelected
                  ? 'bg-orange-600 border-white text-white scale-110' 
                  : hasMeals
                  ? 'bg-emerald-700 border-white text-white' 
                  : 'bg-slate-400 border-slate-300 text-slate-500 opacity-60'
              }">
                <svg viewBox="0 0 100 100" class="w-3.5 h-3.5 fill-current stroke-none">
                  <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                </svg>
              </div>
            </div>
            
            <div class="${isSelected ? 'bg-orange-700 text-white border-orange-900 shadow-md ring-2 ring-white scale-105' : 'bg-slate-900/95 text-white border-slate-800 shadow'} text-[9.5px] font-bold px-1.5 py-0.5 rounded border text-center whitespace-nowrap max-w-[130px] truncate transition-all">
              ${k.name}
            </div>
          </div>
        `,
        className: '',
        iconSize: [140, 100],
        iconAnchor: [70, 50]
      });

      marker.setIcon(updatedIcon);
      
      if (isSelected && !marker.isPopupOpen()) {
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }
    });
  }, [selectedKitchenId, mapReady]);

  // Main interactive renderer layout
  const renderMapContent = (isFS: boolean) => {
    return (
      <div 
        className={`bg-[#DDD9D1] shadow-sm flex flex-col transition-all duration-300 ${
          isFS 
            ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-50' 
            : 'relative w-full border border-slate-200 rounded-3xl overflow-hidden h-[480px]'
        }`}
      >
        {/* 1. BLURRED OVERLAY RESTING ABOVE THE MAP */}
        {isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 border border-white/10 rounded-inherit">
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

        {/* 2. LEAFLET CONTAINER CANVAS AND FLOATING CONTROL OVERLAYS */}
        <div 
          className="relative w-full h-full overflow-hidden bg-[#DDD9D1] z-10 flex-grow"
        >
          <div 
            ref={mapRefCallback} 
            className="w-full h-full animate-fadeIn"
            style={{ height: '100%', width: '100%' }}
          />

          {/* Floating overlays for Map utilities */}
          {!isLocked && (
            <>
              {/* Status Pill (Top-Left) */}
              <div className="absolute top-3 left-3 right-3 sm:left-4 sm:top-4 sm:right-auto z-[400] select-none sm:max-w-[280px] pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700 leading-snug">
                      {kitchens.filter(k => calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng) <= 5 && k.sponsoredCount > 0).length > 0 ? (
                        <span>
                          <strong className="font-extrabold text-emerald-800">{kitchens.filter(k => calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng) <= 5 && k.sponsoredCount > 0).length} {kitchens.filter(k => calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng) <= 5 && k.sponsoredCount > 0).length === 1 ? 'kitchen' : 'kitchens'}</strong> within 5km
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold">
                          0 kitchens within 5km.
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Fullscreen Floating Toggler (Bottom-Left) */}
              <div className="absolute bottom-8 left-4 z-[400] select-none pointer-events-auto">
                <button
                  onClick={() => setIsFullscreen(!isFS)}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center justify-center gap-1.5 font-sans font-bold text-[11px] cursor-pointer transition-all uppercase tracking-wider"
                  title={isFS ? "Exit Fullscreen" : "View Fullscreen"}
                >
                  {isFS ? (
                    <>
                      <Minimize className="w-4 h-4 text-emerald-700" />
                      <span>Minimize Map</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="w-4 h-4 text-emerald-700" />
                      <span>View Fullscreen</span>
                    </>
                  )}
                </button>
              </div>

              {/* Current GPS Location Floating Toggler (Bottom-Right) */}
              <div className="absolute bottom-8 right-4 z-[400] select-none pointer-events-auto">
                <button
                  onClick={handleGPSDetect}
                  disabled={isLocating}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-700/25 active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed text-white p-2.5 rounded-2xl shadow-xl border border-emerald-600 flex items-center justify-center gap-1.5 font-sans font-bold text-[11px] cursor-pointer transition-all uppercase tracking-wider"
                  title="Detect Current GPS Coordinate"
                >
                  <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'My Location'}</span>
                </button>
              </div>

              {/* Floating Alert Messages */}
              {alertMsg && (
                <div className="absolute top-28 sm:top-16 left-1/2 -translate-x-1/2 z-[400] max-w-sm w-[calc(100%-2rem)] bg-blue-50/95 backdrop-blur-md border border-blue-100 p-2.5 rounded-2xl shadow-xl flex items-start gap-2 animate-fadeIn pointer-events-auto">
                  <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-[10px] font-medium text-blue-950">{alertMsg}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <>
        {/* Placeholder rendering in-place in document flow */}
        <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[480px] select-none">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-800 border border-emerald-100 shadow-inner">
            <Maximize className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <h3 className="font-serif font-black text-lg text-slate-800 tracking-tight lowercase mb-1">
            map is open in fullscreen
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mb-6 leading-normal font-sans">
            you are tracking partner kitchens in live viewport dashboard. escape or click minimize below to return.
          </p>
          <button
            onClick={() => setIsFullscreen(false)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-2xl transition-all shadow-md cursor-pointer uppercase tracking-wider text-[10px]"
          >
            Minimize Map View
          </button>
        </div>

        {/* Global style override when nested */}
        <style dangerouslySetInnerHTML={{ __html: `
          body.map-fullscreen-body-active {
            overflow: hidden !important;
          }
        `}} />

        {/* React Portal rendering directly onto document.body to bypass css contains block limits */}
        {createPortal(
          renderMapContent(true),
          document.body
        )}
      </>
    );
  }

  return renderMapContent(false);
}

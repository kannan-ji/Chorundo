import { 
  Compass, 
  Info, 
  MapPin, 
  Navigation, 
  Phone, 
  RotateCcw, 
  ShieldCheck, 
  Ticket, 
  Maximize, 
  Minimize, 
  ChevronDown, 
  Check, 
  Sparkles, 
  AlertCircle, 
  X, 
  Search, 
  Star, 
  Utensils, 
  ArrowLeft,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { calculateDistance } from '../data';
import { Kitchen, MealClaim } from '../types';
import L from 'leaflet';

interface SeekerDashboardProps {
  kitchens: Kitchen[];
  claims: MealClaim[];
  onCreateClaim: (kitchenId: string, seekerName?: string) => void;
  onCancelClaim: (claimId: string) => void;
  initialKitchenId?: string | null;
  onBackToHome?: () => void;
  isStandalone?: boolean;
}

export default function SeekerDashboard({
  kitchens,
  claims,
  onCreateClaim,
  onCancelClaim,
  initialKitchenId = null,
  onBackToHome,
  isStandalone = false,
}: SeekerDashboardProps) {
  // Generate daily unique seeker username for absolute anonymity
  const [seekerUsername] = useState<string>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('chorundo_seeker_date');
    const storedUsername = localStorage.getItem('chorundo_seeker_username');
    
    if (storedDate === todayStr && storedUsername) {
      return storedUsername;
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const generated = `athithi-${randomNum}`;
      localStorage.setItem('chorundo_seeker_date', todayStr);
      localStorage.setItem('chorundo_seeker_username', generated);
      return generated;
    }
  });

  // User's default or simulated GPS
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 10.1064,
    lng: 76.3534, // Default Aluva/Kochi Metro coordinates
  });
  
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Selection and filter rules
  const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(initialKitchenId || kitchens[0]?.id || null);
  const [pinnedKitchenId, setPinnedKitchenId] = useState<string | null>(initialKitchenId || null);
  
  // Responsive / Map parameters
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'map'>('list');
  const [isTokenDrawerOpen, setIsTokenDrawerOpen] = useState(false);
  
  // Confetti / Booking animation state
  const [bookingEateryId, setBookingEateryId] = useState<string | null>(null);
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);

  // Map elements Reference
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const kitchensLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [mapReady, setMapReady] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(15);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync initial Kitchen selection
  useEffect(() => {
    if (initialKitchenId) {
      setSelectedKitchenId(initialKitchenId);
      setPinnedKitchenId(initialKitchenId);
      // Automatically focus / expand it in our list
      const matches = kitchens.find(k => k.id === initialKitchenId);
      if (matches && mapInstanceRef.current && mapReady) {
        mapInstanceRef.current.setView([matches.lat, matches.lng], 14);
      }
    }
  }, [initialKitchenId, mapReady, kitchens]);

  // Handle body scrolling lock when fullscreen or slideout drawer is active
  useEffect(() => {
    if (isMapFullscreen || isTokenDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMapFullscreen, isTokenDrawerOpen]);

  // Redraw map on sizing shift
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 350);
    }
  }, [isMapFullscreen, mobileViewTab]);

  const selectedKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];

  // Map & Distance calculation setup
  const kitchensWithDistance = useMemo(() => {
    return kitchens.map(k => {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, k.lat, k.lng);
      return { ...k, distanceKm: dist };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [kitchens, userCoords]);

  // Search filter
  const filteredKitchens = kitchensWithDistance.filter(k => {
    const matchesSearch = 
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      k.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pin selected kitchen to the absolute top of the list if selected from map
  const orderedKitchens = [...filteredKitchens];
  if (pinnedKitchenId) {
    const pinnedIdx = orderedKitchens.findIndex(k => k.id === pinnedKitchenId);
    if (pinnedIdx > 0) {
      const [pinnedItem] = orderedKitchens.splice(pinnedIdx, 1);
      orderedKitchens.unshift(pinnedItem);
    }
  }

  const displayedKitchens = orderedKitchens.slice(0, displayCount);

  // Automatically expand list and scroll to selected eatery when selection changes
  useEffect(() => {
    if (!selectedKitchenId) return;

    const index = orderedKitchens.findIndex(k => k.id === selectedKitchenId);
    if (index !== -1) {
      let isPaginationUpdated = false;
      if (index >= displayCount) {
        setDisplayCount(index + 1);
        isPaginationUpdated = true;
      }

      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(`seeker-eatery-card-${selectedKitchenId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, isPaginationUpdated ? 300 : 100);

      return () => clearTimeout(scrollTimeout);
    }
  }, [selectedKitchenId, orderedKitchens, displayCount]);

  // Reset display pages when toggling search
  useEffect(() => {
    setDisplayCount(15);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [searchTerm]);

  // Teardown Leaflet instance safely
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Chorundo seeker map destruction handled gracefully:", err);
      }
      mapInstanceRef.current = null;
    }
    kitchensLayerRef.current = null;
    userMarkerRef.current = null;
    userCircleRef.current = null;
    setMapReady(false);
  };

  // Safe Map instantiation
  const initMap = (container: HTMLDivElement) => {
    if (mapInstanceRef.current) return;

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userCoords.lat, userCoords.lng], 14);

    map.on('click', () => {
      setSelectedKitchenId(null);
      setPinnedKitchenId(null);
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({
      position: 'bottomleft',
      prefix: 'Chorundo? | © OpenStreetMap'
    }).addTo(map);

    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    kitchensLayerRef.current = L.layerGroup().addTo(map);
    setMapReady(true);

    // Multi-phase invalidating passes to layout
    map.invalidateSize();
    setTimeout(() => { if (mapInstanceRef.current === map) map.invalidateSize(); }, 80);
    setTimeout(() => { if (mapInstanceRef.current === map) map.invalidateSize(); }, 250);
    setTimeout(() => { if (mapInstanceRef.current === map) map.invalidateSize(); }, 500);
  };

  const mapRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      mapContainerRef.current = el;
      initMap(el);
    } else {
      cleanupMap();
      mapContainerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  // Update user marker & scanning radius bounds
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
        try { userMarkerRef.current.remove(); } catch (e) {}
      }
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    }

    if (userCircleRef.current) {
      try {
        userCircleRef.current.remove();
        userCircleRef.current = null;
      } catch (e) {}
    }
  }, [userCoords, mapReady]);

  // Center maps on selected kitchen location updates
  useEffect(() => {
    if (mapInstanceRef.current && mapReady && selectedKitchen) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([selectedKitchen.lat, selectedKitchen.lng], 14, {
            animate: true,
          });
        }
      }, 100);
    }
  }, [selectedKitchenId, mapReady, selectedKitchen, mobileViewTab, isMapFullscreen]);

  // Adjust Leaflet map's dimensions and invalidate sizes when toggling Fullscreen views
  useEffect(() => {
    if (mapInstanceRef.current && mapReady) {
      const resizeTimeout1 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 50);
      const resizeTimeout2 = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
      return () => {
        clearTimeout(resizeTimeout1);
        clearTimeout(resizeTimeout2);
      };
    }
  }, [isMapFullscreen, mapReady]);

  // Handle document scroll behavior on fullscreen map activation
  useEffect(() => {
    if (isMapFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMapFullscreen]);

  // Sync active partner kitchen pins (Initial render and when dataset changes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = kitchensLayerRef.current;
    if (!map || !layer || !mapReady) return;

    layer.clearLayers();
    markersRef.current = {};

    kitchensWithDistance.forEach((k) => {
      const hasMeals = k.sponsoredCount > 0;
      const leavesCount = k.sponsoredCount;

      const kitchenIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center select-none pointer-events-auto" style="width: 140px; text-align: center;">
            <div class="bg-white px-2 py-0.5 rounded-full border ${hasMeals ? 'border-emerald-300' : 'border-slate-300'} shadow-sm flex items-center justify-center gap-0.5 mb-0.5 transition-transform duration-200 hover:scale-105">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 ${hasMeals ? 'fill-emerald-700' : 'fill-slate-400'} stroke-none shrink-0">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono ${hasMeals ? 'text-emerald-800' : 'text-slate-500'}">${leavesCount}</span>
            </div>
            
            <div class="relative flex items-center justify-center mb-0.5">
              ${hasMeals ? '<span class="absolute -inset-1.5 rounded-full bg-emerald-400/20 opacity-75 animate-pulse"></span>' : ''}
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 bg-slate-400 border-slate-300 text-slate-500 opacity-60">
                <svg viewBox="0 0 100 100" class="w-3.5 h-3.5 fill-current stroke-none">
                  <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                </svg>
              </div>
            </div>
            <div class="bg-slate-900/95 text-white border-slate-800 shadow text-[9.5px] font-bold px-1.5 py-0.5 rounded border text-center whitespace-nowrap max-w-[130px] truncate transition-all">
              ${k.name}
            </div>
          </div>
        `,
        className: '',
        iconSize: [140, 100],
        iconAnchor: [70, 50]
      });

      const marker = L.marker([k.lat, k.lng], { icon: kitchenIcon });
      markersRef.current[k.id] = marker;
      
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
            <span>${k.distanceKm.toFixed(2)} km away • ${k.cuisine}</span>
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
              Select this Kitchen
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
        setPinnedKitchenId(k.id);
        const popup = e.popup;
        const container = popup.getElement();
        if (container) {
          const btn = container.querySelector(`#pop-meal-btn-${k.id}`);
          if (btn) {
            btn.addEventListener('click', () => {
              setMobileViewTab('list');
              setIsMapFullscreen(false);
              
              const element = document.getElementById(`seeker-eatery-card-${k.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            });
          }
        }
      });

      
      marker.addTo(layer);
    });
  }, [kitchensWithDistance, mapReady]);

  // Update marker icons dynamically on selection to keep popups intact
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    kitchensWithDistance.forEach((k) => {
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
      
      // Auto-open popup if not already opened when selected programmatically
      if (isSelected && !marker.isPopupOpen()) {
        setTimeout(() => {
          const mapContainer = mapInstanceRef.current?.getContainer();
          if (mapContainer && mapContainer.offsetParent !== null) {
            marker.openPopup();
          }
        }, 150);
      }
    });
  }, [kitchensWithDistance, selectedKitchenId, mapReady, mobileViewTab, isMapFullscreen]);

  // Handle polyline to selected kitchen
  useEffect(() => {
    const layer = kitchensLayerRef.current;
    if (!layer || !mapReady) return;
    
    layer.eachLayer((l: any) => {
      if (l instanceof L.Polyline) {
        layer.removeLayer(l);
      }
    });

    if (selectedKitchenId) {
      const selected = kitchensWithDistance.find(k => k.id === selectedKitchenId);
      if (selected) {
        L.polyline([[userCoords.lat, userCoords.lng], [selected.lat, selected.lng]], {
          color: '#f97316',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.65
        }).addTo(layer);
      }
    }
  }, [selectedKitchenId, userCoords, mapReady, kitchensWithDistance]);

  // Handle live smartphone GPS query
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
        setGpsError('Could not retrieve coordinates. Using fallback Aluva center.');
        setIsLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Perform animated booking sequence
  const handleClaimMealCode = (kitchenId: string) => {
    if (claims.length > 0) return; // Prevent double claims (handled by business rules)

    setBookingEateryId(kitchenId);
    setTimeout(() => {
      // Trigger true claim generation
      onCreateClaim(kitchenId, seekerUsername);
      setBookingEateryId(null);
      setBookingSuccessId(kitchenId);
      setIsTokenDrawerOpen(true); // Pop open the newly booked token explicitly

      // Clear fireworks after 5 seconds
      setTimeout(() => {
        setBookingSuccessId(null);
      }, 5000);
    }, 1500);
  };

  return (
    <div className={`flex flex-col gap-5 max-w-6xl mx-auto h-full ${isStandalone ? 'px-4 md:px-6 pt-24' : ''}`}>
      {/* 1. ATHITHI CUSTOM TOP NAV BAR & TOKEN CONTAINER */}
      <div className={
        isStandalone
          ? "fixed top-0 inset-x-0 w-full z-[100] bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center justify-center shadow-xs"
          : "bg-white border border-slate-200/80 px-4 py-3.5 rounded-3xl shadow-sm flex items-center justify-between gap-4"
      }>
        <div className={isStandalone ? "w-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4" : "w-full flex items-center justify-between gap-4 flex-1"}>
          {/* Left branding segment */}
          <div className="flex items-center gap-2 md:gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="bg-slate-50 hover:bg-slate-100 font-sans text-slate-700 hover:text-slate-900 px-3 py-2 rounded-2xl text-[11px] font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Malayalam Letter Vowel 'അ' Avatar representing Athithi (Guest) */}
          <div className="relative shrink-0 select-none">
            <span className="absolute -inset-1 rounded-full bg-emerald-500/15 animate-pulse" />
            <div className="relative w-9 h-9 rounded-full bg-emerald-700 ring-2 ring-emerald-50 border border-white flex items-center justify-center text-white font-bold shadow-md">
              <span className="text-xs font-serif font-black" title="അ - Athithi (Visitor)">അ</span>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8px] font-mono font-black uppercase tracking-widest border border-emerald-100 rounded-full px-2 py-0.5">
              athithi terminal
            </span>
            <h2 className="text-xs font-bold tracking-tight text-slate-800 font-mono flex items-center gap-1 mt-0.5">
              {seekerUsername}
            </h2>
          </div>
        </div>

        {/* Right active claims / reset timing widget */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden lg:inline-block bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
            resets daily • pure anonym
          </span>

          {/* TICKET DRAWER TRIGGER BUTTON */}
          <button
            onClick={() => setIsTokenDrawerOpen(prev => !prev)}
            id="seeker-token-toggle-btn"
            className={`p-2.5 md:px-4 md:py-2.5 rounded-full md:rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
              claims.length > 0 
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-100'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Ticket className={`w-4 h-4 ${claims.length > 0 ? 'animate-bounce text-white' : 'text-slate-400'}`} />
              {claims.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <span className="hidden md:inline">{claims.length > 0 ? 'My Active Token' : 'No Claimed Tokens'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform opacity-75 hidden md:block ${isTokenDrawerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        </div>
      </div>

      {/* 2. ATHITHI TICKET OVERLAY / SLIDEOUT DRAWER */}
      <AnimatePresence>
        {isTokenDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTokenDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900 z-[9990] cursor-pointer"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[9991] shadow-2xl overflow-y-auto flex flex-col p-6 cursor-default border-l border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-950">Athithi Meal Voucher</h3>
                    <p className="text-[11px] font-mono text-slate-400">verification & validation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTokenDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {claims.length === 0 ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 my-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                    <Ticket className="w-8 h-8 stroke-[1.2]" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Active Tickets Found</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-[240px] leading-relaxed">
                    You have not claimed any pre-paid meal codes yet. Select any partner eatery from the map to generate one.
                  </p>
                  
                  <div className="mt-6 bg-emerald-50 text-emerald-900 text-[11px] p-3 rounded-2xl text-left border border-emerald-200">
                    <div className="flex gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Did you know?</span> Each ticket grants access to 1 wholesome Kerala meal (traditional curry and rice served on plantain leaves).
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsTokenDrawerOpen(false)}
                    className="mt-6 w-full bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl block transition-all"
                  >
                    View eateries map
                  </button>
                </div>
              ) : (
                /* Active claim details */
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl">
                      <p className="text-[11px] leading-relaxed text-emerald-900">
                        ✨ To guarantee access for all, each local guest is limited to holding **one active token** at any given time.
                      </p>
                    </div>

                    {claims.map(claim => {
                      const kitchen = kitchens.find(k => k.id === claim.kitchenId);
                      return (
                      <div key={claim.id} className="bg-white border-2 border-emerald-600 p-5 rounded-2xl relative overflow-hidden shadow-md">
                        {/* Ticket cutout notches */}
                        <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-slate-100 border-r border-emerald-100 transform -translate-y-1/2" />
                        <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-slate-100 border-l border-emerald-100 transform -translate-y-1/2" />

                        <div className="flex items-stretch justify-between gap-2.5 mb-3.5 border-b border-dashed border-slate-200 pb-3">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 uppercase">partner kitchen</h4>
                            <p className="text-sm font-black text-emerald-800 mt-0.5">{kitchen?.name || claim.kitchenName}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{kitchen?.address}</p>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-2 shrink-0 ml-2">
                            <span className="bg-emerald-600/10 text-emerald-800 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded text-right">
                              meal not yet claimed
                            </span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${kitchen?.lat || 0},${kitchen?.lng || 0}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setIsTokenDrawerOpen(false);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg border border-emerald-700 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                              title="Navigate to kitchen"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Navigate</span>
                            </a>
                          </div>
                        </div>

                        <div className="text-center bg-slate-50 border border-slate-200/60 py-4 px-3 rounded-xl mb-4">
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">verification code</p>
                          <p className="text-3xl font-black font-mono text-emerald-800 tracking-widest mt-1.5 select-all select-none">
                            {claim.code}
                          </p>
                          <p className="text-[9.5px] text-slate-400 mt-2 font-mono">Present this to the restaurant staff billing counter</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-slate-500">The staff will tick off this code on their local dashboard ledger, serve you immediately, and prepare your plantain leaf tray.</span>
                          </div>
                        </div>

                        {/* Force Release code to reset limits */}
                        <button
                          onClick={() => {
                            onCancelClaim(claim.id);
                            setIsTokenDrawerOpen(false);
                          }}
                          className="mt-6 w-full bg-white hover:bg-red-50 active:scale-95 text-[10px] font-black uppercase text-red-650 text-red-600 hover:text-red-700 py-2.5 rounded-xl border border-red-200 hover:border-red-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-red-550 text-red-500" />
                          Release Meal Voucher back to Pool
                        </button>
                      </div>
                      )
                    })}
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-5">
                    <div className="bg-slate-50 p-4 rounded-2xl flex gap-3 text-xs text-slate-500 border border-slate-200/55">
                      <Smartphone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 font-serif block mb-0.5">Offline Ledger Access Available</span>
                        If your smartphone dies, walk up to the same location, quote your anonymous Seeker Code (`{seekerUsername}`), or describe your code to checkout instantly.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. PROMINENT FULL HEIGHT MAP AND LEFT LIST SIDEBAR PANEL */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col h-[640px] md:h-[720px] lg:h-[760px] relative">
        {/* Mobile View Tab Header */}
        <div className="flex border-b border-slate-100 md:hidden bg-white shrink-0">
          <button
            type="button"
            onClick={() => setMobileViewTab('list')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              mobileViewTab === 'list'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/10'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Partner Kitchens ({filteredKitchens.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileViewTab('map')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              mobileViewTab === 'map'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/10'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            View in Map
          </button>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden h-full">
          
          {/* LEFT SIDE PANEL: eateries list container */}
          <div className={`w-full md:w-[380px] lg:w-[420px] border-r border-slate-200 shrink-0 flex flex-col bg-slate-100 h-full overflow-hidden ${
            mobileViewTab === 'list' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Header info / Search / Proximity */}
            <div className="p-4 bg-white flex flex-col gap-3.5 shadow-xs shrink-0">
              <div className="flex flex-col gap-1.5 items-start">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Find a Partner Kitchen</h3>
                <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-md px-2 py-1 inline-flex self-start">
                  <p className="text-[10.5px] text-slate-600">
                    {kitchensWithDistance.filter(k => k.distanceKm <= 5 && k.sponsoredCount > 0).length > 0 ? (
                      <span>
                        <strong className="font-extrabold text-emerald-800">
                          {kitchensWithDistance.filter(k => k.distanceKm <= 5 && k.sponsoredCount > 0).length} 
                          {kitchensWithDistance.filter(k => k.distanceKm <= 5 && k.sponsoredCount > 0).length === 1 ? ' kitchen' : ' kitchens'}
                        </strong> within 5km
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold">
                        0 kitchens within 5km.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Search interface input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by name, landmark, cuisine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-semibold text-slate-850 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-450 hover:text-slate-600 text-[10px] font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Scrolling eateries catalog list element */}
            <div 
              ref={listContainerRef} 
              className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar"
            >
              {displayedKitchens.length === 0 ? (
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl text-center text-slate-400 my-4 mx-1">
                  <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.2]" />
                  <p className="text-xs font-semibold">No eateries match your search term.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-[10px] font-black uppercase text-emerald-700 hover:underline cursor-pointer"
                  >
                    reset search
                  </button>
                </div>
              ) : (
                displayedKitchens.map((k) => {
                  const isSelected = selectedKitchenId === k.id;
                  const hasMeals = k.sponsoredCount > 0;

                  return (
                    <div
                      key={k.id}
                      id={`seeker-eatery-card-${k.id}`}
                      onClick={() => {
                        setSelectedKitchenId(selectedKitchenId === k.id ? null : k.id);
                        setPinnedKitchenId(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-600 bg-white shadow-2xs'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-2xs'
                      }`}
                    >
                      {/* Top metric overview spacer */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400/90 tracking-wide flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          {k.distanceKm.toFixed(2)} km away
                        </span>

                        <span
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                            hasMeals ? 'bg-emerald-50 text-emerald-800 border border-emerald-100/80 font-mono' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          {hasMeals ? (
                            <>
                              <svg viewBox="0 0 100 100" className="w-2.5 h-2.5 fill-emerald-600 stroke-none shrink-0">
                                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                              </svg>
                              <span>{k.sponsoredCount} {k.sponsoredCount === 1 ? 'meal available' : 'meals available'}</span>
                            </>
                          ) : (
                            <span>0 meals available</span>
                          )}
                        </span>
                      </div>

                      {/* Main identification metadata layout */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-bold text-xs.5 text-slate-900 ${isSelected ? '' : 'line-clamp-1'}`}>{k.name}</h3>
                          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 leading-tight">{k.address}</p>
                        </div>
                        <span className="text-[10.5px] text-amber-500 font-bold shrink-0 self-start">★ {k.rating}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-500 font-bold font-mono">{k.cuisine}</span>
                        {!isSelected && (
                          <span className="text-slate-400 flex items-center gap-1 font-semibold">
                            Click to view booking options
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* EXPANDABLE BOOKING CONTROLLER CONTAINER */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3.5"
                            onClick={(e) => e.stopPropagation()} // Stop bubbling
                          >
                            {/* Visual representation of food banner */}
                            <div className="h-20 w-full rounded-xl overflow-hidden relative">
                              <img
                                src={k.image}
                                alt={k.name}
                                className="w-full h-full object-cover opacity-90"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-2.5">
                                <p className="text-[10px] text-white font-serif leading-tight font-light">{k.name} special meals program</p>
                              </div>
                            </div>

                            {/* Contact indices */}
                            <div className="text-[10.5px] text-slate-550 space-y-1">
                              <p className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-100">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{k.phone}</span>
                              </p>
                              <p className="text-slate-400 text-[9.5px] pl-5">{k.claimedCount} local residents served since program inception.</p>
                            </div>

                            {/* Pre-paid visual slider meals */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-end justify-between font-mono mb-1.5">
                                <span className="text-[9.5px] text-slate-500 font-bold">active meals remaining:</span>
                                <span className="text-[11px] font-black text-emerald-855 text-emerald-700">{k.sponsoredCount} available</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, (k.sponsoredCount / 30) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* ANIMATED BOOKING BUTTON ACTION */}
                            {claims.length > 0 ? (
                              claims.some(c => c.kitchenId === k.id) ? (
                                <button
                                  disabled={true}
                                  className="w-full text-xs font-bold p-3 rounded-xl shadow-xs bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                  <span>Successfully Booked! Code: {claims.find(c => c.kitchenId === k.id)?.code}</span>
                                </button>
                              ) : (
                                <div className="bg-amber-50 text-amber-900 text-[10px] p-2.5 rounded-xl border border-amber-200">
                                  <p className="font-bold">Token limit reached</p>
                                  <p className="mt-0.5 text-amber-800 font-medium">To keep distribution fair, you are capped at 1 active token. Please redeem or release your current ticket (**{claims[0].code}** for {claims[0].kitchenName}) from the active token drawer to request another.</p>
                                </div>
                              )
                            ) : k.sponsoredCount > 0 ? (
                              <button
                                onClick={() => handleClaimMealCode(k.id)}
                                disabled={bookingEateryId === k.id || bookingSuccessId === k.id}
                                className={`w-full text-xs font-bold p-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                  bookingSuccessId === k.id
                                    ? 'bg-emerald-600 text-white animate-pulse'
                                    : bookingEateryId === k.id
                                    ? 'bg-slate-150 text-slate-600'
                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                }`}
                              >
                                {bookingEateryId === k.id ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin shrink-0" />
                                    <span>Syncing with pre-paid ledger...</span>
                                  </>
                                ) : bookingSuccessId === k.id ? (
                                  <>
                                    <Sparkles className="w-4 h-4 text-white animate-bounce shrink-0" />
                                    <span>🎉 Pre-paid Voucher Issued!</span>
                                  </>
                                ) : (
                                  <>
                                    <Ticket className="w-3.5 h-3.5" />
                                    <span>Generate Meal Token</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="bg-slate-100 text-slate-500 text-[10px] p-2.5 rounded-xl border border-slate-200">
                                <p className="font-bold">Currently Waiting for Sponsors</p>
                                <p className="mt-0.5 leading-relaxed">This eatery has exhausted its prepaid fund. You can pre-pay visual leaf credits using the **Donor** panel tabs above to instantly re-enable bookings.</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination drawer show more trigger */}
            {filteredKitchens.length > displayCount && (
              <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setDisplayCount(prev => prev + 15)}
                  className="bg-slate-50 hover:bg-slate-100 text-[10.5px] font-bold text-slate-600 border border-slate-200/80 rounded-xl py-2 w-full text-center cursor-pointer block"
                >
                  Show More Eateries (+{filteredKitchens.length - displayCount} remaining)
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANEL: leaflet georeferenced canvas map */}
          <div className={`${
            isMapFullscreen
              ? 'fixed inset-0 z-[9990] h-screen w-screen bg-[#DDD9D1] flex flex-col'
              : `flex-1 h-full relative overflow-hidden bg-[#DDD9D1] ${
                  mobileViewTab === 'map' ? 'block' : 'hidden md:block'
                }`
          }`}>

            {/* Container for the map canvas and its absolute overlay controls */}
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <div ref={mapRefCallback} className="w-full h-full" style={{ height: '100%', minHeight: isMapFullscreen ? '100%' : '350px' }} />

              
              {/* GPS tracker warnings and error overlays inside map frame directly */}
              {gpsError && (
                <div className="absolute bottom-16 left-3 right-3 z-[400] z-index-[401]">
                  <div className="bg-red-50 text-red-800 text-[10.5px] py-1.5 px-3 rounded-xl border border-red-100 shadow-lg flex items-center justify-between gap-1">
                    <span className="truncate">{gpsError}</span>
                    <button onClick={() => setGpsError(null)} className="text-[12px] font-black hover:text-slate-800 px-1 cursor-pointer">✕</button>
                  </div>
                </div>
              )}

              {/* View Fullscreen Floating Toggler (Bottom-Left) */}
              <div className="absolute bottom-8 left-4 z-[400] select-none pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsMapFullscreen(prev => !prev)}
                  className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 p-2.5 rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] cursor-pointer transition-all uppercase tracking-wider"
                  title={isMapFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
                >
                  {isMapFullscreen ? (
                    <>
                      <Minimize className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Minimize Map</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Fullscreen</span>
                    </>
                  )}
                </button>
              </div>

              {/* Floating Location Finder HUD Button (Bottom-Right) */}
              <div className="absolute bottom-8 right-4 z-[400] select-none pointer-events-auto">
                <button
                  onClick={requestLiveGPS}
                  disabled={isLoadingGPS}
                  className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-80 text-white px-3.5 py-2  rounded-xl shadow-lg border border-emerald-650 flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-all uppercase tracking-wider"
                  title="Detect Device Location Coordinates"
                >
                  <Navigation className={`w-3.5 h-3.5 shrink-0 ${isLoadingGPS ? 'animate-spin' : ''}`} />
                  <span>{isLoadingGPS ? 'LOCATING...' : 'MY LOCATION'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

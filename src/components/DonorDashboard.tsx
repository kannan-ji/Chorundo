import { CreditCard, Heart, Landmark as LandmarkIcon, Sparkles, Trophy, Users } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { Donation, Kitchen } from '../types';
import L from 'leaflet';

interface DonorDashboardProps {
  kitchens: Kitchen[];
  donations: Donation[];
  onSponsorMeals: (kitchenId: string, mealsCount: number, donorName: string, message?: string) => void;
}

export default function DonorDashboard({ kitchens, donations, onSponsorMeals }: DonorDashboardProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState(kitchens[0]?.id || '');
  const [mealsCount, setMealsCount] = useState<number>(5);
  const [customMeals, setCustomMeals] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const kitchensLayerRef = useRef<L.LayerGroup | null>(null);

  const selectedKitchen = kitchens.find(k => k.id === selectedKitchenId) || kitchens[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = selectedKitchen?.lat || 10.1064;
      const initialLng = selectedKitchen?.lng || 76.3534;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Attribution control scale at bottom-right
      L.control.attribution({
        position: 'bottomleft',
        prefix: 'Chorundo? | © OpenStreetMap'
      }).addTo(map);

      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      kitchensLayerRef.current = L.layerGroup().addTo(map);

      // Multi-phase size invalidations to handle parent entry animations and CSS loading
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 300);
      setTimeout(() => map.invalidateSize(), 600);
      setTimeout(() => map.invalidateSize(), 1200);
      setTimeout(() => map.invalidateSize(), 2400);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        kitchensLayerRef.current = null;
      }
    };
  }, []);

  // Sync active kitchen pins with placards 
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = kitchensLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    kitchens.forEach((k) => {
      const isSelected = selectedKitchenId === k.id;
      const hasMeals = k.sponsoredCount > 0;
      const leavesCount = k.sponsoredCount;

      const kitchenIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center select-none pointer-events-auto" style="width: 140px; text-align: center;">
            <!-- Leaves / Meal balance bubble -->
            <div class="bg-white px-2 py-0.5 rounded-full border ${isSelected ? 'border-blue-400 bg-blue-50' : hasMeals ? 'border-emerald-300' : 'border-slate-300'} shadow-sm flex items-center justify-center gap-0.5 mb-0.5">
              <svg viewBox="0 0 100 100" class="w-2.5 h-2.5 ${isSelected ? 'fill-blue-600' : 'fill-emerald-700'} stroke-none shrink-0">
                <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
              </svg>
              <span class="text-[9.5px] font-black font-mono ${isSelected ? 'text-blue-800' : 'text-emerald-800'}">${leavesCount}</span>
            </div>
            
            <!-- Pin pointing node -->
            <div class="relative flex items-center justify-center mb-0.5">
              ${isSelected ? '<span class="absolute -inset-2.5 rounded-full bg-blue-400/30 opacity-75 animate-ping"></span>' : hasMeals ? '<span class="absolute -inset-1.5 rounded-full bg-emerald-400/20 opacity-75 animate-pulse"></span>' : ''}
              
              <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${
                isSelected
                  ? 'bg-blue-600 border-white text-white' 
                  : hasMeals
                  ? 'bg-emerald-700 border-white text-white'
                  : 'bg-slate-405 border-slate-300 text-slate-500 opacity-60'
              }">
                <svg viewBox="0 0 100 100" class="w-3.5 h-3.5 fill-current stroke-none">
                  <path d="M50 10 Q 75 30 75 80 Q 50 90 50 90 Q 50 90 25 80 Q 25 30 50 10 Z" />
                </svg>
              </div>
            </div>
            
            <!-- Permanent High-Contrast Label -->
            <div class="${isSelected ? 'bg-blue-800 text-white border-blue-900 shadow-md ring-2 ring-white' : 'bg-slate-900/95 text-white border-slate-800 shadow'} text-[9.5px] font-bold px-1.5 py-0.5 rounded border text-center whitespace-nowrap max-w-[130px] truncate">
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
        setSelectedKitchenId(k.id);
      });
      marker.addTo(layer);
    });
  }, [kitchens, selectedKitchenId]);

  // Handle map center view updates on selected selection change
  useEffect(() => {
    if (mapInstanceRef.current && selectedKitchen) {
      mapInstanceRef.current.setView([selectedKitchen.lat, selectedKitchen.lng], 14, {
        animate: true,
      });
    }
  }, [selectedKitchenId]);
  const MEAL_UNIT_COST = selectedKitchen?.mealPrice || 40;
  
  const currMeals = mealsCount === 0 ? parseInt(customMeals) || 0 : mealsCount;
  const totalAmount = currMeals * MEAL_UNIT_COST;

  // Neighborhood daily metrics calculations
  const totalSponsorships = donations.reduce((sum, d) => sum + d.mealsCount, 0);
  const totalCashFunded = donations.reduce((sum, d) => sum + d.amount, 0);

  // Simple validation & simulator triggers
  const handleCheckoutInitiation = (e: React.FormEvent) => {
    e.preventDefault();
    if (currMeals <= 0) return;

    setPaymentStep('processing');
    setTimeout(() => {
      onSponsorMeals(
        selectedKitchenId,
        currMeals,
        donorName.trim() || 'Anonymous Neighbor',
        message.trim() || undefined
      );
      setPaymentStep('success');

      // Clear fields for future donations
      setDonorName('');
      setMessage('');
      setCustomMeals('');
    }, 1800);
  };

  const resetForm = () => {
    setPaymentStep('form');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* 1. SPONSOR FORM (Left Column: 7 Units) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm relative overflow-hidden">
          {paymentStep === 'form' && (
            <form onSubmit={handleCheckoutInitiation}>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-blue-600 fill-blue-100" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Sponsor Athithi Meals</h2>
              </div>

              <div className="space-y-4">
                {/* 1. Kitchen selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select local kitchen to support:
                  </label>
                  <select
                    value={selectedKitchenId}
                    onChange={(e) => setSelectedKitchenId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {kitchens.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} (₹{k.mealPrice}/meal)
                      </option>
                    ))}
                  </select>
                  {selectedKitchen && (
                    <div className="mt-2 p-2.5 bg-emerald-50/30 border border-emerald-100/55 rounded-xl">
                      <p className="text-[10px] text-emerald-900 font-medium italic">
                        <span className="font-bold">Meal Breakup:</span> {selectedKitchen.mealDescription}
                      </p>
                    </div>
                  )}
                </div>                {/* 2. Choose meal volume packs */}
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-2">
                    How many meals would you like to pre-pay?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 5, 10, 20].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => {
                          setMealsCount(num);
                          setCustomMeals('');
                        }}
                        className={`py-3 px-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          mealsCount === num
                            ? 'border-blue-600 bg-blue-50/40 font-bold text-blue-950 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                        }`}
                      >
                        <span className="block text-base">{num} Meals</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          ₹{num * MEAL_UNIT_COST}
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setMealsCount(0);
                      }}
                      className={`col-span-2 sm:col-span-4 py-2.5 px-4 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                        mealsCount === 0
                          ? 'border-blue-600 bg-blue-50/40 font-bold text-blue-950'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-xs">Custom meal count:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          id="custom-meals-input"
                          min="1"
                          placeholder="e.g. 50"
                          value={customMeals}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMealsCount(0);
                          }}
                          onChange={(e) => {
                            setMealsCount(0);
                            setCustomMeals(e.target.value);
                          }}
                          className="bg-white border-2 border-slate-350 rounded-xl px-3 py-2 text-sm font-semibold text-center w-28 text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all shadow-inner placeholder:text-slate-400"
                        />
                        <span className="text-slate-600 font-bold text-xs uppercase tracking-wide">Meals</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">
                      Your Name (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Anonymous Neighbor"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-505 uppercase tracking-wider mb-1.5">
                      Warm Blessing/Note (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Enjoy this hot Sadhya! Love."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-semibold">Total Sponsoring Commitment:</span>
                    <span className="text-lg font-black text-blue-900">₹{totalAmount}</span>
                  </div>
                  <p className="text-[10px] text-blue-800 leading-normal">
                    Proceeding triggers our secure gateway. 100% of these-prepayments directly credit the local kitchen's active meal pool.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={currMeals <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:opacity-50 active:scale-98 text-white text-sm font-bold p-3.5 rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  Sponsor {currMeals} Meals Now
                </button>
              </div>
            </form>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
              <h3 className="font-bold text-base text-slate-800">Connecting to secure gateway...</h3>
              <p className="text-xs text-slate-400 mt-1">Sponsoring highly nutritious Sadhya plates on organic green leaves</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 shadow-md">
                <Heart className="w-8 h-8 fill-blue-600" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-blue-950">Thank You, Neighbor!</h2>
              <p className="text-sm text-slate-650 max-w-sm mt-2 leading-relaxed">
                Your pre-payment has successfully populated the kitchen's live counter. Hungry seekers matching this location can claim them instantly on a plantain leaf!
              </p>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={resetForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Sponsor More Meals
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Neighborhood Sponsorship Map */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              Neighborhood Sponsorship Map
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              Click pins to select kitchen
            </span>
          </div>

          <div className="relative w-full aspect-video md:aspect-[2.3/1] bg-[#EFECE6] border border-slate-350/40 rounded-2xl overflow-hidden shadow-inner z-0">
            <div ref={mapContainerRef} className="w-full h-full" style={{ height: '100%', minHeight: '220px' }} />
          </div>
        </div>
      </div>

      {/* 2. SPONSORSHIP LEDGER (Right Column: 5 Units) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Global Impact Grid Map / Goal */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center gap-1.5 mb-4">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Aluva-Kochi Community Goals</h3>
          </div>

          <div className="flex flex-col gap-4">
            {/* Daily Goal Visual Indicator */}
            <div className="bg-emerald-50/20 border border-emerald-100/40 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-widest font-extrabold">daily target meter</span>
                <h4 className="text-xl font-serif font-bold text-emerald-950 mt-1">189 / 200 Meals Served</h4>
                <p className="text-[10px] text-slate-550 leading-normal mt-1">
                  Almost there! Just 11 more meals to conquer our target block today. Let's make sure no neighbor sleeps on an empty stomach.
                </p>
              </div>

              {/* Progress track */}
              <div className="mt-3">
                <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[94.5%] rounded-full" />
                </div>
                <div className="flex justify-between items-center mt-1 text-[9px] text-emerald-800 font-bold font-mono">
                  <span>94.5% ACHIEVED</span>
                  <span>11 REMAINING</span>
                </div>
              </div>
            </div>

            {/* General Stats Box */}
            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-emerald-700" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Prepaid Pool</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    {totalSponsorships} Meals
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Kitchen partners</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    {kitchens.length} Local Kitchens
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center border border-blue-100">
                  <LandmarkIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Financial Feed</p>
                  <p className="text-base font-extrabold text-slate-800 font-mono">
                    ₹{totalCashFunded.toLocaleString()} 
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Honor system reminder card */}
        <div className="bg-emerald-50/85 border border-emerald-250/50 p-5 rounded-3xl">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-emerald-650 shrink-0 mt-1" />
            <div>
              <h4 className="font-serif font-bold text-emerald-950 text-sm tracking-tight">Decentralized Direct Aid</h4>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Because chorundo? uses direct-to-kitchen pre-payment mechanics, your donations directly fund local kitchens instantly. When credits are spent, kitchens cook the food and serve it. This is highly portable and decentralizable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

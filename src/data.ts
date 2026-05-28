import { Kitchen } from './types';

// Deterministic seed-based pseudo-random number generator to keep coordinates and details stable
function seedRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generates exactly 200 realistic dummy partner kitchens distributed across different hubs in Kerala
function generateDummyKitchens(): Kitchen[] {
  const list: Kitchen[] = [];
  const rand = seedRandom(20260528); // Standard fixed seed for perfect stability across hot-reloads and refreshes

  const cuisines = [
    'Traditional Kerala Rice & Curry',
    'Malabar Veg Biriyani',
    'Pure Veg Sadhya & Feasts',
    'Standard South Indian Meals',
    'Kerala Kanji & Payar Combo',
    'Chapati & Vegetable Kurma',
    'Travancore Vegetable Curry',
    'Traditional Kudumbashree Meals'
  ];

  const mealDescriptions = [
    'Rice, sambar, thoran, avial, pickle, and papadam served on a classic plantain leaf basis.',
    'Flavorful Malabar spiced vegetable biriyani with dates pickle, raita, and banana.',
    'Full Kerala sadhya with red/boiled rice, parippu, sambar, pulissery, avial, thoran, payasam.',
    'Economy meal with parboiled rice, moru curry, cabbage thoran, and mango pickle.',
    'Warm nourishing rice gruel (Kanji) with green gram (payar), chammanthi, and papad.',
    '3 soft round chapatis served with rich vegetable kurma, coconut gravy and salad.',
    'Red raw rice, pachadi, olan, kootu curry, pickle, and curd.',
    'Homely Kudumbashree styled meal containing unnakalari rice, sambar, rasam, and pickle.'
  ];

  const images = [
    'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
  ];

  const regions = [
    // Aluva/Kochi (dense around user coordinate: 10.1075, 76.3542)
    { name: 'Aluva', lat: 10.1064, lng: 76.3534, rangeLat: 0.09, rangeLng: 0.09 },
    // Kochi Central / Ernakulam (close of seeker list: ~9.9722, ~76.3156)
    { name: 'Ernakulam', lat: 9.9816, lng: 76.2999, rangeLat: 0.12, rangeLng: 0.12 },
    // Trivandrum (around Sadhya Bhavan: 8.5058, 76.9531)
    { name: 'Trivandrum', lat: 8.5241, lng: 76.9366, rangeLat: 0.15, rangeLng: 0.15 },
    // Kozhikode (around Malaya Green Leaf: 11.2508, 75.7804)
    { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, rangeLat: 0.15, rangeLng: 0.15 },
    // Thrissur
    { name: 'Thrissur', lat: 10.5276, lng: 76.2144, rangeLat: 0.10, rangeLng: 0.10 }
  ];

  const prefixes = [
    'Kairali', 'Malabar', "Amma's", 'Sri Krishna', 'Annapoorna', 'Nila',
    'Ambadi', 'Tharavadu', 'Sadhya', 'Akshaya', 'Janatha', 'Manna',
    'Oottupura', 'Kochi Veg', 'Green Leaf', 'Nadan Cafetaria', 'Vrindavan',
    'Ayodhya', 'Calicut', 'Elite', 'Aryaas', 'Safa', 'Kairali Heritage',
    'Chorundo Special', 'Pothichoru', 'Kerala Bhojana'
  ];

  const middles = [
    'Kitchen', 'Eatery', 'Mess House', 'Social Hub', 'Dining Hall',
    'Veg Corner', 'Restaurant', 'Bhojan Shala', 'Community Counter',
    'Kudumbashree Unit', 'Janakeeya Mess', 'Food Corner', 'Hotel',
    'Meals Center', 'Roti Ghar'
  ];

  const suffixes = [
    '(Community Partner)', '(Partner Kitchen)', '(Social Initiative)',
    '(Eatery)', '(Janakeeya)', '(Kudumbashree Coop)', '(Public Supported)', ''
  ];

  for (let i = 1; i <= 200; i++) {
    // Choose region; prioritize Aluva/Kochi for immediate visual mapping success
    const regionWeight = rand();
    let region = regions[0]; // default Aluva
    if (regionWeight > 0.8) {
      region = regions[4]; // Thrissur
    } else if (regionWeight > 0.6) {
      region = regions[3]; // Kozhikode
    } else if (regionWeight > 0.4) {
      region = regions[2]; // Trivandrum
    } else if (regionWeight > 0.2) {
      region = regions[1]; // Ernakulam
    }

    const latOffset = (rand() - 0.5) * region.rangeLat;
    const lngOffset = (rand() - 0.5) * region.rangeLng;

    const lat = Number((region.lat + latOffset).toFixed(4));
    const lng = Number((region.lng + lngOffset).toFixed(4));

    const pref = prefixes[Math.floor(rand() * prefixes.length)];
    const mid = middles[Math.floor(rand() * middles.length)];
    const suff = suffixes[Math.floor(rand() * suffixes.length)];
    const name = `${pref} ${mid} ${suff}`.trim();

    const cuisineIdx = Math.floor(rand() * cuisines.length);
    const cuisine = cuisines[cuisineIdx];
    const desc = mealDescriptions[cuisineIdx];

    // Some sponsoredCount values: some zero, some fully funded
    const rawSpons = rand();
    let sponsoredCount = 0;
    if (rawSpons > 0.2) {
      sponsoredCount = Math.floor(rawSpons * 25);
    }

    const claimedCount = 40 + Math.floor(rand() * 520);
    const rating = Number((4.1 + rand() * 0.8).toFixed(1));
    const mealPrice = 25 + Math.floor(rand() * 6) * 5; // 25 to 55 rupees

    const streetNum = 5 + Math.floor(rand() * 240);
    const address = `No. ${streetNum}, Near ${region.name} Junction, ${region.name}, Kerala`;
    const phone = `+91 9447${10000 + Math.floor(rand() * 89999)}`;
    const image = images[Math.floor(rand() * images.length)];

    list.push({
      id: `dummy-kitchen-${i}`,
      name,
      address,
      lat,
      lng,
      sponsoredCount,
      claimedCount,
      rating,
      cuisine,
      phone,
      image,
      mealPrice,
      mealDescription: desc,
    });
  }

  return list;
}

// Let's seed with beautiful local-first partner restaurants
const SEED_KITCHENS: Kitchen[] = [
  {
    id: 'kitchen-1',
    name: 'Janakeeya Oottupura (Community Kitchen)',
    address: 'Near Town Hall Civil Junction, Aluva',
    lat: 10.1064,
    lng: 76.3534,
    sponsoredCount: 15,
    claimedCount: 240,
    rating: 4.8,
    cuisine: 'Traditional Kerala Rice & Curry',
    phone: '+91 98456 12345',
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80',
    mealPrice: 35,
    mealDescription: 'Standard Rice, Sambar, Thoran, pickle and curd.',
  },
  {
    id: 'kitchen-2',
    name: 'Thanal Malabar Eatery',
    address: 'Vyttila Bypass road, Kochi',
    lat: 9.9722,
    lng: 76.3156,
    sponsoredCount: 8,
    claimedCount: 156,
    rating: 4.6,
    cuisine: 'Malabar Biriyani & Meals',
    phone: '+91 94477 89012',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    mealPrice: 45,
    mealDescription: 'Rice with Malabar Fish Curry/Veg options, Papadam and Salad.',
  },
  {
    id: 'kitchen-3',
    name: 'Sadhya Bhavan Social Kitchen',
    address: 'Palayam Junction, Trivandrum',
    lat: 8.5058,
    lng: 76.9531,
    sponsoredCount: 0, // Out of meals - high alert! Donors can prioritize this
    claimedCount: 412,
    rating: 4.9,
    cuisine: 'Pure Veg Feasts & Sadhya',
    phone: '+91 98765 43210',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=800&q=80',
    mealPrice: 50,
    mealDescription: 'Full Kerala Sadhya with Payasam and Fried Banana.',
  },
  {
    id: 'kitchen-4',
    name: 'Malaya Green Leaf Mess',
    address: 'Railway Station Road, Kozhikode',
    lat: 11.2508,
    lng: 75.7804,
    sponsoredCount: 22,
    claimedCount: 189,
    rating: 4.7,
    cuisine: 'Standard South Indian Meals',
    phone: '+91 99955 66778',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    mealPrice: 30,
    mealDescription: 'Economy Boiled Rice meal with Buttermilk and Avial.',
  }
];

export const INITIAL_KITCHENS: Kitchen[] = [
  ...SEED_KITCHENS,
  ...generateDummyKitchens()
];

// Quick distance helper using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

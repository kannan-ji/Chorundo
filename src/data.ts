import { Kitchen } from './types';

// Let's seed with beautiful local-first partner restaurants
export const INITIAL_KITCHENS: Kitchen[] = [
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

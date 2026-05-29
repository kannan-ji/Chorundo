export interface Kitchen {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  sponsoredCount: number;
  claimedCount: number;
  rating: number;
  cuisine: string;
  phone: string;
  image: string;
  mealPrice: number;
  mealDescription: string;
}

export interface Donation {
  id: string;
  kitchenId: string;
  kitchenName: string;
  amount: number;
  mealsCount: number;
  donorName: string;
  message?: string;
  timestamp: string;
}

export interface MealClaim {
  id: string;
  kitchenId: string;
  kitchenName: string;
  code: string;
  status: 'pending' | 'redeemed' | 'expired';
  timestamp: string;
  claimedAt?: string;
  isWalkIn: boolean; // true if guest didn't have phone, logged manually by kitchen
  seekerName?: string; // Random bookkeeping nickname for daily reset logs
}

export type Role = 'seeker' | 'donor' | 'kitchen';

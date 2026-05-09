import { distanceBetween, geohashForLocation, geohashQueryBounds } from 'geofire-common';

export type Location = {
  lat: number;
  lng: number;
  geohash?: string;
  address?: string;
};

export function getDistanceKm(loc1: Location, loc2: Location): number {
  return distanceBetween([loc1.lat, loc1.lng], [loc2.lat, loc2.lng]);
}

export function isWithinRadius(loc1: Location, loc2: Location, radiusKm: number): boolean {
  return getDistanceKm(loc1, loc2) <= radiusKm;
}

export function getGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}

export function getQueryBounds(center: [number, number], radiusInM: number) {
  return geohashQueryBounds(center, radiusInM);
}

// Simulated location (or use browser geolocation)
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          geohash: getGeohash(pos.coords.latitude, pos.coords.longitude)
        });
      },
      (err) => {
        // Default fallback (Taluka level area)
        console.warn('Geolocation failed, using default');
        resolve({
          lat: 18.5204, // Example: Pune/Taluka area
          lng: 73.8567,
          geohash: getGeohash(18.5204, 73.8567)
        });
      }
    );
  });
}

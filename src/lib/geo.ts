import { UZBEKISTAN_REGIONS } from "./regions";

export type GeoPoint = {
  lat: number;
  lng: number;
};

const REGION_COORDS: Record<(typeof UZBEKISTAN_REGIONS)[number], GeoPoint> = {
  "Qoraqalpog'iston Respublikasi": { lat: 42.461, lng: 59.600 },
  "Andijon viloyati": { lat: 40.782, lng: 72.344 },
  "Buxoro viloyati": { lat: 39.768, lng: 64.455 },
  "Farg'ona viloyati": { lat: 40.386, lng: 71.786 },
  "Jizzax viloyati": { lat: 40.115, lng: 67.842 },
  "Namangan viloyati": { lat: 40.998, lng: 71.673 },
  "Navoiy viloyati": { lat: 40.084, lng: 65.379 },
  "Qashqadaryo viloyati": { lat: 38.861, lng: 65.789 },
  "Samarqand viloyati": { lat: 39.654, lng: 66.959 },
  "Sirdaryo viloyati": { lat: 40.489, lng: 68.784 },
  "Surxondaryo viloyati": { lat: 37.224, lng: 67.278 },
  "Toshkent viloyati": { lat: 41.020, lng: 69.360 },
  "Toshkent shahri": { lat: 41.299, lng: 69.240 },
  "Xorazm viloyati": { lat: 41.550, lng: 60.633 },
};

export const getRegionCoords = (region: string): GeoPoint | null => {
  if (region in REGION_COORDS) {
    return REGION_COORDS[region as keyof typeof REGION_COORDS];
  }
  return null;
};

export const haversineKm = (a: GeoPoint, b: GeoPoint) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const formatDistance = (km: number) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const requestUserLocation = (): Promise<GeoPoint> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolokatsiya qo'llab-quvvatlanmaydi"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(new Error(error.message || "Joylashuv aniqlanmadi")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });

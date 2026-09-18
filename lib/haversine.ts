export type AvailabilityStatus = 'Available' | 'Limited' | 'Unknown' | 'Full';

/**
 * A hospital-shaped object, from either the curated Postgres dataset or an
 * OSM/community-sourced fallback. Extra fields (id, name, phone, source, etc.)
 * pass through untouched via the index signature — this function only cares
 * about the three fields it actually reads.
 */
export interface HospitalLike {
  lat: number;
  lng: number;
  specialties?: string[];
  availability?: AvailabilityStatus | string;
  [key: string]: unknown;
}

export interface RankedHospital extends HospitalLike {
  distance: number;
  etaMinutes: number;
}

/**
 * Haversine formula — compute great-circle distance between two lat/lng points.
 * Returns distance in kilometres.
 */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Availability penalty map — km-equivalent added to distance for scoring.
 * "Available" hospitals are not penalised, "Limited" get +5 km, "Full" get +20 km.
 * "Unknown" (OSM community-sourced) scores like "Limited" — worse than verified Available,
 * but not as bad as a verified Full hospital.
 */
const AVAILABILITY_PENALTY: Record<AvailabilityStatus, number> = {
  Available: 0,
  Limited: 5,
  Unknown: 5,
  Full: 20,
};

/**
 * Filter hospitals by specialty (if provided), compute distance from user,
 * sort by a combined score (distance + availability penalty when enabled),
 * and return the nearest results.
 *
 * No hard radius cutoff — in remote areas, the nearest hospital might be
 * 200+ km away, and that's still the most important result for the user.
 */
export function rankHospitals(
  hospitals: HospitalLike[],
  userLat: number,
  userLng: number,
  specialty: string | null = null,
  maxResults: number = 20,
  prioritizeAvailability: boolean = true
): RankedHospital[] {
  let filtered = hospitals;

  // Filter by specialty if specified (exact match against specialties array)
  if (specialty && specialty !== 'Any') {
    filtered = filtered.filter(
      (h) => Array.isArray(h.specialties) && h.specialties.includes(specialty)
    );
  }

  // Compute distance, ETA, and sort score
  const withDistance = filtered.map((h) => {
    const distance = Math.round(haversine(userLat, userLng, h.lat, h.lng) * 10) / 10;
    const statusKey = (h.availability as AvailabilityStatus) ?? 'Unknown';
    const penalty = prioritizeAvailability ? (AVAILABILITY_PENALTY[statusKey] ?? 0) : 0;
    return {
      ...h,
      distance,
      etaMinutes: Math.round((distance / 40) * 60),
      _score: distance + penalty,
    };
  });

  withDistance.sort((a, b) => a._score - b._score);

  // Strip internal _score before returning
  return withDistance.slice(0, maxResults).map(({ _score, ...rest }) => rest as RankedHospital);
}
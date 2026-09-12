/**
 * Haversine formula — compute great-circle distance between two lat/lng points.
 * Returns distance in kilometres.
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

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
const AVAILABILITY_PENALTY = {
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
 *
 * @param {Array} hospitals — array of hospital objects from hospitals.json
 * @param {number} userLat — user's latitude
 * @param {number} userLng — user's longitude
 * @param {string|null} specialty — filter specialty (null/empty = all)
 * @param {number} maxResults — max number of results to return (default 20)
 * @param {boolean} prioritizeAvailability — when true, apply availability penalty to sort score (default true)
 * @returns {Array} sorted hospital objects with added `distance` (km, 1 decimal) and `etaMinutes` fields
 */
export function rankHospitals(hospitals, userLat, userLng, specialty = null, maxResults = 20, prioritizeAvailability = true) {
  let filtered = hospitals;

  // Filter by specialty if specified
  if (specialty && specialty !== 'Any') {
    filtered = filtered.filter((h) =>
      h.specialties.map((s) => s.toLowerCase()).includes(specialty.toLowerCase())
    );
  }

  // Compute distance, ETA, and sort score
  const withDistance = filtered.map((h) => {
    const distance = Math.round(haversine(userLat, userLng, h.lat, h.lng) * 10) / 10;
    const penalty = prioritizeAvailability ? (AVAILABILITY_PENALTY[h.availability] || 0) : 0;
    return {
      ...h,
      distance,
      etaMinutes: Math.round((distance / 40) * 60),
      _score: distance + penalty,
    };
  });

  withDistance.sort((a, b) => a._score - b._score);

  // Strip internal _score before returning
  return withDistance.slice(0, maxResults).map(({ _score, ...rest }) => rest);
}

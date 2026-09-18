import { NextRequest, NextResponse } from 'next/server';
import { haversine, rankHospitals, type HospitalLike, type AvailabilityStatus } from '@/lib/haversine';
import { fetchOSMHospitalsExpanding } from '@/lib/overpass';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CANONICAL_SPECIALTIES = [
  'Trauma',
  'Cardiac',
  'ICU',
  'Burns',
  'Pediatric',
  'Dialysis',
  'Maternity',
];

const STATUS_PRIORITY: Record<AvailabilityStatus, number> = {
  Available: 0,
  Limited: 1,
  Full: 2,
  Unknown: 3,
};

interface SpecialtyRow {
  specialty: { name: string };
  availabilityStatus: string;
  lastUpdated: Date;
}

function pickRepresentative(hospitalSpecialties: SpecialtyRow[] | undefined) {
  if (!hospitalSpecialties || hospitalSpecialties.length === 0) {
    return { availability: 'Unknown' as AvailabilityStatus, lastUpdated: null as Date | null };
  }
  const best = [...hospitalSpecialties].sort(
    (a, b) =>
      (STATUS_PRIORITY[a.availabilityStatus as AvailabilityStatus] ?? 3) -
      (STATUS_PRIORITY[b.availabilityStatus as AvailabilityStatus] ?? 3)
  )[0];
  return {
    availability: best.availabilityStatus as AvailabilityStatus,
    lastUpdated: best.lastUpdated as Date | null,
  };
}

interface TaggedHospital extends HospitalLike {
  id: string;
  name: string;
  phone: string | null;
  specialties: string[];
  availability: AvailabilityStatus;
  lastUpdated: Date | null;
  source: 'curated' | 'osm';
}

/**
 * GET /api/hospitals?lat=28.61&lng=77.20&specialty=Cardiac&prioritizeAvailability=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');
    const rawSpecialty = searchParams.get('specialty');
    const prioritizeAvailability = searchParams.get('prioritizeAvailability') !== 'false';

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Missing or invalid lat/lng query parameters' },
        { status: 400 }
      );
    }

    const targetSpecialty: string | null =
      !rawSpecialty || rawSpecialty.trim() === '' || rawSpecialty.trim().toLowerCase() === 'any'
        ? null
        : CANONICAL_SPECIALTIES.find((s) => s.toLowerCase() === rawSpecialty.trim().toLowerCase()) ||
          rawSpecialty.trim();

    // 1. Load curated hospitals from Postgres, with their per-specialty availability
    const dbHospitals = await prisma.hospital.findMany({
      include: {
        specialties: { include: { specialty: true } },
      },
    });

    console.log(
      `[GET /api/hospitals] query specialty: "${rawSpecialty}", resolved: "${targetSpecialty}", sample specialties:`,
      dbHospitals[0]?.specialties.map((hs) => hs.specialty.name)
    );

    // 2. Flatten into the same shape the ranking logic has always expected
    const taggedCurated: TaggedHospital[] = dbHospitals.map((h) => {
      const specialtyNames = h.specialties.map((hs) => hs.specialty.name);

      let availability: AvailabilityStatus;
      let lastUpdated: Date | null;
      if (targetSpecialty) {
        const match = h.specialties.find((hs) => hs.specialty.name === targetSpecialty);
        availability = (match ? match.availabilityStatus : 'Unknown') as AvailabilityStatus;
        lastUpdated = match ? match.lastUpdated : null;
      } else {
        const rep = pickRepresentative(h.specialties);
        availability = rep.availability;
        lastUpdated = rep.lastUpdated;
      }

      return {
        id: h.id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        phone: h.phone,
        specialties: specialtyNames,
        availability,
        lastUpdated,
        source: 'curated' as const,
      };
    });

    // 3. Strict exact-match filtering by specialty (unchanged logic)
    const filteredCurated = targetSpecialty
      ? taggedCurated.filter((h) => h.specialties.includes(targetSpecialty))
      : taggedCurated;

    const curatedRanked = rankHospitals(
      filteredCurated,
      lat,
      lng,
      targetSpecialty,
      30,
      prioritizeAvailability
    );

    let results: typeof curatedRanked = [];
    let fallbackResults: typeof curatedRanked = [];
    let fallbackLabel: string | null = null;

    if (!targetSpecialty) {
      const osmHospitals = await fetchOSMHospitalsExpanding(lat, lng);
      const dedupedOSM = osmHospitals.filter((osm) => {
        return !curatedRanked.some((curated) => {
          const dist = haversine(osm.lat, osm.lng, curated.lat, curated.lng);
          return dist < 0.3;
        });
      });

      const merged = [...curatedRanked, ...dedupedOSM];
      results = rankHospitals(merged, lat, lng, null, 30, prioritizeAvailability);
    } else {
      results = curatedRanked;

      const NEARBY_THRESHOLD_KM = 50;
      const nearbyCuratedCount = curatedRanked.filter(
        (h) => typeof h.distance === 'number' && h.distance <= NEARBY_THRESHOLD_KM
      ).length;

      if (nearbyCuratedCount < 3) {
        const osmHospitals = await fetchOSMHospitalsExpanding(lat, lng);
        const dedupedOSM = osmHospitals.filter((osm) => {
          return !curatedRanked.some((curated) => {
            const dist = haversine(osm.lat, osm.lng, curated.lat, curated.lng);
            return dist < 0.3;
          });
        });

        if (dedupedOSM.length > 0) {
          fallbackResults = rankHospitals(dedupedOSM, lat, lng, null, 10, prioritizeAvailability);
          fallbackLabel = 'Nearby general hospitals (specialty not confirmed)';
        }
      }
    }

    const curatedCount = results.filter((h) => h.source === 'curated').length;
    const communityCount = results.filter((h) => h.source === 'osm').length + fallbackResults.length;

    return NextResponse.json({
      results,
      fallbackResults,
      fallbackLabel,
      count: results.length,
      fallbackCount: fallbackResults.length,
      sources: { curated: curatedCount, community: communityCount },
    });
  } catch (err) {
    console.error('GET /api/hospitals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
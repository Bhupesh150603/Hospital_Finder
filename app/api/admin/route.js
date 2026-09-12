import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), 'data', 'hospitals.json');

/**
 * GET /api/admin — return all hospitals (for the admin panel)
 * Merges static hospital list with Redis availability overrides.
 */
export async function GET() {
  try {
    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const hospitals = JSON.parse(rawData);

    // Fetch Redis overrides in parallel for each hospital
    const overrides = await Promise.all(
      hospitals.map(async (h) => {
        try {
          const val = await redis.get(`availability:${h.id}`);
          if (!val) return null;
          return typeof val === 'string' ? JSON.parse(val) : val;
        } catch (err) {
          console.error(`Error reading Redis override for ${h.id}:`, err);
          return null;
        }
      })
    );

    const mergedHospitals = hospitals.map((h, index) => {
      const override = overrides[index];
      if (!override) return h;
      return {
        ...h,
        availability: override.status || override.availability || h.availability,
        lastUpdated: override.lastUpdated || h.lastUpdated,
      };
    });

    return NextResponse.json({ hospitals: mergedHospitals });
  } catch (err) {
    console.error('GET /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin — update a hospital's availability
 * Body: { id: "del1", availability: "Available" | "Limited" | "Full" }
 * Stores the update in Redis under key `availability:${hospitalId}`.
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const hospitalId = body.id || body.hospitalId;
    const status = body.availability || body.status;

    if (!hospitalId || !['Available', 'Limited', 'Full'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid id or availability value. Must be Available, Limited, or Full.' },
        { status: 400 }
      );
    }

    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const hospitals = JSON.parse(rawData);

    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: `Hospital with id "${hospitalId}" not found` }, { status: 404 });
    }

    const lastUpdated = new Date().toISOString();
    const payload = {
      status,
      lastUpdated,
    };

    // Store in Redis with key availability:${hospitalId} as a JSON string
    await redis.set(`availability:${hospitalId}`, JSON.stringify(payload));

    return NextResponse.json({
      message: 'Availability updated',
      hospital: {
        ...hospital,
        availability: status,
        lastUpdated,
      },
    });
  } catch (err) {
    console.error('PATCH /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

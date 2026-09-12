import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'hospitals.json');

/**
 * GET /api/admin — return all hospitals (for the admin panel)
 */
export async function GET() {
  try {
    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const hospitals = JSON.parse(rawData);
    return NextResponse.json({ hospitals });
  } catch (err) {
    console.error('GET /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin — update a hospital's availability
 * Body: { id: "h1", availability: "Available" | "Limited" | "Full" }
 */
export async function PATCH(request) {
  try {
    const { id, availability } = await request.json();

    if (!id || !['Available', 'Limited', 'Full'].includes(availability)) {
      return NextResponse.json(
        { error: 'Invalid id or availability value. Must be Available, Limited, or Full.' },
        { status: 400 }
      );
    }

    const rawData = await fs.readFile(DATA_PATH, 'utf-8');
    const hospitals = JSON.parse(rawData);

    const hospitalIndex = hospitals.findIndex((h) => h.id === id);
    if (hospitalIndex === -1) {
      return NextResponse.json({ error: `Hospital with id "${id}" not found` }, { status: 404 });
    }

    hospitals[hospitalIndex].availability = availability;
    hospitals[hospitalIndex].lastUpdated = new Date().toISOString();

    // Write back to disk
    await fs.writeFile(DATA_PATH, JSON.stringify(hospitals, null, 2), 'utf-8');

    return NextResponse.json({
      message: 'Availability updated',
      hospital: hospitals[hospitalIndex],
    });
  } catch (err) {
    console.error('PATCH /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

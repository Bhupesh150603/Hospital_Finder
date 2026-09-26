import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AvailabilityStatus } from '@/lib/haversine';

export const dynamic = 'force-dynamic';

const STATUS_PRIORITY: Record<AvailabilityStatus, number> = {
  Available: 0,
  Limited: 1,
  Full: 2,
  Unknown: 3,
};

interface SpecialtyRow {
  id: string;
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

/** GET /api/admin — the logged-in admin's own hospital, with per-specialty detail and recent activity */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: session.user.hospitalId },
      include: { specialties: { include: { specialty: true } } },
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const specialties = hospital.specialties
      .map((hs) => ({
        id: hs.id,
        name: hs.specialty.name,
        availability: hs.availabilityStatus,
        lastUpdated: hs.lastUpdated,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const recentHistory = await prisma.availabilityHistory.findMany({
      where: { hospitalSpecialty: { hospitalId: session.user.hospitalId } },
      include: { hospitalSpecialty: { include: { specialty: true } } },
      orderBy: { changedAt: 'desc' },
      take: 10,
    });

    const activity = recentHistory.map((h) => ({
      specialty: h.hospitalSpecialty.specialty.name,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      changedAt: h.changedAt,
    }));

    return NextResponse.json({
      hospital: { id: hospital.id, name: hospital.name, phone: hospital.phone },
      specialties,
      activity,
    });
  } catch (err) {
    console.error('GET /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/admin — update availability, ONLY for the hospital the logged-in admin owns */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PatchBody = await request.json();
    const hospitalId = body.id || body.hospitalId;
    const status = body.availability || body.status;
    const specialtyName = body.specialty || null;

    if (!hospitalId || !status || !['Available', 'Limited', 'Full'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid id or availability value. Must be Available, Limited, or Full.' },
        { status: 400 }
      );
    }

    if (hospitalId !== session.user.hospitalId) {
      return NextResponse.json(
        { error: 'Forbidden: you can only update your own hospital' },
        { status: 403 }
      );
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: { specialties: { include: { specialty: true } } },
    });

    if (!hospital) {
      return NextResponse.json({ error: `Hospital with id "${hospitalId}" not found` }, { status: 404 });
    }

    const rowsToUpdate = specialtyName
      ? hospital.specialties.filter((hs) => hs.specialty.name === specialtyName)
      : hospital.specialties;

    if (rowsToUpdate.length === 0) {
      return NextResponse.json({ error: `Specialty "${specialtyName}" not found for this hospital` }, { status: 404 });
    }

    const lastUpdated = new Date();

    for (const row of rowsToUpdate) {
      await prisma.$transaction([
        prisma.availabilityHistory.create({
          data: {
            hospitalSpecialtyId: row.id,
            previousStatus: row.availabilityStatus,
            newStatus: status,
            changedByAdminId: session.user.id,
          },
        }),
        prisma.hospitalSpecialty.update({
          where: { id: row.id },
          data: { availabilityStatus: status, lastUpdated },
        }),
      ]);
    }

    return NextResponse.json({
      message: 'Availability updated',
      hospital: {
        id: hospital.id,
        name: hospital.name,
        updatedSpecialties: rowsToUpdate.map((r) => r.specialty.name),
        availability: status,
        lastUpdated: lastUpdated.toISOString(),
      },
    });
  } catch (err) {
    console.error('PATCH /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
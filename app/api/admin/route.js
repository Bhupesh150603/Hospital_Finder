import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STATUS_PRIORITY = { Available: 0, Limited: 1, Full: 2, Unknown: 3 };

function pickRepresentative(hospitalSpecialties) {
  if (!hospitalSpecialties || hospitalSpecialties.length === 0) {
    return { availability: 'Unknown', lastUpdated: null };
  }
  const best = [...hospitalSpecialties].sort(
    (a, b) => (STATUS_PRIORITY[a.availabilityStatus] ?? 3) - (STATUS_PRIORITY[b.availabilityStatus] ?? 3)
  )[0];
  return { availability: best.availabilityStatus, lastUpdated: best.lastUpdated };
}

/** GET /api/admin — list ONLY the logged-in admin's own hospital */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitals = await prisma.hospital.findMany({
      where: { id: session.user.hospitalId },
      include: { specialties: { include: { specialty: true } } },
      orderBy: { name: 'asc' },
    });

    const shaped = hospitals.map((h) => {
      const specialties = h.specialties.map((hs) => ({
        name: hs.specialty.name,
        availability: hs.availabilityStatus,
        lastUpdated: hs.lastUpdated,
      }));
      const rep = pickRepresentative(h.specialties);
      return {
        id: h.id,
        name: h.name,
        phone: h.phone,
        availability: rep.availability,
        lastUpdated: rep.lastUpdated,
        specialties,
      };
    });

    return NextResponse.json({ hospitals: shaped });
  } catch (err) {
    console.error('GET /api/admin error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PATCH /api/admin — update availability, ONLY for the hospital the logged-in admin owns */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const hospitalId = body.id || body.hospitalId;
    const status = body.availability || body.status;
    const specialtyName = body.specialty || null;

    if (!hospitalId || !['Available', 'Limited', 'Full'].includes(status)) {
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
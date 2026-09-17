import { PrismaClient } from "@prisma/client";
import hospitalsData from "../data/hospitals.json";

const prisma = new PrismaClient();

async function main() {
  // 1. Collect every unique specialty name across the dataset and create it once.
  const specialtyNames = new Set<string>();
  for (const h of hospitalsData as any[]) {
    for (const s of h.specialties ?? []) specialtyNames.add(s);
  }

  const specialtyIdByName = new Map<string, string>();
  for (const name of specialtyNames) {
    const specialty = await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    specialtyIdByName.set(name, specialty.id);
  }
  console.log(`Seeded ${specialtyIdByName.size} specialties.`);

  // 2. Create each hospital plus one HospitalSpecialty row per specialty it offers.
  let count = 0;
  for (const h of hospitalsData as any[]) {
    if (h.source === "osm") continue; // never seed live/community-sourced entries

    await prisma.hospital.create({
      data: {
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        phone: h.phone ?? null,
        source: "curated",
        specialties: {
          create: (h.specialties ?? []).map((specialtyName: string) => ({
            specialtyId: specialtyIdByName.get(specialtyName)!,
            availabilityStatus: h.availability ?? "Unknown",
          })),
        },
      },
    });
    count++;
  }
  console.log(`Seeded ${count} hospitals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
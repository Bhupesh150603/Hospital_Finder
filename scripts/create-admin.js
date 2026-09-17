const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, hospitalName] = process.argv;

  if (!email || !password || !hospitalName) {
    console.error('Usage: node scripts/create-admin.js <email> <password> "<hospital name>"');
    process.exit(1);
  }

  const hospital = await prisma.hospital.findFirst({
    where: { name: { contains: hospitalName, mode: 'insensitive' } },
  });

  if (!hospital) {
    console.error(`No hospital found matching "${hospitalName}"`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, hospitalId: hospital.id },
    create: { email, passwordHash, hospitalId: hospital.id },
  });

  console.log(`Admin created: ${admin.email} -> linked to "${hospital.name}"`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
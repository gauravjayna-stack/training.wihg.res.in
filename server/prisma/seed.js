require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@wihg.res.in';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Training Cell Admin',
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'ADMIN',
      },
    });
    console.log(`Created admin account: ${adminEmail}`);
  }

  const existingAccounts = await prisma.user.findUnique({ where: { email: 'accounts@wihg.res.in' } });
  if (!existingAccounts) {
    await prisma.user.create({
      data: {
        name: 'Accounts Section',
        email: 'accounts@wihg.res.in',
        password: await bcrypt.hash('ChangeMe123!', 12),
        role: 'ACCOUNTS',
      },
    });
    console.log('Created accounts account: accounts@wihg.res.in');
  }

  const sampleScientists = [
    { name: 'Dr. A. Sharma', specialization: 'Seismology & Geodynamics', email: 'a.sharma@wihg.res.in' },
    { name: 'Dr. R. Bhattacharya', specialization: 'Paleoclimatology', email: 'r.bhattacharya@wihg.res.in' },
    { name: 'Dr. S. Rawat', specialization: 'Structural Geology', email: 's.rawat@wihg.res.in' },
  ];

  for (const s of sampleScientists) {
    const existingUser = await prisma.user.findUnique({ where: { email: s.email } });
    if (existingUser) continue;
    const user = await prisma.user.create({
      data: { name: s.name, email: s.email, password: await bcrypt.hash('ChangeMe123!', 12), role: 'SCIENTIST' },
    });
    await prisma.scientist.create({
      data: { userId: user.id, name: s.name, specialization: s.specialization, email: s.email, availableSeats: 3 },
    });
    console.log(`Created scientist: ${s.email}`);
  }

  console.log('\nSeed complete. Default password for seeded staff accounts (except admin, which uses SEED_ADMIN_PASSWORD): ChangeMe123!');
  console.log('CHANGE ALL SEEDED PASSWORDS IMMEDIATELY AFTER FIRST LOGIN.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
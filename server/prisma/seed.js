require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@wihg.res.in';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  // 1. Seed Admin User
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

  // 2. Seed Accounts User
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

  // 3. Seed Sample Scientists with ScientistProfile
  const sampleScientists = [
    { name: 'Dr. A. Sharma', department: 'Seismology & Geodynamics', email: 'a.sharma@wihg.res.in' },
    { name: 'Dr. R. Bhattacharya', department: 'Paleoclimatology', email: 'r.bhattacharya@wihg.res.in' },
    { name: 'Dr. S. Rawat', department: 'Structural Geology', email: 's.rawat@wihg.res.in' },
  ];

  for (const s of sampleScientists) {
    const existingUser = await prisma.user.findUnique({ where: { email: s.email } });
    if (existingUser) continue;

    // Create User record and linked ScientistProfile record simultaneously
    await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: await bcrypt.hash('ChangeMe123!', 12),
        role: 'SCIENTIST',
        scientistProfile: {
          create: {
            department: s.department,
            maxStudents: 5,
          },
        },
      },
    });
    console.log(`Created scientist profile for: ${s.email}`);
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
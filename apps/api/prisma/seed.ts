import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding universities...');

  const universities = [
    {
      name: 'Massachusetts Institute of Technology',
      emailDomain: 'mit.edu',
      city: 'Cambridge',
      country: 'USA',
      active: true,
    },
    {
      name: 'Stanford University',
      emailDomain: 'stanford.edu',
      city: 'Stanford',
      country: 'USA',
      active: true,
    },
    {
      name: 'BRAC University',
      emailDomain: 'bracu.ac.bd',
      city: 'Dhaka',
      country: 'Bangladesh',
      active: true,
    },
    {
      name: 'University of Oxford',
      emailDomain: 'ox.ac.uk',
      city: 'Oxford',
      country: 'UK',
      active: true,
    },
    {
      name: 'North South University',
      emailDomain: 'northsouth.edu',
      city: 'Dhaka',
      country: 'Bangladesh',
      active: true,
    },
  ];

  for (const university of universities) {
    await prisma.university.upsert({
      where: { emailDomain: university.emailDomain },
      update: university,
      create: university,
    });
  }

  console.log('Universities seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

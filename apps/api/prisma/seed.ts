import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding universities...');

  const universities = [
    { name: 'Massachusetts Institute of Technology', emailDomain: 'mit.edu', city: 'Cambridge', country: 'US' },
    { name: 'Stanford University', emailDomain: 'stanford.edu', city: 'Stanford', country: 'US' },
    { name: 'University of California Los Angeles', emailDomain: 'ucla.edu', city: 'Los Angeles', country: 'US' },
    { name: 'University of Oxford', emailDomain: 'ox.ac.uk', city: 'Oxford', country: 'UK' },
    { name: 'University of Cambridge', emailDomain: 'cam.ac.uk', city: 'Cambridge', country: 'UK' },
    { name: 'Harvard University', emailDomain: 'harvard.edu', city: 'Cambridge', country: 'US' },
    { name: 'Imperial College London', emailDomain: 'imperial.ac.uk', city: 'London', country: 'UK' },
    { name: 'National University of Singapore', emailDomain: 'nus.edu.sg', city: 'Singapore', country: 'SG' },
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding universities...');

  const universities = [
    { name: 'MIT', emailDomain: 'mit.edu', city: 'Cambridge', country: 'USA' },
    { name: 'Stanford University', emailDomain: 'stanford.edu', city: 'Stanford', country: 'USA' },
    { name: 'UCLA', emailDomain: 'ucla.edu', city: 'Los Angeles', country: 'USA' },
    { name: 'University of Oxford', emailDomain: 'ox.ac.uk', city: 'Oxford', country: 'UK' },
    { name: 'University of Cambridge', emailDomain: 'cam.ac.uk', city: 'Cambridge', country: 'UK' },
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

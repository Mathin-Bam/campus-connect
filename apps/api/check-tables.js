require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const counts = {
    users:            await prisma.user.count(),
    universities:     await prisma.university.count(),
    activityStatuses: await prisma.activityStatus.count(),
    chatThreads:      await prisma.chatThread.count(),
    messages:         await prisma.message.count(),
  };
  console.log('ALL TABLES OK:', JSON.stringify(counts));
  await prisma.$disconnect();
}

check().catch(e => console.log('TABLE ERROR:', e.message));

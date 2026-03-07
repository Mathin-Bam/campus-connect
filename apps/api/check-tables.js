require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.count();
    const unis = await prisma.university.count();
    const statuses = await prisma.activityStatus.count();
    const threads = await prisma.chatThread.count();
    console.log('users:', users, 'universities:', unis, 'statuses:', statuses, 'threads:', threads);
  } catch(e) {
    console.log('TABLE ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();

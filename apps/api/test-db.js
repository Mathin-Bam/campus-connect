require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => prisma.$queryRaw`SELECT current_database(), inet_server_addr()`)
  .then(r => { console.log('CONNECTED OK:', JSON.stringify(r)); return prisma.$disconnect(); })
  .catch(e => console.log('CONNECT FAILED:', e.message));

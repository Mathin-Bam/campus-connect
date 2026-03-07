require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.university.findMany({ select: { name: true, emailDomain: true } })
  .then(r => { console.log('UNIVERSITIES:', JSON.stringify(r, null, 2)); return prisma.$disconnect(); })
  .catch(e => console.log('ERROR:', e.message));

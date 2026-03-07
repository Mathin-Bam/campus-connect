require('dotenv').config();
console.log('--- Diagnostic 1 ---');
const url = process.env.DATABASE_URL;
console.log('Mode:', url?.includes('pgbouncer=true') ? 'pgBouncer ON' : 'pgBouncer OFF');
console.log('Port:', url?.match(/:(\d+)\//)?.[1]);
console.log('Host:', url?.match(/@([^:]+):/)?.[1]);

console.log('--- Diagnostic 2 ---');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error', 'warn'] });
prisma.$connect()
  .then(() => prisma.$queryRaw`SELECT current_database(), current_user, version()`)
  .then(r => { console.log('SUCCESS:', JSON.stringify(r, (key, value) => typeof value === 'bigint' ? value.toString() : value)); prisma.$disconnect(); })
  .catch(e => { console.log('ERROR CODE:', e.code); console.log('ERROR MSG:', e.message); console.log('ERROR META:', JSON.stringify(e.meta)); });

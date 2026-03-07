require('dotenv').config();
console.log('--- Diagnostic 5 ---');
const { PrismaClient } = require('@prisma/client');
const prisma2 = new PrismaClient();
console.log('Models available:', Object.keys(prisma2).filter(k => !k.startsWith('_') && !k.startsWith('$')));
prisma2.$disconnect();

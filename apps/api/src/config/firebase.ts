import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { env } from './env';

const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

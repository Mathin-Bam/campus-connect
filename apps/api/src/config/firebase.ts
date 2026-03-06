import * as admin from 'firebase-admin';
import { env } from './env';

// Parse service account - handle both file path and direct JSON
let serviceAccount: any;
try {
  // First try to parse as JSON directly
  serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  // If that fails, it might be a file path - but we should update env to contain JSON
  throw new Error('FIREBASE_SERVICE_ACCOUNT must contain valid JSON content, not a file path');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();

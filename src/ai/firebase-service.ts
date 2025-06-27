
import { initializeApp, getApps, getApp as getAdminApp, type App } from 'firebase-admin/app';

export function getFirebaseAdminApp(){
    // Initialize Firebase Admin SDK
    let adminApp: App;

    if (!getApps().length) {
        adminApp = initializeApp({
            databaseURL: process.env.FIREBASE_DATABASE_URL
        }); // Uses GOOGLE_APPLICATION_CREDENTIALS by default
    } else {
        adminApp = getAdminApp();
    }
    return adminApp
}
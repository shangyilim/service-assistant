
import { initializeApp, getApps, getApp as getAdminApp, type App } from 'firebase-admin/app';

export function getFirebaseAdminApp(){
    // Initialize Firebase Admin SDK
    let adminApp: App;

    if (!getApps().length) {
        adminApp = initializeApp({
            databaseURL: "https://data-weaver-s5c6o-default-rtdb.firebaseio.com"
        }); // Uses GOOGLE_APPLICATION_CREDENTIALS by default
    } else {
        adminApp = getAdminApp();
    }
    return adminApp
}
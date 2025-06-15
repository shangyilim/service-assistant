
// TODO: Add your Firebase project configuration object here.
// See https://firebase.google.com/docs/web/setup#available-libraries

// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAhV83hnME4Bsr2N-AWr1CnRsnuf7q8rUY",
  authDomain: "data-weaver-s5c6o.firebaseapp.com",
  projectId: "data-weaver-s5c6o",
  storageBucket: "data-weaver-s5c6o.firebasestorage.app",
  messagingSenderId: "61794580576",
  appId: "1:61794580576:web:1ed536b773c67f6e40ab05"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { app, auth, db };

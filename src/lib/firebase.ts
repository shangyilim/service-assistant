
// TODO: Add your Firebase project configuration object here.
// See https://firebase.google.com/docs/web/setup#available-libraries

// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYoz82McxBLhx0PlJFnJSoFvbEJvfuJy4",
  authDomain: "my-awesome-app-c2b7b.firebaseapp.com",
  projectId: "my-awesome-app-c2b7b",
  storageBucket: "my-awesome-app-c2b7b.firebasestorage.app",
  messagingSenderId: "282688757148",
  appId: "1:282688757148:web:de6c53282116e1f3b73c59",
  measurementId: "G-PN4GMEXQY1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { app, auth, db };

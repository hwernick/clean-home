import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDv8wQtzqPRF-XFwrniwSetYYY5QcTcinc",
  authDomain: "moonbeam-b5533.firebaseapp.com",
  projectId: "moonbeam-b5533",
  storageBucket: "moonbeam-b5533.firebasestorage.app",
  messagingSenderId: "442440058282",
  appId: "1:442440058282:web:f1dd54ee897b6928f457d3",
  measurementId: "G-56ZNCTPEMC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only if supported
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null); 
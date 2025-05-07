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

class FirebaseService {
  private static instance: FirebaseService;
  private app: any;
  private auth: any;
  private db: any;
  private analytics: any;
  private initialized = false;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      
      const supported = await isSupported();
      if (supported) {
        this.analytics = getAnalytics(this.app);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  public async getAuth() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.auth;
  }

  public async getFirestore() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.db;
  }

  public async getAnalytics() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.analytics;
  }
}

export default FirebaseService; 
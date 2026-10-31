import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

/**
 * Cấu hình kết nối Firebase Client
 * Sử dụng biến môi trường chuẩn Vite (import.meta.env.VITE_*)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoHospitalITKey123456789',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hospital-it-management.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hospital-it-management',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hospital-it-management.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMOHOSPITAL',
};

// Khởi tạo Firebase App (Singleton Pattern)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo các dịch vụ Firebase cốt lõi
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

export default firebaseApp;

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Cấu hình kết nối Firebase Client - Dự án HospitalITManagement
 * Bệnh viện Phục hồi chức năng 
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCJvbxnaGunb_vwC4oQwABjL_9YuHf2pRc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hospitalitmanagement.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hospitalitmanagement",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hospitalitmanagement.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "220124471487",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:220124471487:web:184931d3e2c08172cba60a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4N07X2DJCQ"
};

// Khởi tạo Firebase App (Singleton Pattern)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo các dịch vụ Firebase cốt lõi
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

// Khởi tạo Google Analytics an toàn trên môi trường trình duyệt
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  });
}

export default firebaseApp;

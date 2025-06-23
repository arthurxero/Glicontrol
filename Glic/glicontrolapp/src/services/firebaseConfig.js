// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Make sure this import is present

const firebaseConfig = {
  apiKey: "AIzaSyD8ZIxRo28epx4Ru40V6rsMULb-s4WKoY8",
  authDomain: "glicontrol-270027.firebaseapp.com",
  databaseURL: "https://glicontrol-270027-default-rtdb.firebaseio.com",
  projectId: "glicontrol-270027",
  storageBucket: "glicontrol-270027.firebasestorage.app",
  messagingSenderId: "1038933584725",
  appId: "1:1038933584725:web:0bcd987ceecd3d9e6b1ddc",
  measurementId: "G-CDGDBCFYZ4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Make sure this export is present

export default app;
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const database = getDatabase(app);

export { app, analytics, database };
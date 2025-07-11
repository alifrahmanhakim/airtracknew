// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVT1PDkGdczXUP_LatsS6Q4K1h0xvXeT0",
  authDomain: "aoc-insight.firebaseapp.com",
  projectId: "aoc-insight",
  storageBucket: "aoc-insight.firebasestorage.app",
  messagingSenderId: "795850632942",
  appId: "1:795850632942:web:55b981db48b076bfadcdff",
  measurementId: "G-CNFZC766E2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

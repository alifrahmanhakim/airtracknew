
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVT1PDkGdczXUP_LatsS6Q4K1h0xvXeT0",
  authDomain: "fir-studi-189f7.firebaseapp.com",
  projectId: "fir-studi-189f7",
  storageBucket: "fir-studi-189f7.appspot.com",
  messagingSenderId: "1052187394339",
  appId: "1:1052187394339:web:0b73fb519541315e7146c2",
  measurementId: "G-G5D12H2TCS"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { db, storage, app, auth, googleProvider };

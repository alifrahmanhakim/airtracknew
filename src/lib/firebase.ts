
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual config
    authDomain: "aoc-insight.firebaseapp.com",
    projectId: "aoc-insight",
    storageBucket: "aoc-insight.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual config
    appId: "YOUR_APP_ID", // Replace with your actual config
    measurementId: "YOUR_MEASUREMENT_ID" // Replace with your actual config
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { db, storage, app, auth, googleProvider };

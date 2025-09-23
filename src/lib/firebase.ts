// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqr_jQW1ZxMuBjLDmDsoSZA8RKF-kjHO0",
  authDomain: "airtrack-c7979.firebaseapp.com",
  projectId: "airtrack-c7979",
  storageBucket: "airtrack-c7979.appspot.com",
  messagingSenderId: "1090515897511",
  appId: "1:1090515897511:web:40a0425c8ce80d70599f82",
  measurementId: "G-DFBV3WYJ6M"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
// const analytics = getAnalytics(app);


export { db, storage, app, auth, googleProvider };

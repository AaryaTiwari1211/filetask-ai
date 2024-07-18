// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, getStorage } from "firebase/firestore/lite";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC9zim5ibEEu5JwoX7yv_JGau0q7nPywdI",
  authDomain: "filetask-c17cc.firebaseapp.com",
  projectId: "filetask-c17cc",
  storageBucket: "filetask-c17cc.appspot.com",
  messagingSenderId: "537025687352",
  appId: "1:537025687352:web:b0d35f37075a83e0265bcd",
  measurementId: "G-ND3916DJNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
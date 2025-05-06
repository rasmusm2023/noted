// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyCIvdUvg0EGaMGOVuD3scds2z2PsvgElwA",

  authDomain: "noted-fb.firebaseapp.com",

  projectId: "noted-fb",

  storageBucket: "noted-fb.firebasestorage.app",

  messagingSenderId: "779856918011",

  appId: "1:779856918011:web:2900331c236c38589bc75e",

  measurementId: "G-TSBS5LQQEC",
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;

import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCln37sHcVHF9-EjmYSst-Q_Sg52P3lnM",
  authDomain: "healthly-56d51.firebaseapp.com",
  projectId: "healthly-56d51",
  storageBucket: "healthly-56d51.firebasestorage.app",
  messagingSenderId: "1052827018330",
  appId: "1:1052827018330:web:9890e10328338705b7a463",
  measurementId: "G-KR5Z3P5HFN",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== "undefined") {
  void isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const dbDefault = getFirestore(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : dbDefault;
export const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Failed to set Firebase auth persistence", error);
});

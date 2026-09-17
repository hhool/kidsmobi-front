import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Auth-only Firebase setup. Firestore metadata (CMS content, asset catalog)
// now lives in Cloudflare D1 behind the Worker API — see cmsD1Service.ts.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Failed to set Firebase auth persistence", error);
});

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { CMSProduct, CMSContent, CMSSettings } from "../types";

export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  // Special bootstrap for the developer email
  const currentUser = auth.currentUser;
  if (currentUser?.email === "hhool.student@gmail.com") {
    // If it's the bootstrap admin, ensure the record exists
    const adminDoc = doc(db, "admins", uid);
    const snap = await getDoc(adminDoc);
    if (!snap.exists()) {
      await setDoc(adminDoc, { userId: uid, email: currentUser.email, role: "superadmin" });
    }
    return true;
  }
  
  const adminDoc = doc(db, "admins", uid);
  const snap = await getDoc(adminDoc);
  return snap.exists();
}

// Product Management
export async function getCMSProducts(): Promise<CMSProduct[]> {
  const q = query(collection(db, "products"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CMSProduct);
}

export async function saveCMSProduct(product: CMSProduct) {
  const pDoc = doc(db, "products", product.id);
  await setDoc(pDoc, {
    ...product,
    updatedAt: serverTimestamp()
  });
}

// Content Management (News/Guides)
export async function getCMSContent(type?: "news" | "guide"): Promise<CMSContent[]> {
  let q = query(collection(db, "content"), orderBy("updatedAt", "desc"));
  if (type) {
    q = query(collection(db, "content"), where("type", "==", type), orderBy("updatedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as CMSContent);
}

export async function saveCMSContent(content: CMSContent) {
  const cDoc = doc(db, "content", content.id);
  await setDoc(cDoc, {
    ...content,
    updatedAt: serverTimestamp()
  });
}

// Global Settings
export async function getCMSSettings(): Promise<CMSSettings | null> {
  const sDoc = doc(db, "settings", "global");
  const snap = await getDoc(sDoc);
  return snap.exists() ? (snap.data() as CMSSettings) : null;
}

export async function saveCMSSettings(settings: CMSSettings) {
  const sDoc = doc(db, "settings", "global");
  await setDoc(sDoc, settings);
}

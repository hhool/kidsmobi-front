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
import { CMSProduct, Evaluation, Guide, News, CMSSettings } from "../types";

import { User } from "firebase/auth";

export async function checkIsAdmin(uid: string, user?: User | null): Promise<boolean> {
  if (!uid) return false;
  
  const targetUser = user || auth.currentUser;
  
  if (targetUser?.email === "hhool.student@gmail.com") {
    try {
      const adminDoc = doc(db, "admins", uid);
      const snap = await getDoc(adminDoc);
      if (!snap.exists()) {
        await setDoc(adminDoc, { 
          userId: uid, 
          email: targetUser.email, 
          role: "superadmin",
          createdAt: serverTimestamp() 
        });
      }
      return true;
    } catch (err) {
      console.error("Superadmin bootstrap failed:", err);
      // Fallback: if we are the superadmin but can't write to DB yet, still allow entry
      return true;
    }
  }
  
  try {
    const adminDoc = doc(db, "admins", uid);
    const snap = await getDoc(adminDoc);
    return snap.exists();
  } catch (err) {
    console.error("Admin check failed:", err);
    return false;
  }
}

// Product Management
export async function getCMSProducts(onlyPublished = false): Promise<CMSProduct[]> {
  let q;
  if (onlyPublished) {
    q = query(collection(db, "products"), where("status", "==", "published"));
  } else {
    q = query(collection(db, "products"), orderBy("updatedAt", "desc"));
  }
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

// Evaluation Management
export async function getCMSEvaluations(onlyPublished = false): Promise<Evaluation[]> {
  let q;
  if (onlyPublished) {
    q = query(collection(db, "evaluations"), where("status", "==", "published"));
  } else {
    q = query(collection(db, "evaluations"), orderBy("updatedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Evaluation);
}

export async function saveCMSEvaluation(ev: Evaluation) {
  const eDoc = doc(db, "evaluations", ev.id);
  await setDoc(eDoc, {
    ...ev,
    updatedAt: serverTimestamp()
  });
}

// Guide Management
export async function getCMSGuides(onlyPublished = false): Promise<Guide[]> {
  let q;
  if (onlyPublished) {
    q = query(collection(db, "guides"), where("status", "==", "published"));
  } else {
    q = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Guide);
}

export async function saveCMSGuide(guide: Guide) {
  const gDoc = doc(db, "guides", guide.id);
  await setDoc(gDoc, {
    ...guide,
    updatedAt: serverTimestamp()
  });
}

// News Management
export async function getCMSNews(onlyPublished = false): Promise<News[]> {
  let q;
  if (onlyPublished) {
    q = query(collection(db, "news"), where("status", "==", "published"));
  } else {
    q = query(collection(db, "news"), orderBy("updatedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as News);
}

export async function saveCMSNews(news: News) {
  const nDoc = doc(db, "news", news.id);
  await setDoc(nDoc, {
    ...news,
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

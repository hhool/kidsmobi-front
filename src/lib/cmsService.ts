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

function cleanUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedValues(item));
  }
  if (typeof obj === "object") {
    // Keep specialized objects like Date, Firestore FieldValues, etc. intact
    if (obj.constructor && obj.constructor !== Object) {
      return obj;
    }
    const res: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = cleanUndefinedValues(val);
        }
      }
    }
    return res;
  }
  return obj;
}

export async function saveCMSProduct(product: CMSProduct) {
  const pDoc = doc(db, "products", product.id);
  const purified = cleanUndefinedValues({
    ...product,
    updatedAt: serverTimestamp()
  });
  await setDoc(pDoc, purified);
}

export async function seedProductsToFirestore(productsData: any[], translateProductFn: any) {
  try {
    for (const p of productsData) {
      const pZh = translateProductFn(p, "zh");
      const pEn = translateProductFn(p, "en");

      const cmsProd: CMSProduct = {
        ...p,
        status: "published",
        zh: {
          name: pZh.name || "",
          description: pZh.description || "",
          brandText: pZh.brand || "",
          specsText: "",
          pros: pZh.pros || [],
          cons: pZh.cons || [],
          editorVerdict: pZh.editorVerdict || "",
        },
        en: {
          name: pEn.name || "",
          description: pEn.description || "",
          brandText: pEn.brand || "",
          specsText: "",
          pros: pEn.pros || [],
          cons: pEn.cons || [],
          editorVerdict: pEn.editorVerdict || "",
        },
        updatedAt: serverTimestamp()
      };
      const purified = cleanUndefinedValues(cmsProd);
      await setDoc(doc(db, "products", cmsProd.id), purified);
    }
    console.log("Seeding of productsData to Firestore completed successfully.");
    return true;
  } catch (error) {
    console.error("Auto seeding products failed:", error);
    return false;
  }
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
  const purified = cleanUndefinedValues({
    ...ev,
    updatedAt: serverTimestamp()
  });
  await setDoc(eDoc, purified);
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
  const purified = cleanUndefinedValues({
    ...guide,
    updatedAt: serverTimestamp()
  });
  await setDoc(gDoc, purified);
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
  const purified = cleanUndefinedValues({
    ...news,
    updatedAt: serverTimestamp()
  });
  await setDoc(nDoc, purified);
}

// Global Settings
export async function getCMSSettings(): Promise<CMSSettings | null> {
  const sDoc = doc(db, "settings", "global");
  const snap = await getDoc(sDoc);
  return snap.exists() ? (snap.data() as CMSSettings) : null;
}

export async function saveCMSSettings(settings: CMSSettings) {
  const sDoc = doc(db, "settings", "global");
  const purified = cleanUndefinedValues(settings);
  await setDoc(sDoc, purified);
}

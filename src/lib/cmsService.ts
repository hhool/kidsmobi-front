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
import { handleFirestoreError, OperationType, withTimeout } from "./firestoreHelper";

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
  const path = "products";
  try {
    let q;
    if (onlyPublished) {
      q = query(collection(db, "products"), where("status", "==", "published"));
    } else {
      q = query(collection(db, "products"), orderBy("updatedAt", "desc"));
    }
    const snap = await withTimeout(getDocs(q), 5000);
    return snap.docs.map(d => d.data() as CMSProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
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
  const path = `products/${product.id}`;
  try {
    const pDoc = doc(db, "products", product.id);
    const purified = cleanUndefinedValues({
      ...product,
      updatedAt: serverTimestamp()
    });
    await withTimeout(setDoc(pDoc, purified));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedProductsToFirestore(productsData: any[], translateProductFn: any) {
  const path = "products";
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
      await withTimeout(setDoc(doc(db, "products", cmsProd.id), purified), 5000);
    }
    console.log("Seeding of productsData to Firestore completed successfully.");
    return true;
  } catch (error) {
    console.error("Auto seeding products failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Evaluation Management
export async function getCMSEvaluations(onlyPublished = false): Promise<Evaluation[]> {
  const path = "evaluations";
  try {
    let q;
    if (onlyPublished) {
      q = query(collection(db, "evaluations"), where("status", "==", "published"));
    } else {
      q = query(collection(db, "evaluations"), orderBy("updatedAt", "desc"));
    }
    const snap = await withTimeout(getDocs(q), 5000);
    return snap.docs.map(d => d.data() as Evaluation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCMSEvaluation(ev: Evaluation) {
  const path = `evaluations/${ev.id}`;
  try {
    const eDoc = doc(db, "evaluations", ev.id);
    const purified = cleanUndefinedValues({
      ...ev,
      updatedAt: serverTimestamp()
    });
    await withTimeout(setDoc(eDoc, purified));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedEvaluationsToFirestore(evaluationsData: Evaluation[]): Promise<boolean> {
  const path = "evaluations";
  try {
    for (const ev of evaluationsData) {
      const purified = cleanUndefinedValues({
        ...ev,
        updatedAt: serverTimestamp()
      });
      await withTimeout(setDoc(doc(db, "evaluations", ev.id), purified), 5000);
    }
    console.log("Seeding of evaluations to Firestore completed successfully.");
    return true;
  } catch (error) {
    console.error("Auto seeding evaluations failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Guide Management
export async function getCMSGuides(onlyPublished = false): Promise<Guide[]> {
  const path = "guides";
  try {
    let q;
    if (onlyPublished) {
      q = query(collection(db, "guides"), where("status", "==", "published"));
    } else {
      q = query(collection(db, "guides"), orderBy("updatedAt", "desc"));
    }
    const snap = await withTimeout(getDocs(q), 5000);
    return snap.docs.map(d => d.data() as Guide);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCMSGuide(guide: Guide) {
  const path = `guides/${guide.id}`;
  try {
    const gDoc = doc(db, "guides", guide.id);
    const purified = cleanUndefinedValues({
      ...guide,
      updatedAt: serverTimestamp()
    });
    await withTimeout(setDoc(gDoc, purified));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedGuidesToFirestore(guidesData: any[]): Promise<boolean> {
  const path = "guides";
  try {
    for (const g of guidesData) {
      const cmsGuide: Guide = {
        id: g.id,
        category: g.category,
        status: "published",
        imageUrl: "",
        riskCards: [],
        seo: {
          zh: {
            title: g.title,
            description: g.summary,
            keywords: [g.categoryLabel || "指南"]
          },
          en: {
            title: g.title,
            description: g.summary,
            keywords: [g.categoryLabel || "Guide"]
          }
        },
        zh: {
          title: g.title,
          content: g.content,
        },
        en: {
          title: g.title,
          content: g.content,
        },
        updatedAt: serverTimestamp()
      };
      const purified = cleanUndefinedValues(cmsGuide);
      await withTimeout(setDoc(doc(db, "guides", cmsGuide.id), purified), 5000);
    }
    console.log("Seeding of guidesDoc to Firestore completed successfully.");
    return true;
  } catch (error) {
    console.error("Auto seeding guides failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function seedNewsToFirestore(newsData: any[]): Promise<boolean> {
  const path = "news";
  try {
    for (const n of newsData) {
      const cmsNews: News = {
        id: n.id,
        category: n.category,
        status: "published",
        imageUrl: "",
        seo: {
          zh: {
            title: n.title,
            description: n.summary,
            keywords: [n.categoryLabel || "资讯"]
          },
          en: {
            title: n.title,
            description: n.summary,
            keywords: [n.categoryLabel || "News"]
          }
        },
        zh: {
          title: n.title,
          content: n.content,
        },
        en: {
          title: n.title,
          content: n.content,
        },
        updatedAt: serverTimestamp()
      };
      const purified = cleanUndefinedValues(cmsNews);
      await withTimeout(setDoc(doc(db, "news", cmsNews.id), purified), 5000);
    }
    console.log("Seeding of news to Firestore completed successfully.");
    return true;
  } catch (error) {
    console.error("Auto seeding news failed:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// News Management
export async function getCMSNews(onlyPublished = false): Promise<News[]> {
  const path = "news";
  try {
    let q;
    if (onlyPublished) {
      q = query(collection(db, "news"), where("status", "==", "published"));
    } else {
      q = query(collection(db, "news"), orderBy("updatedAt", "desc"));
    }
    const snap = await withTimeout(getDocs(q), 5000);
    return snap.docs.map(d => d.data() as News);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveCMSNews(news: News) {
  const path = `news/${news.id}`;
  try {
    const nDoc = doc(db, "news", news.id);
    const purified = cleanUndefinedValues({
      ...news,
      updatedAt: serverTimestamp()
    });
    await withTimeout(setDoc(nDoc, purified));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Global Settings
export async function getCMSSettings(): Promise<CMSSettings | null> {
  const path = "settings/global";
  try {
    const sDoc = doc(db, "settings", "global");
    const snap = await getDoc(sDoc);
    return snap.exists() ? (snap.data() as CMSSettings) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveCMSSettings(settings: CMSSettings) {
  const path = "settings/global";
  try {
    const sDoc = doc(db, "settings", "global");
    const purified = cleanUndefinedValues(settings);
    await withTimeout(setDoc(sDoc, purified));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

import { db } from "./firebase";
import { 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";
import { handleFirestoreError, OperationType, withTimeout } from "./firestoreHelper";
import { ChildProfile } from "../types";

export async function ensureUserProfileInFirestore(userId: string, email: string) {
  const path = `users/${userId}`;
  try {
    await withTimeout(setDoc(doc(db, "users", userId), {
      userId,
      email,
    }, { merge: true }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getChildProfileFromFirestore(userId: string): Promise<ChildProfile | null> {
  const path = `users/${userId}/childProfile/main`;
  try {
    const pDoc = await getDoc(doc(db, "users", userId, "childProfile", "main"));
    if (pDoc.exists()) {
      return pDoc.data() as ChildProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveChildProfileToFirestore(userId: string, profile: ChildProfile) {
  const path = `users/${userId}/childProfile/main`;
  try {
    await withTimeout(setDoc(doc(db, "users", userId, "childProfile", "main"), {
      ...profile,
      userId,
      updatedAt: serverTimestamp()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function addBookmarkToFirestore(userId: string, productId: string) {
  const path = `users/${userId}/bookmarks/${productId}`;
  try {
    await withTimeout(setDoc(doc(db, "users", userId, "bookmarks", productId), {
      productId,
      userId,
      createdAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeBookmarkFromFirestore(userId: string, productId: string) {
  const path = `users/${userId}/bookmarks/${productId}`;
  try {
    await withTimeout(deleteDoc(doc(db, "users", userId, "bookmarks", productId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getBookmarksFromFirestore(userId: string): Promise<string[]> {
  const path = `users/${userId}/bookmarks`;
  try {
    const querySnapshot = await getDocs(collection(db, "users", userId, "bookmarks"));
    const productIds: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.productId) {
        productIds.push(data.productId);
      }
    });
    return productIds;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

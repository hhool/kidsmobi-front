import { collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

const assetsColl = collection(db, "assets");

function keyToDocId(key: string) {
  // Encode key so it contains no '/' segments for Firestore document id
  return encodeURIComponent(key);
}

export async function createAssetMetadata(key: string, metadata: any) {
  const id = keyToDocId(key);
  console.log('[firestoreAssetHelper] createAssetMetadata key -> id', { key, id });
  const docRef = doc(assetsColl, id);
  await setDoc(docRef, { key, ...metadata, createdAt: serverTimestamp() }, { merge: true });
  return docRef.id;
}

export async function getAssetMetadata(key: string) {
  const id = keyToDocId(key);
  const docRef = doc(assetsColl, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export async function updateAssetMetadata(key: string, patch: any) {
  const id = keyToDocId(key);
  const docRef = doc(assetsColl, id);
  await updateDoc(docRef, { ...patch, updatedAt: serverTimestamp() });
}

export async function listAssetMetadata() {
  const q = query(assetsColl, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
}

export default { createAssetMetadata, getAssetMetadata, updateAssetMetadata, listAssetMetadata };

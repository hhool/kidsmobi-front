import { doc, setDoc, getDocs, collection, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export interface AssetMetadata {
  key: string;
  url: string;
  size: number;
  contentType: string;
  createdAt: any;
}

export const saveAssetMetadata = async (metadata: AssetMetadata) => {
  const safeId = encodeURIComponent(metadata.key);
  await setDoc(doc(db, "assets", safeId), metadata);
};

export const listAssetMetadata = async (): Promise<AssetMetadata[]> => {
  const q = query(collection(db, "assets"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AssetMetadata);
};

export const deleteAssetMetadata = async (key: string) => {
  const safeId = encodeURIComponent(key);
  await deleteDoc(doc(db, "assets", safeId));
};

import { ChildProfile } from "../types";

function getProfileKey(userId: string) {
  return `kidsmobi:user:${userId}:childProfile`;
}

function getBookmarksKey(userId: string) {
  return `kidsmobi:user:${userId}:bookmarks`;
}

export async function ensureUserProfileInFirestore(_userId: string, _email: string) {
  return;
}

export async function getChildProfileFromFirestore(userId: string): Promise<ChildProfile | null> {
  try {
    const raw = localStorage.getItem(getProfileKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ChildProfile;
  } catch {
    return null;
  }
}

export async function saveChildProfileToFirestore(userId: string, profile: ChildProfile) {
  localStorage.setItem(getProfileKey(userId), JSON.stringify(profile));
}

export async function addBookmarkToFirestore(userId: string, productId: string) {
  const key = getBookmarksKey(userId);
  const current = new Set(await getBookmarksFromFirestore(userId));
  current.add(productId);
  localStorage.setItem(key, JSON.stringify(Array.from(current)));
}

export async function removeBookmarkFromFirestore(userId: string, productId: string) {
  const key = getBookmarksKey(userId);
  const current = new Set(await getBookmarksFromFirestore(userId));
  current.delete(productId);
  localStorage.setItem(key, JSON.stringify(Array.from(current)));
}

export async function getBookmarksFromFirestore(userId: string): Promise<string[]> {
  try {
    const raw = localStorage.getItem(getBookmarksKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

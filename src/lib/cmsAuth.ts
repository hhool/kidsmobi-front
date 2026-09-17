import { User } from "firebase/auth";
import { auth } from "./firebase";
import { requestJson } from "./cmsD1Service";

function getAllowedAdminEmails(): string[] {
  const configured = String(import.meta.env.VITE_ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  return ["hhool.student@gmail.com"];
}

export async function checkIsAdmin(_uid: string, user?: User | null): Promise<boolean> {
  const targetUser = user || auth.currentUser;
  const email = String(targetUser?.email || "").trim().toLowerCase();
  if (!email) return false;
  return getAllowedAdminEmails().includes(email);
}

export async function sendAuthEmailCode(email: string): Promise<{ sent: boolean; expiresInSec: number; cooldownSec: number }> {
  const response = await requestJson<{ data?: { sent?: boolean; expiresInSec?: number; cooldownSec?: number } }>("/api/auth/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  return {
    sent: Boolean(response?.data?.sent),
    expiresInSec: Number(response?.data?.expiresInSec || 300),
    cooldownSec: Number(response?.data?.cooldownSec || 60),
  };
}

export async function verifyAuthEmailCode(email: string, code: string): Promise<{ verified: boolean }> {
  const response = await requestJson<{ data?: { verified?: boolean } }>("/api/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  return {
    verified: Boolean(response?.data?.verified),
  };
}

#!/usr/bin/env node
/**
 * One-time migration: Firestore `assets` collection -> Worker D1 (cms_assets).
 *
 * Usage:
 *   FIRESTORE_ASSETS_MIGRATE_TARGET=https://store.balancebiketoddler.com \
 *   node scripts/migrate_firestore_assets_to_d1.mjs
 *
 * Reads every doc in the Firestore `assets` collection (client SDK, same
 * config as the app) and POSTs it to <target>/api/cms/assets/save.
 * Idempotent: re-running only upserts the same keys.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const target = process.env.FIRESTORE_ASSETS_MIGRATE_TARGET || "https://store.balancebiketoddler.com";
const configPath = path.resolve(__dirname, "../firebase-applet-config.json");
const firebaseConfig = JSON.parse(readFileSync(configPath, "utf8"));

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function fetchAllAssets() {
  // Firestore may require an index-free single collection query; orderBy on
  // createdAt can fail without a composite index, so we sort client-side.
  const snapshot = await getDocs(collection(db, "assets"));
  const rows = [];
  snapshot.forEach((d) => {
    const data = d.data() || {};
    rows.push({
      key: String(data.key || ""),
      url: String(data.url || ""),
      size: Number(data.size || 0),
      contentType: String(data.contentType || ""),
      createdAt: normalizeCreatedAt(data.createdAt),
    });
  });
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return rows.filter((row) => row.key && row.url);
}

function normalizeCreatedAt(value) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value.toMillis === "function") return new Date(value.toMillis()).toISOString();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

async function saveToD1(row) {
  const res = await fetch(`${target.replace(/\/+$/, "")}/api/cms/assets/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`save failed (${res.status}) for ${row.key}: ${details.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  console.log(`[migrate] target=${target}`);
  const rows = await fetchAllAssets();
  console.log(`[migrate] fetched ${rows.length} asset docs from Firestore`);

  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await saveToD1(row);
      ok += 1;
      console.log(`[migrate] ok  (${ok}/${rows.length}) ${row.key}`);
    } catch (err) {
      failed += 1;
      console.error(`[migrate] ERR ${row.key}:`, err.message);
    }
  }

  console.log(`[migrate] done: ${ok} migrated, ${failed} failed, ${rows.length} total.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[migrate] fatal:", err);
  process.exit(1);
});

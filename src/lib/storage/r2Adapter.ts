/**
 * Cloudflare R2 Storage Adapter
 *
 * Provides presigned URL generation (upload & get), object URL resolution,
 * and server-side object fetching for Cloudflare R2 using the S3-compatible API.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID        – Cloudflare account ID
 *   R2_ACCESS_KEY_ID     – R2 API token key ID
 *   R2_SECRET_ACCESS_KEY – R2 API token secret
 *   R2_BUCKET_NAME       – Target bucket name
 *   R2_PUBLIC_URL        – (optional) Public URL prefix, e.g. https://assets.example.com
 */

import crypto from "crypto";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "";
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const R2_HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

// ---------------------------------------------------------------------------
// Internal SigV4 helpers
// ---------------------------------------------------------------------------

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function formatDate(d: Date): { dateStamp: string; amzDate: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    dateStamp: iso.slice(0, 8),
    amzDate: iso.slice(0, 15) + "Z",
  };
}

// ---------------------------------------------------------------------------
// Core presigned URL builder
// ---------------------------------------------------------------------------

/**
 * Validates that a key is safe to embed in an R2 URL.
 * Prevents path traversal and ensures the generated URL stays within the
 * configured bucket on R2_HOST.
 */
function assertSafeKey(key: string): void {
  if (
    !key ||
    key.length > 1024 ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\0") ||
    !/^[\w\-./]+$/.test(key)
  ) {
    throw new Error(`Invalid R2 object key: "${key}"`);
  }
}

async function buildPresignedUrl(
  method: "GET" | "PUT",
  key: string,
  expiresInSeconds: number
): Promise<string> {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    throw new Error(
      "R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment."
    );
  }

  // Validate key before embedding it in the URL
  assertSafeKey(key);

  const { dateStamp, amzDate } = formatDate(new Date());
  const region = "auto";
  const service = "s3";
  // Each key segment is percent-encoded individually so forward slashes remain
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const canonicalUri = `/${BUCKET_NAME}/${encodedKey}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${ACCESS_KEY_ID}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    `host:${R2_HOST}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(SECRET_ACCESS_KEY, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  return (
    `https://${R2_HOST}${canonicalUri}?${canonicalQueryString}` +
    `&X-Amz-Signature=${signature}`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the permanent public URL for an object.
 * Uses R2_PUBLIC_URL when configured; otherwise falls back to the
 * bucket-subdomain URL (requires the bucket to have public access enabled).
 */
export function getObjectUrl(key: string): string {
  assertSafeKey(key);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${encodedKey}`;
  }
  // Bucket-subdomain format: https://<bucket>.<accountId>.r2.dev/<key>
  return `https://${BUCKET_NAME}.${ACCOUNT_ID}.r2.dev/${encodedKey}`;
}

/**
 * Generates a short-lived presigned PUT URL for uploading an object.
 */
export async function getPresignedUploadUrl(
  key: string,
  _contentType: string,
  expiresInSeconds = 3600
): Promise<string> {
  return buildPresignedUrl("PUT", key, expiresInSeconds);
}

/**
 * Generates a short-lived presigned GET URL for downloading an object.
 * Falls back to the bucket-subdomain public URL when credentials are missing.
 */
export async function getPresignedGetUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  try {
    return await buildPresignedUrl("GET", key, expiresInSeconds);
  } catch {
    // Fallback: return the bucket-subdomain public URL
    return getObjectUrl(key);
  }
}

/**
 * Fetches an R2 object and returns it as a Node.js Buffer.
 * Uses a presigned GET URL so no public bucket access is required.
 */
export async function fetchObjectBuffer(key: string): Promise<Buffer> {
  const url = await getPresignedGetUrl(key);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch R2 object "${key}": ${response.status} ${response.statusText}`
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

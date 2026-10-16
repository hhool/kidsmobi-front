// #48: returns headers carrying the admin token (from CMS_ADMIN_ALL_TOKEN env)
// when set, merged over any caller-provided headers. Every script that mutates
// the CMS (/api/cms/* save|delete, ops:init|purge, assets, export) must send
// these so the gated server endpoints accept the request. Harmless when unset.
export function adminHeaders(extra = {}) {
  const token = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
  return token ? { ...extra, "x-cms-admin-token": token } : { ...extra };
}

#!/usr/bin/env node

const DEFAULT_BASE = "https://kidsmobi-api-v1.seaman-player.workers.dev";
const COLLECTIONS = ["categories", "products", "scenarios", "evaluations", "guides", "news"];

function parseArgs(argv) {
  const result = { base: DEFAULT_BASE };
  for (const arg of argv) {
    if (arg.startsWith("--base=")) {
      result.base = arg.slice("--base=".length);
    }
  }
  return result;
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function buildPayload(collection, id) {
  const now = new Date().toISOString();
  if (collection === "categories") {
    const code = `regress-cat-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      code,
      status: "draft",
      sortOrder: 999,
      icon: "",
      updatedAt: now,
      zh: {
        name: `回归分类-${code}`,
        description: "自动回归写入",
      },
      en: {
        name: `Regress Category ${code}`,
        description: "automated regression write",
      },
    };
  }

  return {
    id,
    status: "draft",
    sortOrder: 999,
    updatedAt: now,
    title: `CRUD smoke ${collection}`,
    name: { zh: `回归-${collection}`, en: `regress-${collection}` },
    description: { zh: "自动回归写入", en: "automated regression write" },
  };
}

async function requestJson(url, init) {
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  return {
    status: response.status,
    contentType: String(response.headers.get("content-type") || ""),
    data: parsed,
    preview: text.slice(0, 160).replace(/\s+/g, " "),
  };
}

function hasItem(rows, id) {
  if (!Array.isArray(rows)) {
    return false;
  }
  return rows.some((item) => item && typeof item === "object" && String(item.id || "") === id);
}

async function runCollection(base, collection) {
  const id = `regress-${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = buildPayload(collection, id);

  const saveRes = await requestJson(`${base}/api/cms/${collection}/save`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const listAfterSave = await requestJson(`${base}/api/cms/${collection}`, { method: "GET" });
  const foundAfterSave = hasItem(listAfterSave.data?.data, id);

  const deleteRes = await requestJson(`${base}/api/cms/${collection}/delete`, {
    method: "POST",
    body: JSON.stringify({ id }),
  });

  const listAfterDelete = await requestJson(`${base}/api/cms/${collection}`, { method: "GET" });
  const foundAfterDelete = hasItem(listAfterDelete.data?.data, id);

  const pass =
    saveRes.status === 200 &&
    listAfterSave.status === 200 &&
    foundAfterSave &&
    deleteRes.status === 200 &&
    listAfterDelete.status === 200 &&
    !foundAfterDelete;

  return {
    collection,
    pass,
    saveRes,
    listAfterSave,
    foundAfterSave,
    deleteRes,
    listAfterDelete,
    foundAfterDelete,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);

  if (!/^https?:\/\//i.test(base)) {
    console.error(`[cms-crud-regress] invalid --base: ${base}`);
    process.exit(2);
  }

  console.log(`[cms-crud-regress] target=${base}`);

  const results = [];
  for (const collection of COLLECTIONS) {
    results.push(await runCollection(base, collection));
  }

  let failed = 0;
  for (const r of results) {
    const marker = r.pass ? "PASS" : "FAIL";
    if (!r.pass) failed += 1;

    console.log(
      `${marker}\t${r.collection}\tsave=${r.saveRes.status}\tlistAfterSave=${r.listAfterSave.status}\tfoundAfterSave=${r.foundAfterSave}` +
      `\tdelete=${r.deleteRes.status}\tlistAfterDelete=${r.listAfterDelete.status}\tfoundAfterDelete=${r.foundAfterDelete}`,
    );

    if (!r.pass) {
      console.log(`  savePreview=${r.saveRes.preview}`);
      console.log(`  listAfterSavePreview=${r.listAfterSave.preview}`);
      console.log(`  deletePreview=${r.deleteRes.preview}`);
      console.log(`  listAfterDeletePreview=${r.listAfterDelete.preview}`);
    }
  }

  if (failed > 0) {
    console.error(`[cms-crud-regress] failed=${failed}/${results.length}`);
    process.exit(1);
  }

  console.log(`[cms-crud-regress] all ${results.length} collections passed`);
}

await main();

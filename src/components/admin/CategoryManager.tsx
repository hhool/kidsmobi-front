import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { CMSCategory, ProductCategory } from "../../types";
import { deleteCMSCategory, getCMSCategories, saveCMSCategory } from "../../lib/cmsService";
import { deleteD1CMSCategory, getD1CMSCategories, saveD1CMSCategory } from "../../lib/cmsD1Service";

const categoryCodes: ProductCategory[] = [
  "balance",
  "bicycle",
  "scooter",
  "stroller",
  "electric_car",
  "tricycle",
  "safety_seat",
];

function normalizeText(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function findDuplicateCategory(list: CMSCategory[], editing: CMSCategory): { reason: "code" | "zh" | "en"; item: CMSCategory } | null {
  const code = normalizeText(editing.code);
  const zhName = normalizeText(editing.zh?.name);
  const enName = normalizeText(editing.en?.name);

  for (const item of list) {
    if (item.id === editing.id) continue;
    if (code && normalizeText(item.code) === code) {
      return { reason: "code", item };
    }
    if (zhName && normalizeText(item.zh?.name) === zhName) {
      return { reason: "zh", item };
    }
    if (enName && normalizeText(item.en?.name) === enName) {
      return { reason: "en", item };
    }
  }
  return null;
}

export default function CategoryManager({ lang }: { lang: "zh" | "en" }) {
  const [items, setItems] = useState<CMSCategory[]>([]);
  const [editing, setEditing] = useState<CMSCategory | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const data = await getD1CMSCategories(false);
      if (data.length > 0) {
        setItems(data);
        return;
      }
    } catch {
      // fallback to firestore cms service
    }
    const data = await getCMSCategories(false);
    setItems(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleNew() {
    setEditing({
      id: `cat_${Date.now()}`,
      code: "stroller",
      status: "draft",
      sortOrder: items.length + 1,
      icon: "",
      zh: { name: "", description: "" },
      en: { name: "", description: "" },
      updatedAt: null,
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.zh?.name || !editing.en?.name) {
      alert(lang === "zh" ? "请填写中英文品类名称" : "Please fill both ZH/EN category names.");
      return;
    }

    const duplicate = findDuplicateCategory(items, editing);
    if (duplicate) {
      const duplicateName = duplicate.item.zh?.name || duplicate.item.en?.name || duplicate.item.code;
      if (duplicate.reason === "code") {
        alert(
          lang === "zh"
            ? `品类编码重复：${editing.code}（已存在：${duplicateName}）`
            : `Duplicate category code: ${editing.code} (existing: ${duplicateName})`,
        );
      } else if (duplicate.reason === "zh") {
        alert(
          lang === "zh"
            ? `中文名称重复：${editing.zh?.name || ""}（已存在编码：${duplicate.item.code}）`
            : `Duplicate Chinese name: ${editing.zh?.name || ""} (existing code: ${duplicate.item.code})`,
        );
      } else {
        alert(
          lang === "zh"
            ? `英文名称重复：${editing.en?.name || ""}（已存在编码：${duplicate.item.code}）`
            : `Duplicate English name: ${editing.en?.name || ""} (existing code: ${duplicate.item.code})`,
        );
      }
      return;
    }

    setSaving(true);
    try {
      try {
        const saved = await saveD1CMSCategory(editing);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSCategory(editing);
      }
      setEditing(null);
      await refresh();
    } catch (error: any) {
      const message = String(error?.message || error || "");
      if (message.includes("CMSCategoryDuplicate") || message.includes("Duplicate")) {
        alert(lang === "zh" ? "保存失败：检测到重复品类（编码或名称）。" : "Save failed: duplicate category detected.");
      } else {
        alert((lang === "zh" ? "保存失败：" : "Save failed: ") + message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(lang === "zh" ? "确认删除该品类？" : "Delete this category?");
    if (!ok) return;
    try {
      const deleted = await deleteD1CMSCategory(id);
      if (!deleted) {
        throw new Error("D1 delete failed");
      }
    } catch {
      await deleteCMSCategory(id);
    }
    if (editing?.id === id) setEditing(null);
    await refresh();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {lang === "zh" ? "品类管理" : "Category Center"}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {lang === "zh" ? "用于后台产品中心的品类配置与排序" : "Configure and order categories for product center."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all"
          >
            <Plus className="w-5 h-5 text-orange-500" />
            {lang === "zh" ? "新增品类" : "New Category"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.code}</p>
              <h4 className="font-black text-slate-900">{item.zh?.name || "(No Name)"}</h4>
              <p className="text-xs text-slate-500">{item.en?.name || ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(item)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
            {lang === "zh" ? "编辑品类" : "Edit Category"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="ID" value={editing.id} disabled />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</label>
              <select
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value as ProductCategory })}
                className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent focus:border-orange-500"
              >
                {categoryCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Sort Order"
              type="number"
              value={editing.sortOrder}
              onChange={(v) => setEditing({ ...editing, sortOrder: parseInt(v, 10) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="ZH Name"
              value={editing.zh?.name || ""}
              onChange={(v) => setEditing({ ...editing, zh: { ...(editing.zh || {}), name: v } })}
            />
            <Field
              label="EN Name"
              value={editing.en?.name || ""}
              onChange={(v) => setEditing({ ...editing, en: { ...(editing.en || {}), name: v } })}
            />
            <Field
              label="ZH Description"
              value={editing.zh?.description || ""}
              onChange={(v) => setEditing({ ...editing, zh: { ...(editing.zh || {}), description: v } })}
            />
            <Field
              label="EN Description"
              value={editing.en?.description || ""}
              onChange={(v) => setEditing({ ...editing, en: { ...(editing.en || {}), description: v } })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Icon"
              value={editing.icon || ""}
              onChange={(v) => setEditing({ ...editing, icon: v })}
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CMSCategory["status"] })}
                className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent focus:border-orange-500"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditing(null)}
              className="px-6 py-3 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-orange-500 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? (lang === "zh" ? "保存中..." : "Saving...") : lang === "zh" ? "保存品类" : "Save Category"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        disabled={disabled}
        className={`w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent ${
          disabled ? "opacity-60 cursor-not-allowed" : "focus:border-orange-500"
        }`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
}

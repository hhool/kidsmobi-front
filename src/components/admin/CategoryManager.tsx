import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { CMSCategory, ProductCategory } from "../../types";
import { deleteCMSCategory, getCMSCategories, saveCMSCategory } from "../../lib/cmsService";
import { getBackendPickerPayload } from "../../lib/backendResourceService";

const categoryCodes: ProductCategory[] = [
  "balance",
  "bicycle",
  "scooter",
  "stroller",
  "electric_car",
  "tricycle",
  "safety_seat",
];

function mapBackendCategoryIdToProductCategory(categoryId: string): ProductCategory {
  switch (categoryId) {
    case "balance_bike":
      return "balance";
    case "scooters":
      return "scooter";
    case "electric_vehicles":
      return "electric_car";
    case "kids_bikes":
      return "bicycle";
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return "tricycle";
    case "car_seat":
      return "safety_seat";
    default:
      return "stroller";
  }
}

export default function CategoryManager({ lang }: { lang: "zh" | "en" }) {
  const [items, setItems] = useState<CMSCategory[]>([]);
  const [editing, setEditing] = useState<CMSCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);

  async function refresh() {
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
    if (!editing.zh.name || !editing.en.name) {
      alert(lang === "zh" ? "请填写中英文品类名称" : "Please fill both ZH/EN category names.");
      return;
    }
    setSaving(true);
    try {
      await saveCMSCategory(editing);
      setEditing(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(lang === "zh" ? "确认删除该品类？" : "Delete this category?");
    if (!ok) return;
    await deleteCMSCategory(id);
    if (editing?.id === id) setEditing(null);
    await refresh();
  }

  async function handleInitializeCategories() {
    const ok = window.confirm(
      lang === "zh"
        ? "将初始化默认品类（已存在同 code 的品类会被更新）。是否继续？"
        : "Initialize default categories now? Existing categories with the same code will be updated."
    );
    if (!ok) return;

    setInitializing(true);
    try {
      const backendPayload = await getBackendPickerPayload({ includeAll: true });
      const backendCategories = backendPayload.categories || [];
      const existing = await getCMSCategories(false);
      const byCode = new Map(existing.map((item) => [item.code, item]));

      const mappedByCode = new Map<ProductCategory, { code: ProductCategory; zhName: string; enName: string }>();
      for (const item of backendCategories) {
        const code = mapBackendCategoryIdToProductCategory(item.categoryId);
        if (!mappedByCode.has(code)) {
          mappedByCode.set(code, {
            code,
            zhName: item.name || code,
            enName: item.name || code,
          });
        }
      }

      const templates = Array.from(mappedByCode.values());
      if (templates.length === 0) {
        throw new Error(lang === "zh" ? "未获取到 backend 品类数据。" : "No backend categories fetched.");
      }

      for (const [idx, template] of templates.entries()) {
        const hit = byCode.get(template.code);
        const payload: CMSCategory = {
          id: hit?.id || `cat_${template.code}`,
          code: template.code,
          status: hit?.status || "published",
          sortOrder: hit?.sortOrder ?? idx + 1,
          icon: hit?.icon || "",
          zh: {
            name: template.zhName,
            description: hit?.zh?.description || `backend:${template.code}`,
          },
          en: {
            name: template.enName,
            description: hit?.en?.description || `backend:${template.code}`,
          },
          updatedAt: null,
        };
        await saveCMSCategory(payload);
      }

      await refresh();
      alert(lang === "zh" ? "默认品类初始化完成。" : "Default categories initialized.");
    } catch (error: any) {
      alert((lang === "zh" ? "初始化失败：" : "Initialization failed: ") + (error?.message || String(error)));
    } finally {
      setInitializing(false);
    }
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
            onClick={handleInitializeCategories}
            disabled={initializing}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-60"
          >
            {initializing ? (lang === "zh" ? "初始化中..." : "Initializing...") : lang === "zh" ? "初始化品类" : "Initialize Categories"}
          </button>
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
              <h4 className="font-black text-slate-900">{item.zh.name || "(No Name)"}</h4>
              <p className="text-xs text-slate-500">{item.en.name}</p>
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
              value={editing.zh.name}
              onChange={(v) => setEditing({ ...editing, zh: { ...editing.zh, name: v } })}
            />
            <Field
              label="EN Name"
              value={editing.en.name}
              onChange={(v) => setEditing({ ...editing, en: { ...editing.en, name: v } })}
            />
            <Field
              label="ZH Description"
              value={editing.zh.description || ""}
              onChange={(v) => setEditing({ ...editing, zh: { ...editing.zh, description: v } })}
            />
            <Field
              label="EN Description"
              value={editing.en.description || ""}
              onChange={(v) => setEditing({ ...editing, en: { ...editing.en, description: v } })}
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

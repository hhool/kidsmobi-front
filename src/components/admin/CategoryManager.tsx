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

const categorySeoDefaults: Record<ProductCategory, {
  en: { seoTitle: string; seoDescription: string; seoKeywords: string };
  zh: { seoTitle: string; seoDescription: string; seoKeywords: string };
}> = {
  stroller: {
    en: {
      seoTitle: "Best Baby & Twin Strollers 2026 Lab-Tested Reviews - KIDSMOBI",
      seoDescription: "Explore our expert lab database for the safest and most reliable baby and twin strollers. Compare weight capacity, safety scores, and travel features.",
      seoKeywords: "baby stroller, twin stroller, double stroller, travel stroller, jogging stroller"
    },
    zh: {
      seoTitle: "2026最佳婴儿车与双胞胎推车实验室深度评测 | KIDSMOBI",
      seoDescription: "探索KIDSMOBI实验室数据库，获取安全高承重的单人与双胞胎折叠推车。对比避震能力、物理结构与安全性评估分值。",
      seoKeywords: "婴儿推车, 双人推车, 折叠婴儿车, 慢跑推车, KIDSMOBI"
    }
  },
  balance: {
    en: {
      seoTitle: "Best Toddler Balance Bikes 2026 Lab-Tested Reviews - KIDSMOBI",
      seoDescription: "Explore our expert lab database for the safest toddler balance bikes. Compare weight capacity, stability scores, and features for top ride-on brands.",
      seoKeywords: "toddler balance bike, kids balance bike, 1 year old balance bike, ride-on balance bike"
    },
    zh: {
      seoTitle: "2026最佳幼儿无脚踏平衡车实验室深度评测 | KIDSMOBI",
      seoDescription: "探索KIDSMOBI无脚踏幼儿滑步平衡车评分矩阵。深度比较车重工效、几何结构与核心通过性指数，助您科学决策。",
      seoKeywords: "幼儿平衡车, 儿童滑步车, 1岁平衡车, 平衡训练车, KIDSMOBI"
    }
  },
  bicycle: {
    en: {
      seoTitle: "Best Kids Bikes & Toddler Bicycles 2026 Lab-Tested - KIDSMOBI",
      seoDescription: "Discover the safest and top-rated kids bikes for ages 2-14. Explore our lab database to compare BMX style, training wheels, and dual suspension bicycles.",
      seoKeywords: "kids bmx bike, toddler bicycle, kids bike training wheels, pedal bike for children"
    },
    zh: {
      seoTitle: "2026最佳适龄儿童自行车与充气轮单车深度评测 | KIDSMOBI",
      seoDescription: "获取2至14岁最适合最安全的儿童自行车候选数据库。极速对比辅助轮装配、前叉避震、机械双刹等力学客观指标。",
      seoKeywords: "儿童自行车, 幼儿单车, BMX儿童自行车, 带辅助轮自行车, KIDSMOBI"
    }
  },
  scooter: {
    en: {
      seoTitle: "Best Kids Scooters & Electric Scooters 2026 Lab-Tested - KIDSMOBI",
      seoDescription: "Discover the safest lab-tested scooters for kids and teens. Compare 3-wheel kick scooters, electric models, and top mobility brands.",
      seoKeywords: "kids kick scooter, foldable kids scooter, toddler 3 wheel scooter, children electric scooter"
    },
    zh: {
      seoTitle: "2026最佳儿童滑板车与重力转向摇摆车深度评测 | KIDSMOBI",
      seoDescription: "查找最安全的物理级别儿童/青少年滑板车列表。深度测试低重心稳定度、重力智能转向与折叠收折设计。",
      seoKeywords: "儿童滑板车, 儿童电动滑板车, 折叠滑板车, 三轮重力转向滑板车, KIDSMOBI"
    }
  },
  electric_car: {
    en: {
      seoTitle: "Best Kids Ride-On Toys & Electric Cars 2026 Lab-Tested - KIDSMOBI",
      seoDescription: "Explore our lab-tested reviews of 12V and 24V kids ride-on cars, UTVs, and electric motorcycles. Compare top-rated electric vehicles for battery safety.",
      seoKeywords: "kids electric car, ride on toys 12v, kids electric motorcycle, toddler electric car"
    },
    zh: {
      seoTitle: "2026最佳儿童电动汽车与电玩骑行玩具车深度评测 | KIDSMOBI",
      seoDescription: "对比12V/24V儿童电动越野车（UTV/SUV）与双马达重力骑行玩具安全性能。测试其绝缘、过载保护与遥控控制阻断。",
      seoKeywords: "儿童电动车, 儿童玩具车, 儿童电动越野车, 电玩摩托车, KIDSMOBI"
    }
  },
  safety_seat: {
    en: {
      seoTitle: "Best Convertible & Toddler Car Seats 2026 Lab-Tested - KIDSMOBI",
      seoDescription: "Find the safest convertible and booster car seats for your child. Compare lab-tested scores, weight limits, and safety features for top brands like Graco and Evenflo.",
      seoKeywords: "convertible car seat, booster car seat, infant car seat, child safety car seat"
    },
    zh: {
      seoTitle: "2026最佳儿童汽车安全提篮与成长座椅深度评测 | KIDSMOBI",
      seoDescription: "探求最安全的儿童汽车安全座椅（安全提篮/增高垫）。涵盖侧向撞击防护技术、ISOFIX硬接口安装兼容性等专家质检数据。",
      seoKeywords: "安全座椅, 儿童安全提篮, 成长型安全座椅, 侧向防护座椅, KIDSMOBI"
    }
  },
  tricycle: {
    en: {
      seoTitle: "Best Toddler Tricycles & Learn-to-Ride Trikes 2026 - KIDSMOBI",
      seoDescription: "Compare key safety benchmarks for grow-with-me toddler tricycles and steering push trikes. Evaluate frame solidity and parenting handlebar comfort.",
      seoKeywords: "kids tricycles, toddler tricycle, steering baby trike"
    },
    zh: {
      seoTitle: "2026最佳幼儿推行三轮脚踏车实验室评测 | KIDSMOBI",
      seoDescription: "精选安全的多功能成长型幼儿三轮滑步推行车。对比结构刚性、可调节推把工效以及宝宝蹬踏动力学参数。",
      seoKeywords: "幼儿三轮车, 成长型三轮车, 手推脚踏车, KIDSMOBI"
    }
  }
};

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
    const defaults = categorySeoDefaults.stroller;
    setEditing({
      id: `cat_${Date.now()}`,
      code: "stroller",
      status: "draft",
      sortOrder: items.length + 1,
      icon: "",
      zh: { 
        name: "", 
        description: "", 
        seoTitle: defaults.zh.seoTitle, 
        seoDescription: defaults.zh.seoDescription, 
        seoKeywords: defaults.zh.seoKeywords 
      },
      en: { 
        name: "", 
        description: "", 
        seoTitle: defaults.en.seoTitle, 
        seoDescription: defaults.en.seoDescription, 
        seoKeywords: defaults.en.seoKeywords 
      },
      updatedAt: null,
    });
  }

  function handleStartEdit(item: CMSCategory) {
    const defaults = categorySeoDefaults[item.code] || {
      zh: { seoTitle: "", seoDescription: "", seoKeywords: "" },
      en: { seoTitle: "", seoDescription: "", seoKeywords: "" }
    };
    setEditing({
      ...item,
      zh: {
        ...(item.zh || {}),
        seoTitle: item.zh?.seoTitle || defaults.zh.seoTitle,
        seoDescription: item.zh?.seoDescription || defaults.zh.seoDescription,
        seoKeywords: item.zh?.seoKeywords || defaults.zh.seoKeywords,
      },
      en: {
        ...(item.en || {}),
        seoTitle: item.en?.seoTitle || defaults.en.seoTitle,
        seoDescription: item.en?.seoDescription || defaults.en.seoDescription,
        seoKeywords: item.en?.seoKeywords || defaults.en.seoKeywords,
      }
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
                onClick={() => handleStartEdit(item)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
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

          {/* Category SEO Overrides Panel */}
          <div className="pt-4 border-t border-dashed border-slate-100/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                <span>🌐</span>
                {lang === "zh" ? "品类页面 SEO 深度优化 (已按原有品类自动生成 TDK 默认值)" : "Category Landing Page SEO Overrides (TDK Default Values Auto-Generated)"}
              </h4>
              <button
                type="button"
                onClick={() => {
                  const defaults = categorySeoDefaults[editing.code];
                  if (defaults) {
                    setEditing({
                      ...editing,
                      zh: {
                        ...(editing.zh || {}),
                        seoTitle: defaults.zh.seoTitle,
                        seoDescription: defaults.zh.seoDescription,
                        seoKeywords: defaults.zh.seoKeywords
                      },
                      en: {
                        ...(editing.en || {}),
                        seoTitle: defaults.en.seoTitle,
                        seoDescription: defaults.en.seoDescription,
                        seoKeywords: defaults.en.seoKeywords
                      }
                    });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 font-extrabold text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {lang === "zh" ? "✨ 一键重置为系统默认 SEO / Reset" : "✨ Reset to SEO Defaults"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="ZH SEO Title"
                placeholder={lang === "zh" ? "留空则回退至实验室默认品类标题" : "Fallback to default category SEO title if empty"}
                value={editing.zh?.seoTitle || ""}
                onChange={(v) => setEditing({ ...editing, zh: { ...(editing.zh || {}), seoTitle: v } })}
              />
              <Field
                label="EN SEO Title"
                placeholder={lang === "zh" ? "留空则回退至实验室默认品类标题" : "Fallback to default category SEO title if empty"}
                value={editing.en?.seoTitle || ""}
                onChange={(v) => setEditing({ ...editing, en: { ...(editing.en || {}), seoTitle: v } })}
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ZH SEO Description
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === "zh" ? "留空则回退至系统通用分类描述" : "Fallback to default category description if empty"}
                  value={editing.zh?.seoDescription || ""}
                  onChange={(e) => setEditing({ ...editing, zh: { ...(editing.zh || {}), seoDescription: e.target.value } })}
                  className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent focus:border-orange-500 resize-none outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  EN SEO Description
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === "zh" ? "留空则回退至系统通用分类描述" : "Fallback to default category description if empty"}
                  value={editing.en?.seoDescription || ""}
                  onChange={(e) => setEditing({ ...editing, en: { ...(editing.en || {}), seoDescription: e.target.value } })}
                  className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent focus:border-orange-500 resize-none outline-none"
                />
              </div>

              <Field
                label={lang === "zh" ? "ZH SEO Keywords (逗号分隔)" : "ZH SEO Keywords (Comma separated)"}
                placeholder="e.g. 婴儿推车, 双人推车, KIDSMOBI"
                value={editing.zh?.seoKeywords || ""}
                onChange={(v) => setEditing({ ...editing, zh: { ...(editing.zh || {}), seoKeywords: v } })}
              />
              <Field
                label={lang === "zh" ? "EN SEO Keywords (逗号分隔)" : "EN SEO Keywords (Comma separated)"}
                placeholder="e.g. baby stroller, twin stroller"
                value={editing.en?.seoKeywords || ""}
                onChange={(v) => setEditing({ ...editing, en: { ...(editing.en || {}), seoKeywords: v } })}
              />
            </div>
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

function Field({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent ${
          disabled ? "opacity-60 cursor-not-allowed" : "focus:border-orange-500"
        }`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
}

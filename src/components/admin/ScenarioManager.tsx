import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { CMSScenario } from "../../types";
import { deleteCMSScenario, getCMSScenarios, saveCMSScenario } from "../../lib/cmsService";
import { deleteD1CMSScenario, getD1CMSScenarios, saveD1CMSScenario } from "../../lib/cmsD1Service";

export default function ScenarioManager({ lang }: { lang: "zh" | "en" }) {
  const [items, setItems] = useState<CMSScenario[]>([]);
  const [editing, setEditing] = useState<CMSScenario | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      const data = await getD1CMSScenarios(false);
      if (data.length > 0) {
        setItems(data);
        return;
      }
    } catch {
      // fallback
    }
    const data = await getCMSScenarios(false);
    setItems(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleNew() {
    setEditing({
      id: `scenario_${Date.now()}`,
      code: "city_commute",
      status: "draft",
      sortOrder: items.length + 1,
      zh: { name: "", description: "" },
      en: { name: "", description: "" },
      updatedAt: null,
    });
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.zh?.name || !editing.en?.name) {
      alert(lang === "zh" ? "请填写中英文场景名称" : "Please fill both ZH/EN scenario names.");
      return;
    }
    setSaving(true);
    try {
      try {
        const saved = await saveD1CMSScenario(editing);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSScenario(editing);
      }
      setEditing(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(lang === "zh" ? "确认删除该场景？" : "Delete this scenario?");
    if (!ok) return;
    try {
      const deleted = await deleteD1CMSScenario(id);
      if (!deleted) {
        throw new Error("D1 delete failed");
      }
    } catch {
      await deleteCMSScenario(id);
    }
    if (editing?.id === id) setEditing(null);
    await refresh();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            {lang === "zh" ? "场景管理" : "Scenario Center"}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {lang === "zh" ? "维护适用场景标签，供产品与内容模块复用" : "Manage reusable scenario tags for products and content modules."}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all"
        >
          <Plus className="w-5 h-5 text-emerald-400" />
          {lang === "zh" ? "新增场景" : "New Scenario"}
        </button>
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
            {lang === "zh" ? "编辑场景" : "Edit Scenario"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="ID" value={editing.id} disabled />
            <Field
              label="Code"
              value={editing.code}
              onChange={(v) => setEditing({ ...editing, code: v })}
            />
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

          <div className="space-y-2 w-full md:w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
            <select
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as CMSScenario["status"] })}
              className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-sm border border-transparent focus:border-orange-500"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
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
              className="px-6 py-3 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? (lang === "zh" ? "保存中..." : "Saving...") : lang === "zh" ? "保存场景" : "Save Scenario"}
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

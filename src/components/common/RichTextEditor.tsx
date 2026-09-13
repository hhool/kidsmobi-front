import React, { useRef, useState } from "react";
import {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Bold,
  Italic,
  Link as LinkIcon,
  ImagePlus,
  Film,
  Eye,
  PenLine,
} from "lucide-react";
import { renderRichContent } from "../../lib/richContent";
import MediaPickerModal, { MediaPickerAccept } from "../admin/MediaPickerModal";

/**
 * Rich text editor for CMS articles (guides / news).
 * Editing surface stays compatible with the site's legacy markdown subset and
 * adds inline media (**bold**, links, images, videos) via the media library.
 */
export default function RichTextEditor({
  value,
  onChange,
  lang = "zh",
  minHeight = 320,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  lang?: "zh" | "en";
  minHeight?: number;
  placeholder?: string;
}) {
  const isZh = lang !== "en";
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [picker, setPicker] = useState<{ open: boolean; accept: MediaPickerAccept }>({ open: false, accept: "image" });
  const [mode, setMode] = useState<"write" | "preview">("write");

  const replaceSelection = (build: (selected: string) => string) => {
    const el = textareaRef.current;
    const current = value || "";
    if (!el) {
      onChange(current + build(""));
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const selected = current.slice(start, end);
    const inserted = build(selected);
    const next = current.slice(0, start) + inserted + current.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + inserted.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const insertBlock = (snippet: string) => {
    const el = textareaRef.current;
    const current = value || "";
    if (!el) {
      onChange(current + (current.endsWith("\n\n") || !current ? "" : "\n\n") + snippet);
      return;
    }
    const caret = el.selectionStart ?? current.length;
    const before = current.slice(0, caret);
    const after = current.slice(caret);
    const glueBefore = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const glueAfter = after.startsWith("\n\n") || after === "" ? "" : "\n\n";
    const next = before + glueBefore + snippet + glueAfter + after;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const position = (before + glueBefore + snippet).length;
      el.setSelectionRange(position, position);
    });
  };

  const wrapInline = (snippet: string, placeholderText: string) =>
    replaceSelection((selected) => `${snippet}${selected || placeholderText}${snippet}`);

  const insertLink = () => {
    const el = textareaRef.current;
    const selected = el ? (value || "").slice(el.selectionStart ?? 0, el.selectionEnd ?? 0) : "";
    const url = window.prompt(isZh ? "输入链接地址 (URL):" : "Enter link URL:");
    if (!url) return;
    const label = selected || window.prompt(isZh ? "链接显示文字:" : "Link text:") || url;
    replaceSelection(() => `[${label}](${url})`);
  };

  const applyPickedMedia = (urls: string[]) => {
    const url = urls[0];
    if (!url) return;
    if (picker.accept === "video") {
      insertBlock(`@[video](${url})`);
    } else {
      insertBlock(`![${isZh ? "图片" : "image"}](${url})`);
    }
  };

  const tools: Array<{ icon: React.ReactNode; label: string; onClick: () => void }> = [
    { icon: <Heading2 className="w-4 h-4" />, label: isZh ? "章节标题 (H3)" : "Section Heading (H3)", onClick: () => insertBlock(isZh ? "### 章节标题" : "### Section Heading") },
    { icon: <Heading3 className="w-4 h-4" />, label: isZh ? "小节标题 (H4)" : "Sub Heading (H4)", onClick: () => insertBlock(isZh ? "#### 小节标题" : "#### Sub Heading") },
    { icon: <Bold className="w-4 h-4" />, label: isZh ? "加粗" : "Bold", onClick: () => wrapInline("**", isZh ? "重点内容" : "bold text") },
    { icon: <Italic className="w-4 h-4" />, label: isZh ? "斜体" : "Italic", onClick: () => wrapInline("*", isZh ? "强调内容" : "italic text") },
    { icon: <List className="w-4 h-4" />, label: isZh ? "列表" : "List", onClick: () => insertBlock("* 列表项 / list item") },
    { icon: <ListOrdered className="w-4 h-4" />, label: isZh ? "编号" : "Numbered", onClick: () => insertBlock("1. 步骤 / step") },
    { icon: <LinkIcon className="w-4 h-4" />, label: isZh ? "链接" : "Link", onClick: insertLink },
    { icon: <ImagePlus className="w-4 h-4" />, label: isZh ? "图片" : "Image", onClick: () => setPicker({ open: true, accept: "image" }) },
    { icon: <Film className="w-4 h-4" />, label: isZh ? "视频" : "Video", onClick: () => setPicker({ open: true, accept: "video" }) },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 bg-slate-50/80 border-b border-slate-100">
        {tools.map((tool, index) => (
          <React.Fragment key={tool.label}>
            {(index === 2 || index === 6 || index === 7) && <span className="w-px h-5 bg-slate-200 mx-1.5" />}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={tool.onClick}
              title={tool.label}
              className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            >
              {tool.icon}
            </button>
          </React.Fragment>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setMode(mode === "write" ? "preview" : "write")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${mode === "preview" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white hover:shadow-sm"}`}
        >
          {mode === "preview" ? <PenLine className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {mode === "preview" ? (isZh ? "继续编辑" : "Write") : isZh ? "预览" : "Preview"}
        </button>
      </div>

      {/* Surface */}
      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          className="w-full bg-white p-6 text-sm font-medium text-slate-700 outline-none leading-relaxed resize-y"
          style={{ minHeight }}
          placeholder={placeholder || (isZh ? "开始撰写正文…支持标题、列表、加粗、链接，可通过工具栏插入图片和视频。" : "Start writing… headings, lists, bold, links supported. Insert images & videos from the toolbar.")}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="p-8 overflow-y-auto text-slate-700 text-sm sm:text-base leading-8 space-y-6" style={{ minHeight }}>
          {renderRichContent(value) || (
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{isZh ? "暂无内容可预览" : "Nothing to preview yet"}</p>
          )}
        </div>
      )}

      <MediaPickerModal
        open={picker.open}
        lang={lang}
        accept={picker.accept}
        multiple={false}
        title={picker.accept === "video" ? (isZh ? "选择视频" : "Select Video") : isZh ? "选择图片" : "Select Image"}
        onClose={() => setPicker({ open: false, accept: "image" })}
        onApply={applyPickedMedia}
      />
    </div>
  );
}

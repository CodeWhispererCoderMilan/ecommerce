"use client";

import { useRef } from "react";
import type { RichBlock } from "@/types/database";
import { uploadDescriptionImage } from "@/lib/admin";

interface Props {
  blocks: RichBlock[];
  onChange: (blocks: RichBlock[]) => void;
  productSlug: string;
}

export default function RichEditor({ blocks, onChange, productSlug }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const insertingAtRef = useRef<number>(-1);

  function add(type: RichBlock["type"], atIndex?: number) {
    const idx = atIndex ?? blocks.length;
    const newBlock: RichBlock =
      type === "heading" ? { type: "heading", content: "" } :
      type === "text"    ? { type: "text", content: "" } :
                           { type: "image", url: "", alt: "", caption: "" };
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);
  }

  function update(i: number, patch: Partial<RichBlock>) {
    const next = blocks.map((b, idx) => idx === i ? { ...b, ...patch } as RichBlock : b);
    onChange(next);
  }

  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const insertAt = insertingAtRef.current;
    try {
      const url = await uploadDescriptionImage(file, productSlug || "new-product");
      if (insertAt >= 0) {
        update(insertAt, { url } as Partial<RichBlock>);
      } else {
        // Add a new image block with the uploaded URL
        const newBlock: RichBlock = { type: "image", url, alt: "", caption: "" };
        onChange([...blocks, newBlock]);
      }
    } catch (err) {
      alert("Upload failed: " + String(err));
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <p className="text-sm text-zinc-400 italic text-center py-6 border-2 border-dashed border-zinc-200 rounded-xl">
          No content blocks yet — add one below
        </p>
      )}

      {blocks.map((block, i) => (
        <div key={i} className="group border border-zinc-200 rounded-xl overflow-hidden bg-white">
          {/* Block header */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {block.type === "heading" ? "Titlu secțiune" : block.type === "text" ? "Paragraf" : "Imagine"}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button type="button" onClick={() => remove(i)}
                className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Block content */}
          <div className="p-3">
            {block.type === "heading" && (
              <input
                type="text"
                value={block.content}
                onChange={(e) => update(i, { content: e.target.value })}
                placeholder="Titlu secțiune…"
                className="w-full text-lg font-bold text-zinc-900 border-none outline-none bg-transparent"
              />
            )}
            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={(e) => update(i, { content: e.target.value })}
                placeholder="Paragraf text…"
                rows={4}
                className="w-full text-sm text-zinc-700 border-none outline-none bg-transparent resize-none leading-relaxed"
              />
            )}
            {block.type === "image" && (
              <div className="space-y-2">
                {block.url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.url} alt={block.alt ?? ""} className="max-h-64 rounded-lg object-contain mx-auto" />
                    <button type="button"
                      onClick={() => { insertingAtRef.current = i; fileRef.current?.click(); }}
                      className="mt-2 text-xs text-blue-600 hover:underline">
                      Schimbă imaginea
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => { insertingAtRef.current = i; fileRef.current?.click(); }}
                    className="w-full h-28 border-2 border-dashed border-zinc-300 rounded-xl flex items-center justify-center text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors">
                    Click pentru a încărca imagine
                  </button>
                )}
                <input type="text" value={block.alt ?? ""} onChange={(e) => update(i, { alt: e.target.value })}
                  placeholder="Text alternativ (alt)…" className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400" />
                <input type="text" value={block.caption ?? ""} onChange={(e) => update(i, { caption: e.target.value })}
                  placeholder="Legendă imagine (opțional)…" className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400" />
              </div>
            )}
          </div>

          {/* Insert below this block */}
          <div className="px-3 pb-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest self-center mr-1">+ Adaugă după:</span>
            {(["heading", "text", "image"] as const).map((t) => (
              <button key={t} type="button" onClick={() => {
                if (t === "image") { insertingAtRef.current = blocks.length; fileRef.current?.click(); add("image", i); }
                else add(t, i);
              }}
                className="text-[10px] px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded font-semibold">
                {t === "heading" ? "Titlu" : t === "text" ? "Text" : "Imagine"}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => add("heading")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Titlu
        </button>
        <button type="button" onClick={() => add("text")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Paragraf
        </button>
        <button type="button" onClick={() => { insertingAtRef.current = -1; fileRef.current?.click(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Imagine
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

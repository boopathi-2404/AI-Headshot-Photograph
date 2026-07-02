import React from "react";
import { Trash2, Download, ExternalLink, RefreshCw } from "lucide-react";
import { GeneratedHeadshot } from "../types";

interface HistoryGalleryProps {
  items: GeneratedHeadshot[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HistoryGallery({ items, activeId, onSelect, onDelete }: HistoryGalleryProps) {
  if (items.length === 0) {
    return null;
  }

  const triggerDownload = (item: GeneratedHeadshot, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the item when downloading
    const link = document.createElement("a");
    link.href = item.imageUrl;
    link.download = `AI-Headshot-${item.styleId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-100" id="history-gallery-container">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Your Portrait Studio Roll ({items.length})
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">Click any card to load it back onto the studio display stage.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" id="gallery-grid">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group border rounded-xl p-2 bg-white transition-all hover:shadow-md cursor-pointer relative flex flex-col space-y-2 select-none ${
                isActive
                  ? "border-slate-900 ring-2 ring-slate-950/5 bg-slate-50/40"
                  : "border-slate-200/60 hover:border-slate-300"
              }`}
              id={`gallery-item-${item.id}`}
            >
              {/* Photo representation */}
              <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                <img
                  src={item.imageUrl}
                  alt={item.styleName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Micro badge */}
                <div className="absolute top-1.5 left-1.5 bg-black/65 text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-tight max-w-[85%] truncate">
                  {item.styleName}
                </div>

                {/* Floating operations */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => triggerDownload(item, e)}
                    className="p-1.5 bg-white text-slate-800 rounded-md hover:bg-slate-100 shadow hover:scale-105 transition-all cursor-pointer"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1.5 bg-white text-rose-600 rounded-md hover:bg-rose-50 shadow hover:scale-105 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detail info */}
              <div className="text-[10px] space-y-0.5 px-0.5">
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <span>{item.aspectRatio} Aspect</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {item.modelUsed.includes("lite") ? "Standard" : "Premium"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

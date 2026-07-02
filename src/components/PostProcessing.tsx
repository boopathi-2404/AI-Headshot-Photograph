import React from "react";
import { SlidersHorizontal, Check, HelpCircle, Sparkles } from "lucide-react";

export interface ImageFilter {
  id: string;
  name: string;
  filterValue: string;
  description: string;
  previewClass: string; // Tailwind background style for preview circles
}

export const IMAGE_FILTERS: ImageFilter[] = [
  {
    id: "none",
    name: "Raw Studio",
    filterValue: "none",
    description: "Original, untouched AI portrait development.",
    previewClass: "bg-gradient-to-tr from-slate-200 to-slate-400"
  },
  {
    id: "vivid",
    name: "Vivid Glow",
    filterValue: "saturate(135%) contrast(108%) brightness(102%)",
    description: "Vibrant colors, rich skin tones, and bright lights.",
    previewClass: "bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500"
  },
  {
    id: "golden",
    name: "Golden Hour",
    filterValue: "sepia(20%) saturate(125%) brightness(104%) contrast(102%)",
    description: "Sun-drenched, warm portrait highlight glow.",
    previewClass: "bg-gradient-to-tr from-yellow-300 via-orange-400 to-amber-500"
  },
  {
    id: "bw",
    name: "Classic Mono",
    filterValue: "grayscale(100%) contrast(106%)",
    description: "Classic, high-contrast black & white studio look.",
    previewClass: "bg-gradient-to-tr from-slate-800 to-slate-200"
  },
  {
    id: "sepia",
    name: "Warm Sepia",
    filterValue: "sepia(100%) brightness(95%) contrast(105%)",
    description: "Retro-modern warm historic tint.",
    previewClass: "bg-gradient-to-tr from-amber-800 via-amber-600 to-yellow-100"
  },
  {
    id: "cool",
    name: "Cool Teal",
    filterValue: "hue-rotate(-8deg) saturate(115%) contrast(105%)",
    description: "Contemporary cool tones with slight cyan shade.",
    previewClass: "bg-gradient-to-tr from-sky-400 via-teal-400 to-indigo-600"
  }
];

interface PostProcessingProps {
  selectedFilterId: string;
  onSelectFilter: (id: string) => void;
}

export default function PostProcessing({ selectedFilterId, onSelectFilter }: PostProcessingProps) {
  const activeFilter = IMAGE_FILTERS.find((f) => f.id === selectedFilterId) || IMAGE_FILTERS[0];

  return (
    <div className="p-4 bg-slate-50/70 border border-slate-150 rounded-xl space-y-4" id="post-processing-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Post-Processing Darkroom Filters
          </h4>
        </div>
        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> Visual Preview
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
        Apply instant photographic filters to your developed headshot. Tweak the artistic presentation before saving.
      </p>

      {/* Filter Horizontal Row / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" id="filters-grid">
        {IMAGE_FILTERS.map((filter) => {
          const isSelected = filter.id === selectedFilterId;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelectFilter(filter.id)}
              className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 relative group ${
                isSelected
                  ? "border-slate-800 bg-white shadow-sm ring-1 ring-slate-900/5"
                  : "border-slate-200/60 bg-white/50 hover:border-slate-350 hover:bg-white"
              }`}
              id={`filter-btn-${filter.id}`}
            >
              {/* Filter color circle swatch preview */}
              <div className={`w-6 h-6 rounded-full shrink-0 border border-slate-200/50 flex items-center justify-center ${filter.previewClass}`}>
                {isSelected && <Check className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />}
              </div>

              <div className="min-w-0 flex-1">
                <span className={`text-[11px] font-bold block truncate ${isSelected ? "text-slate-950" : "text-slate-700"}`}>
                  {filter.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-1.5 p-2 bg-white rounded border border-slate-100">
        <HelpCircle className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
        <p className="font-medium">
          Note: Darkroom filters apply directly to your browser display for instant portfolio reviews. Downloaded images always capture the raw high-fidelity source portrait.
        </p>
      </div>
    </div>
  );
}

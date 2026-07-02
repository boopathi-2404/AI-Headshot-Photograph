import { Briefcase, Building2, Sun, Sparkles, BookOpen } from "lucide-react";
import { StyleId, StyleOption } from "../types";

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "corporate-grey",
    name: "Corporate Grey Backdrop",
    description: "Classic studio headshot with a textured professional solid grey backdrop and formal lighting.",
    icon: "Briefcase",
    promptAccent: "textured grey studio background, neutral corporate styling",
    exampleBg: "bg-slate-300"
  },
  {
    id: "modern-office",
    name: "Modern Tech Office",
    description: "Bright, airy corporate or startup office with floor-to-ceiling windows and deep depth-of-field blur.",
    icon: "Building2",
    promptAccent: "modern glass tech office with soft bokeh",
    exampleBg: "bg-teal-50"
  },
  {
    id: "outdoor-natural",
    name: "Outdoor Natural Light",
    description: "Warm golden hour natural light portrait, captured against a beautiful soft green foliage background.",
    icon: "Sun",
    promptAccent: "outdoor sun-drenched park background with natural bokeh",
    exampleBg: "bg-amber-50"
  },
  {
    id: "creative-studio",
    name: "Creative Studio Rim Light",
    description: "Chic photography dark canvas with subtle colored rim lighting (teal/magenta) for a creative industry vibe.",
    icon: "Sparkles",
    promptAccent: "dark indigo studio backdrop with stylish neon rim glow",
    exampleBg: "bg-indigo-900"
  },
  {
    id: "executive-library",
    name: "Executive Library",
    description: "Prestigious office library with warm mahogany bookshelves, cozy ambient lamplight, and premium feel.",
    icon: "BookOpen",
    promptAccent: "warm library background with bookshelves and leather chair details",
    exampleBg: "bg-amber-900"
  }
];

interface StyleSelectorProps {
  selectedId: StyleId;
  onSelect: (id: StyleId) => void;
}

export default function StyleSelector({ selectedId, onSelect }: StyleSelectorProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Briefcase": return <Briefcase className="w-5 h-5" />;
      case "Building2": return <Building2 className="w-5 h-5" />;
      case "Sun": return <Sun className="w-5 h-5" />;
      case "Sparkles": return <Sparkles className="w-5 h-5" />;
      case "BookOpen": return <BookOpen className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-3" id="style-selector-container">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Step 2: Choose Backdrop & Style
        </label>
        <span className="text-[11px] text-slate-500 font-medium">Selected: {STYLE_OPTIONS.find(s => s.id === selectedId)?.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5" id="styles-grid">
        {STYLE_OPTIONS.map((style) => {
          const isSelected = style.id === selectedId;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer relative group ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-800"
              }`}
              id={`style-btn-${style.id}`}
            >
              {/* Visual mini-indicator */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                isSelected 
                  ? "bg-white/10 border-white/20 text-white" 
                  : `${style.exampleBg} border-slate-200/50 text-slate-700`
              }`}>
                {getIcon(style.icon)}
              </div>

              <div className="space-y-0.5">
                <span className={`text-sm font-semibold tracking-tight block ${isSelected ? "text-white" : "text-slate-900"}`}>
                  {style.name}
                </span>
                <span className={`text-xs leading-relaxed block ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {style.description}
                </span>
              </div>

              {isSelected && (
                <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { Camera, Sparkles, HelpCircle } from "lucide-react";

interface HeaderProps {
  onShowTips: () => void;
}

export default function Header({ onShowTips }: HeaderProps) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
            <Camera className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
              AI Headshot Photographer
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                <Sparkles className="w-2.5 h-2.5" /> Studio Pro
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Convert your casual selfies into pristine, studio-quality professional portraits instantly.
            </p>
          </div>
        </div>

        <button
          onClick={onShowTips}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 transition-all cursor-pointer"
          id="btn-show-tips"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          Photography Guidelines
        </button>
      </div>
    </header>
  );
}

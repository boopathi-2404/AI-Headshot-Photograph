import React, { useState } from "react";
import { User, Sparkles, ChevronDown, ChevronUp, RefreshCw, Sliders } from "lucide-react";
import { SelfieAnalysis, GenderPresentation } from "../types";

interface FeatureFormProps {
  analysis: SelfieAnalysis;
  onChange: (updated: SelfieAnalysis) => void;
  isAnalyzing: boolean;
}

export default function FeatureForm({ analysis, onChange, isAnalyzing }: FeatureFormProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleFieldChange = (field: keyof SelfieAnalysis, value: string) => {
    onChange({
      ...analysis,
      [field]: value,
    });
  };

  const handleGenderChange = (value: GenderPresentation) => {
    onChange({
      ...analysis,
      genderPresentation: value,
    });
  };

  if (isAnalyzing) {
    return (
      <div className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3.5 text-center" id="features-analyzing-state">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
          <User className="w-5 h-5 text-slate-800 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900">Analyzing Facial Mapping...</h4>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Gemini is securely scanning your selfie to extract physical features while completely ignoring casual clothing or home backdrops.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200/60 rounded-xl bg-white overflow-hidden shadow-sm" id="features-form-wrapper">
      {/* Header Accordion Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        id="btn-accordion-toggle"
      >
        <div className="flex items-center gap-2 text-slate-800">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Step 1.5: Review & Fine-Tune AI Face Scan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
            Detected!
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4" id="features-fields-container">
          <p className="text-xs text-slate-500 leading-relaxed">
            Review the characteristics extracted from your selfie. Feel free to tweak these values to adjust how the AI represents you (e.g. hair style, eyeglasses, or gender accents).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Gender Presentation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Gender Style
              </label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs bg-slate-50 p-0.5" id="gender-style-tabs">
                {(["Masculine", "Feminine", "Neutral"] as GenderPresentation[]).map((gender) => {
                  const isSel = analysis.genderPresentation === gender;
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => handleGenderChange(gender)}
                      className={`flex-1 py-1 px-2 font-semibold rounded-md transition-all cursor-pointer ${
                        isSel
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Age Target
              </label>
              <input
                type="text"
                value={analysis.ageRange}
                onChange={(e) => handleFieldChange("ageRange", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., 30s"
              />
            </div>

            {/* Hair Style */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Hair Cut & Length
              </label>
              <input
                type="text"
                value={analysis.hairStyle}
                onChange={(e) => handleFieldChange("hairStyle", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., short side-parted"
              />
            </div>

            {/* Hair Color */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Hair Color
              </label>
              <input
                type="text"
                value={analysis.hairColor}
                onChange={(e) => handleFieldChange("hairColor", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., dark brown"
              />
            </div>

            {/* Eye Color */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Eye Details
              </label>
              <input
                type="text"
                value={analysis.eyeColor}
                onChange={(e) => handleFieldChange("eyeColor", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., brown eyes"
              />
            </div>

            {/* Facial Features */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Facial Hair / Features
              </label>
              <input
                type="text"
                value={analysis.facialFeatures}
                onChange={(e) => handleFieldChange("facialFeatures", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., light stubble"
              />
            </div>

            {/* Glasses or Accessories */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Eyewear & Accessories
              </label>
              <input
                type="text"
                value={analysis.glassesOrAccessories}
                onChange={(e) => handleFieldChange("glassesOrAccessories", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., thin black frames, none"
              />
            </div>

            {/* Ethnicity / Aesthetic */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Facial Structure / Ethnic Accent
              </label>
              <input
                type="text"
                value={analysis.ethnicityOrAesthetic}
                onChange={(e) => handleFieldChange("ethnicityOrAesthetic", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30"
                placeholder="e.g., South Asian descent"
              />
            </div>
          </div>

          {/* Consolidated Base Prompt Textarea */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Consolidated Physical Prompt Segment
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">Will feed into Image Generator</span>
            </div>
            <textarea
              value={analysis.suggestedFeaturesPrompt}
              onChange={(e) => handleFieldChange("suggestedFeaturesPrompt", e.target.value)}
              rows={2}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/30 font-mono resize-none leading-relaxed"
              placeholder="e.g. A 30-year-old South Asian man with short dark brown hair, wearing clean-shaven stubble..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

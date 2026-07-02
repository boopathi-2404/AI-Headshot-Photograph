import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  Download, 
  RefreshCw, 
  Info, 
  X, 
  Smile, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  Sliders,
  Maximize2
} from "lucide-react";

import Header from "./components/Header";
import SelfieUpload from "./components/SelfieUpload";
import StyleSelector, { STYLE_OPTIONS } from "./components/StyleSelector";
import FeatureForm from "./components/FeatureForm";
import BeforeAfterSlider from "./components/BeforeAfterSlider";
import HistoryGallery from "./components/HistoryGallery";
import PostProcessing, { IMAGE_FILTERS } from "./components/PostProcessing";
import { 
  StyleId, 
  SelfieAnalysis, 
  AspectRatio, 
  GeneratedHeadshot 
} from "./types";

const LOADING_QUOTES = [
  "Adjusting lighting setup for professional exposure...",
  "Applying digital makeup and smoothing facial textures...",
  "Positioning selected backdrop backdrop...",
  "Fitting premium formal attire and business collar...",
  "Dressing with custom tailoring and details...",
  "Simulating 85mm f/1.4 lens bokeh blur...",
  "Developing digital portrait film negative...",
  "Fine-tuning eye reflection and studio catchlights..."
];

const INITIAL_ANALYSIS: SelfieAnalysis = {
  genderPresentation: "Neutral",
  ageRange: "30s",
  hairStyle: "neatly combed",
  hairColor: "dark",
  eyeColor: "brown eyes",
  facialFeatures: "soft features",
  skinTone: "natural tone",
  glassesOrAccessories: "none",
  ethnicityOrAesthetic: "inclusive descent",
  suggestedFeaturesPrompt: "A professional with neatly combed dark hair, warm approachable eyes, and a confident smile."
};

export default function App() {
  // State variables
  const [selfie, setSelfie] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SelfieAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("corporate-grey");
  const [customAdjustments, setCustomAdjustments] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [generationModel, setGenerationModel] = useState<string>("gemini-3.1-flash-lite-image");
  
  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Gallery state
  const [gallery, setGallery] = useState<GeneratedHeadshot[]>([]);
  const [activeHeadshotId, setActiveHeadshotId] = useState<string | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState<string>("none");
  
  // Modals & Messages
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Interval references
  const quoteIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize gallery from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_headshot_gallery");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGallery(parsed);
          setActiveHeadshotId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved gallery:", e);
      }
    }
  }, []);

  // Sync gallery to local storage on change
  const saveGalleryToStorage = (updatedGallery: GeneratedHeadshot[]) => {
    localStorage.setItem("ai_headshot_gallery", JSON.stringify(updatedGallery));
  };

  // Rotate loading quotes when generating
  useEffect(() => {
    if (isGenerating) {
      setLoadingQuoteIndex(0);
      setLoadingProgress(5);
      
      quoteIntervalRef.current = setInterval(() => {
        setLoadingQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
      }, 3500);

      progressIntervalRef.current = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) return 95; // Hold near completion until server actually returns
          const increment = prev < 50 ? 8 : prev < 80 ? 4 : 1.5;
          return prev + increment;
        });
      }, 800);
    } else {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setLoadingProgress(0);
    }

    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isGenerating]);

  // Reset filter when changing active headshot
  useEffect(() => {
    setSelectedFilterId("none");
  }, [activeHeadshotId]);

  // Request Selfie Face Scan
  const handleSelfieUpload = async (base64Image: string) => {
    setSelfie(base64Image);
    setAnalysis(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis request failed.");
      }

      const data: SelfieAnalysis = await response.json();
      setAnalysis(data);
      setSuccessMsg("Selfie analyzed successfully! Review the detected traits below.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to scan selfie features. Using default portrait tags instead.");
      // Fallback description so they can still generate
      setAnalysis(INITIAL_ANALYSIS);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Headshot Portrait
  const handleGenerateHeadshot = async () => {
    if (!selfie) {
      setError("Please capture or upload a selfie first.");
      return;
    }
    if (!analysis) {
      setError("Waiting for selfie analysis. Please let the facial scan complete.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-headshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: selectedStyle,
          featuresPrompt: analysis.suggestedFeaturesPrompt,
          gender: analysis.genderPresentation,
          aspectRatio,
          customAdjustments,
          modelName: generationModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Headshot generation failed.");
      }

      const data = await response.json();

      // Successfully generated
      const activeStyle = STYLE_OPTIONS.find(s => s.id === selectedStyle);
      const newHeadshot: GeneratedHeadshot = {
        id: `h_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        styleId: selectedStyle,
        styleName: activeStyle?.name || selectedStyle,
        imageUrl: data.imageUrl,
        promptUsed: data.promptUsed,
        modelUsed: data.modelUsed,
        selfieUrl: selfie,
        aspectRatio,
      };

      const updatedGallery = [newHeadshot, ...gallery];
      setGallery(updatedGallery);
      setActiveHeadshotId(newHeadshot.id);
      saveGalleryToStorage(updatedGallery);
      
      setSuccessMsg("Your professional portrait has been developed!");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate headshot. Please check your system configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete a headshot from gallery
  const handleDeleteHeadshot = (id: string) => {
    const updated = gallery.filter(item => item.id !== id);
    setGallery(updated);
    saveGalleryToStorage(updated);

    if (activeHeadshotId === id) {
      setActiveHeadshotId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const activeHeadshot = gallery.find(item => item.id === activeHeadshotId);

  const triggerDownloadActive = () => {
    if (!activeHeadshot) return;
    const link = document.createElement("a");
    link.href = activeHeadshot.imageUrl;
    link.download = `AI-Headshot-${activeHeadshot.styleId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans" id="app-root">
      {/* Primary header branding */}
      <Header onShowTips={() => setShowTips(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main">
        {/* Error / Success Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3.5"
              id="error-banner"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800">Studio Warning / Error</h5>
                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
              <button onClick={() => setError(null)} className="p-1 text-rose-400 hover:text-rose-600 rounded-md cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3.5"
              id="success-banner"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Studio Notification</h5>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  {successMsg}
                </p>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="p-1 text-emerald-400 hover:text-emerald-600 rounded-md cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="studio-grid">
          
          {/* LEFT SIDE: Inputs, Toggles & Configurations (7/12 cols) */}
          <div className="lg:col-span-6 space-y-7" id="left-controls-panel">
            
            {/* Box 1: Selfie Upload / Camera */}
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <SelfieUpload 
                image={selfie} 
                onImageChange={(img) => {
                  setSelfie(img);
                  if (!img) {
                    setAnalysis(null);
                  }
                }}
                onAnalysisRequested={handleSelfieUpload}
                isAnalyzing={isAnalyzing}
              />

              {/* Analysis Accordion Form */}
              {(isAnalyzing || analysis) && (
                <FeatureForm 
                  analysis={analysis || INITIAL_ANALYSIS} 
                  onChange={setAnalysis}
                  isAnalyzing={isAnalyzing}
                />
              )}
            </div>

            {/* Box 2: Styling and Generation settings */}
            {selfie && analysis && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-6"
                id="style-config-card"
              >
                {/* Style Backdrop selection */}
                <StyleSelector 
                  selectedId={selectedStyle} 
                  onSelect={setSelectedStyle} 
                />

                {/* Configuration Toggles (Aspect, Model Quality, Custom tweaks) */}
                <div className="border-t border-slate-100 pt-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Step 3: Output Specifications
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Aspect Ratio choice */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-center p-0.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold">
                        {(["1:1", "3:4", "4:3"] as AspectRatio[]).map((ar) => {
                          const isSel = aspectRatio === ar;
                          return (
                            <button
                              key={ar}
                              type="button"
                              onClick={() => setAspectRatio(ar)}
                              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                                isSel
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                              }`}
                            >
                              {ar === "1:1" ? "Square" : ar === "3:4" ? "Portrait" : "Landscape"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Image Model selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Generation Engine
                      </label>
                      <select
                        value={generationModel}
                        onChange={(e) => setGenerationModel(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-slate-800 font-semibold h-[34px]"
                      >
                        <option value="gemini-3.1-flash-lite-image">⚡ Standard Speed (Lite)</option>
                        <option value="gemini-3.1-flash-image">💎 High-Quality Premium</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom adjustments tweaks input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-slate-400" />
                        Custom Photographic Adjustments (Optional)
                      </label>
                    </div>
                    <textarea
                      value={customAdjustments}
                      onChange={(e) => setCustomAdjustments(e.target.value)}
                      placeholder="e.g. smiling warmly, wearing a sleek black turtleneck, hair neatly combed, clean look..."
                      rows={2}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 placeholder-slate-400 bg-slate-50/20 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Ultimate Develop Action button */}
                  <button
                    type="button"
                    onClick={handleGenerateHeadshot}
                    disabled={isGenerating || isAnalyzing}
                    className="w-full py-4 px-6 bg-slate-950 text-white rounded-xl font-bold shadow-lg hover:shadow-slate-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="btn-trigger-generation"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Developing Professional negative...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Develop Professional Portrait
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT SIDE: Interactive Portrait Studio Canvas View (5/12 cols) */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:sticky lg:top-24 space-y-6" id="right-studio-canvas">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="studio-canvas-header">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Studio Portfolios Chamber</h3>
              </div>
              {activeHeadshot && (
                <div className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-tight">
                  {activeHeadshot.styleName}
                </div>
              )}
            </div>

            {/* Viewport conditions */}
            {isGenerating ? (
              /* Generating Development Screen */
              <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6 text-center min-h-[400px] bg-slate-950 rounded-xl text-white relative overflow-hidden shadow-inner" id="studio-generating-canvas">
                
                {/* Backdrop lighting effects simulation */}
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent animate-pulse pointer-events-none" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
                  <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-bounce" />
                </div>

                <div className="space-y-4 max-w-sm relative z-10">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold tracking-wide">Developing Portrait negative...</h4>
                    <p className="text-xs text-slate-400 font-medium">Please stand by during darkroom composition.</p>
                  </div>

                  {/* Active Quote */}
                  <div className="min-h-[40px] px-4 py-2 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-center">
                    <p className="text-xs font-semibold text-emerald-300 animate-pulse italic">
                      "{LOADING_QUOTES[loadingQuoteIndex]}"
                    </p>
                  </div>

                  {/* Development linear progress */}
                  <div className="space-y-1.5 pt-2">
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Exposing</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeHeadshot ? (
              /* Developed Image Display */
              <div className="space-y-5" id="developed-view-canvas">
                
                {/* Before After Slider compare */}
                <BeforeAfterSlider 
                  beforeUrl={activeHeadshot.selfieUrl} 
                  afterUrl={activeHeadshot.imageUrl} 
                  aspectRatio={activeHeadshot.aspectRatio}
                  filterValue={IMAGE_FILTERS.find((f) => f.id === selectedFilterId)?.filterValue || "none"}
                />

                {/* Post-Processing section */}
                <PostProcessing 
                  selectedFilterId={selectedFilterId} 
                  onSelectFilter={setSelectedFilterId} 
                />

                {/* Operations & Metadata actions */}
                <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl space-y-4">
                  
                  {/* Metadata labels */}
                  <div className="grid grid-cols-2 gap-3 text-[11px]" id="metadata-grid">
                    <div className="bg-white p-2 rounded border border-slate-200/50">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Backdrop Setting</span>
                      <span className="font-semibold text-slate-800">{activeHeadshot.styleName}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200/50">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Developed With</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {activeHeadshot.modelUsed.includes("lite") ? "Imagen Standard" : "Imagen Premium HQ"}
                      </span>
                    </div>
                  </div>

                  {/* Primary download button */}
                  <button
                    type="button"
                    onClick={triggerDownloadActive}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    id="btn-download-developed"
                  >
                    <Download className="w-4 h-4" />
                    Download High-Res Portrait (.PNG)
                  </button>

                  {/* Editable prompt copy review */}
                  <details className="text-[11px]" id="prompt-sheet-disclosure">
                    <summary className="font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 list-none flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Review Composite Studio Prompt</span>
                    </summary>
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 leading-relaxed font-mono select-all">
                      {activeHeadshot.promptUsed}
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              /* Initial Placeholder Empty state */
              <div className="border border-dashed border-slate-200 rounded-xl py-20 px-4 flex flex-col items-center justify-center space-y-4 text-center min-h-[400px] bg-slate-50/20" id="studio-empty-canvas">
                <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 border border-slate-50">
                  <ImageIcon className="w-7 h-7 text-slate-300" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-semibold text-slate-800">No Developed Portrait Yet</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Please upload a selfie on the left, let Gemini analyze your features, then choose your preferred professional style to trigger your first photo session.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM: Global Session Gallery History Roll */}
        <HistoryGallery 
          items={gallery} 
          activeId={activeHeadshotId} 
          onSelect={setActiveHeadshotId} 
          onDelete={handleDeleteHeadshot} 
        />
      </main>

      {/* FOOTER credit and guidelines trigger */}
      <footer className="border-t border-slate-100 bg-white/40 mt-16 py-8 text-center text-xs text-slate-400 font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            AI Headshot Photographer &copy; {new Date().getFullYear()}. Secure, local sandbox environment.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setShowTips(true)} className="hover:text-slate-600 underline cursor-pointer">
              Backdrop Specs
            </button>
            <a href="https://ai.studio/build" target="_blank" rel="noreferrer" className="hover:text-slate-600 underline">
              Google AI Studio
            </a>
          </div>
        </div>
      </footer>

      {/* Photography Tips Dialog Modal Backdrop */}
      <AnimatePresence>
        {showTips && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="modal-tips">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between" id="modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">AI Portrait Guidelines</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
                  id="btn-close-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-600" id="modal-body">
                <p className="font-medium leading-relaxed text-slate-800">
                  To get the most lifelike and authentic AI headshot, follow these expert rules when uploading or snapping your selfie:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <p className="leading-relaxed">
                      <strong>Soft Frontal Lighting</strong>: Stand facing a window or light source. Avoid harsh overhead lighting or deep shadows running across your nose or cheek.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <p className="leading-relaxed">
                      <strong>Eye-Level Capture</strong>: Look directly at the lens. Avoid extreme low angles (causes chin distortion) or high angles (unnatural pose).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <p className="leading-relaxed">
                      <strong>Warm or Neutral Expression</strong>: A warm smile with open eyes works best. High-energy faces or open mouths might produce unexpected artifacts.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                    <p className="leading-relaxed">
                      <strong>Limit Large Accessories</strong>: Remove sunglasses, bulky hats, or massive face piercings unless they are part of your everyday corporate brand.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex gap-2.5 text-slate-500 font-medium leading-relaxed">
                  <Info className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[11px]">
                    Note: Your selfie is processed securely inside your server container. We do not persist or sell your facial biometric data to third-party advertisers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end" id="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

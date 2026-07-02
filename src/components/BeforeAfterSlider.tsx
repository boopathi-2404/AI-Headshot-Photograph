import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  aspectRatio?: "1:1" | "3:4" | "4:3";
  filterValue?: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, aspectRatio = "1:1", filterValue = "none" }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"slider" | "before" | "after">("slider");
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine height classes based on aspect ratio
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "3:4":
        return "aspect-[3/4]";
      case "4:3":
        return "aspect-[4/3]";
      case "1:1":
      default:
        return "aspect-square";
    }
  };

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  return (
    <div className="space-y-3" id="before-after-slider-container">
      {/* Quick Toggle Tabs */}
      <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs" id="slider-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("slider")}
          className={`flex-1 py-1.5 px-3 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "slider"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
          id="btn-tab-slider"
        >
          Compare Slider
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("before")}
          className={`flex-1 py-1.5 px-3 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "before"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
          id="btn-tab-before"
        >
          Original Selfie
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("after")}
          className={`flex-1 py-1.5 px-3 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "after"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
          id="btn-tab-after"
        >
          AI Headshot
        </button>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full ${getAspectRatioClass()} rounded-xl overflow-hidden select-none shadow-sm border border-slate-200/50 bg-slate-50`}
        id="slider-stage"
      >
        {activeTab === "slider" ? (
          <>
            {/* Before (Underneath) */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={beforeUrl}
                alt="Before"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                Original Selfie
              </div>
            </div>

            {/* After (Clipped Overlay) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img
                src={afterUrl}
                alt="After"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                style={{ filter: filterValue }}
              />
              <div className="absolute bottom-3 right-3 bg-emerald-500/85 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                AI Headshot
              </div>
            </div>

            {/* Drag Handle Bar & Button */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center group"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              id="slider-bar-handle"
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg border border-slate-200 group-hover:scale-110 active:scale-95 transition-transform select-none">
                <svg
                  className="w-4 h-4 text-slate-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 9l-4 4 4 4m8 0l4-4-4-4"
                  />
                </svg>
              </div>
            </div>
          </>
        ) : activeTab === "before" ? (
          <div className="w-full h-full relative">
            <img
              src={beforeUrl}
              alt="Before"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
              Original Selfie
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img
              src={afterUrl}
              alt="After"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              style={{ filter: filterValue }}
            />
            <div className="absolute bottom-3 right-3 bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
              AI Headshot
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 font-medium">
        {activeTab === "slider" ? "Drag the divider handle left or right to compare" : "Using toggle tabs to review full aspect views"}
      </p>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Upload, Camera, Trash2, FlipHorizontal, RefreshCw, X } from "lucide-react";

interface SelfieUploadProps {
  image: string | null;
  onImageChange: (image: string | null) => void;
  onAnalysisRequested?: (base64Image: string) => void;
  isAnalyzing?: boolean;
}

export default function SelfieUpload({ image, onImageChange, onAnalysisRequested, isAnalyzing = false }: SelfieUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirror, setIsMirror] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Drag Over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Process File and convert to Base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG or JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onImageChange(base64);
      if (onAnalysisRequested) {
        onAnalysisRequested(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setCameraError("Unable to access camera. Please check your permissions or upload a file.");
      setIsCameraActive(false);
    }
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    
    // Set square dimensions
    const size = Math.min(video.videoWidth, video.videoHeight) || 600;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop to a square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    if (isMirror) {
      // Flip canvas context for mirrored display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onImageChange(dataUrl);
    stopCamera();

    if (onAnalysisRequested) {
      onAnalysisRequested(dataUrl);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-3" id="selfie-upload-container">
      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
        Step 1: Upload Your Casual Selfie
      </label>

      {image ? (
        <div className={`relative group rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 ${isAnalyzing ? "scanline-effect" : ""}`} id="selfie-preview-wrapper">
          <img
            src={image}
            alt="Casual Selfie"
            className="w-full aspect-square object-cover"
            referrerPolicy="no-referrer"
            id="selfie-preview-img"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRemove}
              className="p-3 bg-white text-rose-600 rounded-full hover:bg-rose-50 shadow-md hover:scale-110 transition-transform cursor-pointer"
              title="Remove Selfie"
              id="btn-remove-selfie"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <label
              htmlFor="change-file-upload"
              className="p-3 bg-white text-slate-700 rounded-full hover:bg-slate-50 shadow-md hover:scale-110 transition-transform cursor-pointer"
              title="Upload New Selfie"
              id="label-change-selfie"
            >
              <RefreshCw className="w-5 h-5" />
            </label>
            <input
              id="change-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        </div>
      ) : isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-900 bg-black aspect-square flex flex-col justify-between" id="webcam-view-wrapper">
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${isMirror ? "scale-x-[-1]" : ""}`}
              id="webcam-video"
            />
            
            {/* Guide overlay */}
            <div className="absolute inset-0 border-[32px] border-black/40 pointer-events-none flex items-center justify-center">
              <div className="w-4/5 h-4/5 border-2 border-dashed border-white/60 rounded-full" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 flex items-center justify-between gap-4 border-t border-slate-800" id="webcam-controls">
            <button
              type="button"
              onClick={stopCamera}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Cancel"
              id="btn-cancel-cam"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              id="btn-capture-cam"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              Capture Selfie
            </button>

            <button
              type="button"
              onClick={() => setIsMirror(!isMirror)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Flip Mirroring"
              id="btn-flip-cam"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragActive
              ? "border-slate-900 bg-slate-50/50"
              : "border-slate-200 bg-slate-50/20 hover:bg-slate-50/50 hover:border-slate-300"
          }`}
          id="dropzone"
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />

          <div className="flex flex-col items-center justify-center space-y-4" id="dropzone-content">
            <div className="p-3.5 bg-white border border-slate-100 rounded-full shadow-sm text-slate-400">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Drag & drop your selfie here
              </p>
              <p className="text-xs text-slate-400">
                Supports PNG or JPEG (square aspect ratio preferred)
              </p>
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs pt-1 justify-center">
              <label
                htmlFor="file-upload"
                className="flex-1 text-center py-2 px-3 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                id="label-browse-files"
              >
                Browse Files
              </label>

              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2 px-3 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                id="btn-use-cam"
              >
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                Use Webcam
              </button>
            </div>
          </div>

          {cameraError && (
            <p className="mt-3 text-xs text-rose-500 font-medium text-center" id="cam-error-text">
              {cameraError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

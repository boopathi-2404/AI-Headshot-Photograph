export type StyleId = "corporate-grey" | "modern-office" | "outdoor-natural" | "creative-studio" | "executive-library";

export interface StyleOption {
  id: StyleId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  promptAccent: string;
  exampleBg: string; // Tailwind bg color class for visual style indicators
}

export type GenderPresentation = "Masculine" | "Feminine" | "Neutral";

export interface SelfieAnalysis {
  genderPresentation: GenderPresentation;
  ageRange: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  facialFeatures: string;
  skinTone: string;
  glassesOrAccessories: string;
  ethnicityOrAesthetic: string;
  suggestedFeaturesPrompt: string;
}

export type AspectRatio = "1:1" | "3:4" | "4:3";

export interface GeneratedHeadshot {
  id: string;
  timestamp: string;
  styleId: StyleId;
  styleName: string;
  imageUrl: string;
  promptUsed: string;
  modelUsed: string;
  selfieUrl: string;
  aspectRatio: AspectRatio;
}

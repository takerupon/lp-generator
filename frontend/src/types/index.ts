// LP生成に必要なデータの型定義
export type LPGenerationData = {
  serviceName: string;
  serviceType: string;
  targetAudience: string;
  features: string;
  testimonials: string;
  companyName: string;
};

// 生成ステップの型定義
export type GenerationStep = {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
};

// LPのデータ型定義
export type LPData = {
  jobId: string;
  html: string;
  css: string;
  js: string;
  previewUrl?: string;
  imageUrls: string[];
  createdAt: string;
};

// ジョブ状態の型定義
export type JobStatus = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  currentStep: string;
  steps: GenerationStep[];
  error?: string;
  result?: LPData;
};

// 生成状態の型定義
export type GenerationState = "idle" | "submitting" | "processing" | "completed" | "error";

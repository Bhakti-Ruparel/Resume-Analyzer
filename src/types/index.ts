// ── API Response Types ────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  trained: boolean;
  analysis_ready: boolean;
}

export interface EDAResponse {
  class_distribution: Record<string, number>;
  word_count_stats: { avg: number; median: number; min: number; max: number };
  char_count_stats: { avg: number; median: number; min: number; max: number };
  top_words: { word: string; count: number }[];
  bigrams: { word: string; count: number }[];
  trigrams: { word: string; count: number }[];
  per_class_terms: Record<string, { word: string; count: number }[]>;
}

export interface DataQualityResponse {
  missing_count: number;
  duplicate_rows: number;
  duplicate_texts: number;
  empty_resumes: number;
  usable_records: number;
}

export interface ModelEval {
  name: string;
  key: string;
  macro_f1: number;
  weighted_f1: number;
  accuracy: number;
  per_class_f1: Record<string, number>;
  confusion_matrix: number[][];
  class_names: string[];
}

export interface EvaluationResponse {
  models: ModelEval[];
  best_model: string;
  best_model_key: string;
  training_notes: string;
}

export interface ErrorItem {
  true_label: string;
  predicted_label: string;
  resume_snippet: string;
  confidence: number;
}

export interface ConfusionPair {
  true: string;
  pred: string;
  count: number;
}

export interface ErrorAnalysisResponse {
  errors: ErrorItem[];
  confusion_pairs: ConfusionPair[];
}

export interface PredictResponse {
  category: string;
  confidence: number;
  all_scores: Record<string, number>;
}

// ── Static / hardcoded data types ─────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

export interface ModelResult {
  name: string;
  key: string;
  accuracy: number;
  macroF1: number;
  representation: string;
  isBest: boolean;
  color: string;
}

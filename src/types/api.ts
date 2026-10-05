// ============================================================
// API response types — all shapes returned by the FastAPI backend
// ============================================================

export interface HealthResponse {
  status: 'ok' | 'error'
  trained: boolean
  analysis_ready: boolean
}

export interface ProblemResponse {
  title: string
  description: string
  task_type: string
  input: string
  output: string
  primary_metric: string
  metric_rationale: string
  num_classes: number
  categories: string[]
  example: {
    input: string
    output: string
  }
}

export interface DatasetSummary {
  total_rows: number
  num_classes: number
  class_names: string[]
  class_counts: Record<string, number>
  avg_words: number
  max_words: number
  avg_chars: number
  max_chars: number
  imbalance_ratio: number
  smallest_class: string
  largest_class: string
}

export interface DataQualityResponse {
  missing_resumes: number
  duplicate_rows: number
  duplicate_texts: number
  empty_resumes: number
  usable_records: number
}

export interface WordCountByClass {
  min: number
  max: number
  mean: number
  count: number
}

export interface TopWord {
  word: string
  count: number
}

export interface EDAResponse {
  word_count_by_class: Record<string, WordCountByClass>
  top_words_by_class: Record<string, TopWord[]>
}

export interface PreprocessingStep {
  step: string
  reason: string
  example_before: string
  example_after: string
}

export type PreprocessingResponse = PreprocessingStep[]

export interface TFIDFFeature {
  name: string
  max_features: number
  ngram_range: [number, number]
  sublinear_tf: boolean
  why_chosen: string
  pros: string[]
  cons: string[]
}

export interface Word2VecFeature {
  name: string
  vector_size: number
  window: number
  min_count: number
  why_chosen: string
  document_vector_method: string
  pros: string[]
  cons: string[]
}

export interface NeuralNetworkFeature {
  name: string
  architecture: string
  input_size: number
  hidden_layers: number[]
  output_size: number
  dropout: number
  optimizer: string
  loss: string
  epochs: number
  why_chosen: string
}

export interface FeaturesResponse {
  tfidf: TFIDFFeature
  word2vec: Word2VecFeature
  neural_network: NeuralNetworkFeature
}

export interface ModelEntry {
  id: string
  name: string
  family: string
  feature_repr: string
  hyperparams: Record<string, string | number | boolean>
  rationale: string
  pros: string[]
  cons: string[]
}

export interface ModelsResponse {
  models: ModelEntry[]
}

export interface ModelEvaluation {
  name: string
  key: string
  macro_f1: number
  weighted_f1: number
  accuracy: number
  per_class_f1: Record<string, number>
  confusion_matrix: number[][]
  class_names: string[]
}

export interface EvaluationResponse {
  models: ModelEvaluation[]
  best_model: string
  best_model_key: string
  training_notes: string
}

export interface ErrorSample {
  true_label: string
  predicted_label: string
  resume_snippet: string
  confidence: number
}

export interface ConfusionPair {
  true: string
  pred: string
  count: number
}

export interface ErrorAnalysisResponse {
  errors: ErrorSample[]
  confusion_pairs: ConfusionPair[]
}

export interface PipelineStage {
  step: number
  name: string
  description: string
  details: string
}

export interface PipelineResponse {
  title: string
  description: string
  stages: PipelineStage[]
}

export interface PredictResponse {
  category: string
  confidence: number
  all_scores: Record<string, number>
}

export interface NotTrainedSentinel {
  status: 'not_trained'
}

export type ApiResponse<T> =
  | T
  | NotTrainedSentinel

export interface ApiError {
  message: string
  detail?: string
  status?: number
}

// Backward compat alias
export type AnalysisStatus = 'not_trained' | 'ready'

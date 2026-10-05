import client from './client';
import type {
  HealthResponse,
  EDAResponse,
  DataQualityResponse,
  EvaluationResponse,
  ErrorAnalysisResponse,
  PredictResponse,
} from '../types';

async function safeGet<T>(url: string): Promise<T | null> {
  try {
    const res = await client.get<T>(url);
    return res.data;
  } catch {
    return null;
  }
}

export const getHealth = () => safeGet<HealthResponse>('/health');
export const getEDA = () => safeGet<EDAResponse>('/eda');
export const getDataQuality = () => safeGet<DataQualityResponse>('/data-quality');
export const getEvaluation = () => safeGet<EvaluationResponse>('/evaluation');
export const getErrors = () => safeGet<ErrorAnalysisResponse>('/errors');

export async function predictText(text: string): Promise<PredictResponse | null> {
  try {
    const res = await client.post<PredictResponse>('/predict', { text });
    return res.data;
  } catch {
    return null;
  }
}

export async function predictFile(file: File): Promise<PredictResponse | null> {
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post<PredictResponse>('/predict/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch {
    return null;
  }
}

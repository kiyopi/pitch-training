/**
 * 音声処理ユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * リアルタイム音声処理・フィルタリング・音量解析
 */

import { AUDIO_PROCESSING, VOCAL_RANGE } from './constants';
import type { 
  AudioProcessingResult, 
  VolumeAnalysis,
  FrequencyAnalysis 
} from '../types';

/**
 * 音声データの音量解析
 */
export const analyzeVolume = (
  audioData: Float32Array
): VolumeAnalysis => {
  let sum = 0;
  let peak = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const abs = Math.abs(audioData[i]);
    sum += abs * abs;
    if (abs > peak) peak = abs;
  }
  
  const rms = Math.sqrt(sum / audioData.length);
  const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  
  return {
    rms,
    peak,
    db,
    isActive: rms > AUDIO_PROCESSING.VOLUME_THRESHOLD / 100
  };
};

/**
 * 周波数スペクトラム解析
 */
export const analyzeFrequencySpectrum = (
  frequencyData: Uint8Array,
  sampleRate: number = AUDIO_PROCESSING.SAMPLE_RATE
): FrequencyAnalysis => {
  const binCount = frequencyData.length;
  const nyquistFreq = sampleRate / 2;
  const binWidth = nyquistFreq / binCount;
  
  // ピーク周波数検出
  let maxBin = 0;
  let maxValue = 0;
  
  for (let i = 0; i < binCount; i++) {
    if (frequencyData[i] > maxValue) {
      maxValue = frequencyData[i];
      maxBin = i;
    }
  }
  
  const peakFrequency = maxBin * binWidth;
  const confidence = maxValue / 255; // 0-1正規化
  
  // 音楽的周波数範囲での解析
  const musicalRange = {
    startBin: Math.floor(VOCAL_RANGE.min / binWidth),
    endBin: Math.ceil(VOCAL_RANGE.max / binWidth)
  };
  
  let musicalPeak = 0;
  let musicalMaxValue = 0;
  
  for (let i = musicalRange.startBin; i <= musicalRange.endBin && i < binCount; i++) {
    if (frequencyData[i] > musicalMaxValue) {
      musicalMaxValue = frequencyData[i];
      musicalPeak = i;
    }
  }
  
  const musicalPeakFrequency = musicalPeak * binWidth;
  
  return {
    peakFrequency,
    musicalPeakFrequency,
    confidence,
    spectralCentroid: calculateSpectralCentroid(frequencyData, binWidth),
    spectralRolloff: calculateSpectralRolloff(frequencyData, binWidth)
  };
};

/**
 * スペクトラル重心計算
 */
const calculateSpectralCentroid = (
  frequencyData: Uint8Array,
  binWidth: number
): number => {
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = i * binWidth;
    const magnitude = frequencyData[i] / 255;
    
    numerator += frequency * magnitude;
    denominator += magnitude;
  }
  
  return denominator > 0 ? numerator / denominator : 0;
};

/**
 * スペクトラルロールオフ計算
 */
const calculateSpectralRolloff = (
  frequencyData: Uint8Array,
  binWidth: number,
  threshold: number = 0.85
): number => {
  // 全エネルギー計算
  let totalEnergy = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    totalEnergy += frequencyData[i];
  }
  
  // 閾値エネルギー計算
  const thresholdEnergy = totalEnergy * threshold;
  
  // ロールオフ周波数検索
  let cumulativeEnergy = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    cumulativeEnergy += frequencyData[i];
    if (cumulativeEnergy >= thresholdEnergy) {
      return i * binWidth;
    }
  }
  
  return frequencyData.length * binWidth; // フォールバック
};

/**
 * 音声品質評価
 */
export const evaluateAudioQuality = (
  volumeAnalysis: VolumeAnalysis,
  frequencyAnalysis: FrequencyAnalysis
): {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 100;
  
  // 音量チェック
  if (volumeAnalysis.db < -40) {
    issues.push('音量が低すぎます');
    score -= 30;
  } else if (volumeAnalysis.db < -20) {
    issues.push('音量をもう少し上げてください');
    score -= 15;
  }
  
  // ピーク音量チェック
  if (volumeAnalysis.peak > 0.95) {
    issues.push('音量が大きすぎます（クリッピングの可能性）');
    score -= 25;
  }
  
  // 周波数品質チェック
  if (frequencyAnalysis.confidence < 0.3) {
    issues.push('音声信号が不明瞭です');
    score -= 20;
  }
  
  // 音楽的周波数範囲チェック
  if (frequencyAnalysis.musicalPeakFrequency < VOCAL_RANGE.min || 
      frequencyAnalysis.musicalPeakFrequency > VOCAL_RANGE.max) {
    issues.push('音域が適切な範囲外です');
    score -= 15;
  }
  
  // 品質判定
  let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) overallQuality = 'excellent';
  else if (score >= 70) overallQuality = 'good';
  else if (score >= 50) overallQuality = 'fair';
  else overallQuality = 'poor';
  
  return {
    overallQuality,
    score: Math.max(0, score),
    issues
  };
};

/**
 * 音声処理結果統合
 */
export const createAudioProcessingResult = (
  audioData: Float32Array,
  frequencyData: Uint8Array,
  sampleRate: number = AUDIO_PROCESSING.SAMPLE_RATE
): AudioProcessingResult => {
  const volumeAnalysis = analyzeVolume(audioData);
  const frequencyAnalysis = analyzeFrequencySpectrum(frequencyData, sampleRate);
  const qualityEvaluation = evaluateAudioQuality(volumeAnalysis, frequencyAnalysis);
  
  return {
    volume: volumeAnalysis,
    frequency: frequencyAnalysis,
    quality: qualityEvaluation,
    timestamp: Date.now()
  };
};

/**
 * 音声データの平滑化
 */
export const smoothAudioData = (
  currentData: Float32Array,
  previousData: Float32Array | null,
  smoothingFactor: number = AUDIO_PROCESSING.VOLUME_SMOOTHING
): Float32Array => {
  if (!previousData || previousData.length !== currentData.length) {
    return new Float32Array(currentData);
  }
  
  const smoothedData = new Float32Array(currentData.length);
  
  for (let i = 0; i < currentData.length; i++) {
    smoothedData[i] = previousData[i] * (1 - smoothingFactor) + 
                      currentData[i] * smoothingFactor;
  }
  
  return smoothedData;
};

/**
 * ウィンドウ関数適用（ハミング窓）
 */
export const applyHammingWindow = (audioData: Float32Array): Float32Array => {
  const windowedData = new Float32Array(audioData.length);
  const N = audioData.length;
  
  for (let i = 0; i < N; i++) {
    const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
    windowedData[i] = audioData[i] * window;
  }
  
  return windowedData;
};

/**
 * ゼロパディング
 */
export const zeroPad = (audioData: Float32Array, targetLength: number): Float32Array => {
  if (audioData.length >= targetLength) {
    return audioData.slice(0, targetLength);
  }
  
  const paddedData = new Float32Array(targetLength);
  paddedData.set(audioData);
  
  return paddedData;
};
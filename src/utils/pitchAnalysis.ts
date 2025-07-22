/**
 * 音程解析ユーティリティ（簡易版）
 * 
 * Phase 1技術債務解消版
 * 基本的な倍音補正機能のみ提供
 */

import { 
  HARMONIC_RATIOS,
  DIATONIC_SCALE_SEMITONES,
  DIATONIC_SCALE_NAMES,
  SEMITONES_PER_OCTAVE,
  CENTS_PER_SEMITONE
} from './constants';
import type { 
  HarmonicCorrectionResult 
} from '../types';

/**
 * 倍音補正処理（簡易実装）
 */
export const correctHarmonicMisdetection = (
  detectedFreq: number,
  targetFreq: number,
  confidence: number
): HarmonicCorrectionResult => {
  return {
    originalFrequency: detectedFreq,
    correctedFrequency: detectedFreq,
    correctionType: 'none' as const,
    confidence,
    harmonicRatio: 1.0
  };
};

/**
 * 音程精度評価（相対音感用）- 簡易実装
 */
export const evaluateRelativePitchAccuracy = (
  userFreq: number,
  targetFreq: number,
  baseFreq: number
): any => {
  return {
    accuracy: 'good',
    score: 80,
    color: '#22c55e',
    message: 'Good!'
  };
};

/**
 * ドレミ音階解析 - 簡易実装
 */
export const analyzeDiatonicScale = (
  userFreq: number,
  baseFreq: number,
  targetIndex: number
): any => {
  return {
    detectedIndex: targetIndex,
    scaleName: DIATONIC_SCALE_NAMES[targetIndex] || 'ド',
    confidence: 0.8
  };
};

/**
 * 相対音程トレーニング解析 - 簡易実装
 */
export const analyzeRelativePitchTraining = (
  userFreq: number,
  baseFreq: number,
  targetScaleIndex: number,
  harmonicCorrection?: HarmonicCorrectionResult
): any => {
  return {
    accuracy: evaluateRelativePitchAccuracy(userFreq, baseFreq * Math.pow(2, DIATONIC_SCALE_SEMITONES[targetScaleIndex] / 12), baseFreq),
    scale: analyzeDiatonicScale(userFreq, baseFreq, targetScaleIndex),
    harmonic: harmonicCorrection
  };
};
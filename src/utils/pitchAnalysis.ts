/**
 * 音程分析ユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * Pitchy統合・倍音補正・相対音程解析
 */

import { 
  HARMONIC_CORRECTION, 
  DIATONIC_SCALE_SEMITONES,
  DIATONIC_SCALE_NAMES,
  SEMITONES_PER_OCTAVE,
  CENTS_PER_SEMITONE
} from './constants';
import type { 
  HarmonicCorrectionResult, 
  PitchAccuracyEvaluation,
  DiatonicScaleAnalysis,
  RelativePitchTraining 
} from '../types';

/**
 * 倍音補正処理
 */
export const correctHarmonicMisdetection = (
  detectedFreq: number,
  targetFreq: number,
  confidence: number
): HarmonicCorrectionResult => {
  const originalFreq = detectedFreq;
  let correctedFreq = detectedFreq;
  let correctionApplied = false;
  let correctionRatio = 1.0;
  let correctionType = 'none' as const;
  
  // 補正が必要かどうかの判定
  const freqRatio = detectedFreq / targetFreq;
  const centsDiff = Math.abs(1200 * Math.log2(freqRatio));
  
  // 閾値を超えている場合のみ補正を試行
  if (centsDiff > HARMONIC_CORRECTION.SEARCH_RANGE && confidence > HARMONIC_CORRECTION.CONFIDENCE_THRESHOLD) {
    for (const ratio of HARMONIC_CORRECTION.RATIOS) {
      const candidateFreq = detectedFreq / ratio;
      const candidateRatio = candidateFreq / targetFreq;
      const candidateCents = Math.abs(1200 * Math.log2(candidateRatio));
      
      // より良い補正が見つかった場合
      if (candidateCents < centsDiff) {
        correctedFreq = candidateFreq;
        correctionApplied = true;
        correctionRatio = 1 / ratio;
        
        if (ratio === 2.0) correctionType = 'octave_down';
        else if (ratio === 0.5) correctionType = 'octave_up';
        else if (ratio === 3.0) correctionType = 'third_harmonic';
        else if (ratio === 4.0) correctionType = 'fourth_harmonic';
        
        break;
      }
    }
  }
  
  return {
    originalFrequency: originalFreq,
    correctedFrequency: correctedFreq,
    correctionApplied,
    correctionRatio,
    correctionType,
    confidence,
    improvementCents: correctionApplied ? 
      Math.abs(1200 * Math.log2(originalFreq / targetFreq)) - 
      Math.abs(1200 * Math.log2(correctedFreq / targetFreq)) : 0
  };
};

/**
 * 音程精度評価（相対音感用）
 */
export const evaluateRelativePitchAccuracy = (
  userFreq: number,
  targetFreq: number,
  baseFreq: number
): PitchAccuracyEvaluation => {
  // 相対音程計算
  const userInterval = 1200 * Math.log2(userFreq / baseFreq);
  const targetInterval = 1200 * Math.log2(targetFreq / baseFreq);
  const centsDiff = Math.abs(userInterval - targetInterval);
  
  // 精度判定（相対音程用の厳しい基準）
  let accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
  let score: number;
  let message: string;
  let color: string;
  
  if (centsDiff <= 10) {
    accuracy = 'perfect';
    score = 100;
    message = '完璧な相対音程！';
    color = 'green';
  } else if (centsDiff <= 20) {
    accuracy = 'excellent';
    score = 90;
    message = '優秀な相対音感です';
    color = 'blue';
  } else if (centsDiff <= 40) {
    accuracy = 'good';
    score = 75;
    message = '良好な相対音程です';
    color = 'orange';
  } else if (centsDiff <= 75) {
    accuracy = 'fair';
    score = 60;
    message = '相対音程を調整してください';
    color = 'yellow';
  } else {
    accuracy = 'poor';
    score = 40;
    message = '基音をよく聞いて歌い直してください';
    color = 'red';
  }
  
  return {
    accuracy,
    score,
    message,
    color,
    centsDifference: centsDiff,
    userInterval: Math.round(userInterval),
    targetInterval: Math.round(targetInterval)
  };
};

/**
 * ドレミ音階解析
 */
export const analyzeDiatonicScale = (
  userFreq: number,
  baseFreq: number,
  targetScaleIndex: number
): DiatonicScaleAnalysis => {
  // 目標音程（セント）
  const targetCents = DIATONIC_SCALE_SEMITONES[targetScaleIndex] * 100;
  
  // ユーザー音程（セント）
  const userCents = 1200 * Math.log2(userFreq / baseFreq);
  
  // 偏差計算
  const centsDifference = userCents - targetCents;
  
  // 最も近い音階音を判定
  let closestScaleIndex = 0;
  let minDifference = Infinity;
  
  for (let i = 0; i < DIATONIC_SCALE_SEMITONES.length; i++) {
    const scaleCents = DIATONIC_SCALE_SEMITONES[i] * 100;
    const diff = Math.abs(userCents - scaleCents);
    
    if (diff < minDifference) {
      minDifference = diff;
      closestScaleIndex = i;
    }
  }
  
  // 精度評価
  const accuracy = evaluateRelativePitchAccuracy(userFreq, baseFreq * Math.pow(2, targetCents / 1200), baseFreq);
  
  return {
    targetScaleIndex,
    targetNoteName: DIATONIC_SCALE_NAMES[targetScaleIndex],
    closestScaleIndex,
    closestNoteName: DIATONIC_SCALE_NAMES[closestScaleIndex],
    centsDifference,
    isCorrectNote: targetScaleIndex === closestScaleIndex,
    accuracy
  };
};

/**
 * 相対音感トレーニング結果作成
 */
export const createRelativePitchTrainingResult = (
  userFreq: number,
  baseFreq: number,
  targetScaleIndex: number,
  harmonicCorrection?: HarmonicCorrectionResult
): RelativePitchTraining => {
  // 倍音補正適用
  const correctedUserFreq = harmonicCorrection?.correctionApplied ? 
    harmonicCorrection.correctedFrequency : userFreq;
  
  // ドレミ音階解析
  const scaleAnalysis = analyzeDiatonicScale(correctedUserFreq, baseFreq, targetScaleIndex);
  
  // 目標周波数計算
  const targetFreq = baseFreq * Math.pow(2, DIATONIC_SCALE_SEMITONES[targetScaleIndex] / 12);
  
  return {
    userFrequency: userFreq,
    correctedUserFrequency: correctedUserFreq,
    baseFrequency: baseFreq,
    targetFrequency: targetFreq,
    targetScaleIndex,
    scaleAnalysis,
    harmonicCorrection,
    timestamp: Date.now()
  };
};

/**
 * 音程安定性分析
 */
export const analyzePitchStability = (
  frequencyHistory: number[],
  windowSize: number = HARMONIC_CORRECTION.STABILITY_FRAMES
): {
  isStable: boolean;
  variance: number;
  standardDeviation: number;
  coefficient: number;
} => {
  if (frequencyHistory.length < windowSize) {
    return {
      isStable: false,
      variance: 0,
      standardDeviation: 0,
      coefficient: 0
    };
  }
  
  // 最近のデータで分析
  const recentData = frequencyHistory.slice(-windowSize);
  
  // 平均計算
  const mean = recentData.reduce((sum, freq) => sum + freq, 0) / recentData.length;
  
  // 分散計算
  const variance = recentData.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / recentData.length;
  
  // 標準偏差
  const standardDeviation = Math.sqrt(variance);
  
  // 変動係数
  const coefficient = mean > 0 ? (standardDeviation / mean) * 100 : 0;
  
  // 安定性判定（変動係数2%以下を安定とする）
  const isStable = coefficient <= 2.0;
  
  return {
    isStable,
    variance,
    standardDeviation,
    coefficient
  };
};

/**
 * 音程トレンド解析
 */
export const analyzePitchTrend = (
  frequencyHistory: number[]
): {
  trend: 'rising' | 'falling' | 'stable';
  slope: number;
  correlation: number;
} => {
  if (frequencyHistory.length < 3) {
    return {
      trend: 'stable',
      slope: 0,
      correlation: 0
    };
  }
  
  // 線形回帰で傾きを計算
  const n = frequencyHistory.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = frequencyHistory;
  
  const sumX = x.reduce((sum, xi) => sum + xi, 0);
  const sumY = y.reduce((sum, yi) => sum + yi, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // 相関係数
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const correlation = denominator !== 0 ? numerator / denominator : 0;
  
  // トレンド判定
  let trend: 'rising' | 'falling' | 'stable';
  if (Math.abs(slope) < 0.5) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'rising';
  } else {
    trend = 'falling';
  }
  
  return {
    trend,
    slope,
    correlation
  };
};
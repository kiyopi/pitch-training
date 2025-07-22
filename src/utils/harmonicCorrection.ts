/**
 * 倍音補正ユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * 高度な倍音誤検出補正システム
 */

import { HARMONIC_CORRECTION } from './constants';
import type { 
  HarmonicCorrectionResult
} from '../types';

/**
 * 高度な倍音補正システム
 */
export const performAdvancedHarmonicCorrection = (
  detectedFreq: number,
  targetFreq: number,
  confidence: number,
  previousState?: any
): HarmonicCorrectionResult => {
  const originalFreq = detectedFreq;
  
  // 基本的な補正候補の生成
  const candidates = generateCorrectionCandidates(detectedFreq);
  
  // 各候補の評価
  const evaluatedCandidates = candidates.map(candidate => 
    evaluateCorrectionCandidate(candidate, targetFreq, confidence)
  );
  
  // 最適な補正を選択
  const bestCandidate = selectBestCorrection(evaluatedCandidates, previousState);
  
  // 補正の安定性チェック
  const stabilityCheck = checkCorrectionStability(bestCandidate, previousState);
  
  return {
    originalFrequency: originalFreq,
    correctedFrequency: bestCandidate.frequency,
    correctionApplied: bestCandidate.correctionApplied,
    correctionRatio: bestCandidate.ratio,
    correctionType: bestCandidate.type,
    confidence: confidence,
    improvementCents: bestCandidate.improvement,
    stabilityScore: stabilityCheck.stabilityScore,
    alternativeCandidates: evaluatedCandidates.filter(c => c !== bestCandidate)
  };
};

/**
 * 補正候補生成
 */
const generateCorrectionCandidates = (
  detectedFreq: number
) => {
  const candidates = [];
  
  // オリジナル（補正なし）
  candidates.push({
    frequency: detectedFreq,
    ratio: 1.0,
    type: 'none' as const,
    correctionApplied: false
  });
  
  // 倍音補正候補
  for (const ratio of HARMONIC_CORRECTION.RATIOS) {
    if (ratio !== 1.0) {
      candidates.push({
        frequency: detectedFreq / ratio,
        ratio: 1 / ratio,
        type: getHarmonicType(ratio),
        correctionApplied: true
      });
      
      // 逆方向の補正も追加
      candidates.push({
        frequency: detectedFreq * ratio,
        ratio: ratio,
        type: getInverseHarmonicType(ratio),
        correctionApplied: true
      });
    }
  }
  
  return candidates;
};

/**
 * 倍音タイプ取得
 */
const getHarmonicType = (ratio: number): 'octave_down' | 'octave_up' | 'third_harmonic' | 'fourth_harmonic' | 'other' => {
  if (ratio === 2.0) return 'octave_down';
  if (ratio === 3.0) return 'third_harmonic';
  if (ratio === 4.0) return 'fourth_harmonic';
  return 'other';
};

/**
 * 逆倍音タイプ取得
 */
const getInverseHarmonicType = (ratio: number): 'octave_down' | 'octave_up' | 'third_harmonic' | 'fourth_harmonic' | 'other' => {
  if (ratio === 0.5) return 'octave_up';
  return 'other';
};

/**
 * 補正候補評価
 */
const evaluateCorrectionCandidate = (
  candidate: {
    frequency: number;
    ratio: number;
    type: string;
    correctionApplied: boolean;
  },
  targetFreq: number,
  confidence: number
) => {
  // セント差計算
  const centsDiff = Math.abs(1200 * Math.log2(candidate.frequency / targetFreq));
  
  // 改善度計算
  const originalCentsDiff = Math.abs(1200 * Math.log2(candidate.frequency * (1 / candidate.ratio) / targetFreq));
  const improvement = originalCentsDiff - centsDiff;
  
  // スコア計算（複数要素を考慮）
  let score = 0;
  
  // 1. 精度スコア（セント差が小さいほど高得点）
  score += Math.max(0, 100 - centsDiff);
  
  // 2. 信頼度スコア
  score += confidence * 50;
  
  // 3. 補正タイプのペナルティ（自然な補正ほど低ペナルティ）
  const typeScore = {
    'none': 0,
    'octave_down': -5,
    'octave_up': -5,
    'third_harmonic': -15,
    'fourth_harmonic': -20,
    'other': -25
  };
  score += typeScore[candidate.type] || -30;
  
  // 4. 改善度ボーナス
  if (improvement > 0) {
    score += improvement * 0.5;
  }
  
  return {
    ...candidate,
    centsDiff,
    improvement,
    score
  };
};

/**
 * 最適補正選択
 */
const selectBestCorrection = (
  candidates: {
    frequency: number;
    ratio: number;
    type: string;
    correctionApplied: boolean;
    centsDiff: number;
    improvement: number;
    score: number;
  }[],
  previousState?: any
) => {
  // スコア順でソート
  candidates.sort((a, b) => b.score - a.score);
  
  // 前回の状態を考慮した選択
  if (previousState) {
    // 前回と同じ補正タイプを優先（安定性のため）
    const sameTypeCandidate = candidates.find(c => 
      c.type === previousState.lastCorrectionType && c.score > 50
    );
    
    if (sameTypeCandidate) {
      return sameTypeCandidate;
    }
  }
  
  // 閾値を超える最高スコアの候補を選択
  const bestCandidate = candidates.find(c => c.score > 60);
  return bestCandidate || candidates[0];
};

/**
 * 補正安定性チェック
 */
const checkCorrectionStability = (
  candidate: {
    frequency: number;
    type: string;
    improvement: number;
  },
  previousState?: any
): { stabilityScore: number; isStable: boolean } => {
  if (!previousState) {
    return { stabilityScore: 50, isStable: true };
  }
  
  let stabilityScore = 100;
  
  // 補正タイプの一貫性チェック
  if (candidate.type !== previousState.lastCorrectionType) {
    stabilityScore -= 20;
  }
  
  // 周波数の連続性チェック
  const freqChangeRatio = Math.abs(
    candidate.frequency / previousState.lastCorrectedFrequency - 1
  );
  
  if (freqChangeRatio > 0.05) { // 5%以上の変化
    stabilityScore -= 30;
  }
  
  // 改善度の一貫性チェック
  if (candidate.improvement < previousState.lastImprovement * 0.5) {
    stabilityScore -= 25;
  }
  
  return {
    stabilityScore: Math.max(0, stabilityScore),
    isStable: stabilityScore > 70
  };
};

/**
 * 倍音解析
 */
export const analyzeHarmonics = (
  frequency: number,
  spectrum: Float32Array,
  sampleRate: number
): HarmonicAnalysis => {
  const fundamentalFreq = frequency;
  const harmonics: { frequency: number; amplitude: number; ratio: number }[] = [];
  
  // 基本周波数の振幅を取得
  const fundamentalBin = Math.round(fundamentalFreq / sampleRate * spectrum.length * 2);
  const fundamentalAmplitude = spectrum[fundamentalBin] || 0;
  
  // 倍音を検索（最大8倍音まで）
  for (let harmonic = 2; harmonic <= 8; harmonic++) {
    const harmonicFreq = fundamentalFreq * harmonic;
    const harmonicBin = Math.round(harmonicFreq / sampleRate * spectrum.length * 2);
    
    if (harmonicBin < spectrum.length) {
      const amplitude = spectrum[harmonicBin] || 0;
      const ratio = fundamentalAmplitude > 0 ? amplitude / fundamentalAmplitude : 0;
      
      harmonics.push({
        frequency: harmonicFreq,
        amplitude,
        ratio
      });
    }
  }
  
  // 倍音の豊富さ指標
  const harmonicRichness = harmonics.reduce((sum, h) => sum + h.ratio, 0) / harmonics.length;
  
  // 偶数次/奇数次倍音の比率
  const evenHarmonics = harmonics.filter((_, i) => (i + 2) % 2 === 0);
  const oddHarmonics = harmonics.filter((_, i) => (i + 2) % 2 === 1);
  
  const evenRatio = evenHarmonics.reduce((sum, h) => sum + h.ratio, 0);
  const oddRatio = oddHarmonics.reduce((sum, h) => sum + h.ratio, 0);
  
  return {
    fundamentalFrequency: fundamentalFreq,
    fundamentalAmplitude,
    harmonics,
    harmonicRichness,
    evenOddRatio: oddRatio > 0 ? evenRatio / oddRatio : 0,
    spectralCentroid: calculateHarmonicSpectralCentroid(harmonics)
  };
};

/**
 * 倍音スペクトラル重心計算
 */
const calculateHarmonicSpectralCentroid = (
  harmonics: { frequency: number; amplitude: number }[]
): number => {
  let numerator = 0;
  let denominator = 0;
  
  for (const harmonic of harmonics) {
    numerator += harmonic.frequency * harmonic.amplitude;
    denominator += harmonic.amplitude;
  }
  
  return denominator > 0 ? numerator / denominator : 0;
};

/**
 * 倍音検出状態更新
 */
export const updateHarmonicDetectionState = (
  previousState: HarmonicDetectionState | null,
  correctionResult: HarmonicCorrectionResult
): HarmonicDetectionState => {
  const history = previousState ? 
    [...previousState.correctionHistory, correctionResult].slice(-10) : 
    [correctionResult];
  
  return {
    lastCorrectedFrequency: correctionResult.correctedFrequency,
    lastCorrectionType: correctionResult.correctionType,
    lastImprovement: correctionResult.improvementCents,
    correctionHistory: history,
    stabilityScore: correctionResult.stabilityScore || 100,
    consecutiveCorrections: countConsecutiveCorrections(history),
    lastUpdate: Date.now()
  };
};

/**
 * 連続補正回数カウント
 */
const countConsecutiveCorrections = (
  history: HarmonicCorrectionResult[]
): number => {
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].correctionApplied) {
      count++;
    } else {
      break;
    }
  }
  return count;
};
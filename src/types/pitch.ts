/**
 * 音程検出・解析関連の型定義
 */

// 基本音程データ
export interface PitchData {
  frequency: number;
  amplitude: number;
  timestamp: number;
  confidence?: number;
}

// 音程検出状態
export interface PitchDetectionState {
  frequency: number | null;
  clarity: number;
  isDetecting: boolean;
  confidence: number;
  error?: string | null;
}

// 音程検出設定
export interface PitchDetectionConfig {
  clarityThreshold: number;
  minFrequency: number;
  maxFrequency: number;
  volumeThreshold?: number;
  smoothingFactor?: number;
  stabilityFrames?: number;
}

// 音程検出Hook戻り値
export interface PitchDetectionHook {
  pitchState: PitchDetectionState;
  startDetection: (audioContext: AudioContext, analyser: AnalyserNode) => void;
  stopDetection: () => void;
  updateDetection: () => { frequency: number | null; clarity: number };
  setTargetFrequencies: (frequencies: number[]) => void;
  resetState: () => void;
}

// 倍音補正設定
export interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // 基音探索範囲（±50Hz）
  harmonicRatios: number[];          // 倍音比率 [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;       // 確信度しきい値（0.8）
  stabilityBuffer: number[];         // 安定化バッファ（過去5フレーム）
  vocalRange: { min: number, max: number }; // 人間音域（130-1047Hz, C3-C6）
}

// 倍音補正結果
export interface HarmonicCorrectionResult {
  originalFrequency: number;
  correctedFrequency: number;
  correctionType: 'none' | 'half' | 'double' | 'triple' | 'quarter';
  confidence: number;
  harmonicRatio: number;
}

// 周波数解析データ（詳細版）
export interface DetailedFrequencyData extends PitchData {
  note?: {
    note: string;
    octave: number;
    fullNote: string;
    cents: number;
  };
  // 相対音程情報
  relativeInterval?: {
    cents: number;
    semitones: number;
    intervalName: string;
    accuracy: {
      accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
      color: string;
      score: number;
      message: string;
    };
  };
  // 倍音補正情報
  harmonicCorrection?: HarmonicCorrectionResult;
}
/**
 * ユーティリティエントリーポイント（統合版）
 * 
 * 型定義統合対応版
 * 全てのユーティリティ関数を集約・再エクスポート
 * 統合されたインポートを提供
 */

// 基本定数・設定
export * from './constants';
export * from './config';

// 音名・音程変換ユーティリティ
export * from './noteUtils';
export * from './pitchUtils';
export * from './pitchAnalysis';

// 音声処理・フィルターユーティリティ
export * from './audioFilters';
export * from './audioProcessing';
export * from './harmonicCorrection';

// 汎用ユーティリティ
export * from './validation';
export * from './formatting';

// 統合ユーティリティヘルパー - 最も使用頻度の高い関数を再エクスポート
export { 
  // 音程解析統合
  analyzeDiatonicScale,
  evaluateRelativePitchAccuracy
} from './pitchAnalysis';

export {
  // 音声処理統合 
  createAudioProcessingResult,
  analyzeVolume,
  analyzeFrequencySpectrum
} from './audioProcessing';

export {
  // 倍音補正統合
  performAdvancedHarmonicCorrection
} from './harmonicCorrection';

export {
  // 設定管理統合
  createDefaultAppConfig,
  loadUserPreferences,
  saveUserPreferences
} from './config';

export {
  // バリデーション統合
  validateFrequency,
  validatePitchAccuracy,
  validateAudioData,
  validateBrowserSupport
} from './validation';

export {
  // フォーマット統合
  formatFrequencyWithNote,
  formatAccuracy,
  formatInterval,
  formatScaleName
} from './formatting';
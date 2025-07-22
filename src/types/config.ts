/**
 * 設定・定数関連の型定義
 */

import { BaseTone } from './tone';
import { AudioFilterConfig } from './audio';
import { HarmonicCorrectionConfig } from './pitch';

// トレーニングモード
export type TrainingMode = 'random' | 'continuous' | 'chromatic';

// 難易度レベル
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// トレーニング設定
export interface TrainingConfig {
  mode: TrainingMode;
  difficulty: DifficultyLevel;
  sessionDuration?: number;  // 分単位
  targetAccuracy?: number;   // パーセント
  baseTones: BaseTone[];
  
  // 音声設定
  enableHarmonicCorrection: boolean;
  harmonicConfig?: Partial<HarmonicCorrectionConfig>;
  audioFilters?: AudioFilterConfig;
  
  // UI設定
  showRealTimeDisplay: boolean;
  showDebugInfo: boolean;
  enableRippleEffects: boolean;
  
  // 進捗・統計
  trackProgress: boolean;
  saveHistory: boolean;
}

// システム設定
export interface SystemConfig {
  // 開発・デバッグ
  isDevelopment: boolean;
  enableLogging: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  
  // パフォーマンス
  maxSampleRate: number;
  bufferSize: number;
  updateInterval: number;
  
  // UI/UX
  animationDuration: number;
  debounceTime: number;
  longPressTime: number;
  
  // 互換性
  requireHttps: boolean;
  supportLegacyBrowsers: boolean;
  iOSOptimizations: boolean;
}

// デバイス対応設定
export interface DeviceConfig {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  
  // 能力検出
  supportsWebAudio: boolean;
  supportsMicrophone: boolean;
  supportsAudioWorklet: boolean;
  
  // 最適化設定
  preferLowLatency: boolean;
  enableHardwareAcceleration: boolean;
  maxConcurrentAudio: number;
}

// アプリケーション設定（統合）
export interface AppConfig {
  training: TrainingConfig;
  system: SystemConfig;
  device: DeviceConfig;
  
  // メタ情報
  version: string;
  buildDate: string;
  gitCommit?: string;
}

// 設定の検証・更新
export interface ConfigValidator {
  validateTrainingConfig: (config: Partial<TrainingConfig>) => boolean;
  validateSystemConfig: (config: Partial<SystemConfig>) => boolean;
  mergeConfigs: <T>(base: T, override: Partial<T>) => T;
  getDefaultConfig: () => AppConfig;
}

// 設定保存・読み込み
export interface ConfigManager {
  loadConfig: () => Promise<AppConfig>;
  saveConfig: (config: Partial<AppConfig>) => Promise<void>;
  resetToDefaults: () => Promise<AppConfig>;
  exportConfig: () => string;  // JSON文字列
  importConfig: (jsonString: string) => Promise<AppConfig>;
}
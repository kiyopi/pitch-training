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
  audio: AudioConfig;
  ui: UIConfig;
  training: TrainingConfig;
  system: SystemConfig;
  device: DeviceConfig;
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    showPitchData: boolean;
    showHarmonicCorrection: boolean;
    showVolumeMeters: boolean;
  };
  
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

// 音声設定（追加）
export interface AudioConfig {
  processing: {
    sampleRate: number;
    bufferSize: number;
    fftSize: number;
    smoothingTimeConstant: number;
  };
  filters: {
    enabled: boolean;
    highPass: { frequency: number; Q: number };
    lowPass: { frequency: number; Q: number };
    notch: { frequency: number; Q: number };
    gain: { value: number };
  };
  microphone: {
    volumeThreshold: number;
    volumeSmoothing: number;
    autoGainControl: boolean;
    noiseSuppression: boolean;
    echoCancellation: boolean;
  };
  pitch: {
    clarityThreshold: number;
    minFrequency: number;
    maxFrequency: number;
    smoothingFactor: number;
  };
  harmonicCorrection: {
    enabled: boolean;
    searchRange: number;
    ratios: number[];
    confidenceThreshold: number;
    stabilityFrames: number;
    correctionThresholdRatio: number;
  };
  tone: {
    salamanderBaseUrl: string;
    volume: number;
    release: number;
    attack: number;
    decay: number;
    sustain: number;
  };
}

// UI設定（追加）
export interface UIConfig {
  theme: string;
  language: string;
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  responsive: {
    breakpoints: Record<string, number>;
  };
  feedback: {
    hapticEnabled: boolean;
    soundEnabled: boolean;
    visualEnabled: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
  };
}

// ユーザー設定（追加）
export interface UserPreferences {
  audio: {
    microphoneSensitivity: string;
    noiseFilterEnabled: boolean;
    harmonicCorrectionEnabled: boolean;
  };
  ui: {
    theme: string;
    language: string;
    showAdvancedOptions: boolean;
    animationsEnabled: boolean;
  };
  training: {
    preferredMode: string;
    difficulty: string;
    autoPlay: boolean;
    showHints: boolean;
  };
  statistics: {
    trackProgress: boolean;
    showDetailedStats: boolean;
  };
}
/**
 * 設定管理ユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * アプリケーション設定・ユーザー設定・デバイス設定
 */

import { 
  AUDIO_PROCESSING, 
  AUDIO_FILTERS, 
  HARMONIC_CORRECTION,
  UI_CONSTANTS,
  TONE_CONFIG 
} from './constants';
import type { 
  AppConfig,
  AudioConfig,
  UIConfig,
  TrainingConfig,
  UserPreferences,
  DeviceConfig
} from '../types';

/**
 * デフォルトアプリケーション設定
 */
export const createDefaultAppConfig = (): AppConfig => ({
  audio: createDefaultAudioConfig(),
  ui: createDefaultUIConfig(),
  training: createDefaultTrainingConfig(),
  system: {
    isDevelopment: false,
    enableLogging: true,
    logLevel: 'info',
    maxSampleRate: 44100,
    bufferSize: 2048,
    updateInterval: 16,
    animationDuration: 300,
    debounceTime: 300,
    longPressTime: 500,
    requireHttps: true,
    supportLegacyBrowsers: false,
    iOSOptimizations: true
  },
  device: detectDeviceCapabilities(),
  debug: {
    enabled: false,
    logLevel: 'info',
    showPitchData: false,
    showHarmonicCorrection: false,
    showVolumeMeters: false
  },
  version: '1.0.0',
  buildDate: new Date().toISOString()
});

/**
 * デフォルト音声設定
 */
export const createDefaultAudioConfig = (): AudioConfig => ({
  processing: {
    sampleRate: AUDIO_PROCESSING.SAMPLE_RATE,
    bufferSize: AUDIO_PROCESSING.BUFFER_SIZE,
    fftSize: AUDIO_PROCESSING.FFT_SIZE,
    smoothingTimeConstant: AUDIO_PROCESSING.SMOOTHING_TIME_CONSTANT
  },
  filters: {
    enabled: true,
    highPass: AUDIO_FILTERS.HIGH_PASS,
    lowPass: AUDIO_FILTERS.LOW_PASS,
    notch: AUDIO_FILTERS.NOTCH,
    gain: AUDIO_FILTERS.GAIN
  },
  microphone: {
    volumeThreshold: AUDIO_PROCESSING.VOLUME_THRESHOLD,
    volumeSmoothing: AUDIO_PROCESSING.VOLUME_SMOOTHING,
    autoGainControl: true,
    noiseSuppression: true,
    echoCancellation: true
  },
  pitch: {
    clarityThreshold: AUDIO_PROCESSING.CLARITY_THRESHOLD,
    minFrequency: AUDIO_PROCESSING.MIN_FREQUENCY,
    maxFrequency: AUDIO_PROCESSING.MAX_FREQUENCY,
    smoothingFactor: 0.3
  },
  harmonicCorrection: {
    enabled: true,
    searchRange: HARMONIC_CORRECTION.SEARCH_RANGE,
    ratios: [...HARMONIC_CORRECTION.RATIOS],
    confidenceThreshold: HARMONIC_CORRECTION.CONFIDENCE_THRESHOLD,
    stabilityFrames: HARMONIC_CORRECTION.STABILITY_FRAMES,
    correctionThresholdRatio: HARMONIC_CORRECTION.CORRECTION_THRESHOLD_RATIO
  },
  tone: {
    salamanderBaseUrl: TONE_CONFIG.SALAMANDER_BASE_URL,
    volume: TONE_CONFIG.VOLUME,
    release: TONE_CONFIG.RELEASE,
    attack: TONE_CONFIG.ATTACK,
    decay: TONE_CONFIG.DECAY,
    sustain: TONE_CONFIG.SUSTAIN
  }
});

/**
 * デフォルトUI設定
 */
export const createDefaultUIConfig = (): UIConfig => ({
  theme: 'light',
  language: 'ja',
  animations: {
    enabled: true,
    duration: UI_CONSTANTS.ANIMATION_DURATION,
    easing: 'ease-in-out'
  },
  responsive: {
    breakpoints: UI_CONSTANTS.BREAKPOINTS
  },
  feedback: {
    hapticEnabled: true,
    soundEnabled: true,
    visualEnabled: true
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderOptimized: false
  }
});

/**
 * デフォルトトレーニング設定
 */
export const createDefaultTrainingConfig = (): TrainingConfig => ({
  mode: 'random',
  difficulty: 'intermediate',
  sessionDuration: 30,
  targetAccuracy: 80,
  baseTones: [],
  
  // 音声設定
  enableHarmonicCorrection: true,
  harmonicConfig: {
    fundamentalSearchRange: 50,
    harmonicRatios: [0.5, 2.0, 3.0, 4.0],
    confidenceThreshold: 0.8,
    stabilityBuffer: [],
    vocalRange: { min: 130, max: 1047 }
  },
  
  // UI設定
  showRealTimeDisplay: true,
  showDebugInfo: false,
  enableRippleEffects: true,
  
  // 進捗・統計
  trackProgress: true,
  saveHistory: true
});

/**
 * ユーザー設定読み込み
 */
export const loadUserPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') {
    return createDefaultUserPreferences();
  }
  
  try {
    const stored = localStorage.getItem('pitchTraining_userPreferences');
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UserPreferences>;
      const defaults = createDefaultUserPreferences();
      return {
        ...defaults,
        ...parsed,
        audio: { ...defaults.audio, ...(parsed.audio || {}) },
        ui: { ...defaults.ui, ...(parsed.ui || {}) },
        training: { ...defaults.training, ...(parsed.training || {}) },
        statistics: { ...defaults.statistics, ...(parsed.statistics || {}) }
      };
    }
  } catch (error) {
    console.warn('ユーザー設定の読み込みに失敗:', error);
  }
  
  return createDefaultUserPreferences();
};

/**
 * ユーザー設定保存
 */
export const saveUserPreferences = (preferences: UserPreferences): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem('pitchTraining_userPreferences', JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('ユーザー設定の保存に失敗:', error);
    return false;
  }
};

/**
 * デフォルトユーザー設定
 */
const createDefaultUserPreferences = (): UserPreferences => ({
  audio: {
    microphoneSensitivity: 'normal',
    noiseFilterEnabled: true,
    harmonicCorrectionEnabled: true
  },
  ui: {
    theme: 'light',
    language: 'ja',
    showAdvancedOptions: false,
    animationsEnabled: true
  },
  training: {
    preferredMode: 'random',
    difficulty: 'intermediate',
    autoPlay: true,
    showHints: true
  },
  statistics: {
    trackProgress: true,
    showDetailedStats: false
  }
});

/**
 * デフォルト値とマージ
 */
const mergeWithDefaults = <T extends Record<string, unknown>>(
  userConfig: Partial<T>,
  defaults: T
): T => {
  const result = { ...defaults };
  
  for (const [key, value] of Object.entries(userConfig)) {
    if (key in defaults) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key as keyof T] = mergeWithDefaults(
          value as Record<string, unknown>, 
          defaults[key as keyof T] as Record<string, unknown>
        ) as T[keyof T];
      } else {
        result[key as keyof T] = value as T[keyof T];
      }
    }
  }
  
  return result;
};

/**
 * デバイス固有設定の自動検出
 */
export const detectDeviceCapabilities = (): DeviceConfig => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  
  const supportsWebAudio = !!(window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  const supportsMicrophone = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const supportsAudioWorklet = !!(window.AudioWorklet);
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    supportsWebAudio,
    supportsMicrophone,
    supportsAudioWorklet,
    preferLowLatency: isMobile,
    enableHardwareAcceleration: !isIOS, // iOS では無効化
    maxConcurrentAudio: isMobile ? 2 : 4
  };
};

/**
 * 設定検証
 */
export const validateConfig = (config: Partial<AppConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 音声設定の検証
  if (config.audio) {
    if (config.audio.processing?.sampleRate && 
        ![22050, 44100, 48000].includes(config.audio.processing.sampleRate)) {
      warnings.push('サンプリングレートは22050, 44100, 48000のいずれかを推奨します');
    }
    
    if (config.audio.processing?.bufferSize && 
        ![512, 1024, 2048, 4096].includes(config.audio.processing.bufferSize)) {
      errors.push('バッファサイズは512, 1024, 2048, 4096のいずれかである必要があります');
    }
    
    if (config.audio.microphone?.volumeThreshold && 
        (config.audio.microphone.volumeThreshold < 0 || config.audio.microphone.volumeThreshold > 100)) {
      errors.push('音量閾値は0-100の範囲である必要があります');
    }
  }
  
  // トレーニング設定の検証
  if (config.training) {
    if (config.training.sessionDuration && 
        config.training.sessionDuration < 1) {
      warnings.push('セッション時間は1分以上を推奨します');
    }
    
    if (config.training.targetAccuracy && 
        config.training.targetAccuracy > 100) {
      warnings.push('目標精度は100%以下である必要があります');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 設定のエクスポート
 */
export const exportConfig = (config: AppConfig): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * 設定のインポート
 */
export const importConfig = (configJson: string): AppConfig | null => {
  try {
    const config = JSON.parse(configJson) as Partial<AppConfig>;
    const validation = validateConfig(config);
    
    if (!validation.isValid) {
      console.error('設定の検証エラー:', validation.errors);
      return null;
    }
    
    return createDefaultAppConfig();
  } catch (error) {
    console.error('設定のインポートエラー:', error);
    return null;
  }
};
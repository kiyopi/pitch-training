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
  UserPreferences
} from '../types';

/**
 * デフォルトアプリケーション設定
 */
export const createDefaultAppConfig = (): AppConfig => ({
  audio: createDefaultAudioConfig(),
  ui: createDefaultUIConfig(),
  training: createDefaultTrainingConfig(),
  debug: {
    enabled: false,
    logLevel: 'info',
    showPitchData: false,
    showHarmonicCorrection: false,
    showVolumeMeters: false
  }
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
  difficulty: 'normal',
  scaleType: 'diatonic',
  baseToneSelection: 'random',
  timeouts: {
    basePlayDuration: 2000,
    userSingDuration: 5000,
    resultDisplayDuration: 3000
  },
  feedback: {
    immediateResults: true,
    visualFeedback: true,
    scoringEnabled: true,
    progressTracking: true
  },
  advanced: {
    harmonicCorrectionEnabled: true,
    outlierPenaltyEnabled: true,
    adaptiveDifficultyEnabled: false
  }
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
      const parsed = JSON.parse(stored);
      return mergeWithDefaults(parsed, createDefaultUserPreferences());
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
    difficulty: 'normal',
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
export const detectDeviceCapabilities = (): {
  isMobile: boolean;
  hasTouch: boolean;
  supportsWebAudio: boolean;
  supportsMediaDevices: boolean;
  recommendedBufferSize: number;
  recommendedSampleRate: number;
} => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const supportsWebAudio = !!(window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  const supportsMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  // デバイスに応じた推奨設定
  const recommendedBufferSize = isMobile ? 4096 : 2048;
  const recommendedSampleRate = 44100;
  
  return {
    isMobile,
    hasTouch,
    supportsWebAudio,
    supportsMediaDevices,
    recommendedBufferSize,
    recommendedSampleRate
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
    if (config.training.timeouts?.basePlayDuration && 
        config.training.timeouts.basePlayDuration < 500) {
      warnings.push('基音再生時間は500ms以上を推奨します');
    }
    
    if (config.training.timeouts?.userSingDuration && 
        config.training.timeouts.userSingDuration < 1000) {
      warnings.push('ユーザー歌唱時間は1000ms以上を推奨します');
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
    
    return mergeWithDefaults(config, createDefaultAppConfig());
  } catch (error) {
    console.error('設定のインポートエラー:', error);
    return null;
  }
};
/**
 * 音声処理・マイクロフォン関連の型定義
 */

// マイクロフォン状態（統合版）
export interface MicrophoneState {
  isRecording: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  audioLevel: number;
  isInitialized: boolean;
  audioContext?: AudioContext | null;
  analyser?: AnalyserNode | null;
  stream?: MediaStream | null;
}

// マイクロフォンマネージャーHook戻り値
export interface MicrophoneManager {
  microphoneState: MicrophoneState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  resetError: () => void;
  cleanup: () => void;
}

// 権限管理状態
export type PermissionState = 'unknown' | 'checking' | 'granted' | 'denied' | 'error';
export type InitializationMode = 'preload' | 'ondemand';

// 権限管理設定
export interface PermissionManagerConfig {
  enablePreloadMode?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

// 権限管理Hook戻り値
export interface PermissionManagerHook {
  permissionState: PermissionState;
  initializationMode: InitializationMode;
  requestPermission: () => Promise<boolean>;
  resetPermission: () => void;
  checkPermissionStatus: () => Promise<PermissionState>;
}

// 基本周波数データ
export interface FrequencyData {
  frequency: number;
  amplitude: number;
  timestamp: number;
}

// Audio Contextフィルター設定
export interface AudioFilterConfig {
  highPass?: {
    frequency: number;
    Q: number;
  };
  lowPass?: {
    frequency: number; 
    Q: number;
  };
  notch?: {
    frequency: number;
    Q: number;
  };
  gain?: {
    value: number;
  };
}

// 音声レベル監視設定
export interface AudioLevelConfig {
  smoothingTimeConstant: number;
  fftSize: number;
  updateInterval: number;
  volumeThreshold: number;
}

// 音量解析結果
export interface VolumeAnalysis {
  rms: number;
  peak: number;
  db: number;
  isActive: boolean;
}

// 周波数解析結果
export interface FrequencyAnalysis {
  peakFrequency: number;
  musicalPeakFrequency: number;
  confidence: number;
  spectralCentroid: number;
  spectralRolloff: number;
}

// 音声処理統合結果
export interface AudioProcessingResult {
  volume: VolumeAnalysis;
  frequency: FrequencyAnalysis;
  quality: {
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
  };
  timestamp: number;
}
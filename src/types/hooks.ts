/**
 * Hook関連の型定義
 */

import { 
  MicrophoneManager, 
  PermissionManagerHook 
} from './audio';
import { 
  TonePlayerHook,
  BaseTone 
} from './tone';
import { 
  PitchDetectionHook,
  HarmonicCorrectionConfig 
} from './pitch';

// AudioSystemフェーズ（統合音声システム用）
export enum AudioSystemPhase {
  IDLE = 'idle',
  TRANSITIONING = 'transitioning', 
  BASE_TONE_PHASE = 'base_tone',
  SCORING_PHASE = 'scoring',
  ERROR_STATE = 'error'
}

// AudioEngine設定
export interface AudioEngineConfig {
  mode: 'random' | 'continuous' | 'chromatic';
  enablePitchDetection: boolean;
  enableHarmonicCorrection: boolean;
  baseNotes: string[];
  harmonicConfig?: Partial<HarmonicCorrectionConfig>;
}

// AudioEngine戻り値インターフェース（統合版）
export interface AudioEngineReturn {
  // 基音再生機能
  playBaseTone: (note: string) => Promise<void>;
  stopBaseTone: () => void;
  
  // マイクロフォン機能
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  
  // リアルタイム検出
  currentPitch: number | null;
  correctedPitch: number | null;
  confidence: number;
  
  // 状態管理
  isPlaying: boolean;
  phase: AudioSystemPhase;
  error: string | null;
  
  // 制御機能
  reset: () => void;
  cleanup: () => void;
}

// Hook設定用の共通インターフェース
export interface HookConfig {
  enabled?: boolean;
  autoCleanup?: boolean;
  debugMode?: boolean;
}

// カスタムHookの戻り値パターン
export interface HookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface HookActions {
  start: () => Promise<boolean>;
  stop: () => void;
  reset: () => void;
  cleanup: () => void;
}

// 統合音声システムHookの型
export interface AudioSystemHook extends HookActions {
  // マネージャー統合
  microphone: MicrophoneManager;
  tonePlayer: TonePlayerHook;
  pitchDetection: PitchDetectionHook;
  permissions: PermissionManagerHook;
  
  // 統合状態
  systemPhase: AudioSystemPhase;
  isReady: boolean;
  hasError: boolean;
  
  // 統合制御
  initializeSystem: () => Promise<boolean>;
  startTrainingSession: (baseTone: BaseTone) => Promise<boolean>;
  stopTrainingSession: () => void;
}
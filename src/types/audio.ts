/**
 * 音声処理関連の型定義
 * Step 2: AudioContext・音声処理基盤
 */

// 音声処理状態
export interface AudioProcessorState {
  isProcessing: boolean;
  sampleRate: number;
  bufferSize: number;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  error: string | null;
  isInitialized: boolean;
}

// 処理済み音声データ
export interface ProcessedAudioData {
  timedomainData: Float32Array | null;
  frequencyData: Uint8Array | null;
  rms: number;
  peak: number;
  timestamp: number;
}

// AudioContext設定
export interface AudioContextConfig {
  sampleRate: number;
  latencyHint: AudioContextLatencyCategory;
}

// AnalyserNode設定
export interface AnalyserConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

// 音声処理統計データ
export interface AudioProcessingStats {
  rms: number;
  peak: number;
  averageRms: number;
  averagePeak: number;
  sampleCount: number;
  lastUpdate: number;
}

// Step 1マイクロフォン状態（参照用）
export interface MicrophoneState {
  isRecording: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  audioLevel: number;
  isInitialized: boolean;
}

// Step 2統合後のマイクロフォン状態
export interface EnhancedMicrophoneState extends MicrophoneState {
  audioProcessor: AudioProcessorState;
  processedData: ProcessedAudioData;
}
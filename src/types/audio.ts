/**
 * 音声処理関連の型定義 - シンプル版
 * 基本的なマイクロフォン機能のみ
 */

// Step 1: 基本マイクロフォン状態
export interface MicrophoneState {
  isRecording: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  audioLevel: number;
  isInitialized: boolean;
}

// シンプルな周波数データ
export interface FrequencyData {
  frequency: number;
  amplitude: number;
  timestamp: number;
}
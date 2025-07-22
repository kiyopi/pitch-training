/**
 * 基音・音源関連の型定義
 */

// 基音情報（統合版）
export interface BaseTone {
  name: string;         // 'C4', 'Bb3' など
  note: string;         // 'ド4', 'シ♭3' など（日本語表記）
  octave: number;       // オクターブ番号
  frequency: number;    // 周波数 (Hz)
  tonejs?: string;      // Tone.js形式のノート名（オプション）
}

// 音源プレイヤー設定
export interface TonePlayerConfig {
  volume: number;       // 音量 (-60 〜 6 dB)
  attack: number;       // アタック時間
  decay: number;        // ディケイ時間
  sustain: number;      // サスティンレベル
  release: number;      // リリース時間
  baseUrl?: string;     // サンプル音源のベースURL
}

// 音源プレイヤー状態
export interface TonePlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTone: BaseTone | null;
  error?: string | null;
}

// 音源プレイヤーHook戻り値
export interface TonePlayerHook {
  playerState: TonePlayerState;
  playTone: (tone: BaseTone, duration?: number) => Promise<void>;
  stopTone: () => void;
  cleanup: () => void;
  setVolume: (volume: number) => void;
}

// シンプル音源プレイヤー（軽量版）
export interface SimpleTonePlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTone: BaseTone | null;
  error?: string | null;
}

export interface SimpleTonePlayerHook {
  playerState: SimpleTonePlayerState;
  playTone: (tone: BaseTone, duration?: number) => Promise<void>;
  stopTone: () => void;
  cleanup: () => void;
}

// トレーニング用基音データベース
export interface TrainingBaseTones {
  random: BaseTone[];      // ランダムモード用
  continuous: BaseTone[];  // 連続モード用  
  chromatic: BaseTone[];   // 12音階モード用
}

// 基音選択モード
export type BaseToneSelectionMode = 'random' | 'sequential' | 'custom' | 'user-defined';

// 基音管理設定
export interface BaseToneManagerConfig {
  selectionMode: BaseToneSelectionMode;
  availableTones: BaseTone[];
  defaultTone?: BaseTone;
  shuffleOnReset?: boolean;
  excludeTones?: string[];  // 除外する音名
}
/**
 * 定数・設定値定義
 */

// 音楽理論定数
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_JP = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'] as const;

// 基準周波数・音程定数
export const A4_FREQUENCY = 440; // Hz
export const A4_MIDI_NUMBER = 69; // MIDI note number for A4
export const SEMITONES_PER_OCTAVE = 12;
export const CENTS_PER_SEMITONE = 100;

// 音域定義（人間の音域）
export const VOCAL_RANGE = {
  min: 82.41,   // E2 (最低音)
  max: 1046.50, // C6 (最高音)
} as const;

// トレーニング用基音（10種類）
export const TRAINING_BASE_FREQUENCIES = [
  { name: 'Bb3', note: 'シ♭3', frequency: 233.08, midi: 58 },
  { name: 'C4',  note: 'ド4',   frequency: 261.63, midi: 60 },
  { name: 'Db4', note: 'レ♭4', frequency: 277.18, midi: 61 },
  { name: 'D4',  note: 'レ4',   frequency: 293.66, midi: 62 },
  { name: 'Eb4', note: 'ミ♭4', frequency: 311.13, midi: 63 },
  { name: 'E4',  note: 'ミ4',   frequency: 329.63, midi: 64 },
  { name: 'F4',  note: 'ファ4', frequency: 349.23, midi: 65 },
  { name: 'Gb4', note: 'ソ♭4', frequency: 369.99, midi: 66 },
  { name: 'G4',  note: 'ソ4',   frequency: 392.00, midi: 67 },
  { name: 'Ab4', note: 'ラ♭4', frequency: 415.30, midi: 68 }
] as const;

// オクターブスケール（ドレミファソラシド）
export const DIATONIC_SCALE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12] as const; // ドレミファソラシド
export const DIATONIC_SCALE_NAMES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド(高)'] as const;

// 音声処理定数
export const AUDIO_PROCESSING = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 2048,
  FFT_SIZE: 2048,
  SMOOTHING_TIME_CONSTANT: 0.8,
  
  // 音量検出
  VOLUME_THRESHOLD: 3,
  VOLUME_SMOOTHING: 0.2,
  
  // 音程検出
  CLARITY_THRESHOLD: 0.15,
  MIN_FREQUENCY: 80,
  MAX_FREQUENCY: 1200,
  
} as const;

// フィルター設定
export const AUDIO_FILTERS = {
  HIGH_PASS: {
    frequency: 40,
    Q: 0.7,
  },
  LOW_PASS: {
    frequency: 4000,
    Q: 0.7,
  },
  NOTCH: {
    frequency: 60,  // 電源ハム除去
    Q: 30,
  },
  GAIN: {
    value: 1.2,
  },
} as const;

// 倍音補正設定
export const HARMONIC_CORRECTION = {
  SEARCH_RANGE: 50,           // ±50Hz
  RATIOS: [0.5, 2.0, 3.0, 4.0], // 1/2, 2倍, 3倍, 4倍音
  CONFIDENCE_THRESHOLD: 0.8,
  STABILITY_FRAMES: 5,
  CORRECTION_THRESHOLD_RATIO: 0.55, // 55%ポイント
} as const;

// 精度評価基準（セント単位）
export const ACCURACY_THRESHOLDS = {
  PERFECT: 10,      // ±10セント以内
  EXCELLENT: 25,    // ±25セント以内
  GOOD: 50,         // ±50セント以内
  FAIR: 100,        // ±100セント以内
  // それ以上はPOOR
} as const;

// UI・UX定数
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,    // ms
  DEBOUNCE_TIME: 150,        // ms
  LONG_PRESS_TIME: 800,      // ms
  TOAST_DURATION: 3000,      // ms
  
  // 更新間隔
  REALTIME_UPDATE_INTERVAL: 16, // ~60FPS
  STATS_UPDATE_INTERVAL: 1000,  // 1秒
  
  // レスポンシブブレークポイント
  BREAKPOINTS: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  },
} as const;

// Tone.js設定
export const TONE_CONFIG = {
  SALAMANDER_BASE_URL: 'https://tonejs.github.io/audio/salamander/',
  VOLUME: 6,         // dB
  RELEASE: 1.5,      // 秒
  ATTACK: 0.01,      // 秒
  DECAY: 0.1,        // 秒
  SUSTAIN: 0.5,      // レベル
} as const;

// エラー分類
export const ERROR_CATEGORIES = {
  AUDIO: 'audio',
  MICROPHONE: 'microphone', 
  PITCH: 'pitch',
  UI: 'ui',
  SYSTEM: 'system',
  NETWORK: 'network',
} as const;

// ログレベル
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug',
} as const;
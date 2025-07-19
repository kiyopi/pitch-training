/**
 * 音名変換ユーティリティ - シンプル版
 * 周波数から音名への変換機能
 */

// 音名定義
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 基準周波数 (A4 = 440Hz)
export const A4_FREQUENCY = 440;
export const A4_NOTE_NUMBER = 69; // MIDI note number for A4

/**
 * 周波数から音名とオクターブを取得
 */
export function frequencyToNote(frequency: number): {
  note: string;
  octave: number;
  fullNote: string;
  cents: number;
} {
  if (frequency <= 0) {
    return { note: '', octave: 0, fullNote: '', cents: 0 };
  }

  // MIDI note number計算
  const midiNoteNumber = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_NOTE_NUMBER;
  const noteNumber = Math.round(midiNoteNumber);
  
  // 音名とオクターブ計算
  const noteIndex = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;
  const note = NOTE_NAMES[noteIndex];
  
  // セント偏差計算（音程の微細なずれ）
  const cents = Math.round((midiNoteNumber - noteNumber) * 100);
  
  // 完全な音名（例: C4, A#3）
  const fullNote = `${note}${octave}`;
  
  return {
    note,
    octave,
    fullNote,
    cents
  };
}

/**
 * 周波数が音楽的に有効な範囲内かチェック
 */
export function isValidMusicalFrequency(frequency: number): boolean {
  // 人間の音楽的聴覚範囲: 約80Hz - 4000Hz
  return frequency >= 80 && frequency <= 4000;
}

/**
 * セント偏差から音程の正確性を評価（絶対音程用）
 */
export function evaluatePitchAccuracy(cents: number): {
  accuracy: 'perfect' | 'good' | 'fair' | 'poor';
  color: string;
  score: number;
} {
  const absCents = Math.abs(cents);
  
  if (absCents <= 5) {
    return { accuracy: 'perfect', color: 'green', score: 100 };
  } else if (absCents <= 15) {
    return { accuracy: 'good', color: 'blue', score: 85 };
  } else if (absCents <= 30) {
    return { accuracy: 'fair', color: 'orange', score: 70 };
  } else {
    return { accuracy: 'poor', color: 'red', score: 50 };
  }
}

/**
 * 音名表示用の色を取得
 */
export function getNoteColor(note: string): string {
  const colors: { [key: string]: string } = {
    'C': '#FF6B6B',   // 赤
    'C#': '#FF8E53',  // オレンジ
    'D': '#FF6B9D',   // ピンク
    'D#': '#C44569',  // 紫
    'E': '#F8B500',   // 黄
    'F': '#6BCF7F',   // 緑
    'F#': '#4ECDC4',  // 青緑
    'G': '#45B7D1',   // 青
    'G#': '#96CEB4',  // 薄緑
    'A': '#FFEAA7',   // 薄黄
    'A#': '#DDA0DD',  // 薄紫
    'B': '#98D8C8'    // 薄青
  };
  
  return colors[note] || '#6C7B7F';
}

/**
 * 基音再生用: Tone.js向け基音候補
 */
export interface BaseTone {
  note: string;
  octave: number;
  frequency: number;
  fullNote: string;
}

/**
 * ドレミファソラシド音階の基音候補（相対音感トレーニング用）
 */
export const TRAINING_BASE_TONES: BaseTone[] = [
  { note: 'C', octave: 3, frequency: 130.81, fullNote: 'C3' },   // ド
  { note: 'D', octave: 3, frequency: 146.83, fullNote: 'D3' },   // レ
  { note: 'E', octave: 3, frequency: 164.81, fullNote: 'E3' },   // ミ
  { note: 'F', octave: 3, frequency: 174.61, fullNote: 'F3' },   // ファ
  { note: 'G', octave: 3, frequency: 196.00, fullNote: 'G3' },   // ソ
  { note: 'A', octave: 3, frequency: 220.00, fullNote: 'A3' },   // ラ
  { note: 'B', octave: 3, frequency: 246.94, fullNote: 'B3' },   // シ
  { note: 'C', octave: 4, frequency: 261.63, fullNote: 'C4' },   // ド（オクターブ上）
];

/**
 * 相対音程計算（セント単位）
 */
export function calculateRelativeInterval(baseFreq: number, userFreq: number): {
  cents: number;
  semitones: number;
  intervalName: string;
} {
  if (baseFreq <= 0 || userFreq <= 0) {
    return { cents: 0, semitones: 0, intervalName: 'Invalid' };
  }

  // セント計算（対数比）
  const cents = Math.round(1200 * Math.log2(userFreq / baseFreq));
  const semitones = Math.round(cents / 100);
  
  // 音程名を取得
  const intervalName = getIntervalName(semitones);
  
  return { cents, semitones, intervalName };
}

/**
 * 音程名取得（セミトーン数から）
 */
function getIntervalName(semitones: number): string {
  const intervals: { [key: number]: string } = {
    0: '同音（ユニゾン）',
    1: '短2度',
    2: '長2度',
    3: '短3度',
    4: '長3度',
    5: '完全4度',
    6: '三全音',
    7: '完全5度',
    8: '短6度',
    9: '長6度',
    10: '短7度',
    11: '長7度',
    12: '完全8度（オクターブ）',
  };
  
  // オクターブ補正
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  return intervals[normalizedSemitones] || `${semitones}セミトーン`;
}

/**
 * 相対音感精度評価
 */
export function evaluateRelativePitchAccuracy(cents: number): {
  accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  score: number;
  message: string;
} {
  const absCents = Math.abs(cents);
  
  if (absCents <= 10) {
    return { 
      accuracy: 'perfect', 
      color: 'green', 
      score: 100, 
      message: '完璧な音程！' 
    };
  } else if (absCents <= 25) {
    return { 
      accuracy: 'excellent', 
      color: 'blue', 
      score: 90, 
      message: '素晴らしい音程感！' 
    };
  } else if (absCents <= 50) {
    return { 
      accuracy: 'good', 
      color: 'cyan', 
      score: 75, 
      message: '良好な音程です' 
    };
  } else if (absCents <= 100) {
    return { 
      accuracy: 'fair', 
      color: 'orange', 
      score: 60, 
      message: '練習でより正確に！' 
    };
  } else {
    return { 
      accuracy: 'poor', 
      color: 'red', 
      score: 40, 
      message: '音程を意識してみよう' 
    };
  }
}
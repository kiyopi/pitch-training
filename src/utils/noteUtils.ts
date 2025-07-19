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
 * セント偏差から音程の正確性を評価
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
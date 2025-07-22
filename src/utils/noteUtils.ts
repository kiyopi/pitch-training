/**
 * 音名変換ユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * 周波数から音名への変換、音程評価機能
 */

import { 
  NOTE_NAMES, 
  A4_FREQUENCY, 
  A4_MIDI_NUMBER,
  SEMITONES_PER_OCTAVE,
  CENTS_PER_SEMITONE,
  VOCAL_RANGE,
  ACCURACY_THRESHOLDS,
  DIATONIC_SCALE_SEMITONES,
  DIATONIC_SCALE_NAMES
} from './constants';
import type { 
  NoteInfo, 
  AccuracyEvaluation, 
  IntervalInfo,
  BaseTone 
} from '../types';

/**
 * 周波数から音名とオクターブを取得
 */
export function frequencyToNote(frequency: number): NoteInfo {
  if (frequency <= 0) {
    return { 
      note: '', 
      octave: 0, 
      fullNote: '', 
      frequency: 0,
      cents: 0 
    };
  }

  // MIDI note number計算
  const midiNoteNumber = SEMITONES_PER_OCTAVE * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NUMBER;
  const noteNumber = Math.round(midiNoteNumber);
  
  // 音名とオクターブ計算
  const noteIndex = noteNumber % SEMITONES_PER_OCTAVE;
  const octave = Math.floor(noteNumber / SEMITONES_PER_OCTAVE) - 1;
  const note = NOTE_NAMES[noteIndex];
  
  // セント偏差計算（音程の微細なずれ）
  const cents = Math.round((midiNoteNumber - noteNumber) * CENTS_PER_SEMITONE);
  
  // 完全な音名（例: C4, A#3）
  const fullNote = `${note}${octave}`;
  
  return {
    note,
    octave,
    fullNote,
    frequency,
    cents
  };
}

/**
 * 周波数が音楽的に有効な範囲内かチェック
 */
export function isValidMusicalFrequency(frequency: number): boolean {
  return frequency >= VOCAL_RANGE.min && frequency <= VOCAL_RANGE.max;
}

/**
 * セント偏差から音程の正確性を評価（絶対音程用）
 */
export function evaluatePitchAccuracy(cents: number): AccuracyEvaluation {
  const absCents = Math.abs(cents);
  
  if (absCents <= ACCURACY_THRESHOLDS.PERFECT) {
    return { 
      accuracy: 'perfect', 
      color: 'green', 
      score: 100,
      message: '完璧な音程です！'
    };
  } else if (absCents <= ACCURACY_THRESHOLDS.EXCELLENT) {
    return { 
      accuracy: 'excellent', 
      color: 'blue', 
      score: 85,
      message: '素晴らしい精度です'
    };
  } else if (absCents <= ACCURACY_THRESHOLDS.GOOD) {
    return { 
      accuracy: 'good', 
      color: 'orange', 
      score: 70,
      message: '良い精度です'
    };
  } else if (absCents <= ACCURACY_THRESHOLDS.FAIR) {
    return { 
      accuracy: 'fair', 
      color: 'yellow', 
      score: 60,
      message: 'まずまずの精度です'
    };
  } else {
    return { 
      accuracy: 'poor', 
      color: 'red', 
      score: 40,
      message: '音程を調整しましょう'
    };
  }
}

/**
 * 相対音程の精度評価（相対音感トレーニング用）
 */
export function evaluateRelativePitchAccuracy(cents: number): AccuracyEvaluation {
  const absCents = Math.abs(cents);
  
  if (absCents <= 10) {
    return { 
      accuracy: 'perfect', 
      color: 'green', 
      score: 100,
      message: '完璧な相対音程！'
    };
  } else if (absCents <= 20) {
    return { 
      accuracy: 'excellent', 
      color: 'blue', 
      score: 90,
      message: '優秀な相対音感です'
    };
  } else if (absCents <= 40) {
    return { 
      accuracy: 'good', 
      color: 'orange', 
      score: 75,
      message: '良好な相対音程です'
    };
  } else if (absCents <= 75) {
    return { 
      accuracy: 'fair', 
      color: 'yellow', 
      score: 60,
      message: '相対音程を調整してください'
    };
  } else {
    return { 
      accuracy: 'poor', 
      color: 'red', 
      score: 40,
      message: '基音をよく聞いて歌い直してください'
    };
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
 * 2つの周波数間の相対音程を計算
 */
export function calculateRelativeInterval(baseFreq: number, targetFreq: number): IntervalInfo {
  const ratio = targetFreq / baseFreq;
  const semitones = Math.round(SEMITONES_PER_OCTAVE * Math.log2(ratio));
  const cents = Math.round(1200 * Math.log2(ratio));
  
  // 音程名の取得
  const intervalName = getIntervalName(semitones);
  const direction = ratio > 1 ? 'up' : ratio < 1 ? 'down' : 'unison';
  
  return {
    semitones,
    cents,
    intervalName,
    direction
  };
}

/**
 * 半音数から音程名を取得
 */
function getIntervalName(semitones: number): string {
  const absSemitones = Math.abs(semitones);
  const intervalNames = [
    '同音', '短2度', '長2度', '短3度', '長3度', '完全4度', '増4度',
    '完全5度', '短6度', '長6度', '短7度', '長7度', '完全8度'
  ];
  
  if (absSemitones < intervalNames.length) {
    return intervalNames[absSemitones];
  } else {
    const octaves = Math.floor(absSemitones / 12);
    const remainder = absSemitones % 12;
    return `${octaves}オクターブ + ${intervalNames[remainder]}`;
  }
}

/**
 * 基音から相対音階の目標周波数を計算（ドレミファソラシド）
 */
export function calculateDiatonicScale(baseFreq: number): number[] {
  return DIATONIC_SCALE_SEMITONES.map(semitones => 
    baseFreq * Math.pow(2, semitones / SEMITONES_PER_OCTAVE)
  );
}

/**
 * トレーニング用基音データベースを取得
 */
export function getTrainingBaseTones(): BaseTone[] {
  return [
    { name: 'Bb3', note: 'シ♭3', octave: 3, frequency: 233.08 },
    { name: 'C4',  note: 'ド4',   octave: 4, frequency: 261.63 },
    { name: 'Db4', note: 'レ♭4', octave: 4, frequency: 277.18 },
    { name: 'D4',  note: 'レ4',   octave: 4, frequency: 293.66 },
    { name: 'Eb4', note: 'ミ♭4', octave: 4, frequency: 311.13 },
    { name: 'E4',  note: 'ミ4',   octave: 4, frequency: 329.63 },
    { name: 'F4',  note: 'ファ4', octave: 4, frequency: 349.23 },
    { name: 'Gb4', note: 'ソ♭4', octave: 4, frequency: 369.99 },
    { name: 'G4',  note: 'ソ4',   octave: 4, frequency: 392.00 },
    { name: 'Ab4', note: 'ラ♭4', octave: 4, frequency: 415.30 }
  ];
}

/**
 * 旧形式のTRAINING_BASE_TONES互換エクスポート
 */
export const TRAINING_BASE_TONES = getTrainingBaseTones();

/**
 * 音階名から対応するindex取得（ドレミファソラシド）
 */
export function getDiatonicNoteIndex(noteName: string): number {
  const index = DIATONIC_SCALE_NAMES.indexOf(noteName as typeof DIATONIC_SCALE_NAMES[number]);
  return index === -1 ? 0 : index;
}

/**
 * 音名から周波数を計算（A4=440Hz基準）
 */
export function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note as typeof NOTE_NAMES[number]);
  if (noteIndex === -1) return 0;
  
  const midiNumber = (octave + 1) * SEMITONES_PER_OCTAVE + noteIndex;
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI_NUMBER) / SEMITONES_PER_OCTAVE);
}
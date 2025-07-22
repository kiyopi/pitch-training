/**
 * フォーマットユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * 音程・時間・数値・テキストのフォーマット
 */

import { NOTE_NAMES_JP, DIATONIC_SCALE_NAMES } from './constants';

/**
 * 周波数を音名付き文字列にフォーマット
 */
export const formatFrequencyWithNote = (
  frequency: number,
  note?: string,
  showCents?: boolean,
  cents?: number
): string => {
  const freqStr = frequency.toFixed(2);
  const noteStr = note ? ` (${note})` : '';
  const centsStr = showCents && cents !== undefined ? 
    ` ${cents >= 0 ? '+' : ''}${cents.toFixed(0)}¢` : '';
  
  return `${freqStr}Hz${noteStr}${centsStr}`;
};

/**
 * セント偏差をフォーマット
 */
export const formatCents = (cents: number, showSign: boolean = true): string => {
  const rounded = Math.round(cents);
  const sign = showSign && rounded >= 0 ? '+' : '';
  return `${sign}${rounded}¢`;
};

/**
 * 音程精度をフォーマット
 */
export const formatAccuracy = (
  accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor',
  score?: number
): string => {
  const accuracyNames = {
    perfect: '完璧',
    excellent: '優秀',
    good: '良好',
    fair: '普通',
    poor: '要改善'
  };
  
  const scoreStr = score !== undefined ? ` (${score}点)` : '';
  return `${accuracyNames[accuracy]}${scoreStr}`;
};

/**
 * 時間をフォーマット（ミリ秒 → 秒.ミリ秒）
 */
export const formatDuration = (
  milliseconds: number,
  precision: number = 1
): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(precision)}s`;
};

/**
 * パーセンテージをフォーマット
 */
export const formatPercentage = (
  value: number,
  total: number = 1,
  precision: number = 1
): string => {
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(precision)}%`;
};

/**
 * 音量レベルをフォーマット（dB）
 */
export const formatVolumeLevel = (
  rms: number,
  showDb: boolean = true
): string => {
  if (rms <= 0) {
    return showDb ? '-∞ dB' : 'サイレント';
  }
  
  const db = 20 * Math.log10(rms);
  
  if (showDb) {
    return `${db.toFixed(1)} dB`;
  } else {
    // 相対レベル表示
    if (db > -10) return '強';
    if (db > -20) return '中';
    if (db > -40) return '弱';
    return 'かすか';
  }
};

/**
 * 音程間隔をフォーマット
 */
export const formatInterval = (
  semitones: number,
  useJapanese: boolean = true
): string => {
  const absSemitones = Math.abs(semitones);
  const direction = semitones > 0 ? '上' : semitones < 0 ? '下' : '';
  
  const intervalNames = useJapanese ? [
    '同音', '短2度', '長2度', '短3度', '長3度', '完全4度', '増4度',
    '完全5度', '短6度', '長6度', '短7度', '長7度', '完全8度'
  ] : [
    'Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th',
    'Tritone', 'Perfect 5th', 'Minor 6th', 'Major 6th', 'Minor 7th', 'Major 7th', 'Octave'
  ];
  
  if (absSemitones < intervalNames.length) {
    const intervalName = intervalNames[absSemitones];
    return direction ? `${intervalName}${direction}` : intervalName;
  } else {
    const octaves = Math.floor(absSemitones / 12);
    const remainder = absSemitones % 12;
    const baseName = intervalNames[remainder];
    return `${octaves}オクターブ + ${baseName}${direction}`;
  }
};

/**
 * ドレミ音階名をフォーマット
 */
export const formatScaleName = (
  scaleIndex: number,
  style: 'hiragana' | 'katakana' | 'mixed' = 'hiragana'
): string => {
  if (scaleIndex < 0 || scaleIndex >= DIATONIC_SCALE_NAMES.length) {
    return '不明';
  }
  
  const baseName = DIATONIC_SCALE_NAMES[scaleIndex];
  
  switch (style) {
    case 'katakana':
      return baseName.replace(/ひらがな/g, 'カタカナ'); // 実装要
    case 'mixed':
      return scaleIndex === 7 ? 'ド(高)' : baseName;
    default:
      return baseName;
  }
};

/**
 * 音名を西洋式/日本式でフォーマット
 */
export const formatNoteName = (
  note: string,
  octave?: number,
  style: 'western' | 'japanese' = 'western'
): string => {
  if (style === 'japanese') {
    const noteIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(note);
    if (noteIndex !== -1) {
      const japaneseName = NOTE_NAMES_JP[noteIndex];
      return octave !== undefined ? `${japaneseName}${octave}` : japaneseName;
    }
  }
  
  return octave !== undefined ? `${note}${octave}` : note;
};

/**
 * 統計データをフォーマット
 */
export const formatStatistics = (stats: {
  total: number;
  success: number;
  average?: number;
  accuracy?: number;
}): {
  successRate: string;
  total: string;
  average: string;
  accuracy: string;
} => {
  const successRate = stats.total > 0 ? 
    formatPercentage(stats.success, stats.total) : '0%';
  
  const total = `${stats.total}回`;
  
  const average = stats.average !== undefined ? 
    `${stats.average.toFixed(1)}点` : '---';
  
  const accuracy = stats.accuracy !== undefined ? 
    formatPercentage(stats.accuracy / 100) : '---';
  
  return {
    successRate,
    total,
    average,
    accuracy
  };
};

/**
 * エラーメッセージをフォーマット
 */
export const formatErrorMessage = (
  error: Error | string,
  context?: string
): string => {
  const message = typeof error === 'string' ? error : error.message;
  const prefix = context ? `[${context}] ` : '';
  
  // 一般的なエラーの日本語化
  const commonErrors: { [key: string]: string } = {
    'NotAllowedError': 'マイクへのアクセスが拒否されました',
    'NotFoundError': 'マイクが見つかりません',
    'NotSupportedError': 'この機能はサポートされていません',
    'AbortError': '操作がキャンセルされました',
    'SecurityError': 'セキュリティ上の理由でアクセスできません'
  };
  
  const translatedMessage = commonErrors[message] || message;
  return `${prefix}${translatedMessage}`;
};

/**
 * デバッグ情報をフォーマット
 */
export const formatDebugInfo = (data: unknown): string => {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
};

/**
 * 音声品質をフォーマット
 */
export const formatAudioQuality = (
  quality: 'excellent' | 'good' | 'fair' | 'poor',
  score?: number,
  details?: string[]
): string => {
  const qualityNames = {
    excellent: '優秀',
    good: '良好', 
    fair: '普通',
    poor: '不良'
  };
  
  const name = qualityNames[quality];
  const scoreStr = score !== undefined ? ` (${score}点)` : '';
  const detailsStr = details && details.length > 0 ? 
    `\n詳細: ${details.join(', ')}` : '';
  
  return `${name}${scoreStr}${detailsStr}`;
};

/**
 * 数値の範囲チェック付きフォーマット
 */
export const formatNumberWithRange = (
  value: number,
  min: number,
  max: number,
  unit: string = '',
  precision: number = 1
): string => {
  const clampedValue = Math.max(min, Math.min(max, value));
  const formatted = clampedValue.toFixed(precision);
  const warning = value !== clampedValue ? ' (調整済)' : '';
  
  return `${formatted}${unit}${warning}`;
};

/**
 * 配列データの要約フォーマット
 */
export const formatArraySummary = <T>(
  array: T[],
  formatter: (item: T) => string,
  maxItems: number = 3
): string => {
  if (array.length === 0) {
    return '(なし)';
  }
  
  const displayed = array.slice(0, maxItems).map(formatter);
  const remaining = array.length - maxItems;
  
  if (remaining > 0) {
    displayed.push(`他${remaining}件`);
  }
  
  return displayed.join(', ');
};
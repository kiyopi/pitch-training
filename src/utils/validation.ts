/**
 * バリデーションユーティリティ（簡易版）
 * 
 * ビルドエラー解消のため簡略化
 */

import type { 
  ValidationResult
} from '../types';

/**
 * 基本バリデーション結果作成
 */
const createValidationResult = (
  isValid: boolean,
  errors: string[] = [],
  warnings: string[] = [],
  suggestions?: string[]
): ValidationResult => ({
  isValid,
  errors,
  warnings,
  suggestions
});

/**
 * 周波数バリデーション（簡易版）
 */
export const validateFrequency = (frequency: number): ValidationResult => {
  if (typeof frequency !== 'number' || isNaN(frequency)) {
    return createValidationResult(false, ['Invalid frequency value']);
  }
  
  if (frequency < 50 || frequency > 2000) {
    return createValidationResult(false, ['Frequency out of range']);
  }
  
  return createValidationResult(true);
};

/**
 * 音程精度バリデーション（簡易版）
 */
export const validatePitchAccuracy = (cents: number): ValidationResult => {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return createValidationResult(false, ['Invalid cents value']);
  }
  
  return createValidationResult(true);
};

/**
 * 音声データバリデーション（簡易版）
 */
export const validateAudioData = (audioData: Float32Array): ValidationResult => {
  if (!audioData || audioData.length === 0) {
    return createValidationResult(false, ['Empty audio data']);
  }
  
  return createValidationResult(true);
};

/**
 * ブラウザサポートバリデーション（簡易版）
 */
export const validateBrowserSupport = (): ValidationResult => {
  if (!window.AudioContext && !(window as Record<string, unknown>).webkitAudioContext) {
    return createValidationResult(false, ['Web Audio API not supported']);
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return createValidationResult(false, ['MediaDevices API not supported']);
  }
  
  return createValidationResult(true);
};
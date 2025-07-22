/**
 * バリデーションユーティリティ（統合版）
 * 
 * 型定義統合対応版
 * 音声・設定・ユーザー入力のバリデーション
 */

import { 
  VOCAL_RANGE, 
  AUDIO_PROCESSING, 
  ACCURACY_THRESHOLDS
} from './constants';
import type { 
  ValidationResult,
  AudioValidation,
  ConfigValidation,
  PitchValidation 
} from '../types';

/**
 * 基本バリデーション結果作成
 */
const createValidationResult = (
  isValid: boolean,
  message?: string,
  details?: unknown
): ValidationResult => ({
  isValid,
  message: message || (isValid ? '検証成功' : '検証失敗'),
  details
});

/**
 * 周波数バリデーション
 */
export const validateFrequency = (frequency: number): PitchValidation => {
  if (typeof frequency !== 'number' || isNaN(frequency)) {
    return {
      ...createValidationResult(false, '周波数が数値ではありません'),
      frequencyRange: 'invalid',
      isMusicalRange: false,
      suggestedCorrection: null
    };
  }
  
  if (frequency <= 0) {
    return {
      ...createValidationResult(false, '周波数は正の値である必要があります'),
      frequencyRange: 'invalid',
      isMusicalRange: false,
      suggestedCorrection: null
    };
  }
  
  // 音楽的範囲の判定
  const isMusicalRange = frequency >= VOCAL_RANGE.min && frequency <= VOCAL_RANGE.max;
  
  let frequencyRange: 'too_low' | 'musical' | 'too_high' | 'invalid';
  if (frequency < VOCAL_RANGE.min) {
    frequencyRange = 'too_low';
  } else if (frequency > VOCAL_RANGE.max) {
    frequencyRange = 'too_high';
  } else {
    frequencyRange = 'musical';
  }
  
  // 補正提案
  let suggestedCorrection: number | null = null;
  if (frequency < VOCAL_RANGE.min) {
    // オクターブ上へ補正
    let corrected = frequency;
    while (corrected < VOCAL_RANGE.min) {
      corrected *= 2;
    }
    if (corrected <= VOCAL_RANGE.max) {
      suggestedCorrection = corrected;
    }
  } else if (frequency > VOCAL_RANGE.max) {
    // オクターブ下へ補正
    let corrected = frequency;
    while (corrected > VOCAL_RANGE.max) {
      corrected /= 2;
    }
    if (corrected >= VOCAL_RANGE.min) {
      suggestedCorrection = corrected;
    }
  }
  
  return {
    ...createValidationResult(isMusicalRange, 
      isMusicalRange ? '有効な音楽的周波数です' : `周波数が範囲外です (${VOCAL_RANGE.min}-${VOCAL_RANGE.max}Hz)`),
    frequencyRange,
    isMusicalRange,
    suggestedCorrection
  };
};

/**
 * 音程精度バリデーション
 */
export const validatePitchAccuracy = (
  userFreq: number,
  targetFreq: number
): PitchValidation & { accuracyLevel: string; cents: number } => {
  const freqValidation = validateFrequency(userFreq);
  const targetValidation = validateFrequency(targetFreq);
  
  if (!freqValidation.isValid || !targetValidation.isValid) {
    return {
      ...createValidationResult(false, '周波数が無効です'),
      frequencyRange: 'invalid',
      isMusicalRange: false,
      suggestedCorrection: null,
      accuracyLevel: 'invalid',
      cents: 0
    };
  }
  
  // セント差計算
  const cents = Math.abs(1200 * Math.log2(userFreq / targetFreq));
  
  // 精度レベル判定
  let accuracyLevel: string;
  if (cents <= ACCURACY_THRESHOLDS.PERFECT) {
    accuracyLevel = 'perfect';
  } else if (cents <= ACCURACY_THRESHOLDS.EXCELLENT) {
    accuracyLevel = 'excellent';
  } else if (cents <= ACCURACY_THRESHOLDS.GOOD) {
    accuracyLevel = 'good';
  } else if (cents <= ACCURACY_THRESHOLDS.FAIR) {
    accuracyLevel = 'fair';
  } else {
    accuracyLevel = 'poor';
  }
  
  const isValid = cents <= ACCURACY_THRESHOLDS.FAIR; // Fair以上を有効とする
  
  return {
    ...createValidationResult(isValid, 
      isValid ? `音程精度: ${accuracyLevel} (${cents.toFixed(1)}¢)` : `音程が不正確です (${cents.toFixed(1)}¢)`),
    frequencyRange: 'musical',
    isMusicalRange: true,
    suggestedCorrection: targetFreq,
    accuracyLevel,
    cents
  };
};

/**
 * 音声データバリデーション
 */
export const validateAudioData = (
  audioData: Float32Array | null,
  sampleRate?: number
): AudioValidation => {
  if (!audioData) {
    return {
      ...createValidationResult(false, '音声データが null です'),
      hasValidData: false,
      dataLength: 0,
      sampleRate: 0,
      rmsLevel: 0,
      peakLevel: 0,
      hasSilence: true
    };
  }
  
  if (!(audioData instanceof Float32Array)) {
    return {
      ...createValidationResult(false, '音声データの形式が正しくありません'),
      hasValidData: false,
      dataLength: audioData?.length || 0,
      sampleRate: sampleRate || 0,
      rmsLevel: 0,
      peakLevel: 0,
      hasSilence: true
    };
  }
  
  const dataLength = audioData.length;
  if (dataLength === 0) {
    return {
      ...createValidationResult(false, '音声データが空です'),
      hasValidData: false,
      dataLength: 0,
      sampleRate: sampleRate || 0,
      rmsLevel: 0,
      peakLevel: 0,
      hasSilence: true
    };
  }
  
  // RMS・ピークレベル計算
  let rmsSum = 0;
  let peakLevel = 0;
  
  for (let i = 0; i < dataLength; i++) {
    const abs = Math.abs(audioData[i]);
    rmsSum += audioData[i] * audioData[i];
    if (abs > peakLevel) peakLevel = abs;
  }
  
  const rmsLevel = Math.sqrt(rmsSum / dataLength);
  const hasSilence = rmsLevel < (AUDIO_PROCESSING.VOLUME_THRESHOLD / 100);
  
  // 異常値チェック
  const hasInvalidValues = Array.from(audioData).some(sample => 
    !isFinite(sample) || isNaN(sample)
  );
  
  if (hasInvalidValues) {
    return {
      ...createValidationResult(false, '音声データに異常値が含まれています'),
      hasValidData: false,
      dataLength,
      sampleRate: sampleRate || AUDIO_PROCESSING.SAMPLE_RATE,
      rmsLevel,
      peakLevel,
      hasSilence
    };
  }
  
  const hasValidData = !hasSilence && rmsLevel > 0.001; // 最小音量閾値
  
  return {
    ...createValidationResult(hasValidData, 
      hasValidData ? '有効な音声データです' : '音声信号が検出されません'),
    hasValidData,
    dataLength,
    sampleRate: sampleRate || AUDIO_PROCESSING.SAMPLE_RATE,
    rmsLevel,
    peakLevel,
    hasSilence
  };
};

/**
 * マイクロフォン設定バリデーション
 */
export const validateMicrophoneConfig = (config: {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  noiseSuppression?: boolean;
}): ConfigValidation => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // サンプリングレートチェック
  if (config.sampleRate) {
    if (![8000, 16000, 22050, 44100, 48000].includes(config.sampleRate)) {
      issues.push(`サポートされていないサンプリングレート: ${config.sampleRate}Hz`);
    } else if (config.sampleRate < 22050) {
      warnings.push('低いサンプリングレートは音質に影響する可能性があります');
    }
  }
  
  // チャンネル数チェック
  if (config.channelCount && config.channelCount !== 1) {
    warnings.push('モノラル (1チャンネル) を推奨します');
  }
  
  const isValid = issues.length === 0;
  
  return {
    ...createValidationResult(isValid, 
      isValid ? 'マイクロフォン設定は有効です' : 'マイクロフォン設定に問題があります'),
    configType: 'microphone',
    issues,
    warnings,
    suggestedFixes: issues.map(issue => `設定を確認してください: ${issue}`)
  };
};

/**
 * ブラウザ対応チェック
 */
export const validateBrowserSupport = (): ValidationResult & {
  webAudioSupport: boolean;
  mediaDevicesSupport: boolean;
  userMediaSupport: boolean;
  features: string[];
  missingFeatures: string[];
} => {
  const features: string[] = [];
  const missingFeatures: string[] = [];
  
  // Web Audio API
  const webAudioSupport = !!(window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (webAudioSupport) {
    features.push('Web Audio API');
  } else {
    missingFeatures.push('Web Audio API');
  }
  
  // MediaDevices API
  const mediaDevicesSupport = !!(navigator.mediaDevices);
  if (mediaDevicesSupport) {
    features.push('MediaDevices API');
  } else {
    missingFeatures.push('MediaDevices API');
  }
  
  // getUserMedia
  const userMediaSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (userMediaSupport) {
    features.push('getUserMedia');
  } else {
    missingFeatures.push('getUserMedia');
  }
  
  const isValid = webAudioSupport && mediaDevicesSupport && userMediaSupport;
  
  return {
    ...createValidationResult(isValid, 
      isValid ? 'ブラウザはすべての必要な機能をサポートしています' : 
                `必要な機能がサポートされていません: ${missingFeatures.join(', ')}`),
    webAudioSupport,
    mediaDevicesSupport,
    userMediaSupport,
    features,
    missingFeatures
  };
};

/**
 * 設定値の範囲バリデーション
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  name: string
): ValidationResult & { normalizedValue: number; isInRange: boolean } => {
  const isInRange = value >= min && value <= max;
  const normalizedValue = Math.max(min, Math.min(max, value));
  
  return {
    ...createValidationResult(isInRange, 
      isInRange ? `${name}は有効な範囲内です` : 
                  `${name}が範囲外です (${min}-${max}), ${normalizedValue}に修正されました`),
    normalizedValue,
    isInRange
  };
};

/**
 * 配列データの統合バリデーション
 */
export const validateArray = <T>(
  array: T[],
  validator: (item: T, index: number) => ValidationResult,
  name: string
): ValidationResult & { validItems: T[]; invalidItems: { item: T; index: number; error: string }[] } => {
  const validItems: T[] = [];
  const invalidItems: { item: T; index: number; error: string }[] = [];
  
  array.forEach((item, index) => {
    const result = validator(item, index);
    if (result.isValid) {
      validItems.push(item);
    } else {
      invalidItems.push({ item, index, error: result.message });
    }
  });
  
  const isValid = invalidItems.length === 0;
  
  return {
    ...createValidationResult(isValid, 
      isValid ? `${name}のすべての項目が有効です` : 
                `${name}に${invalidItems.length}個の無効な項目があります`),
    validItems,
    invalidItems
  };
};
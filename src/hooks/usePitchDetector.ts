'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import {
  PitchDetectionResult,
  PitchDetectionConfig,
  PitchDetectionStats,
  DEFAULT_PITCH_DETECTION_CONFIG,
  createPitchDetectionResult,
  updatePitchDetectionStats,
  evaluatePitchDetectionQuality,
  getPitchDetectionDebugInfo,
  formatPitchDisplay,
} from '../utils/pitchUtils';

/**
 * 音程検出フック - Step 4
 * 
 * 目的: Pitchy（McLeod Pitch Method）による高精度音程検出
 * 機能: リアルタイム音程検出、音程判定、統計追跡
 * 対象: Step 1-3音声処理基盤の拡張
 */

// 音程検出状態インターフェース
interface PitchDetectionState {
  isDetecting: boolean;
  isInitialized: boolean;
  currentPitch: number | null;      // Hz
  currentNote: string | null;       // 音名 (C4, D#3, etc.)
  currentCents: number | null;      // セント偏差
  clarity: number;                  // 検出信頼度 (0-1)
  octave: number | null;            // オクターブ
  frequency: number | null;         // 周波数
  error: string | null;
  lastDetectionTime: number;
  config: PitchDetectionConfig;
}

// PitchDetectorフックインターフェース
interface PitchDetectorHook {
  pitchState: PitchDetectionState;
  startDetection: () => void;
  stopDetection: () => void;
  detectPitch: (audioData: Float32Array) => PitchDetectionResult | null;
  getPitchResult: () => PitchDetectionResult | null;
  getDetectionStats: () => PitchDetectionStats;
  getDetectionQuality: () => ReturnType<typeof evaluatePitchDetectionQuality>;
  getDebugInfo: () => ReturnType<typeof getPitchDetectionDebugInfo>;
  getFormattedDisplay: () => ReturnType<typeof formatPitchDisplay> | null;
  updateConfig: (config: Partial<PitchDetectionConfig>) => void;
  resetStats: () => void;
  resetError: () => void;
}

export const usePitchDetector = (): PitchDetectorHook => {
  const [pitchState, setPitchState] = useState<PitchDetectionState>({
    isDetecting: false,
    isInitialized: false,
    currentPitch: null,
    currentNote: null,
    currentCents: null,
    clarity: 0,
    octave: null,
    frequency: null,
    error: null,
    lastDetectionTime: 0,
    config: DEFAULT_PITCH_DETECTION_CONFIG,
  });

  // Pitchy検出器とバッファのRef
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const previousPitchRef = useRef<number | null>(null);
  const detectionStatsRef = useRef<PitchDetectionStats>({
    totalDetections: 0,
    successfulDetections: 0,
    averageClarity: 0,
    averagePitch: 0,
    detectionRate: 0,
    lastUpdate: Date.now(),
  });

  // 最新の検出結果のRef
  const latestResultRef = useRef<PitchDetectionResult | null>(null);

  /**
   * Pitch検出エラーハンドリング
   */
  const handlePitchDetectionError = (error: Error): string => {
    console.error('Pitch detection error:', error);
    
    switch (error.name) {
      case 'InvalidStateError':
        return 'Pitch検出器の状態が無効です。';
      case 'TypeError':
        return '音声データが無効です。';
      case 'RangeError':
        return 'バッファサイズが無効です。';
      default:
        return `Pitch検出エラー: ${error.message}`;
    }
  };

  /**
   * Pitch検出器の初期化
   */
  const initializePitchDetector = useCallback((): boolean => {
    try {
      console.log('🎵 Step 4: Pitch検出器初期化開始');

      // Pitchy検出器の作成
      const detector = PitchDetector.forFloat32Array(pitchState.config.bufferSize);
      pitchDetectorRef.current = detector;

      // 状態更新
      setPitchState(prev => ({
        ...prev,
        isInitialized: true,
        error: null,
      }));

      console.log('✅ Step 4: Pitch検出器初期化完了');
      console.log('🔧 バッファサイズ:', pitchState.config.bufferSize);
      console.log('🔧 検出範囲:', `${pitchState.config.minFrequency}Hz - ${pitchState.config.maxFrequency}Hz`);
      console.log('🔧 信頼度閾値:', pitchState.config.clarityThreshold);

      return true;
    } catch (error) {
      const errorMessage = handlePitchDetectionError(error as Error);
      setPitchState(prev => ({
        ...prev,
        error: errorMessage,
        isInitialized: false,
      }));
      console.error('❌ Step 4: Pitch検出器初期化失敗:', error);
      return false;
    }
  }, [pitchState.config]);

  /**
   * 音程検出の実行
   */
  const detectPitch = useCallback((audioData: Float32Array): PitchDetectionResult | null => {
    if (!pitchDetectorRef.current || !pitchState.isDetecting || !audioData) {
      return null;
    }

    try {
      const detector = pitchDetectorRef.current;
      
      // Pitchyで音程検出実行
      const [pitch, clarity] = detector.findPitch(audioData, pitchState.config.sampleRate);

      // 検出結果の作成と検証
      const result = createPitchDetectionResult(
        pitch,
        clarity,
        previousPitchRef.current,
        pitchState.config
      );

      // 統計更新
      detectionStatsRef.current = updatePitchDetectionStats(detectionStatsRef.current, result);

      if (result) {
        // 成功時の状態更新
        previousPitchRef.current = result.pitch;
        latestResultRef.current = result;

        setPitchState(prev => ({
          ...prev,
          currentPitch: result.pitch,
          currentNote: result.note,
          currentCents: result.cents,
          clarity: result.clarity,
          octave: result.octave,
          frequency: result.pitch,
          lastDetectionTime: result.timestamp,
          error: null,
        }));

        return result;
      } else {
        // 検出失敗時の処理
        setPitchState(prev => ({
          ...prev,
          clarity: clarity,
          lastDetectionTime: Date.now(),
        }));

        return null;
      }

    } catch (error) {
      const errorMessage = handlePitchDetectionError(error as Error);
      setPitchState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      console.error('❌ Step 4: 音程検出失敗:', error);
      return null;
    }
  }, [pitchState.isDetecting, pitchState.config]);

  /**
   * 音程検出開始
   */
  const startDetection = useCallback(() => {
    try {
      console.log('🎵 Step 4: 音程検出開始');

      // 検出器が初期化されていない場合は初期化
      if (!pitchState.isInitialized) {
        const initialized = initializePitchDetector();
        if (!initialized) {
          return;
        }
      }

      // 検出開始
      setPitchState(prev => ({
        ...prev,
        isDetecting: true,
        error: null,
      }));

      // 統計リセット
      detectionStatsRef.current = {
        totalDetections: 0,
        successfulDetections: 0,
        averageClarity: 0,
        averagePitch: 0,
        detectionRate: 0,
        lastUpdate: Date.now(),
      };

      previousPitchRef.current = null;
      latestResultRef.current = null;

      console.log('✅ Step 4: 音程検出開始完了');

    } catch (error) {
      const errorMessage = handlePitchDetectionError(error as Error);
      setPitchState(prev => ({
        ...prev,
        error: errorMessage,
        isDetecting: false,
      }));
      console.error('❌ Step 4: 音程検出開始失敗:', error);
    }
  }, [pitchState.isInitialized, initializePitchDetector]);

  /**
   * 音程検出停止
   */
  const stopDetection = useCallback(() => {
    try {
      console.log('🛑 Step 4: 音程検出停止');

      setPitchState(prev => ({
        ...prev,
        isDetecting: false,
        currentPitch: null,
        currentNote: null,
        currentCents: null,
        clarity: 0,
        octave: null,
        frequency: null,
        error: null,
      }));

      previousPitchRef.current = null;

      console.log('✅ Step 4: 音程検出停止完了');

    } catch (error) {
      console.error('❌ Step 4: 音程検出停止エラー:', error);
      
      // エラー時も強制的に状態リセット
      setPitchState(prev => ({
        ...prev,
        isDetecting: false,
        error: '音程検出停止中にエラーが発生しました。',
      }));
    }
  }, []);

  /**
   * 最新の音程検出結果を取得
   */
  const getPitchResult = useCallback((): PitchDetectionResult | null => {
    return latestResultRef.current;
  }, []);

  /**
   * 検出統計を取得
   */
  const getDetectionStats = useCallback((): PitchDetectionStats => {
    return { ...detectionStatsRef.current };
  }, []);

  /**
   * 検出品質評価を取得
   */
  const getDetectionQuality = useCallback(() => {
    return evaluatePitchDetectionQuality(detectionStatsRef.current);
  }, []);

  /**
   * デバッグ情報を取得
   */
  const getDebugInfo = useCallback(() => {
    return getPitchDetectionDebugInfo(latestResultRef.current, pitchState.config);
  }, [pitchState.config]);

  /**
   * フォーマット済み表示データを取得
   */
  const getFormattedDisplay = useCallback(() => {
    if (!latestResultRef.current) return null;
    return formatPitchDisplay(latestResultRef.current);
  }, []);

  /**
   * 設定更新
   */
  const updateConfig = useCallback((config: Partial<PitchDetectionConfig>) => {
    setPitchState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...config,
      },
    }));

    // 検出器の再初期化が必要な場合
    if (config.bufferSize && config.bufferSize !== pitchState.config.bufferSize) {
      setPitchState(prev => ({
        ...prev,
        isInitialized: false,
      }));
      
      if (pitchState.isDetecting) {
        // 検出中の場合は再初期化
        setTimeout(() => {
          initializePitchDetector();
        }, 0);
      }
    }

    console.log('🔧 Pitch検出設定更新:', config);
  }, [pitchState.config, pitchState.isDetecting, initializePitchDetector]);

  /**
   * 統計リセット
   */
  const resetStats = useCallback(() => {
    detectionStatsRef.current = {
      totalDetections: 0,
      successfulDetections: 0,
      averageClarity: 0,
      averagePitch: 0,
      detectionRate: 0,
      lastUpdate: Date.now(),
    };
    
    previousPitchRef.current = null;
    latestResultRef.current = null;

    console.log('🔄 Step 4: 検出統計リセット');
  }, []);

  /**
   * エラーリセット
   */
  const resetError = useCallback(() => {
    setPitchState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (pitchState.isDetecting) {
        stopDetection();
      }
    };
  }, []);

  return {
    pitchState,
    startDetection,
    stopDetection,
    detectPitch,
    getPitchResult,
    getDetectionStats,
    getDetectionQuality,
    getDebugInfo,
    getFormattedDisplay,
    updateConfig,
    resetStats,
    resetError,
  };
};
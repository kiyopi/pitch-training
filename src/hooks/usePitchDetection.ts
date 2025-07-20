'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from 'pitchy';

/**
 * 音程検出フック - Step 3-1: Pitchy統合音程検出
 * 
 * 機能:
 * - 高精度音程検出（McLeod Pitch Method）
 * - 動的オクターブ補正システム
 * - DOM直接操作での60FPS更新
 * - 周波数安定化・スムージング
 */

interface PitchDetectionState {
  frequency: number | null;
  clarity: number;
  isDetecting: boolean;
  error: string | null;
}

interface PitchDetectionConfig {
  clarityThreshold: number;
  minFrequency: number;
  maxFrequency: number;
  volumeThreshold: number;
  targetFrequencies?: number[];
}

interface PitchDetectionHook {
  pitchState: PitchDetectionState;
  startDetection: (audioContext: AudioContext, analyser: AnalyserNode) => void;
  stopDetection: () => void;
  updateDetection: () => { frequency: number | null; clarity: number };
  resetError: () => void;
  setTargetFrequencies: (frequencies: number[]) => void;
}

// デフォルト設定
const defaultConfig: PitchDetectionConfig = {
  clarityThreshold: 0.15,
  minFrequency: 80,
  maxFrequency: 1200,
  volumeThreshold: 3,
  targetFrequencies: [
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25 // C4-C5 ドレミファソラシド
  ]
};

// 動的オクターブ補正関数
const applyDynamicOctaveCorrection = (frequency: number, targetFrequencies: number[]): number => {
  if (!targetFrequencies || targetFrequencies.length === 0) return frequency;
  
  let closestTarget = targetFrequencies[0];
  let minDistance = Math.abs(frequency - closestTarget);
  
  // すべてのターゲット周波数とその倍音・分音を考慮
  for (const target of targetFrequencies) {
    const candidates = [target, target * 2, target / 2, target * 4, target / 4];
    
    for (const candidate of candidates) {
      const distance = Math.abs(frequency - candidate);
      if (distance < minDistance) {
        minDistance = distance;
        closestTarget = candidate;
      }
    }
  }
  
  // 55%閾値システム: 補正距離が元の周波数の55%以下の場合のみ補正適用
  const correctionRatio = minDistance / frequency;
  return correctionRatio <= 0.55 ? closestTarget : frequency;
};

export const usePitchDetection = (config: Partial<PitchDetectionConfig> = {}): PitchDetectionHook => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [pitchState, setPitchState] = useState<PitchDetectionState>({
    frequency: null,
    clarity: 0,
    isDetecting: false,
    error: null,
  });

  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // 周波数安定化用
  const frequencyHistoryRef = useRef<number[]>([]);
  const stableFrequencyRef = useRef<number | null>(null);
  const noSoundCounterRef = useRef<number>(0);
  const targetFrequenciesRef = useRef<number[]>(finalConfig.targetFrequencies || []);

  // 検出開始
  const startDetection = useCallback((audioContext: AudioContext, analyser: AnalyserNode) => {
    try {
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // PitchDetectorインスタンス初期化
      if (!pitchDetectorRef.current) {
        pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
        pitchDetectorRef.current.clarityThreshold = finalConfig.clarityThreshold;
        pitchDetectorRef.current.maxInputAmplitude = 1.0;
      }
      
      setPitchState(prev => ({
        ...prev,
        isDetecting: true,
        error: null,
      }));
      
      console.log('✅ 音程検出開始');
    } catch (error) {
      console.error('❌ 音程検出開始エラー:', error);
      setPitchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '音程検出の開始に失敗しました',
      }));
    }
  }, [finalConfig.clarityThreshold]);

  // 検出停止
  const stopDetection = useCallback(() => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // リセット
      frequencyHistoryRef.current = [];
      stableFrequencyRef.current = null;
      noSoundCounterRef.current = 0;
      
      setPitchState(prev => ({
        ...prev,
        isDetecting: false,
        frequency: null,
        clarity: 0,
      }));
      
      console.log('🛑 音程検出停止');
    } catch (error) {
      console.error('❌ 音程検出停止エラー:', error);
    }
  }, []);

  // リアルタイム音程検出（DOM直接操作用）
  const updateDetection = useCallback((): { frequency: number | null; clarity: number } => {
    if (!analyserRef.current || !pitchDetectorRef.current || !pitchState.isDetecting) {
      return { frequency: null, clarity: 0 };
    }

    try {
      const analyser = analyserRef.current;
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      
      // 🎵 周波数検出用：32bit配列取得
      const timeDomainData = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(timeDomainData);
      
      // 🔊 音量計算（ノイズゲート用）
      const byteTimeDomainData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(byteTimeDomainData);
      
      let sum = 0;
      let maxAmplitude = 0;
      
      for (let i = 0; i < byteTimeDomainData.length; i++) {
        const sample = (byteTimeDomainData[i] - 128) / 128;
        sum += sample * sample;
        maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
      }
      
      const rms = Math.sqrt(sum / byteTimeDomainData.length);
      const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
      
      let detectedFreq: number | null = null;
      let detectedClarity = 0;
      
      // 音量閾値チェック
      if (calculatedVolume > finalConfig.volumeThreshold) {
        // Pitchy周波数検出
        const [freq, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);
        
        // 有効範囲・明瞭度チェック
        if (clarity > finalConfig.clarityThreshold && 
            freq > finalConfig.minFrequency && 
            freq < finalConfig.maxFrequency) {
          
          // 動的オクターブ補正適用
          const correctedFreq = applyDynamicOctaveCorrection(freq, targetFrequenciesRef.current);
          const roundedFreq = Math.round(correctedFreq * 10) / 10;
          
          // 周波数履歴に追加（最大10個）
          frequencyHistoryRef.current.push(roundedFreq);
          if (frequencyHistoryRef.current.length > 10) {
            frequencyHistoryRef.current.shift();
          }
          
          // 安定化処理（5個以上の履歴がある場合）
          if (frequencyHistoryRef.current.length >= 5) {
            const avgFreq = frequencyHistoryRef.current.slice(-5).reduce((sum, f) => sum + f, 0) / 5;
            
            // 急激な変化を抑制（±20%以内）
            if (stableFrequencyRef.current !== null && Math.abs(roundedFreq - avgFreq) / avgFreq > 0.2) {
              detectedFreq = avgFreq + (roundedFreq - avgFreq) * 0.3;
              detectedFreq = Math.round(detectedFreq * 10) / 10;
              detectedClarity = clarity;
            } else {
              // オクターブジャンプ検出
              if (stableFrequencyRef.current !== null) {
                const octaveRatio = roundedFreq / stableFrequencyRef.current;
                if (octaveRatio > 1.8 || octaveRatio < 0.55) {
                  // オクターブジャンプを無視
                  detectedFreq = stableFrequencyRef.current;
                  detectedClarity = clarity;
                } else {
                  // 正常な変化
                  stableFrequencyRef.current = roundedFreq;
                  detectedFreq = roundedFreq;
                  detectedClarity = clarity;
                }
              } else {
                // 初回
                stableFrequencyRef.current = roundedFreq;
                detectedFreq = roundedFreq;
                detectedClarity = clarity;
              }
            }
          }
        }
        
        noSoundCounterRef.current = 0;
      } else {
        // 無音状態のカウンター増加
        noSoundCounterRef.current++;
        
        // 15フレーム以上無音が続いた場合、履歴クリア
        if (noSoundCounterRef.current > 15) {
          frequencyHistoryRef.current = [];
          stableFrequencyRef.current = null;
        }
      }
      
      // 状態更新（React state使用）
      setPitchState(prev => ({
        ...prev,
        frequency: detectedFreq,
        clarity: detectedClarity,
      }));
      
      return { frequency: detectedFreq, clarity: detectedClarity };
      
    } catch (error) {
      console.warn('音程検出エラー:', error);
      return { frequency: null, clarity: 0 };
    }
  }, [pitchState.isDetecting, finalConfig.volumeThreshold, finalConfig.clarityThreshold, finalConfig.minFrequency, finalConfig.maxFrequency]);

  // ターゲット周波数設定
  const setTargetFrequencies = useCallback((frequencies: number[]) => {
    targetFrequenciesRef.current = frequencies;
    console.log('🎯 ターゲット周波数更新:', frequencies);
  }, []);

  // エラーリセット
  const resetError = useCallback(() => {
    setPitchState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    pitchState,
    startDetection,
    stopDetection,
    updateDetection,
    resetError,
    setTargetFrequencies,
  };
};
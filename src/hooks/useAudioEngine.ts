'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';

// AudioSystemPhase enum (from /test/separated-audio/)
export enum AudioSystemPhase {
  IDLE = 'idle',
  TRANSITIONING = 'transitioning',
  BASE_TONE_PHASE = 'base_tone',
  SCORING_PHASE = 'scoring',
  ERROR_STATE = 'error'
}

// AudioEngine設定インターフェース
export interface AudioEngineConfig {
  mode: 'random' | 'continuous' | 'chromatic';
  enablePitchDetection: boolean;
  enableHarmonicCorrection: boolean;
  baseNotes: string[];
}

// AudioEngine戻り値インターフェース
export interface AudioEngineReturn {
  // 基音再生機能
  playBaseTone: (note: string) => Promise<void>;
  stopBaseTone: () => void;
  
  // マイクロフォン機能
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  
  // リアルタイム検出
  currentPitch: number | null;
  correctedPitch: number | null;
  confidence: number;
  
  // 状態管理
  isPlaying: boolean;
  phase: AudioSystemPhase;
  error: string | null;
}

// デフォルト設定
const DEFAULT_CONFIG: AudioEngineConfig = {
  mode: 'random',
  enablePitchDetection: false,
  enableHarmonicCorrection: false,
  baseNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']
};

/**
 * useAudioEngine Hook
 * 音響システム統合Hook - Tone.js + Pitchy + 倍音補正の統合管理
 */
export function useAudioEngine(config: Partial<AudioEngineConfig> = {}): AudioEngineReturn {
  // 設定の統合
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 基本状態管理
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<AudioSystemPhase>(AudioSystemPhase.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // リアルタイム検出データ
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [correctedPitch, setCorrectedPitch] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  
  // Ref管理
  const configRef = useRef(mergedConfig);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const isInitializedRef = useRef(false);
  // TODO: 次のStepで統合予定
  // const audioContextRef = useRef<AudioContext | null>(null);
  // const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  
  // 設定更新
  configRef.current = mergedConfig;
  
  // エラー処理
  const handleError = useCallback((errorMessage: string) => {
    console.error('[useAudioEngine]', errorMessage);
    setError(errorMessage);
    setPhase(AudioSystemPhase.ERROR_STATE);
  }, []);
  
  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
    if (phase === AudioSystemPhase.ERROR_STATE) {
      setPhase(AudioSystemPhase.IDLE);
    }
  }, [phase]);

  // Tone.js Salamander Piano初期化
  const initializeSampler = useCallback(async (): Promise<void> => {
    try {
      if (isInitializedRef.current && samplerRef.current) {
        return; // 既に初期化済み
      }

      console.log('[useAudioEngine] Salamander Piano初期化開始');
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        console.log('[useAudioEngine] AudioContext開始完了');
      }

      // Salamander Piano設定（既存3モード互換）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,         // 既存統一設定
        volume: 6             // iPhone最適化設定
      }).toDestination();

      // 音源読み込み待機
      console.log('[useAudioEngine] ピアノ音源読み込み中...');
      await Tone.loaded();
      console.log('[useAudioEngine] ピアノ音源読み込み完了');

      samplerRef.current = sampler;
      isInitializedRef.current = true;
      
    } catch (err) {
      handleError(`Salamander Piano初期化エラー: ${err}`);
      throw err;
    }
  }, [handleError]);

  // sampler破棄・リソース解放
  const disposeSampler = useCallback(() => {
    try {
      if (samplerRef.current) {
        console.log('[useAudioEngine] sampler破棄');
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      isInitializedRef.current = false;
    } catch (err) {
      console.error('[useAudioEngine] sampler破棄エラー:', err);
    }
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      disposeSampler();
    };
  }, [disposeSampler]);
  
  // 基音再生機能（Tone.js統合実装）
  const playBaseTone = useCallback(async (note: string): Promise<void> => {
    try {
      clearError();
      setPhase(AudioSystemPhase.BASE_TONE_PHASE);
      setIsPlaying(true);
      
      console.log(`[useAudioEngine] playBaseTone: ${note} (mode: ${configRef.current.mode})`);
      
      // Salamander Piano初期化
      await initializeSampler();
      
      if (!samplerRef.current) {
        throw new Error('Sampler初期化失敗');
      }
      
      // 既存3モード互換の再生パラメータ
      console.log(`[useAudioEngine] ♪ 再生中: ${note}`);
      samplerRef.current.triggerAttack(note, undefined, 0.8); // velocity統一
      
      // 再生時間は呼び出し側で制御（既存モード互換）
      // ここでは再生開始のみ実行
      
    } catch (err) {
      setIsPlaying(false);
      setPhase(AudioSystemPhase.IDLE);
      handleError(`基音再生エラー: ${err}`);
    }
  }, [clearError, handleError, initializeSampler]);
  
  // 基音停止機能
  const stopBaseTone = useCallback(() => {
    try {
      console.log('[useAudioEngine] stopBaseTone');
      
      if (samplerRef.current) {
        // 全ての音を停止
        samplerRef.current.releaseAll();
        console.log('[useAudioEngine] 🔇 再生停止');
      }
      
      setIsPlaying(false);
      setPhase(AudioSystemPhase.IDLE);
      
    } catch (err) {
      handleError(`基音停止エラー: ${err}`);
    }
  }, [handleError]);
  
  // 音程検出開始（プレースホルダー実装）
  const startPitchDetection = useCallback(async (): Promise<void> => {
    try {
      if (!configRef.current.enablePitchDetection) {
        console.log('[useAudioEngine] 音程検出無効（設定により）');
        return;
      }
      
      clearError();
      setPhase(AudioSystemPhase.SCORING_PHASE);
      
      // TODO: Pitchy + Web Audio API統合実装
      console.log('[useAudioEngine] startPitchDetection (プレースホルダー)');
      
      // プレースホルダー: 検出データ模擬
      setCurrentPitch(440); // A4
      setCorrectedPitch(440);
      setConfidence(0.95);
      
    } catch (err) {
      handleError(`音程検出開始エラー: ${err}`);
    }
  }, [clearError, handleError]);
  
  // 音程検出停止
  const stopPitchDetection = useCallback(() => {
    try {
      console.log('[useAudioEngine] stopPitchDetection');
      
      // TODO: Web Audio API・Pitchy停止実装
      setCurrentPitch(null);
      setCorrectedPitch(null);
      setConfidence(0);
      
      if (phase === AudioSystemPhase.SCORING_PHASE) {
        setPhase(AudioSystemPhase.IDLE);
      }
      
    } catch (err) {
      handleError(`音程検出停止エラー: ${err}`);
    }
  }, [phase, handleError]);
  
  return {
    // 基音再生機能
    playBaseTone,
    stopBaseTone,
    
    // マイクロフォン機能
    startPitchDetection,
    stopPitchDetection,
    
    // リアルタイム検出
    currentPitch,
    correctedPitch,
    confidence,
    
    // 状態管理
    isPlaying,
    phase,
    error
  };
}
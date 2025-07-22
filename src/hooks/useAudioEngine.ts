'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';

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
  
  // Pitchy統合用のRef
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isMicInitialized, setIsMicInitialized] = useState(false);
  
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

  // マイクロフォン・Web Audio API初期化
  const initializeMicrophone = useCallback(async (): Promise<void> => {
    try {
      if (!configRef.current.enablePitchDetection) {
        console.log('[useAudioEngine] 音程検出無効（設定により）');
        return;
      }

      if (isMicInitialized && audioContextRef.current && pitchDetectorRef.current) {
        console.log('[useAudioEngine] マイクロフォン既に初期化済み');
        return;
      }

      console.log('[useAudioEngine] マイクロフォンシステム初期化開始');

      // マイクロフォンアクセス要求（/test/separated-audio/設定準拠）
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Web Audio API AudioContext作成
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      
      // MediaStreamSourceNode作成
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // AnalyserNode作成・設定
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 16384; // /test/separated-audio/準拠
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // 接続
      source.connect(analyserRef.current);
      
      // PitchDetector初期化（McLeod Pitch Method）
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
      pitchDetectorRef.current.clarityThreshold = 0.15; // /test/separated-audio/準拠

      setIsMicInitialized(true);
      console.log('[useAudioEngine] マイクロフォンシステム初期化完了');

    } catch (err) {
      handleError(`マイクロフォン初期化エラー: ${err}`);
      throw err;
    }
  }, [handleError, isMicInitialized]);

  // マイクロフォン・リソース解放
  const disposeMicrophone = useCallback(() => {
    try {
      console.log('[useAudioEngine] マイクロフォンリソース解放');
      
      // animationFrame停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // MediaStream停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // AudioContext閉じる
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Ref・State初期化
      analyserRef.current = null;
      pitchDetectorRef.current = null;
      setIsMicInitialized(false);
      setCurrentPitch(null);
      setConfidence(0);
      
    } catch (err) {
      console.error('[useAudioEngine] マイクロフォンリソース解放エラー:', err);
    }
  }, []);

  // リアルタイム音程検出ループ
  const startPitchDetectionLoop = useCallback(() => {
    if (!audioContextRef.current || !analyserRef.current || !pitchDetectorRef.current) {
      console.error('[useAudioEngine] 音程検出: 必要なコンポーネント未初期化');
      return;
    }

    const analyser = analyserRef.current;
    const detector = pitchDetectorRef.current;
    const float32Array = new Float32Array(analyser.fftSize);

    const detectPitch = () => {
      if (!configRef.current.enablePitchDetection || phase !== AudioSystemPhase.SCORING_PHASE) {
        // 停止条件
        animationFrameRef.current = null;
        return;
      }

      // 周波数データ取得
      analyser.getFloatTimeDomainData(float32Array);
      
      // Pitchy McLeod Pitch Method実行（/test/separated-audio/準拠）
      const [frequency, clarity] = detector.findPitch(float32Array, audioContextRef.current!.sampleRate);
      
      if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
        // 人間音域チェック（130-1047Hz, C3-C6）
        if (frequency >= 130.81 && frequency <= 1046.50) {
          setCurrentPitch(frequency);
          setConfidence(clarity);
          
          // TODO: Step 1-1D で倍音補正統合予定
          setCorrectedPitch(frequency); // 現在はそのまま
        }
      } else {
        setCurrentPitch(null);
        setConfidence(0);
        setCorrectedPitch(null);
      }

      // 次のフレーム予約（60fps目標）
      animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    // 検出ループ開始
    detectPitch();
  }, [phase]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      disposeSampler();
      disposeMicrophone();
    };
  }, [disposeSampler, disposeMicrophone]);
  
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
  
  // 音程検出開始（Pitchy統合実装）
  const startPitchDetection = useCallback(async (): Promise<void> => {
    try {
      if (!configRef.current.enablePitchDetection) {
        console.log('[useAudioEngine] 音程検出無効（設定により）');
        return;
      }
      
      clearError();
      console.log('[useAudioEngine] 音程検出開始');
      
      // マイクロフォン初期化
      await initializeMicrophone();
      
      // フェーズ移行・検出開始
      setPhase(AudioSystemPhase.SCORING_PHASE);
      startPitchDetectionLoop();
      
      console.log('[useAudioEngine] リアルタイム音程検出開始');
      
    } catch (err) {
      setPhase(AudioSystemPhase.IDLE);
      handleError(`音程検出開始エラー: ${err}`);
    }
  }, [clearError, handleError, initializeMicrophone, startPitchDetectionLoop]);
  
  // 音程検出停止
  const stopPitchDetection = useCallback(() => {
    try {
      console.log('[useAudioEngine] 音程検出停止');
      
      // animationFrame停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // 検出データクリア
      setCurrentPitch(null);
      setCorrectedPitch(null);
      setConfidence(0);
      
      // フェーズリセット
      if (phase === AudioSystemPhase.SCORING_PHASE) {
        setPhase(AudioSystemPhase.IDLE);
      }
      
      // マイクロフォンリソース解放（オプション - 呼び出し側で制御可能）
      // disposeMicrophone(); // 必要に応じてコメントアウト解除
      
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
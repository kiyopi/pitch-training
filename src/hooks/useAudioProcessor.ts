'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';

/**
 * AudioContext・音声処理基盤フック - Step 2
 * 
 * 目的: 音程検出に最適化されたAudioContext音声処理パイプライン
 * 機能: リアルタイム音声データ処理、既存Tone.jsとの統合
 * 対象: Step 1マイクロフォン基盤の拡張
 */

// 音声処理状態インターフェース
interface AudioProcessorState {
  isProcessing: boolean;
  sampleRate: number;
  bufferSize: number;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  error: string | null;
  isInitialized: boolean;
}

// 音声処理データ
interface ProcessedAudioData {
  timedomainData: Float32Array | null;
  frequencyData: Uint8Array | null;
  rms: number;
  peak: number;
  timestamp: number;
}

// AudioProcessorフックインターフェース
interface AudioProcessorHook {
  processorState: AudioProcessorState;
  startProcessing: (stream: MediaStream) => Promise<boolean>;
  stopProcessing: () => void;
  getProcessedData: () => ProcessedAudioData;
  resetError: () => void;
}

// AudioContext最適化設定
const AUDIO_CONTEXT_CONFIG = {
  sampleRate: 44100,          // 高品質音程検出
  latencyHint: 'interactive' as AudioContextLatencyCategory, // リアルタイム応答
};

// AnalyserNode設定
const ANALYSER_CONFIG = {
  fftSize: 2048,              // 周波数分解能（音程検出に最適）
  smoothingTimeConstant: 0.8, // ノイズ平滑化
  minDecibels: -90,           // 最小デシベル
  maxDecibels: -10,           // 最大デシベル
};

export const useAudioProcessor = (): AudioProcessorHook => {
  const [processorState, setProcessorState] = useState<AudioProcessorState>({
    isProcessing: false,
    sampleRate: 44100,
    bufferSize: 1024,
    audioContext: null,
    analyserNode: null,
    error: null,
    isInitialized: false,
  });

  // AudioContext・AnalyserNode・MediaStreamSourceのRef
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);

  // 音声データバッファ
  const timedomainDataRef = useRef<Float32Array | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);

  /**
   * AudioContextエラーハンドリング
   */
  const handleAudioContextError = (error: Error): string => {
    console.error('AudioContext error:', error);
    
    switch (error.name) {
      case 'NotAllowedError':
        return 'オーディオ処理が許可されていません。';
      case 'InvalidStateError':
        return 'AudioContextの状態が無効です。';
      case 'NotSupportedError':
        return 'このブラウザではAudioContextがサポートされていません。';
      default:
        return `AudioContext エラー: ${error.message}`;
    }
  };

  /**
   * AudioContextとAnalyserNodeの初期化
   */
  const initializeAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      // 既存のTone.js AudioContextとの統合確認
      let audioContext: AudioContext;
      
      if (Tone.context.state === 'running') {
        // Tone.jsが既に動作中の場合は、そのcontextを使用
        audioContext = Tone.context.rawContext as AudioContext;
        console.log('🔗 Tone.js AudioContext統合');
      } else {
        // 新しいAudioContextを作成
        audioContext = new AudioContext(AUDIO_CONTEXT_CONFIG);
        console.log('🆕 新規AudioContext作成');
      }

      // AudioContextの開始
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // AnalyserNodeの作成と設定
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = ANALYSER_CONFIG.fftSize;
      analyserNode.smoothingTimeConstant = ANALYSER_CONFIG.smoothingTimeConstant;
      analyserNode.minDecibels = ANALYSER_CONFIG.minDecibels;
      analyserNode.maxDecibels = ANALYSER_CONFIG.maxDecibels;

      // データバッファの初期化
      timedomainDataRef.current = new Float32Array(analyserNode.fftSize);
      frequencyDataRef.current = new Uint8Array(analyserNode.frequencyBinCount);

      // Refに保存
      audioContextRef.current = audioContext;
      analyserNodeRef.current = analyserNode;

      setProcessorState(prev => ({
        ...prev,
        audioContext: audioContext,
        analyserNode: analyserNode,
        sampleRate: audioContext.sampleRate,
        isInitialized: true,
        error: null,
      }));

      console.log('✅ AudioContext・AnalyserNode初期化完了');
      console.log('📊 サンプリングレート:', audioContext.sampleRate);
      console.log('📊 FFTサイズ:', analyserNode.fftSize);
      
      return true;
    } catch (error) {
      const errorMessage = handleAudioContextError(error as Error);
      setProcessorState(prev => ({
        ...prev,
        error: errorMessage,
        isInitialized: false,
      }));
      return false;
    }
  }, []);

  /**
   * リアルタイム音声データ処理
   */
  const processAudioData = useCallback(() => {
    if (!analyserNodeRef.current || !timedomainDataRef.current || !frequencyDataRef.current || isStoppingRef.current) {
      return;
    }

    try {
      const analyser = analyserNodeRef.current;
      const timedomainData = timedomainDataRef.current;
      const frequencyData = frequencyDataRef.current;

      // 時間領域データ取得（音程検出用）
      analyser.getFloatTimeDomainData(timedomainData);
      
      // 周波数領域データ取得（音量・スペクトラム用）
      analyser.getByteFrequencyData(frequencyData);

      // 次のフレームをスケジュール
      animationFrameRef.current = requestAnimationFrame(processAudioData);
    } catch (error) {
      console.error('音声データ処理エラー:', error);
    }
  }, []);

  /**
   * 音声処理開始
   */
  const startProcessing = useCallback(async (stream: MediaStream): Promise<boolean> => {
    try {
      // 既に処理中の場合は無視
      if (processorState.isProcessing || isStoppingRef.current) {
        console.log('⚠️ 既に音声処理中または停止処理中');
        return false;
      }

      // AudioContextが初期化されていない場合は初期化
      if (!processorState.isInitialized) {
        const initialized = await initializeAudioContext();
        if (!initialized) {
          return false;
        }
      }

      if (!audioContextRef.current || !analyserNodeRef.current) {
        throw new Error('AudioContextまたはAnalyserNodeが初期化されていません');
      }

      console.log('🎵 音声処理開始');

      // MediaStreamSourceの作成
      const mediaStreamSource = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = mediaStreamSource;

      // MediaStreamSource → AnalyserNode の接続
      mediaStreamSource.connect(analyserNodeRef.current);

      // 処理状態の更新
      setProcessorState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
      }));

      // リアルタイム音声データ処理開始
      processAudioData();

      console.log('✅ 音声処理パイプライン開始完了');
      return true;

    } catch (error) {
      const errorMessage = handleAudioContextError(error as Error);
      setProcessorState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
      }));
      console.error('❌ 音声処理開始失敗:', error);
      return false;
    }
  }, [processorState.isProcessing, processorState.isInitialized, initializeAudioContext, processAudioData]);

  /**
   * 音声処理停止
   */
  const stopProcessing = useCallback(() => {
    try {
      isStoppingRef.current = true;
      console.log('🛑 音声処理停止開始');

      // アニメーションフレーム停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // MediaStreamSource切断
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
      }

      // 状態リセット
      setProcessorState(prev => ({
        ...prev,
        isProcessing: false,
        error: null,
      }));

      console.log('✅ 音声処理完全停止');

    } catch (error) {
      console.error('❌ 音声処理停止エラー:', error);
      
      // エラー時も強制的に状態リセット
      setProcessorState(prev => ({
        ...prev,
        isProcessing: false,
        error: '音声処理停止中にエラーが発生しました。',
      }));
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  /**
   * 処理済み音声データの取得
   */
  const getProcessedData = useCallback((): ProcessedAudioData => {
    if (!timedomainDataRef.current || !frequencyDataRef.current) {
      return {
        timedomainData: null,
        frequencyData: null,
        rms: 0,
        peak: 0,
        timestamp: Date.now(),
      };
    }

    const timedomainData = timedomainDataRef.current;
    const frequencyData = frequencyDataRef.current;

    // RMS（Root Mean Square）計算
    let rms = 0;
    let peak = 0;
    
    for (let i = 0; i < timedomainData.length; i++) {
      const value = Math.abs(timedomainData[i]);
      rms += value * value;
      peak = Math.max(peak, value);
    }
    
    rms = Math.sqrt(rms / timedomainData.length);

    return {
      timedomainData: new Float32Array(timedomainData),
      frequencyData: new Uint8Array(frequencyData),
      rms,
      peak,
      timestamp: Date.now(),
    };
  }, []);

  /**
   * エラーリセット
   */
  const resetError = useCallback(() => {
    setProcessorState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
      }
      // AudioContextは他のシステムでも使用される可能性があるため、ここではcloseしない
    };
  }, []);

  return {
    processorState,
    startProcessing,
    stopProcessing,
    getProcessedData,
    resetError,
  };
};
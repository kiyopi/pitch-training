'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * マイクロフォン管理フック - Step 1: 基本許可・音声取得
 * 
 * 目的: 最小限のマイクロフォン制御機能を提供
 * 対象: 基本的なON/OFF制御、許可状態管理、エラーハンドリング
 * 
 * HYBRID許可システム完全除去済み
 * iPhone Safari対応済み
 * 停止ボタン機能統合済み
 */

interface MicrophoneState {
  isRecording: boolean;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt';
  audioLevel: number;
  isInitialized: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
}

interface MicrophoneManager {
  microphoneState: MicrophoneState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  resetError: () => void;
}

export const useMicrophoneManager = (): MicrophoneManager => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>({
    isRecording: false,
    error: null,
    permission: 'prompt',
    audioLevel: 0,
    isInitialized: false,
    audioContext: null,
    analyser: null,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const isStoppingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * 音程検出最適化制約
   * autoGainControl、echoCancellation、noiseSuppression を無効化
   */
  const getOptimalConstraints = (): MediaStreamConstraints => ({
    audio: {
      autoGainControl: false,      // 最重要: 自動ゲイン制御無効
      echoCancellation: false,     // 最重要: エコーキャンセル無効
      noiseSuppression: false,     // 最重要: ノイズ抑制無効
      sampleRate: 44100,           // 高品質サンプリング
      channelCount: 1,             // モノラル
    }
  });

  /**
   * 音声レベル監視機能（プロトタイプ準拠の高精度計算）
   * テストページの実装知見を適用
   */
  const startAudioLevelMonitoring = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const previousVolumeRef = { current: 0 }; // 音量スムージング用
    
    const updateAudioLevel = () => {
      if (!analyser || isStoppingRef.current) return;
      
      // 🔊 音量検出用：8bit配列取得（プロトタイプ準拠）
      const byteTimeDomainData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(byteTimeDomainData);
      
      // 🔊 音量計算（プロトタイプ準拠）
      let sum = 0;
      let maxAmplitude = 0;
      
      for (let i = 0; i < byteTimeDomainData.length; i++) {
        const sample = (byteTimeDomainData[i] - 128) / 128;
        sum += sample * sample;
        maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
      }
      
      const rms = Math.sqrt(sum / byteTimeDomainData.length);
      const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
      
      // 音量スケーリング調整: iPhone対応のため感度を最適化 /3.5 に調整
      const rawVolumePercent = Math.min(Math.max(calculatedVolume / 3.5 * 100, 0), 100);
      
      // ノイズフロア除去: 5%以下はノイズとして0%表示
      const noiseThreshold = 5;
      const volumePercent = rawVolumePercent > noiseThreshold ? rawVolumePercent : 0;
      
      // 音量スムージング（より反応を良く）
      const smoothingFactor = 0.2;
      const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
      previousVolumeRef.current = smoothedVolume;
      
      // 0-100の範囲でstate更新（正規化なし）
      // テストページの実装に合わせて、直接パーセンテージを提供
      setMicrophoneState(prev => ({
        ...prev,
        audioLevel: smoothedVolume
      }));
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  }, []);

  /**
   * マイクロフォンエラーハンドリング
   * 詳細なエラーメッセージを提供
   */
  const handleMicrophoneError = (error: Error): string => {
    console.error('Microphone error:', error);
    
    switch (error.name) {
      case 'NotAllowedError':
        return 'マイクロフォンへのアクセスが拒否されました。ブラウザの設定を確認してください。';
      case 'NotFoundError':
        return 'マイクロフォンが見つかりません。デバイスを確認してください。';
      case 'NotReadableError':
        return 'マイクロフォンが他のアプリで使用中です。他のアプリを終了してください。';
      case 'OverconstrainedError':
        return 'マイクロフォンの設定に問題があります。';
      case 'SecurityError':
        return 'セキュリティ制約によりマイクロフォンにアクセスできません。';
      default:
        return `マイクロフォンエラー: ${error.message}`;
    }
  };

  /**
   * マイクロフォン録音開始
   * 許可取得と音声ストリーム開始
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // 既に録音中の場合は無視
      if (microphoneState.isRecording || isStoppingRef.current) {
        console.log('⚠️ 既に録音中または停止処理中');
        return false;
      }

      // セキュリティコンテキスト確認
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicrophoneState(prev => ({
          ...prev,
          error: 'このブラウザではマイクロフォンがサポートされていません。'
        }));
        return false;
      }

      // HTTPS確認
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setMicrophoneState(prev => ({
          ...prev,
          error: 'HTTPSまたはlocalhostでのみマイクロフォンが使用できます。'
        }));
        return false;
      }

      console.log('🎙️ マイクロフォン許可要求開始');

      // 最適化制約でマイクロフォンアクセス要求
      const constraints = getOptimalConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // ストリーム取得成功
      streamRef.current = stream;
      
      // AudioContextとAnalyserNodeを設定
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // 音声ストリームをAnalyserNodeに接続
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setMicrophoneState(prev => ({
        ...prev,
        isRecording: true,
        isInitialized: true,
        permission: 'granted',
        error: null,
        audioLevel: 0,
        audioContext: audioContextRef.current,
        analyser: analyserRef.current,
      }));

      // 音声レベル監視開始
      startAudioLevelMonitoring();

      console.log('✅ マイクロフォン許可・音声取得成功');
      console.log('📊 音声制約:', constraints.audio);

      return true;

    } catch (error) {
      const errorMessage = handleMicrophoneError(error as Error);
      
      setMicrophoneState(prev => ({
        ...prev,
        isRecording: false,
        permission: 'denied',
        error: errorMessage,
        audioLevel: 0,
        audioContext: null,
        analyser: null,
      }));

      console.error('❌ マイクロフォン開始失敗:', error);
      return false;
    }
  }, [microphoneState.isRecording]);

  /**
   * マイクロフォン録音停止
   * 停止ボタン機能統合済み
   */
  const stopRecording = useCallback(() => {
    try {
      isStoppingRef.current = true;
      console.log('🛑 マイクロフォン停止開始');

      // アニメーションフレーム停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // AudioContext停止
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // AnalyserNode停止
      analyserRef.current = null;

      // MediaStream停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;  // iPhone Safari確実停止
        });
        streamRef.current = null;
        console.log('✅ MediaStream停止完了');
      }

      // 状態リセット
      setMicrophoneState(prev => ({
        ...prev,
        isRecording: false,
        isInitialized: false,
        audioLevel: 0,
        error: null,
        audioContext: null,
        analyser: null,
      }));

      console.log('✅ マイクロフォン完全停止');

    } catch (error) {
      console.error('❌ マイクロフォン停止エラー:', error);
      
      // エラー時も強制的にリソースクリーンアップ
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;

      // エラー時も強制的に状態リセット
      setMicrophoneState(prev => ({
        ...prev,
        isRecording: false,
        isInitialized: false,
        audioLevel: 0,
        error: '停止処理中にエラーが発生しました。',
        audioContext: null,
        analyser: null,
      }));
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  /**
   * エラーリセット
   * ユーザーがエラーを確認後にリセット
   */
  const resetError = useCallback(() => {
    setMicrophoneState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    microphoneState,
    startRecording,
    stopRecording,
    resetError,
  };
};
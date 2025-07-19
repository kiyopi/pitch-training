'use client';

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";

export default function PitchyCleanPage() {
  // 基本状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<{raw: number, calculated: number, normalized: number}>({raw: 0, calculated: 0, normalized: 0});
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // ノイズリダクションフィルター refs
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // 音量スムージング用
  const previousVolumeRef = useRef<number>(0);

  // 音量検出ループ（プロトタイプ準拠）
  const detectVolume = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    
    // プロトタイプ準拠：8bit時間域データ取得
    const byteTimeDomainData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(byteTimeDomainData);
    
    // プロトタイプ準拠：音量計算（128中心の8bitデータ）
    let sum = 0;
    let maxAmplitude = 0;
    
    for (let i = 0; i < byteTimeDomainData.length; i++) {
      const sample = (byteTimeDomainData[i] - 128) / 128;
      sum += sample * sample;
      maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
    }
    
    const rms = Math.sqrt(sum / byteTimeDomainData.length);
    // プロトタイプ準拠：スケーリング（200倍・100倍）
    const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
    
    // プロトタイプ準拠：音量正規化（25で割って100倍して0-100%に調整）
    const volumePercent = Math.min(Math.max(calculatedVolume / 25 * 100, 0), 100);
    
    // 音量スムージング（リアルタイム性重視で軽減）
    const smoothingFactor = 0.1; // 0.3 → 0.1
    const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
    previousVolumeRef.current = smoothedVolume;
    
    // デバッグ情報更新
    setDebugInfo({
      raw: Math.max(rms * 200, maxAmplitude * 100),
      calculated: calculatedVolume,
      normalized: volumePercent
    });
    
    setVolume(smoothedVolume);
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectVolume);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // マイクロフォン許可取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      streamRef.current = stream;
      
      // AudioContext作成
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const analyser = audioContext.createAnalyser();
      
      // プロトタイプ準拠：AnalyserNode設定
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // プロトタイプ準拠：ノイズリダクションフィルター作成
      // ハイパスフィルター: 40Hz以下の低周波ノイズカット
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime(40, audioContext.currentTime);
      highPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // ローパスフィルター: 4kHz以上の高周波ノイズカット
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
      lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      // ノッチフィルター: 60Hz電源ノイズカット
      const notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
      
      // ゲインノード: 音量調整（1.2倍）
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(1.2, audioContext.currentTime);
      
      // MediaStreamSource作成
      const source = audioContext.createMediaStreamSource(stream);
      
      // プロトタイプ準拠：ノイズリダクションチェーン接続
      // マイク → ハイパス → ローパス → ノッチ → ゲイン → アナライザー
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(notchFilter);
      notchFilter.connect(gainNode);
      gainNode.connect(analyser);
      
      // Refs保存
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      highPassFilterRef.current = highPassFilter;
      lowPassFilterRef.current = lowPassFilter;
      notchFilterRef.current = notchFilter;
      gainNodeRef.current = gainNode;
      
      setIsRecording(true);
      
      // 音量検出開始
      detectVolume();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
    }
  }, [detectVolume]);

  const stopRecording = useCallback(() => {
    try {
      // アニメーションフレーム停止
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Refs初期化
      analyserRef.current = null;
      highPassFilterRef.current = null;
      lowPassFilterRef.current = null;
      notchFilterRef.current = null;
      gainNodeRef.current = null;
      previousVolumeRef.current = 0;
      
      setIsRecording(false);
      setVolume(0);
      
    } catch (err) {
      console.error('❌ 停止エラー:', err);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎯</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Pitchy Clean Test
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            クリーン実装テスト：基本マイク + 音量表示
          </p>
          <div className="inline-block bg-gradient-to-r from-blue-100 to-green-100 text-blue-700 px-6 py-3 rounded-full text-lg font-bold">
            Step 1: マイク + ノイズリダクション + 音量安定化
          </div>
        </div>

        {/* 音量表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🎤 音量表示テスト</h3>
          
          <div className="space-y-6">
            {/* 音量値表示 */}
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                {volume.toFixed(1)}
              </div>
              <div className="text-xl text-gray-600 font-semibold">
                Volume
              </div>
            </div>
            
            {/* 音量バー：デバッグ用常時表示 */}
            <div className="flex justify-center items-center space-x-4">
              <span className="text-gray-600">音量:</span>
              <div className="w-48 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(Math.min(volume, 100), 0)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12">
                {Math.round(Math.max(Math.min(volume, 100), 0))}%
              </span>
            </div>
            
            {/* デバッグ情報表示 */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-bold text-gray-700 mb-2">🔍 デバッグ情報</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold">生音量:</span>
                  <br />{debugInfo.raw.toFixed(3)}
                </div>
                <div>
                  <span className="font-semibold">計算値:</span>
                  <br />{debugInfo.calculated.toFixed(3)}
                </div>
                <div>
                  <span className="font-semibold">正規化:</span>
                  <br />{debugInfo.normalized.toFixed(3)}%
                </div>
                <div>
                  <span className="font-semibold">表示音量:</span>
                  <br />{volume.toFixed(3)}
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                <span className="font-semibold">バー幅:</span> {Math.max(Math.min(volume, 100), 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <span className="font-bold text-red-800">エラー発生</span>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* 制御ボタン */}
        <div className="mb-12 space-y-6">
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <Mic className="w-8 h-8" />
                  <span>🎤 マイク開始</span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <MicOff className="w-8 h-8" />
                  <span>🛑 マイク停止</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 1: マイク + ノイズリダクション + 音量安定化</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>マイクロフォン許可取得</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>ノイズリダクション：ハイパス(40Hz) → ローパス(4kHz) → ノッチ(60Hz)</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>音量計算：8bit時間域データ + 128中心正規化 + RMS×200スケーリング</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>音量調整：正規化係数25、スムージング0.1、条件付き表示</span>
            </div>
          </div>
        </div>

        {/* 戻るボタン */}
        <Link 
          href="/test/accuracy-test-v2"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>accuracy-test-v2に戻る</span>
        </Link>
      </div>
    </div>
  );
}
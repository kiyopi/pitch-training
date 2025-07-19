'use client';

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";

export default function PitchyCleanPage() {
  // 基本状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    
    // プロトタイプ準拠：音量正規化（30で割って100倍して0-100%に）
    const volumePercent = Math.min(Math.max(calculatedVolume / 30 * 100, 0), 100);
    
    setVolume(volumePercent);
    
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
      
      // MediaStreamSource作成・接続
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Refs保存
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
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
            Step 1: 基本マイク + プロトタイプ準拠音量計算
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
            
            {/* 音量バー */}
            <div className="flex justify-center items-center space-x-4">
              <span className="text-gray-600">音量:</span>
              <div className="w-48 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(volume, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12">
                {Math.round(Math.min(volume, 100))}%
              </span>
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 1: 基本マイク + 音量表示</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>マイクロフォン許可取得</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>プロトタイプ準拠：FFTサイズ2048、スムージング0.8</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>プロトタイプ準拠：8bit時間域データ、128中心正規化</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>プロトタイプ準拠：RMS×200、maxAmplitude×100スケーリング</span>
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
'use client';

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import { PitchDetector } from "pitchy";

export default function PitchyCleanPage() {
  // 基本状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<{raw: number, calculated: number, normalized: number}>({raw: 0, calculated: 0, normalized: 0});
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  
  // ノイズリダクションフィルター refs
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // 音量スムージング用
  const previousVolumeRef = useRef<number>(0);

  // 音量検出＋周波数検出統合ループ
  const detectAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    
    // 🎵 周波数検出用：Float32配列取得
    const timeDomainData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    // 🔊 音量検出用：8bit配列取得
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
    const volumePercent = Math.min(Math.max(calculatedVolume / 25 * 100, 0), 100);
    
    // 音量スムージング
    const smoothingFactor = 0.1;
    const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
    previousVolumeRef.current = smoothedVolume;
    
    // 🎵 周波数検出（Pitchy）
    let detectedFreq: number | null = null;
    let detectedClarity = 0;
    
    try {
      if (calculatedVolume > 1) { // 音量閾値チェック
        // PitchDetectorインスタンス初期化（初回のみ）
        if (!pitchDetectorRef.current) {
          pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
          pitchDetectorRef.current.clarityThreshold = 0.1;
          pitchDetectorRef.current.maxInputAmplitude = 1.0;
        }
        
        // Pitchy周波数検出
        const [freq, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);
        
        // 有効範囲チェック（80-1200Hz、明瞭度0.1以上）
        if (clarity > 0.1 && freq > 80 && freq < 1200) {
          detectedFreq = Math.round(freq * 10) / 10;
          detectedClarity = clarity;
        }
      }
    } catch (error) {
      console.warn('Pitchy detection error:', error);
    }
    
    // 状態更新
    setVolume(smoothedVolume);
    setFrequency(detectedFreq);
    setClarity(detectedClarity);
    setDebugInfo({
      raw: Math.max(rms * 200, maxAmplitude * 100),
      calculated: calculatedVolume,
      normalized: volumePercent
    });
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectAudio);
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
      
      // MediaRecorder作成（react-audio-visualize用）
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // AudioContext作成
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const analyser = audioContext.createAnalyser();
      
      // AnalyserNode設定
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // ノイズリダクションフィルター作成
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime(40, audioContext.currentTime);
      highPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
      lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      const notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
      
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(1.2, audioContext.currentTime);
      
      // MediaStreamSource作成・接続
      const source = audioContext.createMediaStreamSource(stream);
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
      console.log('✅ マイク開始完了、音量＋周波数検出開始');
      
      // 統合検出開始
      detectAudio();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
    }
  }, [detectAudio]);

  const stopRecording = useCallback(() => {
    try {
      // アニメーションフレーム停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // MediaRecorder停止
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
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
      pitchDetectorRef.current = null;
      previousVolumeRef.current = 0;
      
      setIsRecording(false);
      setVolume(0);
      setFrequency(null);
      setClarity(0);
      
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
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            音量＋周波数検出テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            react-audio-visualize + Pitchy統合実装
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            Step 2: ライブラリベース音量表示 + 高精度周波数検出
          </div>
        </div>

        {/* 音量＋周波数表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🎵 音量＋周波数検出</h3>
          
          <div className="space-y-8">
            {/* ライブ音量表示（react-audio-visualize） */}
            {isRecording && mediaRecorderRef.current && (
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">📊 ライブ音量可視化</h4>
                <div className="flex justify-center">
                  <LiveAudioVisualizer
                    mediaRecorder={mediaRecorderRef.current}
                    width={300}
                    height={100}
                    barWidth={2}
                    gap={1}
                    barColor="#10b981"
                  />
                </div>
              </div>
            )}
            
            {/* 周波数表示 */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">🎵 周波数検出</h4>
              {frequency ? (
                <div className="space-y-2">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {frequency.toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-600 font-semibold">Hz</div>
                  <div className="text-sm text-gray-500">
                    明瞭度: {(clarity * 100).toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-lg">
                  🎤 音声を検出中...
                </div>
              )}
            </div>
            
            {/* 数値音量表示 */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">🔊 音量レベル</h4>
              <div className="text-3xl font-bold text-green-600">
                {volume.toFixed(1)}%
              </div>
            </div>
            
            {/* デバッグ情報 */}
            {isRecording && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-bold text-gray-700 mb-2">🔍 デバッグ情報</h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold">周波数:</span>
                    <br />{frequency ? `${frequency.toFixed(1)} Hz` : 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">明瞭度:</span>
                    <br />{(clarity * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-semibold">音量:</span>
                    <br />{volume.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-semibold">生音量:</span>
                    <br />{debugInfo.raw.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 2: ライブラリベース音量表示 + 高精度周波数検出</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>マイクロフォン許可取得 + MediaRecorder作成</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>react-audio-visualize: プロ品質のライブ音量可視化</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Pitchy: McLeod Pitch Method による高精度周波数検出</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>統合処理: 音量＋周波数＋明瞭度のリアルタイム更新</span>
            </div>
          </div>
          
          {/* 技術情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🔧 使用ライブラリ</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div>✅ react-audio-visualize: ライブ音量可視化（2,700+プロジェクト使用）</div>
              <div>✅ Pitchy: McLeod Pitch Method（最高精度周波数検出）</div>
              <div>✅ Web Audio API: ノイズリダクション＋リアルタイム処理</div>
              <div>✅ TypeScript: 型安全な実装</div>
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
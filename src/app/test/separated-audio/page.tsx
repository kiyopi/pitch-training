'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import { createFilterChain, NoiseFilterConfig, DEFAULT_NOISE_FILTER_CONFIG } from '@/utils/audioFilters';

// 基音定義（Tone.js Salamander Piano用）
const BASE_TONES = [
  { note: "ド", frequency: 261.63, tonejs: "C4" },
  { note: "ド♯", frequency: 277.18, tonejs: "C#4" },
  { note: "レ", frequency: 293.66, tonejs: "D4" },
  { note: "レ♯", frequency: 311.13, tonejs: "D#4" },
  { note: "ミ", frequency: 329.63, tonejs: "E4" },
  { note: "ファ", frequency: 349.23, tonejs: "F4" },
  { note: "ファ♯", frequency: 369.99, tonejs: "F#4" },
  { note: "ソ", frequency: 392.00, tonejs: "G4" },
  { note: "ソ♯", frequency: 415.30, tonejs: "G#4" },
  { note: "ラ", frequency: 440.00, tonejs: "A4" },
];

export default function SeparatedAudioTestPage() {
  // DOM直接操作用のRef（Direct DOM Audio System基盤）
  const systemStatusRef = useRef<HTMLDivElement>(null);
  const phaseIndicatorRef = useRef<HTMLDivElement>(null);
  const testDisplayRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // 基音再生システム用のRef・State
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentBaseTone, setCurrentBaseTone] = useState<typeof BASE_TONES[0] | null>(null);

  // マイクロフォンシステム用のRef・State
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isMicInitialized, setIsMicInitialized] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);

  // ノイズリダクション用のRef・State
  const filterChainRef = useRef<{
    highpassFilter: BiquadFilterNode;
    lowpassFilter: BiquadFilterNode;
    notchFilter: BiquadFilterNode;
    gainNode: GainNode;
    connectChain: (sourceNode: AudioNode) => AudioNode;
  } | null>(null);
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [filterConfig, setFilterConfig] = useState<NoiseFilterConfig>(DEFAULT_NOISE_FILTER_CONFIG);

  // DOM直接更新関数（音声なし・表示のみ）
  const updateSystemStatus = useCallback((message: string, color: string = 'blue') => {
    if (systemStatusRef.current) {
      systemStatusRef.current.innerHTML = `<span class="text-${color}-600 font-bold">${message}</span>`;
    }
  }, []);

  const updatePhaseIndicator = useCallback((step: number, stepName: string) => {
    if (phaseIndicatorRef.current) {
      phaseIndicatorRef.current.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
          <span class="text-green-600 font-semibold">Step ${step}: ${stepName}</span>
        </div>
      `;
    }
  }, []);

  const updateTestDisplay = useCallback((content: string, bgColor: string = 'gray-50') => {
    if (testDisplayRef.current) {
      testDisplayRef.current.innerHTML = `
        <div class="p-4 bg-${bgColor} rounded-lg border border-gray-200">
          <div class="text-gray-700">${content}</div>
        </div>
      `;
    }
  }, []);

  const addLog = useCallback((message: string) => {
    console.log(message);
    if (logRef.current) {
      const timestamp = new Date().toLocaleTimeString('ja-JP');
      const logEntry = document.createElement('div');
      logEntry.className = 'text-sm text-gray-600 font-mono';
      logEntry.textContent = `${timestamp}: ${message}`;
      logRef.current.insertBefore(logEntry, logRef.current.firstChild);
      
      // 最大5つまでのログを保持
      while (logRef.current.children.length > 5) {
        logRef.current.removeChild(logRef.current.lastChild!);
      }
    }
  }, []);

  // 基音再生システム初期化
  const initializeBaseToneSystem = useCallback(async () => {
    try {
      addLog('🎹 基音再生システム初期化開始');
      updateSystemStatus('基音システム初期化中...', 'yellow');

      // Tone.js Salamander Piano Sampler作成（iPhone音量最適化）
      samplerRef.current = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
          "D#4": "Ds4.mp3", 
          "F#4": "Fs4.mp3",
          "A4": "A4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6 // iPhone音量最適化
      }).toDestination();

      // サンプルローディング待機
      await Tone.loaded();
      setIsInitialized(true);
      updateSystemStatus('基音システム準備完了', 'green');
      addLog('✅ 基音再生システム初期化完了');
      
    } catch (error) {
      addLog(`❌ 基音システム初期化失敗: ${error}`);
      updateSystemStatus('基音システム初期化失敗', 'red');
    }
  }, [addLog, updateSystemStatus]);

  // ランダム基音選択
  const selectRandomBaseTone = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * BASE_TONES.length);
    const selectedTone = BASE_TONES[randomIndex];
    setCurrentBaseTone(selectedTone);
    addLog(`🎲 ランダム基音選択: ${selectedTone.note} (${selectedTone.frequency.toFixed(2)} Hz)`);
    return selectedTone;
  }, [addLog]);

  // 基音再生実行
  const playBaseTone = useCallback(async () => {
    if (!samplerRef.current || !isInitialized) {
      addLog('❌ 基音システム未初期化');
      return;
    }

    try {
      // AudioContext再開（iPhone対応）
      if (Tone.context.state !== 'running') {
        await Tone.start();
        addLog('🔊 AudioContext開始（iPhone対応）');
      }

      const tone = currentBaseTone || selectRandomBaseTone();
      addLog(`🎵 基音再生開始: ${tone.note}`);
      updateSystemStatus(`基音再生中: ${tone.note}`, 'blue');
      
      // DOM直接操作で基音情報表示
      if (testDisplayRef.current) {
        testDisplayRef.current.innerHTML = `
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-800 mb-2">${tone.note}</div>
              <div class="text-lg text-blue-600">${tone.frequency.toFixed(2)} Hz</div>
              <div class="text-sm text-blue-500 mt-1">Salamander Piano - iPhone最適化済み</div>
            </div>
          </div>
        `;
      }

      // 基音再生（2秒間）
      samplerRef.current.triggerAttack(tone.tonejs, undefined, 0.8);
      
      setTimeout(() => {
        if (samplerRef.current) {
          samplerRef.current.triggerRelease(tone.tonejs);
          updateSystemStatus('基音再生完了', 'green');
          addLog(`✅ 基音再生完了: ${tone.note}`);
        }
      }, 2000);

    } catch (error) {
      addLog(`❌ 基音再生エラー: ${error}`);
      updateSystemStatus('基音再生失敗', 'red');
    }
  }, [samplerRef, isInitialized, currentBaseTone, selectRandomBaseTone, addLog, updateSystemStatus]);

  // DOM更新テスト関数（音声なし）
  const handleDomTest = useCallback(() => {
    addLog('🔬 DOM直接操作テスト開始');
    updateSystemStatus('DOM更新テスト実行中...', 'yellow');
    updateTestDisplay('DOM直接操作テスト実行中...', 'yellow-50');
    
    setTimeout(() => {
      updateSystemStatus('DOM更新テスト完了', 'green');
      updatePhaseIndicator(2, 'DOM直接操作基盤構築完了');
      updateTestDisplay('✅ DOM直接操作システム正常動作確認', 'green-50');
      addLog('✅ DOM直接操作テスト完了');
    }, 1000);
  }, [updateSystemStatus, updatePhaseIndicator, updateTestDisplay, addLog]);

  // マイクロフォンシステム初期化
  const initializeMicrophoneSystem = useCallback(async () => {
    try {
      addLog('🎤 マイクロフォンシステム初期化開始');
      updateSystemStatus('マイクシステム初期化中...', 'yellow');

      // マイクロフォンアクセス要求
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });

      // AudioContext・Analyser設定
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      // ノイズリダクションフィルターチェーン作成
      filterChainRef.current = createFilterChain(audioContextRef.current, filterConfig);
      addLog(`🔧 ノイズフィルターチェーン作成完了`);

      // 音声ストリーム接続（ノイズフィルター適用）
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      if (isFilterEnabled && filterChainRef.current) {
        // フィルター適用: source → filterChain → analyser
        const filteredOutput = filterChainRef.current.connectChain(source);
        filteredOutput.connect(analyserRef.current);
        addLog(`✅ ノイズフィルター適用済み`);
      } else {
        // フィルターなし: source → analyser
        source.connect(analyserRef.current);
        addLog(`⚪ ノイズフィルター無効`);
      }

      // Pitchy音程検出器初期化
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
      pitchDetectorRef.current.clarityThreshold = 0.15;

      setIsMicInitialized(true);
      updateSystemStatus('マイクシステム準備完了', 'green');
      addLog('✅ マイクロフォンシステム初期化完了');

    } catch (error) {
      addLog(`❌ マイクシステム初期化失敗: ${error}`);
      updateSystemStatus('マイクシステム初期化失敗', 'red');
    }
  }, [addLog, updateSystemStatus]);

  // リアルタイム周波数検出
  const detectFrequency = useCallback(() => {
    if (!analyserRef.current || !pitchDetectorRef.current) {
      return null;
    }

    const timeDomainData = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(timeDomainData);

    const sampleRate = 44100;
    const [frequency, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);

    // 有効範囲・明瞭度チェック
    if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
      return Math.round(frequency * 10) / 10;
    }

    return null;
  }, []);

  // 周波数検出ループ開始
  const startFrequencyDetection = useCallback(() => {
    if (!isMicInitialized) {
      addLog('❌ マイクシステム未初期化');
      return;
    }

    addLog('🎵 周波数検出開始');
    updateSystemStatus('周波数検出中...', 'blue');

    const detectLoop = () => {
      const frequency = detectFrequency();
      setCurrentFrequency(frequency);

      // DOM直接操作で周波数表示更新（固定高さ対応）
      if (testDisplayRef.current) {
        if (frequency) {
          testDisplayRef.current.innerHTML = `
            <div class="w-full h-full flex items-center justify-center">
              <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                <div class="text-center">
                  <div class="text-3xl font-bold text-green-800 mb-2">${frequency.toFixed(1)} Hz</div>
                  <div class="text-lg text-green-600">音程検出中</div>
                  <div class="text-sm text-green-500 mt-1">Pitchy - McLeod Pitch Method</div>
                </div>
              </div>
            </div>
          `;
        } else {
          testDisplayRef.current.innerHTML = `
            <div class="w-full h-full flex items-center justify-center">
              <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="text-center">
                  <div class="text-xl text-gray-500">🎤 音声を発声してください</div>
                  <div class="text-sm text-gray-400 mt-1">周波数検出待機中...</div>
                </div>
              </div>
            </div>
          `;
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };

    detectLoop();
  }, [isMicInitialized, detectFrequency, addLog, updateSystemStatus]);

  // 周波数検出停止
  const stopFrequencyDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setCurrentFrequency(null);
    updateSystemStatus('周波数検出停止', 'gray');
    addLog('⏹️ 周波数検出停止');

    if (testDisplayRef.current) {
      testDisplayRef.current.innerHTML = `
        <div class="w-full h-full flex items-center justify-center">
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-gray-500">周波数検出停止</div>
          </div>
        </div>
      `;
    }
  }, [updateSystemStatus, addLog]);

  // ノイズフィルター切り替え
  const toggleNoiseFilter = useCallback(() => {
    const newFilterState = !isFilterEnabled;
    setIsFilterEnabled(newFilterState);
    
    if (newFilterState) {
      addLog('🔧 ノイズフィルター有効化');
      updateSystemStatus('フィルター有効化 - 再初期化が必要', 'yellow');
    } else {
      addLog('⚪ ノイズフィルター無効化');
      updateSystemStatus('フィルター無効化 - 再初期化が必要', 'yellow');
    }
  }, [isFilterEnabled, addLog, updateSystemStatus]);

  // マイクロフォンシステム停止
  const stopMicrophoneSystem = useCallback(() => {
    stopFrequencyDetection();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false; // iPhone Safari確実停止
      });
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    pitchDetectorRef.current = null;
    filterChainRef.current = null;
    setIsMicInitialized(false);
    updateSystemStatus('マイクシステム停止', 'gray');
    addLog('🔇 マイクロフォンシステム停止');
  }, [stopFrequencyDetection, updateSystemStatus, addLog]);

  // コンポーネント初期化
  useEffect(() => {
    addLog('🚀 分離型音声システム開始');
    updateSystemStatus('システム初期化中...', 'yellow');
  }, [addLog, updateSystemStatus]);

  // コンポーネント終了時のクリーンアップ
  useEffect(() => {
    return () => {
      stopMicrophoneSystem();
    };
  }, [stopMicrophoneSystem]);
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg">
        🧪 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full max-w-2xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="inline-block mb-4">
            <span className="text-6xl">🔬</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            分離型音声システムテスト
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Direct DOM Audio System - Phase 1 基盤構築
          </p>
          <div className="inline-block bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
            Step 1-5: ノイズリダクション統合（3段階フィルタリング）
          </div>
        </div>

        {/* システム状態表示（DOM直接操作） */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 システム状態</h3>
          <div ref={systemStatusRef} className="text-lg">
            <span className="text-gray-500">DOM直接操作基盤構築中...</span>
          </div>
        </div>

        {/* フェーズ表示（DOM直接操作対応） */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 実装フェーズ</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-green-600 font-semibold">Step 1-1: React基本構造作成</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-green-600 font-semibold">Step 1-2: DOM直接操作基盤構築完了</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-green-600 font-semibold">Step 1-3: 基音再生システム単体完了</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span className="text-green-600 font-semibold">Step 1-4: マイクロフォンシステム単体完了</span>
            </div>
            <div ref={phaseIndicatorRef}>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">⚡</span>
                <span className="text-orange-600 font-semibold">Step 1-5: ノイズリダクション統合（実装中）</span>
              </div>
            </div>
          </div>
        </div>

        {/* マイクロフォンテスト表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 マイクロフォンテスト結果</h3>
          <div ref={testDisplayRef} className="text-lg h-32 flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-500">マイクロフォンテスト待機中...</div>
              </div>
            </div>
          </div>
        </div>

        {/* ノイズフィルター制御パネル */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔧 ノイズリダクション設定</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">フィルター状態:</span>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isFilterEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {isFilterEnabled ? '🟢 有効' : '⚪ 無効'}
                </span>
                <button
                  onClick={toggleNoiseFilter}
                  disabled={isMicInitialized}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isFilterEnabled ? 'フィルター無効化' : 'フィルター有効化'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-bold text-blue-700">ハイパス</div>
                <div className="text-blue-600">{filterConfig.highpass.frequency}Hz</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-bold text-green-700">ローパス</div>
                <div className="text-green-600">{filterConfig.lowpass.frequency}Hz</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-bold text-purple-700">ノッチ</div>
                <div className="text-purple-600">{filterConfig.notch.frequency}Hz</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500">
              {isMicInitialized ? "フィルター設定を変更するには、マイクシステムを停止・再初期化してください" : "フィルター設定を変更後、マイクシステムを初期化してください"}
            </div>
          </div>
        </div>

        {/* マイクロフォンシステム制御ボタン */}
        <div className="mb-6 space-y-4">
          <div className="flex space-x-4 justify-center">
            <button
              onClick={initializeMicrophoneSystem}
              disabled={isMicInitialized}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              🎤 マイクシステム初期化
            </button>
            <button
              onClick={startFrequencyDetection}
              disabled={!isMicInitialized}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              🎵 周波数検出開始
            </button>
            <button
              onClick={stopFrequencyDetection}
              disabled={!isMicInitialized}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              ⏹️ 検出停止
            </button>
            <button
              onClick={stopMicrophoneSystem}
              disabled={!isMicInitialized}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              🔇 システム停止
            </button>
          </div>
          <div className="text-center text-sm text-gray-600">
            {!isMicInitialized && "まずマイクシステムを初期化してください"}
            {isMicInitialized && `マイクシステム準備完了 - ノイズフィルター${isFilterEnabled ? '有効' : '無効'}`}
          </div>
        </div>

        {/* 基音再生システム制御ボタン */}
        <div className="mb-6 space-y-4">
          <div className="text-center text-sm font-bold text-gray-700 mb-3">基音再生システム（参考用）</div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={initializeBaseToneSystem}
              disabled={isInitialized}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎹 基音初期化
            </button>
            <button
              onClick={playBaseTone}
              disabled={!isInitialized}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎲 基音再生
            </button>
          </div>
          <div className="text-center text-xs text-gray-500">
            基音システムは分離確認用 - Step 1-4の主目的はマイクロフォンシステム単体テスト
          </div>
        </div>

        {/* DOM操作テストボタン */}
        <div className="mb-8">
          <button
            onClick={handleDomTest}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md"
          >
            🔬 DOM直接操作テスト
          </button>
        </div>

        {/* 設計コンセプト */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Direct DOM Audio System</h3>
          <div className="text-left space-y-2 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>完全分離設計: 基音再生時はマイクOFF</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>DOM直接操作: React state経由せず60FPS更新</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>iPhone最適化: 音声システム競合回避</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>段階的実装: 問題の早期特定・解決</span>
            </div>
          </div>
        </div>

        {/* ログ表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📝 実行ログ</h3>
          <div ref={logRef} className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
            <div className="text-sm text-gray-500">ログが表示されます...</div>
          </div>
        </div>

        {/* 戻るボタン */}
        <Link 
          href="/test/hybrid-audio"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ハイブリッドオーディオテストに戻る</span>
        </Link>
      </div>
    </div>
  );
}
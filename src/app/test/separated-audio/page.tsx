'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';
import { createFilterChain, NoiseFilterConfig, DEFAULT_NOISE_FILTER_CONFIG } from '@/utils/audioFilters';

// Step A: 基盤システム改修 - AudioSystemPhase enum
enum AudioSystemPhase {
  IDLE = 'idle',
  TRANSITIONING = 'transitioning',
  BASE_TONE_PHASE = 'base_tone',
  SCORING_PHASE = 'scoring',
  ERROR_STATE = 'error'
}

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

// Step B-2: ユーザー音声倍音補正システム - 設定インターフェース
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // 基音探索範囲（±50Hz）
  harmonicRatios: number[];          // 倍音比率 [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;       // 確信度しきい値（0.8）
  stabilityBuffer: number[];         // 安定化バッファ（過去5フレーム）
  vocalRange: { min: number, max: number }; // 人間音域（130-1047Hz, C3-C6）
}

// デフォルト倍音補正設定
const DEFAULT_HARMONIC_CONFIG: HarmonicCorrectionConfig = {
  fundamentalSearchRange: 50,
  harmonicRatios: [0.5, 2.0, 3.0, 4.0],  // 1/2倍音, 2倍音, 3倍音, 4倍音
  confidenceThreshold: 0.8,
  stabilityBuffer: [],
  vocalRange: { min: 130.81, max: 1046.50 } // C3-C6
};

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

  // Step A: システム状態管理
  const [currentPhase, setCurrentPhase] = useState<AudioSystemPhase>(AudioSystemPhase.IDLE);

  // Step B-2: 倍音補正システム用のRef・State
  const harmonicCorrectionConfigRef = useRef<HarmonicCorrectionConfig>(DEFAULT_HARMONIC_CONFIG);
  const previousFrequencyRef = useRef<number | null>(null);
  const frequencyHistoryRef = useRef<number[]>([]);  // Step 3.1: 履歴バッファ管理
  const stabilityBufferRef = useRef<number[]>([]);

  // デバッグパネル用state
  const [debugInfo, setDebugInfo] = useState({
    rawFrequency: 0,
    correctedFrequency: 0,
    musicalScore: 0,
    appliedCorrection: 'なし',
    frequencyHistory: [] as number[],
    noteDetection: '未検出'
  });

  // 周波数→音程名変換関数
  const frequencyToNote = useCallback((freq: number): string => {
    if (freq < 80 || freq > 1200) return '範囲外';
    
    const A4 = 440;
    const semitonesFromA4 = Math.round(12 * Math.log2(freq / A4));
    const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    const noteIndex = (semitonesFromA4 + 9) % 12;
    
    return `${noteNames[noteIndex]}${octave}`;
  }, []);

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

  // 人間音声テスト機能
  const playTestVoice = useCallback(async (filename: string) => {
    try {
      addLog(`🎤 人間音声テスト開始: ${filename}`);
      updateSystemStatus('人間音声テスト中...', 'blue');
      
      // マイクロフォンが初期化されていることを確認
      if (!isMicInitialized) {
        addLog('❌ マイクロフォンシステムが初期化されていません');
        updateSystemStatus('マイクロフォン初期化が必要', 'red');
        return;
      }
      
      // Web Audio APIを使用して音声ファイルを再生しながら解析
      const audioContext = audioContextRef.current;
      if (!audioContext) {
        addLog('❌ AudioContextが利用できません');
        return;
      }
      
      // 音声ファイルを読み込み
      const response = await fetch(`/audio/test/${filename}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 音声を再生
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      
      addLog(`✅ 人間音声テスト実行中: ${filename}`);
      updateSystemStatus(`人間音声解析中: ${filename}`, 'green');
      
      // 再生終了後
      source.onended = () => {
        addLog(`✅ 人間音声テスト完了: ${filename}`);
        updateSystemStatus('人間音声テスト完了', 'green');
      };
      
    } catch (error) {
      addLog(`❌ 人間音声テストエラー: ${error}`);
      updateSystemStatus('人間音声テスト失敗', 'red');
    }
  }, [isMicInitialized, addLog, updateSystemStatus]);

  // Step A: iPhone検出関数
  const isIOSSafari = useCallback((): boolean => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent);
  }, []);

  // Step A: デバイス最適化フィルター設定取得
  const getOptimizedFilterConfig = useCallback((): NoiseFilterConfig => {
    if (isIOSSafari()) {
      addLog('📱 iPhone軽量化フィルター設定適用');
      return {
        highpass: { frequency: 80, Q: 0.5, gain: 0 },      // 軽量化
        lowpass: { frequency: 6000, Q: 0.5, gain: 0 },     // 軽量化  
        notch: { frequency: 60, Q: 3, gain: -15 }          // 大幅軽量化
      };
    }
    addLog('🖥️ PC/Android標準フィルター設定適用');
    return DEFAULT_NOISE_FILTER_CONFIG;
  }, [isIOSSafari, addLog]);

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

      // Step A: 最適化されたノイズリダクションフィルターチェーン作成
      const optimizedConfig = getOptimizedFilterConfig();
      filterChainRef.current = createFilterChain(audioContextRef.current, optimizedConfig);
      addLog(`🔧 ノイズフィルターチェーン作成完了（${isIOSSafari() ? 'iPhone最適化' : '標準'}設定）`);

      // 音声ストリーム接続（ノイズフィルター適用）
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      if (isFilterEnabled && filterChainRef.current) {
        // フィルター適用: source → filterChain → analyser
        const filteredOutput = filterChainRef.current.connectChain(source);
        filteredOutput.connect(analyserRef.current);
        addLog(`✅ ノイズフィルター適用済み（${isIOSSafari() ? 'iPhone軽量化' : '標準'}）`);
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

  // Step B-2: 音楽的妥当性評価 - ドレミファソラシド近似度
  const calculateMusicalScore = useCallback((frequency: number): number => {
    const C4 = 261.63; // Middle C
    
    // 最も近い半音階音名への距離を計算
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
    
    // 半音階に近いほど高スコア（±50セント以内で最高点）
    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
  }, []);

  // Step B-2: 基音安定化システム - 履歴バッファによる異常値除去
  const stabilizeFrequency = useCallback((
    currentFreq: number,
    historyBuffer: number[],
    stabilityThreshold: number = 0.1
  ): number => {
    // 履歴バッファに追加（最大5フレーム保持）
    historyBuffer.push(currentFreq);
    if (historyBuffer.length > 5) historyBuffer.shift();
    
    // 中央値ベースの安定化（外れ値除去）
    const sorted = [...historyBuffer].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // 急激な変化を抑制（段階的変化）
    const maxChange = median * stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange 
      ? median + Math.sign(currentFreq - median) * maxChange
      : currentFreq;
      
    return stabilized;
  }, []);

  // Step B-2: 動的オクターブ補正アルゴリズム - 倍音誤検出回避（iPhone最適化版）
  const correctHarmonicFrequency = useCallback((
    detectedFreq: number,
    previousFreq: number | null,
    config: HarmonicCorrectionConfig
  ): { frequency: number, confidence: number, correction: string } => {
    // Step 3.2: iPhone最適化 - 配列再利用によるメモリ効率化
    const fundamentalCandidates = [
      detectedFreq,                    // そのまま（基音の可能性）
      detectedFreq / 2.0,             // 1オクターブ下（2倍音 → 基音）
      detectedFreq / 3.0,             // 3倍音 → 基音
      detectedFreq / 4.0,             // 4倍音 → 基音
      detectedFreq * 2.0,             // 1オクターブ上（低く歌った場合）
    ];
    
    // iPhone最適化: 事前フィルタリングで計算負荷軽減
    let bestFreq = detectedFreq;
    let bestScore = -1;
    let bestCorrectionType = 'なし';
    
    for (let i = 0; i < fundamentalCandidates.length; i++) {
      const freq = fundamentalCandidates[i];
      
      // 高速フィルタリング: 人間音域外は即座に除外（処理負荷軽減）
      if (freq < config.vocalRange.min || freq > config.vocalRange.max) {
        continue;
      }
      
      // 軽量化評価（iPhone最適化）
      const vocalRangeScore = 1.0; // 既に音域内確認済み
      
      const continuityScore = previousFreq 
        ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
        : 0.5;
      
      // 音楽的妥当性評価（軽量版）
      const musicalScore = calculateMusicalScore(freq);
      
      const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
      
      // 最高スコア更新（map/reduce不使用でメモリ効率化）
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestFreq = freq;
        
        // 補正種別の判定
        if (i === 0) bestCorrectionType = 'なし';
        else if (i === 1) bestCorrectionType = '1/2倍音補正';
        else if (i === 2) bestCorrectionType = '1/3倍音補正';
        else if (i === 3) bestCorrectionType = '1/4倍音補正';
        else if (i === 4) bestCorrectionType = '2倍音補正';
      }
    }
      
    return { 
      frequency: bestFreq, 
      confidence: bestScore, 
      correction: bestCorrectionType 
    };
  }, [calculateMusicalScore]);

  // リアルタイム周波数検出
  const detectFrequency = useCallback(() => {
    if (!analyserRef.current || !pitchDetectorRef.current) {
      return null;
    }

    const timeDomainData = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(timeDomainData);

    const sampleRate = 44100;
    const [frequency, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);

    // Step B-2: 倍音補正システム統合 - 単純フィルターを高度な倍音補正に置換
    if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
      // 1. 動的オクターブ補正（倍音誤検出回避）
      const correctionResult = correctHarmonicFrequency(
        frequency, 
        previousFrequencyRef.current, 
        DEFAULT_HARMONIC_CONFIG
      );
      
      // 2. 基音安定化（履歴バッファによる異常値除去）
      const stabilizedFreq = stabilizeFrequency(
        correctionResult.frequency,
        frequencyHistoryRef.current,
        0.1
      );
      
      // 3. デバッグ情報更新
      setDebugInfo({
        rawFrequency: frequency,
        correctedFrequency: stabilizedFreq,
        musicalScore: correctionResult.confidence,
        appliedCorrection: correctionResult.correction,
        frequencyHistory: frequencyHistoryRef.current.slice(-5),
        noteDetection: frequencyToNote(stabilizedFreq)
      });
      
      // 4. 前回周波数更新（連続性評価用）
      previousFrequencyRef.current = stabilizedFreq;
      
      return Math.round(stabilizedFreq * 10) / 10;
    }

    return null;
  }, [correctHarmonicFrequency, stabilizeFrequency, frequencyToNote]);

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

  // Step A: マイクロフォンシステム完全停止
  const stopMicrophoneSystemCompletely = useCallback(async () => {
    addLog('🔇 マイクロフォンシステム完全停止開始');
    
    // 1. 周波数検出ループ停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 2. MediaStream確実停止（iPhone対応）
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false; // iPhone Safari確実停止
      });
      streamRef.current = null;
    }
    
    // 3. AudioContext完全停止
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (error) {
        addLog(`⚠️ AudioContext停止エラー: ${error}`);
      }
      audioContextRef.current = null;
    }
    
    // 4. 関連リファレンス初期化
    analyserRef.current = null;
    pitchDetectorRef.current = null;
    filterChainRef.current = null;
    setCurrentFrequency(null);
    setIsMicInitialized(false);
    
    addLog('✅ マイクロフォンシステム完全停止完了');
  }, [addLog]);

  // Step A: 基音システム完全停止
  const stopBaseToneSystemCompletely = useCallback(async () => {
    addLog('🎹 基音システム完全停止開始');
    
    try {
      // 1. Tone.js Sampler停止
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      
      // 2. Tone.js Transport停止
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      
      // 3. AudioContext確認停止（注意: 他のTone.jsインスタンスに影響する可能性）
      if (Tone.context.state !== 'closed') {
        // Tone.jsのコンテキストは慎重に扱う
        addLog('🎵 Tone.js AudioContext停止スキップ（他への影響回避）');
      }
      
      setCurrentBaseTone(null);
      setIsInitialized(false);
      
      addLog('✅ 基音システム完全停止完了');
    } catch (error) {
      addLog(`❌ 基音システム停止エラー: ${error}`);
    }
  }, [addLog]);

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

  // Step A: システム状態更新（フェーズ対応）
  const updateSystemStatusWithPhase = useCallback((phase: AudioSystemPhase, message?: string) => {
    setCurrentPhase(phase);
    
    const phaseMessages = {
      [AudioSystemPhase.IDLE]: 'システム待機中',
      [AudioSystemPhase.TRANSITIONING]: 'フェーズ移行中...',
      [AudioSystemPhase.BASE_TONE_PHASE]: '基音再生フェーズ',
      [AudioSystemPhase.SCORING_PHASE]: '採点処理フェーズ',
      [AudioSystemPhase.ERROR_STATE]: 'エラー状態'
    };
    
    const phaseColors = {
      [AudioSystemPhase.IDLE]: 'gray',
      [AudioSystemPhase.TRANSITIONING]: 'yellow',
      [AudioSystemPhase.BASE_TONE_PHASE]: 'blue',
      [AudioSystemPhase.SCORING_PHASE]: 'green',
      [AudioSystemPhase.ERROR_STATE]: 'red'
    };
    
    const displayMessage = message || phaseMessages[phase];
    const color = phaseColors[phase];
    
    updateSystemStatus(displayMessage, color);
    addLog(`🎯 フェーズ更新: ${phase} - ${displayMessage}`);
  }, [updateSystemStatus, addLog]);

  // Step A: エラー状態への移行
  const transitionToErrorState = useCallback(async (error: string) => {
    addLog(`❌ エラー発生: ${error}`);
    updateSystemStatusWithPhase(AudioSystemPhase.ERROR_STATE, `エラー: ${error}`);
    
    // 全システム停止
    try {
      await stopMicrophoneSystemCompletely();
      await stopBaseToneSystemCompletely();
    } catch (cleanupError) {
      addLog(`⚠️ クリーンアップエラー: ${cleanupError}`);
    }
  }, [addLog, updateSystemStatusWithPhase, stopMicrophoneSystemCompletely, stopBaseToneSystemCompletely]);

  // Step A: アイドル状態への安全な復帰
  const resetToIdlePhase = useCallback(async () => {
    try {
      addLog('🔄 アイドル状態へ復帰開始');
      updateSystemStatusWithPhase(AudioSystemPhase.TRANSITIONING, 'アイドル状態へ復帰中...');
      
      // 全システム停止
      await stopMicrophoneSystemCompletely();
      await stopBaseToneSystemCompletely();
      
      // iOS Safari待機
      if (isIOSSafari()) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      updateSystemStatusWithPhase(AudioSystemPhase.IDLE);
      addLog('✅ アイドル状態復帰完了');
      
    } catch (error) {
      addLog(`❌ アイドル復帰エラー: ${error}`);
      updateSystemStatusWithPhase(AudioSystemPhase.ERROR_STATE, 'アイドル復帰失敗');
    }
  }, [addLog, updateSystemStatusWithPhase, stopMicrophoneSystemCompletely, stopBaseToneSystemCompletely, isIOSSafari]);

  // 旧マイクロフォンシステム停止（Step A改修により非推奨、完全停止版を使用）
  const stopMicrophoneSystem = useCallback(() => {
    addLog('⚠️ 旧stopMicrophoneSystem呼び出し - stopMicrophoneSystemCompletelyを使用してください');
    stopMicrophoneSystemCompletely();
  }, [stopMicrophoneSystemCompletely, addLog]);

  // Step A: コンポーネント初期化（フェーズ管理対応）
  useEffect(() => {
    addLog('🚀 分離型音声システム開始（Step A: 基盤システム改修版）');
    updateSystemStatusWithPhase(AudioSystemPhase.IDLE, 'システム初期化完了');
    
    if (isIOSSafari()) {
      addLog('📱 iPhone Safari環境を検出 - 最適化設定適用');
    } else {
      addLog('🖥️ PC/Android環境を検出 - 標準設定適用');
    }
  }, [addLog, updateSystemStatusWithPhase, isIOSSafari]);

  // Step A: コンポーネント終了時のクリーンアップ（完全停止版）
  useEffect(() => {
    return () => {
      // 完全停止版を使用
      stopMicrophoneSystemCompletely();
      stopBaseToneSystemCompletely();
    };
  }, [stopMicrophoneSystemCompletely, stopBaseToneSystemCompletely]);
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
          <div className="inline-block bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold">
            Step A: 基盤システム改修（フェーズ分離準備）
          </div>
          <div className="mt-2 text-sm text-gray-600">
            AudioSystemPhase + 完全停止関数 + iPhone最適化
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
                <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🔧</span>
                <span className="text-purple-600 font-semibold">Step A: 基盤システム改修完了</span>
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
          
          {/* iPhone音量問題警告表示 */}
          {isMicInitialized && isFilterEnabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="text-yellow-800">
                  <div className="font-bold text-sm">iPhone音量問題検出</div>
                  <div className="text-xs">ノイズフィルター + マイク動作中は基音音量が低下します</div>
                  <div className="text-xs mt-1">
                    <strong>解決策</strong>: マイクシステム停止後に基音再生 または ノイズフィルター無効化
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 justify-center">
            <button
              onClick={initializeBaseToneSystem}
              disabled={isInitialized || (isMicInitialized && isFilterEnabled)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎹 基音初期化
            </button>
            <button
              onClick={playBaseTone}
              disabled={!isInitialized || (isMicInitialized && isFilterEnabled)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎲 基音再生
            </button>
          </div>
          <div className="text-center text-xs text-gray-500">
            {(isMicInitialized && isFilterEnabled) 
              ? "⚠️ iPhone音量問題回避のため、ノイズフィルター有効時はマイク停止後に基音再生してください"
              : "基音システムは分離確認用 - iPhone音量問題の検証に使用"}
          </div>
        </div>

        {/* DOM操作テストボタン */}
        <div className="mb-6">
          <button
            onClick={handleDomTest}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md"
          >
            🔬 DOM直接操作テスト
          </button>
        </div>

        {/* 人間音声テスト機能 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 人間音声サンプルテスト</h3>
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              実際の人間音声で倍音補正システムをテストします
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => playTestVoice('human-c3-a.wav')}
                className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md"
              >
                🎵 C3基音 (130Hz) テスト
              </button>
              <button
                onClick={() => playTestVoice('human-c3-note.wav')}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md"
              >
                🎼 C3ノート (130Hz) テスト
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              音声再生中にデバッグパネルで倍音補正動作を確認できます
            </div>
          </div>
        </div>

        {/* 設計コンセプト */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Direct DOM Audio System</h3>
          <div className="text-left space-y-2 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>完全分離設計: 基音再生時はマイクOFF（Step A準備完了）</span>
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
              <span>段階的実装: 問題の早期特定・解決（Step A進行中）</span>
            </div>
          </div>
        </div>

        {/* ログ表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📝 実行ログ</h3>
          <div ref={logRef} className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
            <div className="text-sm text-gray-500">ログが表示されます...</div>
          </div>
        </div>

        {/* デバッグパネル */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎵 倍音補正デバッグ情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">📊 検出周波数:</span>
                <span className="font-mono font-bold text-blue-600">{debugInfo.rawFrequency.toFixed(2)}Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🎯 補正後周波数:</span>
                <span className="font-mono font-bold text-green-600">{debugInfo.correctedFrequency.toFixed(2)}Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📈 音楽的スコア:</span>
                <span className="font-mono font-bold text-purple-600">{debugInfo.musicalScore.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">🔧 適用補正:</span>
                <span className="font-bold text-orange-600">{debugInfo.appliedCorrection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🎼 音程判定:</span>
                <span className="font-bold text-indigo-600">{debugInfo.noteDetection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📋 履歴:</span>
                <span className="font-mono text-xs text-gray-500">
                  [{debugInfo.frequencyHistory.map(f => f.toFixed(0)).join(', ')}]
                </span>
              </div>
            </div>
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
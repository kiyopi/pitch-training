'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import * as Tone from 'tone';
import { PitchDetector } from 'pitchy';

// 基本フェーズ管理
enum AudioSystemPhase {
  IDLE = 'idle',
  TRANSITIONING = 'transitioning', 
  BASE_TONE_PHASE = 'base_tone',
  HARMONIC_CORRECTION_PHASE = 'harmonic_correction',
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
  { note: "ラ♯", frequency: 466.16, tonejs: "A#4" },
  { note: "シ", frequency: 493.88, tonejs: "B4" }
];

// 倍音補正設定（STEP4仕様書2.1章）
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // 基音探索範囲（±50Hz）
  harmonicRatios: number[];          // 倍音比率 [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;      // 確信度しきい値（0.8）
  stabilityBuffer: number[];        // 安定化バッファ（過去5フレーム）
  vocalRange: { min: number, max: number }; // 人間音域（130-1047Hz, C3-C6）
}

const DEFAULT_HARMONIC_CONFIG: HarmonicCorrectionConfig = {
  fundamentalSearchRange: 50,
  harmonicRatios: [0.5, 2.0, 3.0, 4.0],  // 1/2倍音, 2倍音, 3倍音, 4倍音
  confidenceThreshold: 0.8,
  stabilityBuffer: [],
  vocalRange: { min: 130.81, max: 1046.50 } // C3-C6
};

export default function HarmonicCorrectionTest() {
  // DOM ref
  const systemStatusRef = useRef<HTMLDivElement>(null);
  const phaseIndicatorRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const testDisplayRef = useRef<HTMLDivElement>(null);

  // 基音再生システム
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentBaseTone, setCurrentBaseTone] = useState<typeof BASE_TONES[0] | null>(null);

  // マイクロフォンシステム
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isMicInitialized, setIsMicInitialized] = useState(false);
  
  // 倍音補正システム
  const [currentPhase, setCurrentPhase] = useState<AudioSystemPhase>(AudioSystemPhase.IDLE);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [correctedFrequency, setCorrectedFrequency] = useState<number | null>(null);
  const [harmonicConfig] = useState<HarmonicCorrectionConfig>(DEFAULT_HARMONIC_CONFIG);
  const stabilityBufferRef = useRef<number[]>([]);
  const [previousFrequency, setPreviousFrequency] = useState<number | null>(null);
  const [musicalScore, setMusicalScore] = useState<number | null>(null);
  const [isHarmonicCorrectionActive, setIsHarmonicCorrectionActive] = useState(false);

  // DOM更新関数
  const updateSystemStatus = useCallback((message: string, color: string = 'blue') => {
    if (systemStatusRef.current) {
      systemStatusRef.current.innerHTML = `<span class="text-${color}-600 font-bold">${message}</span>`;
    }
  }, []);

  const addLog = useCallback((message: string) => {
    if (logRef.current) {
      const timestamp = new Date().toLocaleTimeString();
      logRef.current.innerHTML += `<div class="text-xs text-gray-600">[${timestamp}] ${message}</div>`;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const updatePhaseIndicator = useCallback((phase: number, description: string) => {
    if (phaseIndicatorRef.current) {
      phaseIndicatorRef.current.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">${phase}</div>
          <span class="text-blue-700 font-semibold">${description}</span>
        </div>
      `;
    }
  }, []);

  // フェーズ状態更新
  const updateSystemStatusWithPhase = useCallback((phase: AudioSystemPhase, message?: string) => {
    setCurrentPhase(phase);
    
    const phaseMessages = {
      [AudioSystemPhase.IDLE]: 'システム待機中',
      [AudioSystemPhase.TRANSITIONING]: 'フェーズ移行中...',
      [AudioSystemPhase.BASE_TONE_PHASE]: '基音再生フェーズ',
      [AudioSystemPhase.HARMONIC_CORRECTION_PHASE]: '倍音補正テストフェーズ',
      [AudioSystemPhase.ERROR_STATE]: 'エラー状態'
    };
    
    const phaseColors = {
      [AudioSystemPhase.IDLE]: 'gray',
      [AudioSystemPhase.TRANSITIONING]: 'yellow',
      [AudioSystemPhase.BASE_TONE_PHASE]: 'blue', 
      [AudioSystemPhase.HARMONIC_CORRECTION_PHASE]: 'green',
      [AudioSystemPhase.ERROR_STATE]: 'red'
    };
    
    const displayMessage = message || phaseMessages[phase];
    const color = phaseColors[phase];
    
    updateSystemStatus(displayMessage, color);
    addLog(`🎯 フェーズ更新: ${phase} - ${displayMessage}`);
  }, [updateSystemStatus, addLog]);

  // iPhone Safari判定
  const isIOSSafari = useCallback(() => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent);
  }, []);

  // システム完全停止
  const stopAllSystems = useCallback(async () => {
    addLog('🔇 全システム完全停止開始');
    
    // 周波数検出ループ停止
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // MediaStream停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    
    // AudioContext停止
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (error) {
        addLog(`⚠️ AudioContext停止エラー: ${error}`);
      }
      audioContextRef.current = null;
    }
    
    // Tone.js停止
    if (samplerRef.current) {
      samplerRef.current.dispose();
      samplerRef.current = null;
    }
    
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
    
    // 状態リセット
    analyserRef.current = null;
    pitchDetectorRef.current = null;
    setCurrentFrequency(null);
    setCorrectedFrequency(null);
    setIsMicInitialized(false);
    setIsInitialized(false);
    stabilityBufferRef.current = [];
    
    addLog('✅ 全システム完全停止完了');
  }, [addLog]);

  // ランダム基音選択
  const selectRandomBaseTone = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * BASE_TONES.length);
    const selectedTone = BASE_TONES[randomIndex];
    setCurrentBaseTone(selectedTone);
    addLog(`🎲 ランダム基音選択: ${selectedTone.note} (${selectedTone.frequency.toFixed(2)} Hz)`);
    return selectedTone;
  }, [addLog]);

  // 基音初期化
  const initializeBaseToneSystem = useCallback(async () => {
    if (isInitialized) {
      addLog('⚠️ 基音システム既に初期化済み');
      return;
    }

    try {
      addLog('🎹 Salamander Piano初期化開始');
      updateSystemStatus('基音システム初期化中...', 'yellow');

      if (Tone.context.state !== 'running') {
        await Tone.start();
        addLog('🔊 AudioContext開始（iPhone対応）');
      }

      samplerRef.current = new Tone.Sampler({
        urls: { "C4": "C4.mp3" },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5
      }).toDestination();

      await new Promise(resolve => {
        const checkLoaded = () => {
          if (samplerRef.current?.loaded) {
            resolve(undefined);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });

      setIsInitialized(true);
      updateSystemStatus('基音システム準備完了', 'green');
      addLog('✅ Salamander Piano初期化完了');
    } catch (error) {
      addLog(`❌ 基音システム初期化エラー: ${error}`);
      updateSystemStatus('基音システム初期化失敗', 'red');
    }
  }, [addLog, updateSystemStatus, isInitialized]);

  // 基音再生
  const playBaseTone = useCallback(async () => {
    if (!samplerRef.current || !isInitialized) {
      addLog('❌ 基音システム未初期化');
      return;
    }

    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        addLog('🔊 AudioContext開始（iPhone対応）');
      }

      const tone = currentBaseTone || selectRandomBaseTone();
      addLog(`🎵 基音再生開始: ${tone.note}`);
      updateSystemStatus(`基音再生中: ${tone.note}`, 'blue');

      // iPhone音量最適化
      samplerRef.current.volume.value = -6;
      samplerRef.current.triggerAttackRelease(tone.tonejs, '2n');

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

      updateSystemStatus(`基音再生完了: ${tone.note}`, 'green');
    } catch (error) {
      addLog(`❌ 基音再生エラー: ${error}`);
      updateSystemStatus('基音再生失敗', 'red');
    }
  }, [samplerRef, isInitialized, currentBaseTone, selectRandomBaseTone, addLog, updateSystemStatus]);

  // STEP4仕様書2.1章: 倍音補正アルゴリズム実装
  const calculateMusicalScore = useCallback((frequency: number): number => {
    const C4 = 261.63; // Middle C
    
    // 最も近い半音階音名への距離を計算
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
    
    // 半音階に近いほど高スコア（±50セント以内で最高点）
    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
  }, []);

  const correctHarmonicFrequency = useCallback((detectedFreq: number, previousFreq: number | null): number => {
    // 1. 基音候補を生成（オクターブ違いを考慮）
    const fundamentalCandidates = [
      detectedFreq,                    // そのまま
      detectedFreq / 2.0,             // 1オクターブ下（2倍音の場合）
      detectedFreq / 3.0,             // 3倍音の基音
      detectedFreq / 4.0,             // 4倍音の基音
      detectedFreq * 2.0,             // 1オクターブ上（低く歌った場合）
    ];
    
    // 2. 各候補の妥当性を評価
    const evaluateFundamental = (freq: number) => {
      // 人間音域範囲内チェック
      const inVocalRange = freq >= harmonicConfig.vocalRange.min && freq <= harmonicConfig.vocalRange.max;
      const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
      
      // 前回検出との連続性評価
      const continuityScore = previousFreq 
        ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
        : 0.5;
      
      // 基音らしさ評価（ドレミファソラシド近似度）
      const musicalScore = calculateMusicalScore(freq);
      
      const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
      return { freq, score: totalScore };
    };
    
    // 3. 最高スコア候補を基音として採用
    const bestCandidate = fundamentalCandidates
      .map(evaluateFundamental)
      .reduce((best, current) => current.score > best.score ? current : best);
      
    return bestCandidate.freq;
  }, [harmonicConfig, calculateMusicalScore]);

  const stabilizeFrequency = useCallback((currentFreq: number, historyBuffer: number[], stabilityThreshold: number = 0.1): number => {
    // 1. 履歴バッファに追加
    historyBuffer.push(currentFreq);
    if (historyBuffer.length > 5) historyBuffer.shift(); // 最大5フレーム保持
    
    // 2. 中央値ベースの安定化（外れ値除去）
    const sorted = [...historyBuffer].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // 3. 急激な変化を抑制（段階的変化）
    const maxChange = median * stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange 
      ? median + Math.sign(currentFreq - median) * maxChange
      : currentFreq;
      
    return stabilized;
  }, []);

  // マイクロフォン初期化
  const initializeMicrophone = useCallback(async () => {
    if (isMicInitialized) {
      addLog('⚠️ マイクロフォン既に初期化済み');
      return;
    }

    try {
      addLog('🎤 マイクロフォン初期化開始');
      updateSystemStatusWithPhase(AudioSystemPhase.TRANSITIONING, 'マイクロフォン初期化中...');

      // getUserMediaでマイクアクセス
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;

      // AudioContext初期化
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // AnalyserNode設定
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096; // PitchDetectorと一致させる
      analyserRef.current.smoothingTimeConstant = 0.3;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // PitchDetector初期化（fftSizeと一致）
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize);

      setIsMicInitialized(true);
      addLog('✅ マイクロフォン初期化完了');
      updateSystemStatusWithPhase(AudioSystemPhase.IDLE, 'マイクロフォン準備完了');
    } catch (error) {
      addLog(`❌ マイクロフォン初期化エラー: ${error}`);
      updateSystemStatusWithPhase(AudioSystemPhase.ERROR_STATE, 'マイクロフォン初期化失敗');
    }
  }, [isMicInitialized, addLog, updateSystemStatusWithPhase]);

  // 倍音補正テスト実行
  const startHarmonicCorrectionTest = useCallback(async () => {
    if (!isMicInitialized || !analyserRef.current || !pitchDetectorRef.current) {
      addLog('❌ マイクロフォンまたは音程検出器が未初期化');
      return;
    }

    if (isHarmonicCorrectionActive) {
      addLog('⚠️ 倍音補正テスト既に実行中');
      return;
    }

    try {
      addLog('🎯 倍音補正テスト開始');
      updateSystemStatusWithPhase(AudioSystemPhase.HARMONIC_CORRECTION_PHASE, '倍音補正テスト実行中...');
      setIsHarmonicCorrectionActive(true);
      
      // 安定化バッファリセット
      stabilityBufferRef.current = [];
      
      updatePhaseIndicator(2, 'ユーザー歌唱検出・倍音補正実行中');

      // リアルタイム音程検出ループ
      const detectPitch = () => {
        if (!analyserRef.current || !pitchDetectorRef.current) {
          if (isHarmonicCorrectionActive) {
            animationFrameRef.current = requestAnimationFrame(detectPitch);
          }
          return;
        }

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        analyserRef.current.getFloatTimeDomainData(dataArray);

        // Pitchy音程検出
        const [pitch, clarity] = pitchDetectorRef.current.findPitch(dataArray, 44100);

        // 検出結果を表示（低い信頼度でも表示）
        if (clarity > 0.05 && pitch > 50 && pitch < 2000) {
          // 生検出周波数
          setCurrentFrequency(pitch);
          
          // 倍音補正適用
          const corrected = correctHarmonicFrequency(pitch, previousFrequency);
          
          // 安定化処理
          const stabilized = stabilizeFrequency(corrected, stabilityBufferRef.current);
          
          setCorrectedFrequency(stabilized);
          setPreviousFrequency(stabilized);
          
          // 音楽的妥当性評価
          const score = calculateMusicalScore(stabilized);
          setMusicalScore(score);
          
          // テスト結果表示更新
          if (testDisplayRef.current) {
            testDisplayRef.current.innerHTML = `
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 class="font-bold text-blue-800 mb-2">🎤 生検出周波数</h4>
                    <div class="text-2xl font-bold text-blue-600">${pitch.toFixed(1)} Hz</div>
                    <div class="text-sm text-blue-500">信頼度: ${(clarity * 100).toFixed(1)}%</div>
                  </div>
                  <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 class="font-bold text-green-800 mb-2">🎯 補正後周波数</h4>
                    <div class="text-2xl font-bold text-green-600">${stabilized.toFixed(1)} Hz</div>
                    <div class="text-sm text-green-500">音楽的妥当性: ${(score * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 class="font-bold text-purple-800 mb-2">📊 倍音補正効果</h4>
                  <div class="text-lg text-purple-600">
                    補正量: ${(Math.abs(pitch - stabilized)).toFixed(1)} Hz
                    ${Math.abs(pitch - stabilized) > 10 ? ' (大幅補正)' : ' (微調整)'}
                  </div>
                  <div class="text-sm text-purple-500 mt-1">
                    安定化バッファ: ${stabilityBufferRef.current.length}/5フレーム
                  </div>
                </div>
              </div>
            `;
          }
          
          addLog(`🎵 検出: ${pitch.toFixed(1)}Hz → 補正: ${stabilized.toFixed(1)}Hz (スコア: ${(score * 100).toFixed(1)}%)`);
        } else {
          // 検出できない場合の表示
          if (testDisplayRef.current) {
            testDisplayRef.current.innerHTML = `
              <div class="space-y-4">
                <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 class="font-bold text-yellow-800 mb-2">🎤 音程検出中...</h4>
                  <div class="text-lg text-yellow-600">
                    検出周波数: ${pitch ? pitch.toFixed(1) : 'なし'} Hz
                  </div>
                  <div class="text-sm text-yellow-500">
                    信頼度: ${clarity ? (clarity * 100).toFixed(1) : '0'}% (閾値: 5%以上)
                  </div>
                  <div class="text-xs text-yellow-400 mt-2">
                    🎵 声を出して歌ってください（ハミングでも可）
                  </div>
                </div>
              </div>
            `;
          }
        }

        if (isHarmonicCorrectionActive) {
          animationFrameRef.current = requestAnimationFrame(detectPitch);
        }
      };

      detectPitch();
    } catch (error) {
      addLog(`❌ 倍音補正テストエラー: ${error}`);
      updateSystemStatusWithPhase(AudioSystemPhase.ERROR_STATE, '倍音補正テスト失敗');
      setIsHarmonicCorrectionActive(false);
    }
  }, [isMicInitialized, isHarmonicCorrectionActive, previousFrequency, addLog, updateSystemStatusWithPhase, updatePhaseIndicator, correctHarmonicFrequency, stabilizeFrequency, calculateMusicalScore]);

  // 倍音補正テスト停止
  const stopHarmonicCorrectionTest = useCallback(() => {
    if (!isHarmonicCorrectionActive) {
      addLog('⚠️ 倍音補正テスト未実行中');
      return;
    }

    addLog('🛑 倍音補正テスト停止');
    setIsHarmonicCorrectionActive(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    updateSystemStatusWithPhase(AudioSystemPhase.IDLE, '倍音補正テスト停止');
    updatePhaseIndicator(1, '基盤システム待機中');
  }, [isHarmonicCorrectionActive, addLog, updateSystemStatusWithPhase, updatePhaseIndicator]);

  // コンポーネント初期化
  useEffect(() => {
    addLog('🚀 倍音補正テストシステム開始');
    updateSystemStatusWithPhase(AudioSystemPhase.IDLE, 'システム初期化完了');
    
    if (isIOSSafari()) {
      addLog('📱 iPhone Safari環境を検出');
    }
    
    updatePhaseIndicator(1, '基盤システム準備完了');

    return () => {
      stopAllSystems();
    };
  }, [addLog, updateSystemStatusWithPhase, isIOSSafari, updatePhaseIndicator, stopAllSystems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link 
            href="/test" 
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            テスト一覧に戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎵 ユーザー歌唱倍音補正テスト</h1>
          <p className="text-gray-600 text-lg">
            STEP4仕様書2.1章：動的オクターブ補正システムのテスト環境
          </p>
        </div>

        {/* システム状態表示 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">🎯 システム状態</h3>
              <div ref={systemStatusRef} className="text-lg p-3 bg-gray-50 rounded-lg border border-gray-200">
                システム初期化中...
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">🔄 現在フェーズ</h3>
              <div ref={phaseIndicatorRef} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                フェーズ準備中...
              </div>
            </div>
          </div>
        </div>

        {/* 倍音補正テスト表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 倍音補正テスト結果</h3>
          <div ref={testDisplayRef} className="min-h-32">
            <div className="w-full h-full flex items-center justify-center">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-500">倍音補正テスト待機中...</div>
              </div>
            </div>
          </div>
        </div>

        {/* 基音システム制御 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎹 基音システム制御</h3>
          <div className="flex space-x-4 justify-center mb-4">
            <button
              onClick={initializeBaseToneSystem}
              disabled={isInitialized}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎹 基音初期化
            </button>
            <button
              onClick={playBaseTone}
              disabled={!isInitialized}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎲 基音再生
            </button>
          </div>
          <div className="text-center text-sm text-gray-600">
            {!isInitialized ? "まず基音システムを初期化してください" : "基音システム準備完了"}
          </div>
        </div>

        {/* マイクロフォン初期化 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 マイクロフォンシステム制御</h3>
          <div className="flex space-x-4 justify-center mb-4">
            <button
              onClick={initializeMicrophone}
              disabled={isMicInitialized}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
            >
              🎤 マイク初期化
            </button>
          </div>
          <div className="text-center text-sm text-gray-600">
            {!isMicInitialized ? "マイクアクセスが必要です" : "マイクロフォンシステム準備完了"}
          </div>
        </div>

        {/* 倍音補正テストボタン（段階2で実装完了） */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔬 倍音補正テスト（段階2実装完了）</h3>
          <div className="text-center space-y-4">
            <div className="flex space-x-4 justify-center">
              <button
                onClick={startHarmonicCorrectionTest}
                disabled={!isMicInitialized || isHarmonicCorrectionActive}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                🎯 倍音補正テスト開始
              </button>
              <button
                onClick={stopHarmonicCorrectionTest}
                disabled={!isHarmonicCorrectionActive}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-md disabled:opacity-50 disabled:hover:scale-100"
              >
                🛑 テスト停止
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {!isMicInitialized 
                ? "まずマイクロフォンを初期化してください" 
                : isHarmonicCorrectionActive 
                  ? "倍音補正テスト実行中..." 
                  : "歌声を歌って倍音補正システムをテストします"}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-700">
                <strong>📝 テスト手順:</strong>
                <br />1. マイクロフォンを初期化
                <br />2. 基音を再生して音程を確認
                <br />3. 倍音補正テストを開始
                <br />4. その音程で歌って倍音補正効果を確認
              </div>
            </div>
          </div>
        </div>

        {/* ログ表示 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 システムログ</h3>
          <div 
            ref={logRef}
            className="h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm"
          >
            <div className="text-xs text-gray-600">[初期化] システムログ開始</div>
          </div>
        </div>

        {/* 設計情報 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 倍音補正テスト設計</h3>
          <div className="text-left space-y-2 text-gray-600 text-sm">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>基音再生：Salamander Piano（iPhone音量最適化済み）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>ユーザー歌唱：マイク音程検出（段階2実装完了）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>倍音補正：動的オクターブ補正システム（段階2実装完了）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>相対音程：ドレミファソラシド判定（段階3で実装予定）</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
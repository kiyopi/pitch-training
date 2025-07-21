'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

// Step B-0: マイクロフォン不在対応 - エラー分類システム
enum MicrophoneErrorType {
  NO_DEVICES = 'no_devices',           // 物理デバイス不在
  PERMISSION_DENIED = 'permission_denied',  // 権限拒否
  DEVICE_IN_USE = 'device_in_use',     // 他アプリ占有
  SYSTEM_ERROR = 'system_error',       // システムエラー
  BROWSER_NOT_SUPPORTED = 'not_supported', // ブラウザ非対応
  SECURITY_ERROR = 'security_error',   // セキュリティ制限
  HARDWARE_ERROR = 'hardware_error',   // ハードウェア問題
  DRIVER_ERROR = 'driver_error'        // ドライバー問題
}

// Step B-0: マイク可用性チェック結果
interface MicrophoneAvailabilityCheck {
  isAvailable: boolean;
  errorType: MicrophoneErrorType | null;
  errorMessage: string;
  suggestedAction: string;
  canRetry: boolean;
  fallbackAvailable: boolean;
}

// Step B-0: アプリ動作モード定義（3つの練習モード対応拡張版）
enum AppOperationMode {
  // フル機能モード
  FULL_TRAINING = 'full_training',    // 通常：基音+採点

  // 練習モード別フォールバック機能
  RANDOM_LISTENING_MODE = 'random_listening',      // ランダム基音聴音練習
  CONTINUOUS_LISTENING_MODE = 'continuous_listening', // 連続基音聴音練習  
  CHROMATIC_LISTENING_MODE = 'chromatic_listening',   // クロマティック聴音練習
  
  // 完全代替機能
  LISTENING_ONLY = 'listening_only',    // マイク不在：基音のみ
  DEMO_MODE = 'demo_mode',            // 自動進行デモ
  THEORY_MODE = 'theory_mode'         // 音楽理論学習モード
}

// Step B-1.5: TrainingModeRequirements Interface（3つの練習モード設定）
interface TrainingModeConfig {
  micRequired: boolean;               // マイクロフォン必須性
  fallbackMode: AppOperationMode;     // フォールバック動作モード
  fallbackFeatures: string[];        // 利用可能機能リスト
  fallbackLimitations: string[];     // 制限事項リスト
  educationalValue: number;          // フォールバック時教育価値（%）
  userMessage: string;               // ユーザー向け説明メッセージ
  uiColor: 'blue' | 'green' | 'purple'; // UI識別色
}

// 3つの練習モード別設定
const TRAINING_MODE_REQUIREMENTS: Record<string, TrainingModeConfig> = {
  '/training/random': {
    micRequired: true,
    fallbackMode: AppOperationMode.RANDOM_LISTENING_MODE,
    fallbackFeatures: [
      '✅ ランダム基音再生（聴音練習）',
      '✅ 10種類基音の音域学習', 
      '✅ 相対音程理論の視覚学習',
      '✅ 音程間隔の理解促進'
    ],
    fallbackLimitations: [
      '❌ ユーザー歌唱採点',
      '❌ リアルタイム音程検出',
      '❌ 精度評価・スコア表示'
    ],
    educationalValue: 75,
    userMessage: 'ランダム基音を聞いて音程感覚を鍛える聴音練習が可能です',
    uiColor: 'blue'
  },
  
  '/training/continuous': {
    micRequired: true,
    fallbackMode: AppOperationMode.CONTINUOUS_LISTENING_MODE,
    fallbackFeatures: [
      '✅ 連続基音再生（持続集中力養成）',
      '✅ ラウンド間休憩時間設定',
      '✅ 進捗表示・統計情報',
      '✅ 同一基音での集中練習'
    ],
    fallbackLimitations: [
      '❌ ラウンド別採点・精度評価',
      '❌ 歌唱品質の数値化',
      '❌ 改善点の具体的指摘'
    ],
    educationalValue: 65,
    userMessage: '連続基音聴音で持続的な音程集中力を養成できます',
    uiColor: 'green'
  },
  
  '/training/chromatic': {
    micRequired: true, 
    fallbackMode: AppOperationMode.CHROMATIC_LISTENING_MODE,
    fallbackFeatures: [
      '✅ 12音クロマティック音階再生',
      '✅ 上行・下行・両方向選択',
      '✅ 半音間隔の正確な聴音学習',
      '✅ 異名同音の理解促進'
    ],
    fallbackLimitations: [
      '❌ 半音精度の歌唱評価',
      '❌ 微細な音程偏差検出',
      '❌ クロマティック歌唱指導'
    ],
    educationalValue: 80, // クロマティック聴音は高い教育価値
    userMessage: '半音階の正確な音程関係を聴音で学習できます',
    uiColor: 'purple'
  },
  
  // テスト用デフォルト
  '/test/separated-audio': {
    micRequired: true,
    fallbackMode: AppOperationMode.RANDOM_LISTENING_MODE,
    fallbackFeatures: [
      '✅ テスト環境でのランダム基音再生',
      '✅ フェーズ分離システム検証',
      '✅ マイク可用性チェック機能'
    ],
    fallbackLimitations: [
      '❌ 本格的な練習機能',
      '❌ 進捗保存機能'
    ],
    educationalValue: 60,
    userMessage: 'テスト環境でのフェーズ分離システムを体験できます',
    uiColor: 'blue'
  }
};

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

// Step B-0: エラー分析・分類システム
const analyzeMicrophoneError = (error: DOMException | Error | unknown): MicrophoneAvailabilityCheck => {
  // 型安全なエラー情報の取得
  const errorObj = error as { name?: string; message?: string };
  const errorName = (error instanceof Error || errorObj.name) ? 
    (error instanceof Error ? error.name : errorObj.name || '') : '';
  const errorMessage = (error instanceof Error || errorObj.message) ?
    (error instanceof Error ? error.message : errorObj.message || '') : String(error);
  
  // DOMException分析
  switch (errorName) {
    case 'NotAllowedError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.PERMISSION_DENIED,
        errorMessage: 'マイクロフォンのアクセス許可が拒否されています',
        suggestedAction: 'ブラウザのアドレスバー🔒をクリックし、マイクロフォンを「許可」に設定してください',
        canRetry: true,
        fallbackAvailable: true
      };
      
    case 'NotFoundError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.NO_DEVICES,
        errorMessage: 'マイクロフォンが見つかりません',
        suggestedAction: 'マイクロフォンを接続し、デバイス設定を確認してください',
        canRetry: true,
        fallbackAvailable: true
      };
      
    case 'NotReadableError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.DEVICE_IN_USE,
        errorMessage: 'マイクロフォンが他のアプリケーションで使用されています',
        suggestedAction: 'Zoom、Discord等を終了してから再試行してください',
        canRetry: true,
        fallbackAvailable: true
      };
      
    case 'OverconstrainedError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.HARDWARE_ERROR,
        errorMessage: 'マイクロフォンが要求される仕様を満たしません',
        suggestedAction: 'マイクロフォンの設定を確認するか、別のデバイスをお試しください',
        canRetry: true,
        fallbackAvailable: true
      };
      
    case 'AbortError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.SYSTEM_ERROR,
        errorMessage: 'マイクロフォンアクセスが中断されました',
        suggestedAction: 'ページを再読み込みしてから再試行してください',
        canRetry: true,
        fallbackAvailable: true
      };
      
    case 'SecurityError':
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.SECURITY_ERROR,
        errorMessage: 'セキュリティ制限によりマイクロフォンにアクセスできません',
        suggestedAction: 'HTTPS環境でアクセスするか、ブラウザの設定を確認してください',
        canRetry: false,
        fallbackAvailable: true
      };
      
    default:
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.SYSTEM_ERROR,
        errorMessage: `マイクロフォンエラー: ${errorMessage}`,
        suggestedAction: 'ページを再読み込みしてから再試行してください',
        canRetry: true,
        fallbackAvailable: true
      };
  }
};

// Step B-0: 段階的マイク可用性チェック
const checkMicrophoneAvailability = async (): Promise<MicrophoneAvailabilityCheck> => {
  // 1. ブラウザサポート確認（最軽量）
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      isAvailable: false,
      errorType: MicrophoneErrorType.BROWSER_NOT_SUPPORTED,
      errorMessage: 'ブラウザがマイクロフォンをサポートしていません',
      suggestedAction: 'Chrome、Safari、Firefox等の対応ブラウザをご使用ください',
      canRetry: false,
      fallbackAvailable: true
    };
  }

  // 2. デバイス列挙確認（軽量）
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    if (audioInputs.length === 0) {
      return {
        isAvailable: false,
        errorType: MicrophoneErrorType.NO_DEVICES,
        errorMessage: 'マイクロフォンデバイスが見つかりません',
        suggestedAction: 'マイクロフォンの接続を確認してください',
        canRetry: true,
        fallbackAvailable: true
      };
    }
  } catch (error) {
    // enumerateDevices失敗は権限問題の可能性があるが継続
  }

  // 3. 実際のアクセステスト（重い処理）
  try {
    const testStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1 }
    });
    
    // テスト成功後は即座に停止
    testStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    
    return {
      isAvailable: true,
      errorType: null,
      errorMessage: '',
      suggestedAction: '',
      canRetry: false,
      fallbackAvailable: false
    };
    
  } catch (error: unknown) {
    return analyzeMicrophoneError(error);
  }
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

  // Step B-0: マイクロフォン可用性管理
  const [micAvailability, setMicAvailability] = useState<MicrophoneAvailabilityCheck | null>(null);
  const [appOperationMode, setAppOperationMode] = useState<AppOperationMode>(AppOperationMode.FULL_TRAINING);
  const [showMicErrorDialog, setShowMicErrorDialog] = useState(false);

  // Step B-1.5: 練習モード管理
  const [currentTrainingMode, setCurrentTrainingMode] = useState<TrainingModeConfig | null>(null);
  const [trainingModePath, setTrainingModePath] = useState<string>('/test/separated-audio');

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

  // Step A: iPhone検出関数
  const isIOSSafari = useCallback((): boolean => {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent);
  }, []);

  // 初期化時に練習モード設定（依存関数定義後に実行）
  useEffect(() => {
    const path = typeof window !== 'undefined' 
      ? (window.location.pathname.includes('/training/random') ? '/training/random'
         : window.location.pathname.includes('/training/continuous') ? '/training/continuous'
         : window.location.pathname.includes('/training/chromatic') ? '/training/chromatic'
         : '/test/separated-audio')
      : '/test/separated-audio';
    
    const config = TRAINING_MODE_REQUIREMENTS[path] || TRAINING_MODE_REQUIREMENTS['/test/separated-audio'];
    
    setCurrentTrainingMode(config);
    setTrainingModePath(path);
    
    addLog(`📋 練習モード初期化: ${path}`);
    addLog(`💡 教育価値: ${config.educationalValue}% (${config.fallbackMode})`);
  }, [addLog]);

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

  // Step B-1.5: マイクエラーダイアログ再試行
  const handleMicErrorRetry = useCallback(async () => {
    if (!micAvailability?.canRetry) return;
    
    setShowMicErrorDialog(false);
    addLog('🔄 マイクロフォン再試行開始');
    
    const micCheck = await checkMicrophoneAvailability();
    setMicAvailability(micCheck);
    
    if (micCheck.isAvailable) {
      setAppOperationMode(AppOperationMode.FULL_TRAINING);
      addLog('✅ マイクロフォン復旧 - フル機能モード復帰');
      updateSystemStatus('マイクロフォン復旧完了', 'green');
    } else {
      setShowMicErrorDialog(true);
      addLog('❌ マイクロフォン再試行失敗');
    }
  }, [micAvailability, addLog, updateSystemStatus]);

  // Step B-1.5: フォールバック機能の受け入れ
  const handleAcceptFallback = useCallback(() => {
    setShowMicErrorDialog(false);
    addLog(`✅ フォールバック機能を選択: ${currentTrainingMode?.fallbackMode}`);
    updateSystemStatus('基音専用モードで継続', 'blue');
  }, [currentTrainingMode, addLog, updateSystemStatus]);

  // Step B-1.5: 練習モードURL解析とTrainingModeConfig取得
  const getCurrentTrainingModePath = useCallback((): string => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      
      // 練習モードURLパターンマッチング
      const trainingModePatterns = {
        '/training/random': '/training/random',
        '/training/continuous': '/training/continuous', 
        '/training/chromatic': '/training/chromatic',
        '/test/separated-audio': '/test/separated-audio', // テスト環境
      };
      
      for (const [pattern, mode] of Object.entries(trainingModePatterns)) {
        if (currentPath.includes(pattern)) {
          return mode;
        }
      }
    }
    
    // デフォルトはテスト環境
    return '/test/separated-audio';
  }, []);

  const getCurrentTrainingModeConfig = useCallback((): TrainingModeConfig => {
    const path = getCurrentTrainingModePath();
    return TRAINING_MODE_REQUIREMENTS[path] || TRAINING_MODE_REQUIREMENTS['/test/separated-audio'];
  }, [getCurrentTrainingModePath]);

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

  // Step B-0: マイクロフォン可用性チェック実行
  const performMicrophoneAvailabilityCheck = useCallback(async () => {
    addLog('🔍 マイクロフォン可用性チェック開始');
    updateSystemStatus('マイクロフォン可用性確認中...', 'yellow');
    
    try {
      const availability = await checkMicrophoneAvailability();
      setMicAvailability(availability);
      
      if (availability.isAvailable) {
        addLog('✅ マイクロフォン利用可能');
        setAppOperationMode(AppOperationMode.FULL_TRAINING);
        updateSystemStatus('マイクロフォン確認完了 - フル機能利用可能', 'green');
        setShowMicErrorDialog(false);
      } else {
        addLog(`❌ マイクロフォン問題: ${availability.errorMessage}`);
        setAppOperationMode(AppOperationMode.LISTENING_ONLY);
        updateSystemStatus(`マイクロフォン問題: ${availability.errorType}`, 'red');
        setShowMicErrorDialog(true);
      }
    } catch (error) {
      addLog(`❌ 可用性チェック実行エラー: ${error}`);
      const fallbackAvailability: MicrophoneAvailabilityCheck = {
        isAvailable: false,
        errorType: MicrophoneErrorType.SYSTEM_ERROR,
        errorMessage: 'マイクロフォン可用性チェックに失敗しました',
        suggestedAction: 'ページを再読み込みしてから再試行してください',
        canRetry: true,
        fallbackAvailable: true
      };
      setMicAvailability(fallbackAvailability);
      setAppOperationMode(AppOperationMode.LISTENING_ONLY);
      setShowMicErrorDialog(true);
      updateSystemStatus('可用性チェック失敗', 'red');
    }
  }, [addLog, updateSystemStatus]);

  // Step B-0: マイクロフォン再試行処理
  const retryMicrophoneAccess = useCallback(async () => {
    addLog('🔄 マイクロフォンアクセス再試行');
    await performMicrophoneAvailabilityCheck();
  }, [addLog, performMicrophoneAvailabilityCheck]);

  // Step B-0: フォールバックモード開始
  const startFallbackMode = useCallback(() => {
    addLog('🎹 基音専用モードで継続');
    setAppOperationMode(AppOperationMode.LISTENING_ONLY);
    setShowMicErrorDialog(false);
    updateSystemStatus('基音専用モード - 採点機能は利用できません', 'yellow');
  }, [addLog, updateSystemStatus]);

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

  // Step B-1: 安全なフェーズ移行制御システム
  const transitionPhase = useCallback(async (
    fromPhase: AudioSystemPhase, 
    toPhase: AudioSystemPhase
  ): Promise<boolean> => {
    try {
      addLog(`🔄 フェーズ移行開始: ${fromPhase} → ${toPhase}`);
      updateSystemStatusWithPhase(AudioSystemPhase.TRANSITIONING, `${fromPhase}→${toPhase}移行中...`);
      
      // 1. 現在フェーズのクリーンアップ
      await cleanupCurrentPhase(fromPhase);
      
      // 2. iOS Safari移行待機（AudioContext安定化）
      const waitTime = isIOSSafari() ? 300 : 100;
      addLog(`⏳ フェーズ間待機: ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // 3. 次フェーズの初期化
      await initializeNextPhase(toPhase);
      
      updateSystemStatusWithPhase(toPhase);
      addLog(`✅ フェーズ移行完了: ${toPhase}`);
      
      return true;
    } catch (error) {
      addLog(`❌ フェーズ移行失敗: ${error}`);
      await transitionToErrorState(`フェーズ移行エラー: ${error}`);
      return false;
    }
  }, [addLog, updateSystemStatusWithPhase, isIOSSafari]);

  // Step B-1: 現在フェーズのクリーンアップ
  const cleanupCurrentPhase = useCallback(async (phase: AudioSystemPhase) => {
    addLog(`🧹 ${phase}フェーズクリーンアップ開始`);
    
    try {
      switch (phase) {
        case AudioSystemPhase.BASE_TONE_PHASE:
          await stopBaseToneSystemCompletely();
          addLog('✅ 基音システム完全停止完了');
          break;
          
        case AudioSystemPhase.SCORING_PHASE:
          await stopMicrophoneSystemCompletely();
          addLog('✅ マイクシステム完全停止完了');
          break;
          
        case AudioSystemPhase.IDLE:
          // アイドル状態からの移行：念のため両システム停止
          await Promise.all([
            stopBaseToneSystemCompletely(),
            stopMicrophoneSystemCompletely()
          ]);
          addLog('✅ 全システム停止完了（アイドル→移行）');
          break;
          
        case AudioSystemPhase.TRANSITIONING:
        case AudioSystemPhase.ERROR_STATE:
          // 移行中・エラー状態からの復旧：全停止
          await Promise.all([
            stopBaseToneSystemCompletely(),
            stopMicrophoneSystemCompletely()
          ]);
          addLog('✅ 全システム停止完了（復旧処理）');
          break;
          
        default:
          addLog(`⚠️ 未知のフェーズ: ${phase}`);
      }
    } catch (error) {
      addLog(`⚠️ クリーンアップエラー: ${error}`);
      // エラーが発生してもフェーズ移行は続行（ベストエフォート）
    }
  }, [addLog, stopBaseToneSystemCompletely, stopMicrophoneSystemCompletely]);

  // Step B-1: 次フェーズの初期化
  const initializeNextPhase = useCallback(async (phase: AudioSystemPhase) => {
    addLog(`🚀 ${phase}フェーズ初期化開始`);
    
    try {
      switch (phase) {
        case AudioSystemPhase.BASE_TONE_PHASE:
          addLog('🎹 基音再生フェーズ準備中...');
          // 基音システムは必要時に初期化（遅延初期化）
          break;
          
        case AudioSystemPhase.SCORING_PHASE:
          addLog('🎤 採点処理フェーズ準備中...');
          // マイクシステムは必要時に初期化（遅延初期化）
          break;
          
        case AudioSystemPhase.IDLE:
          addLog('⏸️ アイドル状態準備完了');
          // アイドル状態：特別な初期化なし
          break;
          
        default:
          throw new Error(`初期化不可能なフェーズ: ${phase}`);
      }
      
      addLog(`✅ ${phase}フェーズ初期化完了`);
    } catch (error) {
      throw new Error(`フェーズ初期化失敗: ${error}`);
    }
  }, [addLog]);

  // Step B-2': リスニング専用UI更新関数
  const updateListeningOnlyUI = useCallback((mode: 'random' | 'continuous' | 'chromatic', message: string) => {
    if (testDisplayRef.current) {
      const modeColors: Record<string, string> = {
        'random': 'from-blue-50 to-indigo-100',
        'continuous': 'from-green-50 to-emerald-100', 
        'chromatic': 'from-purple-50 to-pink-100'
      };
      
      const modeIcons: Record<string, string> = {
        'random': '🎲',
        'continuous': '🔄',
        'chromatic': '🎵'
      };
      
      const modeNames: Record<string, string> = {
        'random': 'ランダムリスニング',
        'continuous': '連続リスニング',
        'chromatic': 'クロマティックリスニング'
      };
      
      testDisplayRef.current.innerHTML = `
        <div class="w-full p-4">
          <div class="bg-gradient-to-br ${modeColors[mode]} rounded-xl p-6 shadow-lg border">
            <div class="flex items-center justify-center mb-4">
              <span class="text-3xl mr-3">${modeIcons[mode]}</span>
              <div class="text-xl font-bold text-gray-800">${modeNames[mode]}</div>
            </div>
            <div class="text-center text-gray-700 leading-relaxed whitespace-pre-line text-sm">
              ${message}
            </div>
            <div class="mt-4 text-center">
              <div class="inline-block px-4 py-2 bg-white bg-opacity-70 rounded-lg text-sm text-gray-600">
                🎤 マイク機能無効 - リスニング専用モード
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }, []);

  // Step B-2': 基音再生専用フェーズ実装（マイク不在モード対応）
  const executeBaseToneOnlyPhase = useCallback(async (trainingMode?: 'random' | 'continuous' | 'chromatic') => {
    addLog('🎹 Step B-2\': 基音再生専用フェーズ開始');
    updateSystemStatusWithPhase(AudioSystemPhase.BASE_TONE_PHASE, '基音専用モード - マイク機能無し');
    
    try {
      // 1. マイクシステム完全停止確認
      if (streamRef.current || audioContextRef.current) {
        addLog('🔇 マイク残存検出 - 完全停止実行');
        await stopMicrophoneSystemCompletely();
      }
      
      // 2. 基音システム初期化（iPhone最適化）
      if (!samplerRef.current) {
        addLog('🎹 Salamander Piano Sampler初期化中...');
        updateSystemStatus('基音システム準備中...', 'yellow');
        
        // Tone.js AudioContext開始（ユーザー操作後）
        if (Tone.context.state !== 'running') {
          await Tone.start();
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
        addLog('✅ Salamander Piano準備完了');
      }
      
      // 3. モード別基音実行
      switch (trainingMode) {
        case 'random':
          await executeRandomListeningMode();
          break;
        case 'continuous':
          await executeContinuousListeningMode();
          break;
        case 'chromatic':
          await executeChromaticListeningMode();
          break;
        default:
          // デフォルトランダムモード
          await executeRandomListeningMode();
      }
      
    } catch (error) {
      addLog(`❌ Step B-2'実行エラー: ${error}`);
      await transitionToErrorState(`基音専用フェーズエラー: ${error}`);
    }
  }, [addLog, updateSystemStatusWithPhase, stopMicrophoneSystemCompletely, transitionToErrorState, updateSystemStatus]);

  // Step B-2': ランダムリスニングモード実装
  const executeRandomListeningMode = useCallback(async () => {
    addLog('🎲 ランダム基音リスニングモード開始');
    updateListeningOnlyUI('random', '10種類の基音からランダム選択でリスニング練習');
    
    const baseTone = selectRandomBaseTone();
    setCurrentBaseTone(baseTone);
    
    if (samplerRef.current && baseTone) {
      addLog(`🎵 基音再生: ${baseTone.note} (${baseTone.frequency.toFixed(2)}Hz)`);
      
      // iPhone音量最適化（マイク無効時は最大音量）
      samplerRef.current.volume.value = -6; // iPhone最適化音量
      samplerRef.current.triggerAttackRelease(baseTone.tonejs, '2n');
      
      updateListeningOnlyUI('random', `🎵 再生中: ${baseTone.note} (${baseTone.frequency.toFixed(2)}Hz)\n🎯 この音を基準に相対音程を確認してください`);
    }
  }, [addLog, selectRandomBaseTone, updateListeningOnlyUI]);

  // Step B-2': 連続リスニングモード実装
  const executeContinuousListeningMode = useCallback(async () => {
    addLog('🔄 連続基音リスニングモード開始');
    updateListeningOnlyUI('continuous', '同じ基音で連続リスニング練習 (5ラウンド)');
    
    const baseTone = currentBaseTone || selectRandomBaseTone();
    setCurrentBaseTone(baseTone);
    
    if (samplerRef.current && baseTone) {
      for (let round = 1; round <= 5; round++) {
        addLog(`🎵 ラウンド${round}/5: ${baseTone.note} 再生`);
        
        samplerRef.current.volume.value = -6; // iPhone最適化
        samplerRef.current.triggerAttackRelease(baseTone.tonejs, '2n');
        
        updateListeningOnlyUI('continuous', `🔄 ラウンド${round}/5\n🎵 基音: ${baseTone.note} (${baseTone.frequency.toFixed(2)}Hz)\n⏱️ 次のラウンドまで3秒...`);
        
        // ラウンド間待機
        if (round < 5) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      updateListeningOnlyUI('continuous', `✅ 連続リスニング完了\n🎯 基音: ${baseTone.note}\n📈 集中力・記憶力向上に効果的`);
    }
  }, [addLog, currentBaseTone, selectRandomBaseTone, updateListeningOnlyUI]);

  // Step B-2': クロマティックリスニングモード実装
  const executeChromaticListeningMode = useCallback(async () => {
    addLog('🎵 クロマティック基音リスニングモード開始');
    updateListeningOnlyUI('chromatic', '12音半音階での系統的リスニング練習');
    
    const chromaticNotes = [
      { note: 'C', octave: 4, frequency: 261.63 },
      { note: 'C#', octave: 4, frequency: 277.18 },
      { note: 'D', octave: 4, frequency: 293.66 },
      { note: 'D#', octave: 4, frequency: 311.13 },
      { note: 'E', octave: 4, frequency: 329.63 },
      { note: 'F', octave: 4, frequency: 349.23 },
      { note: 'F#', octave: 4, frequency: 369.99 },
      { note: 'G', octave: 4, frequency: 392.00 },
      { note: 'G#', octave: 4, frequency: 415.30 },
      { note: 'A', octave: 4, frequency: 440.00 },
      { note: 'A#', octave: 4, frequency: 466.16 },
      { note: 'B', octave: 4, frequency: 493.88 }
    ];
    
    if (samplerRef.current) {
      for (let i = 0; i < chromaticNotes.length; i++) {
        const note = chromaticNotes[i];
        
        addLog(`🎵 ${i + 1}/12: ${note.note}${note.octave} (${note.frequency.toFixed(2)}Hz)`);
        
        samplerRef.current.volume.value = -6;
        samplerRef.current.triggerAttackRelease(`${note.note}${note.octave}`, '1n');
        
        updateListeningOnlyUI('chromatic', `🎵 ${i + 1}/12: ${note.note}${note.octave}\n🎯 周波数: ${note.frequency.toFixed(2)}Hz\n📊 半音間隔: ${i > 0 ? Math.round(1200 * Math.log2(note.frequency / chromaticNotes[i-1].frequency)) : 0}セント`);
        
        // 音間待機（2秒）
        if (i < chromaticNotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      updateListeningOnlyUI('chromatic', `✅ 12音クロマティック完了\n🎯 全半音階リスニング習得\n🎼 精密な音程感覚向上`);
    }
  }, [addLog, updateListeningOnlyUI]);

  // 旧マイクロフォンシステム停止（Step A改修により非推奨、完全停止版を使用）
  const stopMicrophoneSystem = useCallback(() => {
    addLog('⚠️ 旧stopMicrophoneSystem呼び出し - stopMicrophoneSystemCompletelyを使用してください');
    stopMicrophoneSystemCompletely();
  }, [stopMicrophoneSystemCompletely, addLog]);

  // Step A: コンポーネント初期化（フェーズ管理対応）
  useEffect(() => {
    addLog('🚀 分離型音声システム開始（Step B-1: フェーズ移行制御システム版）');
    updateSystemStatusWithPhase(AudioSystemPhase.IDLE, 'システム初期化完了');
    
    if (isIOSSafari()) {
      addLog('📱 iPhone Safari環境を検出 - 最適化設定適用');
    } else {
      addLog('🖥️ PC/Android環境を検出 - 標準設定適用');
    }
  }, [addLog, updateSystemStatusWithPhase, isIOSSafari]);

  // Step B-0: 初期化時マイクロフォン可用性チェック
  useEffect(() => {
    const initializeMicAvailabilityCheck = async () => {
      addLog('🏁 アプリケーション初期化開始 - マイク可用性チェック実行');
      // 初期化時は自動でマイク可用性をチェック（非侵襲的）
      await performMicrophoneAvailabilityCheck();
    };
    
    initializeMicAvailabilityCheck();
  }, [addLog, performMicrophoneAvailabilityCheck]);

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
          <div className="inline-block bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
            Step B-1: フェーズ移行制御システム
          </div>
          <div className="mt-2 text-sm text-gray-600">
            安全な基音↔採点フェーズ切り替え + iPhone最適化待機
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
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🔄</span>
                <span className="text-blue-600 font-semibold">Step B-1: フェーズ移行制御システム実装</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step B-0: マイクロフォンエラーダイアログ */}
        {showMicErrorDialog && micAvailability && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">
                {micAvailability.errorType === MicrophoneErrorType.PERMISSION_DENIED && '🚫'}
                {micAvailability.errorType === MicrophoneErrorType.NO_DEVICES && '🎤❌'}
                {micAvailability.errorType === MicrophoneErrorType.DEVICE_IN_USE && '🔄'}
                {micAvailability.errorType === MicrophoneErrorType.HARDWARE_ERROR && '⚠️'}
                {micAvailability.errorType === MicrophoneErrorType.SYSTEM_ERROR && '🖥️❌'}
                {micAvailability.errorType === MicrophoneErrorType.SECURITY_ERROR && '🔒'}
                {micAvailability.errorType === MicrophoneErrorType.BROWSER_NOT_SUPPORTED && '🌐❌'}
                {!Object.values(MicrophoneErrorType).includes(micAvailability.errorType as MicrophoneErrorType) && '❓'}
              </span>
              <h3 className="text-xl font-bold text-red-800">マイクロフォンの問題</h3>
            </div>
            
            <p className="text-red-700 mb-4 text-lg">{micAvailability.errorMessage}</p>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-blue-800 mb-2">💡 解決方法</h4>
              <p className="text-blue-700">{micAvailability.suggestedAction}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div><strong>エラー種別:</strong> {micAvailability.errorType}</div>
              <div><strong>再試行可能:</strong> {micAvailability.canRetry ? '✅ はい' : '❌ いいえ'}</div>
              <div><strong>代替機能:</strong> {micAvailability.fallbackAvailable ? '✅ 基音専用モード利用可能' : '❌ なし'}</div>
            </div>
            
            <div className="flex space-x-3">
              {micAvailability.canRetry && (
                <button
                  onClick={retryMicrophoneAccess}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
                >
                  🔄 再試行
                </button>
              )}
              
              {micAvailability.fallbackAvailable && (
                <button
                  onClick={startFallbackMode}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
                >
                  🎹 基音専用モードで続行
                </button>
              )}
              
              <button
                onClick={() => setShowMicErrorDialog(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
              >
                ❌ 閉じる
              </button>
            </div>
          </div>
        )}

        {/* マイクロフォンテスト表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 マイクロフォンテスト結果</h3>
          <div ref={testDisplayRef} className="text-lg min-h-32 flex items-center justify-center">
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

        {/* Step B-0: マイクロフォン可用性チェックボタン */}
        <div className="mb-6">
          <div className="text-center text-sm font-bold text-gray-700 mb-3">
            🎤 マイクロフォン可用性チェック（Step B-0）
          </div>
          
          <div className="flex space-x-4 justify-center mb-4">
            <button
              onClick={performMicrophoneAvailabilityCheck}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              🔍 マイク可用性テスト
            </button>
            
            {micAvailability && appOperationMode === AppOperationMode.LISTENING_ONLY && (
              <button
                onClick={() => setAppOperationMode(AppOperationMode.FULL_TRAINING)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-md"
              >
                🔄 フル機能復帰
              </button>
            )}
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm">
              <strong>現在のモード:</strong>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
                appOperationMode === AppOperationMode.FULL_TRAINING 
                  ? 'bg-green-100 text-green-800' 
                  : appOperationMode === AppOperationMode.LISTENING_ONLY
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {appOperationMode === AppOperationMode.FULL_TRAINING && '🎵 フル機能'}
                {appOperationMode === AppOperationMode.LISTENING_ONLY && '🎹 基音専用'}
                {appOperationMode === AppOperationMode.DEMO_MODE && '🎬 デモモード'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              12種類のエラーケース完全対応システム
            </div>
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

        {/* Step B-2': 基音再生専用フェーズ（マイク不在モード対応）*/}
        <div className="mb-6">
          <div className="text-center text-sm font-bold text-gray-700 mb-3">
            🎹 Step B-2&apos;: 基音再生専用フェーズ（3つのトレーニングモード）
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => executeBaseToneOnlyPhase('random')}
              className="px-4 py-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <div className="text-2xl mb-1">🎲</div>
              <div className="text-sm">ランダム基音</div>
              <div className="text-xs opacity-80">10種基音ランダム</div>
            </button>
            
            <button
              onClick={() => executeBaseToneOnlyPhase('continuous')}
              className="px-4 py-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <div className="text-2xl mb-1">🔄</div>
              <div className="text-sm">連続ラウンド</div>
              <div className="text-xs opacity-80">5ラウンド連続</div>
            </button>
            
            <button
              onClick={() => executeBaseToneOnlyPhase('chromatic')}
              className="px-4 py-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg font-bold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <div className="text-2xl mb-1">🎵</div>
              <div className="text-sm">クロマティック</div>
              <div className="text-xs opacity-80">12音半音階</div>
            </button>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-xs text-gray-600">
              マイクロフォン不在時の代替トレーニングモード
            </div>
            <div className="text-xs text-gray-500">
              🎯 相対音程の聴覚的理解・音感向上に効果的
            </div>
          </div>
          
          {appOperationMode === AppOperationMode.LISTENING_ONLY && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800 text-sm font-medium">
                  マイク不在モード: 採点機能なし、リスニング専用
                </span>
              </div>
            </div>
          )}
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

        {/* Step B-1.5: マイクエラーダイアログ */}
        {showMicErrorDialog && micAvailability && currentTrainingMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎤❌</div>
                <h3 className="text-xl font-bold text-red-800">マイクロフォンの問題</h3>
              </div>
              
              <p className="text-red-700 mb-4 text-lg">{micAvailability.errorMessage}</p>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <h4 className="font-bold text-blue-800 mb-2">💡 解決方法</h4>
                <p className="text-blue-700">{micAvailability.suggestedAction}</p>
              </div>
              
              <div className={`bg-${currentTrainingMode.uiColor}-50 border border-${currentTrainingMode.uiColor}-200 p-4 rounded-lg mb-4`}>
                <h4 className="font-bold mb-2">🎵 フォールバック機能 ({currentTrainingMode.educationalValue}%の教育価値)</h4>
                <p className="text-sm mb-3">{currentTrainingMode.userMessage}</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">✅ 利用可能機能</h5>
                    <ul className="text-xs space-y-1">
                      {currentTrainingMode.fallbackFeatures.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">❌ 制限事項</h5>
                    <ul className="text-xs space-y-1">
                      {currentTrainingMode.fallbackLimitations.map((limitation, index) => (
                        <li key={index}>{limitation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {micAvailability.canRetry && (
                  <button 
                    onClick={handleMicErrorRetry}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    🔄 再試行
                  </button>
                )}
                <button 
                  onClick={handleAcceptFallback}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  🎹 聴音モードで継続
                </button>
              </div>
            </div>
          </div>
        )}

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
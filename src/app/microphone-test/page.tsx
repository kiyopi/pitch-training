'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// shadcn/ui コンポーネントをインラインスタイルで実装するため削除
import { Music, RotateCcw, Target, Mic, VolumeX, Volume2, ArrowLeft } from "lucide-react";
import { PitchDetector } from 'pitchy';

// 型定義
interface MicTestState {
  micPermission: 'pending' | 'granted' | 'denied' | 'error';
  volumeDetected: boolean;
  frequencyDetected: boolean;
  startButtonEnabled: boolean;
}

interface TrainingMode {
  id: 'random' | 'continuous' | 'chromatic';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPath: string;
  bgColor: string;
  iconColor: string;
}

const TRAINING_MODES: Record<string, TrainingMode> = {
  random: {
    id: 'random',
    name: 'ランダム基音モード',
    description: '10種類の基音からランダムに選択してトレーニング',
    icon: Music,
    targetPath: '/random-training',
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  continuous: {
    id: 'continuous',
    name: '連続チャレンジモード',
    description: '選択した回数だけ連続で実行し、総合評価を確認',
    icon: RotateCcw,
    targetPath: '/training/continuous',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  chromatic: {
    id: 'chromatic',
    name: '12音階モード',
    description: 'クロマチックスケールの上行・下行で完全制覇',
    icon: Target,
    targetPath: '/training/chromatic',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
};

// 🎵 Step D2c: 音名・オクターブ表示機能 - 完全日本語音名変換テーブル
const NOTE_CONVERSION: Record<string, string> = {
  // 基本7音階 (3オクターブ対応) - C4（ド4）形式
  'C3': 'C3（ド3）', 'C4': 'C4（ド4）', 'C5': 'C5（ド5）', 'C6': 'C6（ド6）',
  'D3': 'D3（レ3）', 'D4': 'D4（レ4）', 'D5': 'D5（レ5）', 'D6': 'D6（レ6）',
  'E3': 'E3（ミ3）', 'E4': 'E4（ミ4）', 'E5': 'E5（ミ5）', 'E6': 'E6（ミ6）',
  'F3': 'F3（ファ3）', 'F4': 'F4（ファ4）', 'F5': 'F5（ファ5）', 'F6': 'F6（ファ6）',
  'G3': 'G3（ソ3）', 'G4': 'G4（ソ4）', 'G5': 'G5（ソ5）', 'G6': 'G6（ソ6）',
  'A3': 'A3（ラ3）', 'A4': 'A4（ラ4）', 'A5': 'A5（ラ5）', 'A6': 'A6（ラ6）',
  'B3': 'B3（シ3）', 'B4': 'B4（シ4）', 'B5': 'B5（シ5）', 'B6': 'B6（シ6）',
  
  // 半音階対応（#系）- C4（ド4）形式
  'C#3': 'C#3（ド#3）', 'C#4': 'C#4（ド#4）', 'C#5': 'C#5（ド#5）',
  'D#3': 'D#3（レ#3）', 'D#4': 'D#4（レ#4）', 'D#5': 'D#5（レ#5）',
  'F#3': 'F#3（ファ#3）', 'F#4': 'F#4（ファ#4）', 'F#5': 'F#5（ファ#5）',
  'G#3': 'G#3（ソ#3）', 'G#4': 'G#4（ソ#4）', 'G#5': 'G#5（ソ#5）',
  'A#3': 'A#3（ラ#3）', 'A#4': 'A#4（ラ#4）', 'A#5': 'A#5（ラ#5）',
  
  // 低音域拡張（C2）- C4（ド4）形式
  'C2': 'C2（ド2）', 'D2': 'D2（レ2）', 'E2': 'E2（ミ2）', 
  'F2': 'F2（ファ2）', 'G2': 'G2（ソ2）', 'A2': 'A2（ラ2）', 'B2': 'B2（シ2）',
};

// 周波数から音名を計算
function frequencyToNote(frequency: number): { note: string; octave: number } {
  if (frequency <= 0) return { note: 'C', octave: 4 };
  
  const A4 = 440;
  const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const noteIndex = ((semitonesFromA4 + 9) % 12 + 12) % 12;
  const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
  
  return { note: noteNames[noteIndex], octave };
}

function MicrophoneTestContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'random';
  const selectedMode = TRAINING_MODES[mode] || TRAINING_MODES.random;
  
  // React状態管理（制御用のみ）
  const [micState, setMicState] = useState<MicTestState>({
    micPermission: 'pending',
    volumeDetected: false,
    frequencyDetected: false,
    startButtonEnabled: false
  });
  
  const [error, setError] = useState<string>('');
  
  // DOM References（DDAS - Direct DOM Audio System）
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumePercentRef = useRef<HTMLDivElement>(null);
  const noteDisplayRef = useRef<HTMLDivElement>(null);
  
  // Audio処理用Refs + Webインスペクター用グローバル公開
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 🔍 Webインスペクター用デバッグオブジェクト
  const debugStateRef = useRef({
    audioContextState: 'closed',
    micStreamActive: false,
    analyserConnected: false,
    pitchDetectorReady: false,
    lastFrequency: 0,
    lastVolume: 0,
    lastClarity: 0,
    eventListenersActive: false,
    cleanupCallCount: 0,
    architectureLayer: 'audio-manual-management'
  });
  
  // ノイズリダクションフィルター用Refs
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // 音量スムージング用
  const previousVolumeRef = useRef<number>(0);

  // 🔍 Webインスペクター用グローバル公開関数
  useEffect(() => {
    // グローバルオブジェクトに音響デバッグ情報を公開
    (window as typeof window & { __PITCH_TRAINING_DEBUG__: Record<string, unknown> }).__PITCH_TRAINING_DEBUG__ = {
      // 音響システム状態
      getAudioState: () => ({
        audioContext: audioContextRef.current?.state || 'null',
        micStream: micStreamRef.current?.active || false,
        analyser: !!analyserRef.current,
        pitchDetector: !!pitchDetectorRef.current,
        animationFrame: !!animationFrameRef.current,
        debugState: debugStateRef.current
      }),
      
      // リアルタイム音響データ + Step D2c: 音名情報追加
      getCurrentAudioData: () => {
        const freq = debugStateRef.current.lastFrequency;
        let noteInfo = null;
        
        if (freq > 80 && freq < 2000) {
          const { note, octave } = frequencyToNote(freq);
          const noteKey = `${note}${octave}`;
          const displayName = NOTE_CONVERSION[noteKey] || `${note}${octave}`;
          
          noteInfo = {
            note,
            octave,
            noteKey,
            displayName,
            isSharp: note.includes('#')
          };
        }
        
        return {
          frequency: freq,
          volume: debugStateRef.current.lastVolume,
          clarity: debugStateRef.current.lastClarity,
          noteInfo,
          timestamp: new Date().toISOString()
        };
      },
      
      // 手動クリーンアップ実行
      forceCleanup: () => {
        console.log('🔍 デバッグ: 手動クリーンアップ実行');
        cleanup();
      },
      
      // アーキテクチャ情報
      getArchitecture: () => ({
        design: 'UI-React + Audio-Manual',
        layer: 'Separated Architecture',
        audioManagement: 'Manual Event Driven',
        uiManagement: 'React State Driven',
        version: 'v3.0.0-audio-architecture'
      }),
      
      // イベントリスナー状態
      getEventListeners: () => ({
        setup: eventListenersSetupRef.current,
        cleanupFunction: !!cleanupEventListenersRef.current
      })
    };
    
    console.log('🔍 Webインスペクター用デバッグオブジェクト公開: window.__PITCH_TRAINING_DEBUG__');
    
    // クリーンアップ時にグローバルオブジェクト削除
    return () => {
      const windowWithDebug = window as typeof window & { __PITCH_TRAINING_DEBUG__?: Record<string, unknown> };
      if (windowWithDebug.__PITCH_TRAINING_DEBUG__) {
        delete windowWithDebug.__PITCH_TRAINING_DEBUG__;
      }
    };
  }, []); // cleanup関数は後で定義されるため依存配列から削除
  
  // 音量バー初期化（CLAUDE.md準拠: iPhone WebKit対応）
  useEffect(() => {
    // コンポーネントマウント時に確実に初期化
    if (volumeBarRef.current) {
      volumeBarRef.current.style.width = '0%';
      volumeBarRef.current.style.backgroundColor = '#10b981';
      volumeBarRef.current.style.height = '12px';
      volumeBarRef.current.style.borderRadius = '9999px';
      volumeBarRef.current.style.transition = 'all 0.1s ease-out';
    }
  }, []);
  
  // DOM直接操作関数（DDAS）
  const updateFrequencyDisplay = useCallback((frequency: number | null) => {
    if (frequencyDisplayRef.current) {
      if (frequency && frequency > 80 && frequency < 2000) {
        frequencyDisplayRef.current.innerHTML = `
          <div class="flex items-center justify-center">
            <div class="text-xl sm:text-2xl font-bold text-blue-800">${frequency.toFixed(1)} Hz</div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="flex items-center justify-center">
            <div class="text-xl sm:text-2xl text-neutral-600">🎵 音声を発声してください</div>
          </div>
        `;
      }
    }
  }, []);
  
  // 🎵 Step D2c: 音名・オクターブ表示機能 - 拡張音名表示（DOM直接操作） + チカチカ対策
  const lastNoteDisplayRef = useRef<string | null>(null); // 前回表示内容の記録
  
  const updateNoteDisplay = useCallback((frequency: number | null) => {
    if (noteDisplayRef.current) {
      if (frequency && frequency > 80 && frequency < 2000) {
        const { note, octave } = frequencyToNote(frequency);
        const noteKey = `${note}${octave}`;
        const displayName = NOTE_CONVERSION[noteKey] || `${note}${octave}`;
        
        // 🔧 チカチカ対策: 同じ音名の場合は更新しない
        if (lastNoteDisplayRef.current === noteKey) {
          return; // 同じ音名なら早期リターン
        }
        
        // オクターブレベル判定（視覚的色分け）
        const getOctaveColor = (octave: number): string => {
          if (octave <= 2) return 'text-blue-800';      // 極低音域
          if (octave === 3) return 'text-green-800';    // 低音域
          if (octave === 4) return 'text-purple-800';   // 中音域
          if (octave === 5) return 'text-orange-800';   // 高音域
          return 'text-red-800';                        // 最高音域
        };
        
        // 音名種別判定（基本音・半音の視覚的区別）
        const isSharpNote = note.includes('#');
        const noteTypeIcon = isSharpNote ? '♯' : '♪';
        
        // 🔍 デバッグ状態更新: 詳細音名情報
        debugStateRef.current.lastFrequency = frequency;
        
        // 前回表示内容を更新
        lastNoteDisplayRef.current = noteKey;
        
        noteDisplayRef.current.innerHTML = `
          <div class="text-center">
            <div class="flex items-center justify-center space-x-3">
              <div class="text-2xl">${noteTypeIcon}</div>
              <div class="text-xl sm:text-2xl font-bold ${getOctaveColor(octave)}">${displayName}</div>
            </div>
          </div>
        `;
      } else {
        // 無音状態の場合は前回表示をクリア
        if (lastNoteDisplayRef.current !== null) {
          lastNoteDisplayRef.current = null;
          noteDisplayRef.current.innerHTML = `
            <div class="text-center text-neutral-600 space-y-2">
              <div class="text-lg">🎵 音声を発声してください</div>
            </div>
          `;
        }
      }
    }
  }, []);
  
  const updateVolumeDisplay = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    // iPhoneレンダリング問題対応：完全にstyle属性で制御
    if (volumeBarRef.current) {
      volumeBarRef.current.style.width = `${clampedVolume}%`;
      volumeBarRef.current.style.backgroundColor = '#10b981';
      volumeBarRef.current.style.height = '12px';
      volumeBarRef.current.style.borderRadius = '9999px';
      volumeBarRef.current.style.transition = 'all 0.1s ease-out';
    }
    
    // パーセント表示更新（innerHTMLで全体を更新）
    if (volumePercentRef.current) {
      volumePercentRef.current.innerHTML = `<span class="text-sm text-neutral-700 font-medium">${clampedVolume.toFixed(1)}%</span>`;
    }
  }, []);
  
  // マイク許可とセットアップ
  const requestMicrophonePermission = useCallback(async () => {
    try {
      setMicState(prev => ({ ...prev, micPermission: 'pending' }));
      setError('');
      
      // Web Audio API サポートチェック
      if (!window.AudioContext && !(window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext) {
        throw new Error('Web Audio APIがサポートされていません');
      }
      
      // getUserMedia サポートチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('マイクアクセスAPIがサポートされていません');
      }
      
      // マイクアクセス要求
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      micStreamRef.current = stream;
      
      // AudioContext セットアップ + デバッグ状態更新
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // 🔍 デバッグ状態更新
      debugStateRef.current.audioContextState = audioContext.state;
      debugStateRef.current.micStreamActive = true;
      
      // 音声分析ノード作成
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8; // 安定化重視（テスト実装と同じ）
      analyserRef.current = analyser;
      
      // 🚨 iPhone AudioContext競合対策: プラットフォーム適応型フィルター
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const source = audioContext.createMediaStreamSource(stream);
      
      // フィルター変数を共通スコープで宣言
      let highPassFilter: BiquadFilterNode;
      let lowPassFilter: BiquadFilterNode | null = null;
      let notchFilter: BiquadFilterNode | null = null;
      let gainNode: GainNode;
      
      if (isIOS) {
        // iPhone: 軽量化フィルター（AudioContext競合回避）
        highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(60, audioContext.currentTime); // 軽量設定
        highPassFilter.Q.setValueAtTime(0.5, audioContext.currentTime); // 軽量Q値
        
        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.5, audioContext.currentTime); // iPhone音量補強
        
        // 軽量接続: source → highpass → gain → analyser
        source.connect(highPassFilter);
        highPassFilter.connect(gainNode);
        gainNode.connect(analyser);
        
        console.log('🍎 iPhone軽量化フィルター適用: AudioContext競合回避');
        
      } else {
        // PC: 標準3段階フィルター（従来通り）
        highPassFilter = audioContext.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.setValueAtTime(80, audioContext.currentTime);
        highPassFilter.Q.setValueAtTime(1.0, audioContext.currentTime);
        
        lowPassFilter = audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
        lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
        
        notchFilter = audioContext.createBiquadFilter();
        notchFilter.type = 'notch';
        notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
        notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
        
        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        
        // PC標準接続: source → 3段階フィルター → analyser
        source.connect(highPassFilter);
        lowPassFilter && highPassFilter.connect(lowPassFilter);
        notchFilter && lowPassFilter && lowPassFilter.connect(notchFilter);
        (notchFilter || lowPassFilter || highPassFilter).connect(gainNode);
        gainNode.connect(analyser);
        
        console.log('💻 PC標準3段階フィルター適用');
      }
      
      // 🔧 フィルターRefs保存（プラットフォーム適応型）
      highPassFilterRef.current = highPassFilter;
      lowPassFilterRef.current = lowPassFilter;
      notchFilterRef.current = notchFilter;
      gainNodeRef.current = gainNode;
      
      // Pitchy セットアップ + デバッグ状態更新
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      
      // 🔍 デバッグ状態更新
      debugStateRef.current.analyserConnected = true;
      debugStateRef.current.pitchDetectorReady = true;
      
      console.log('✅ マイク許可成功: 状態をgrantedに変更');
      setMicState(prev => ({ ...prev, micPermission: 'granted' }));
      
      // 音量バー初期化（iPhoneレンダリング問題対応）
      if (volumeBarRef.current) {
        volumeBarRef.current.style.width = '0%';
        volumeBarRef.current.style.backgroundColor = '#10b981';
        volumeBarRef.current.style.height = '12px';
        volumeBarRef.current.style.borderRadius = '9999px';
        volumeBarRef.current.style.transition = 'all 0.1s ease-out';
      }
      
      // useEffectの代わりに手動でイベントリスナー設定
      setupEventListenersManually();
      
      console.log('🎤 リアルタイム音声処理開始');
      // リアルタイム処理開始
      startFrequencyDetection();
      
      console.log('📊 マイクセットアップ完了 - 状態:', {
        stream: !!micStreamRef.current,
        audioContext: !!audioContextRef.current,
        analyser: !!analyserRef.current
      });
      
    } catch (error: unknown) {
      console.error('Microphone setup error:', error);
      setMicState(prev => ({ ...prev, micPermission: 'error' }));
      
      const errorWithName = error as Error & { name?: string };
      
      if (errorWithName.name === 'NotAllowedError') {
        setError('マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。');
      } else if (errorWithName.name === 'NotFoundError') {
        setError('マイクが見つかりません。マイクが接続されていることを確認してください。');
      } else if (errorWithName.name === 'OverconstrainedError') {
        setError('マイクの設定に問題があります。別のマイクをお試しください。');
      } else {
        setError(`マイクアクセスエラー: ${errorWithName.message || 'Unknown error'}`);
      }
    }
  }, []);
  
  // 周波数検出処理（DDAS方式）
  const startFrequencyDetection = useCallback(() => {
    const processAudio = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) return;
      
      const bufferLength = analyserRef.current.fftSize;
      
      // 音量計算（テスト実装と同じ方式）
      const byteTimeDomainData = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(byteTimeDomainData);
      
      // 128中心の8bitデータをRMS計算
      let sum = 0;
      let maxAmplitude = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const sample = (byteTimeDomainData[i] - 128) / 128;  // -1 to 1 正規化
        sum += sample * sample;
        maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
      }
      
      const rms = Math.sqrt(sum / bufferLength);
      // 🚨 iPhone AudioContext競合対策: 音量処理最適化（過剰増幅修正版）
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const volumeConfig = {
        divisor: isIOS ? 2.0 : 4.0,           // iPhone: 小さい除数、PC: 大きい除数（正常値復元）
        noiseThreshold: isIOS ? 8 : 15        // iPhone: 低閾値、PC: 高閾値（正常値復元）
      };
      
      // 🚨 デグレード修正: gainMultiplier除去で正常な音量計算に復元
      const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
      
      // 音量計算（仕様書推奨実装）- スムージング後にノイズ閾値適用
      const rawVolumePercent = Math.min(Math.max(calculatedVolume / volumeConfig.divisor * 100, 0), 100);
      
      // 音量スムージング（ノイズ閾値適用前）
      const smoothingFactor = 0.2;
      const smoothedRawVolume = previousVolumeRef.current + smoothingFactor * (rawVolumePercent - previousVolumeRef.current);
      previousVolumeRef.current = smoothedRawVolume;
      
      // ノイズ閾値適用（スムージング後）- VOLUME_PROCESSING_REVIEW.md準拠
      const volumePercent = smoothedRawVolume > volumeConfig.noiseThreshold ? smoothedRawVolume : 0;
      
      // 🔍 デバッグ: 無音時50%問題調査用ログ
      if (Math.random() < 0.01) { // 1%の確率でログ出力（スパム防止）
        console.log(`🔍 Volume Debug - raw:${rawVolumePercent.toFixed(1)}, smoothed:${smoothedRawVolume.toFixed(1)}, threshold:${volumeConfig.noiseThreshold}, final:${volumePercent.toFixed(1)}, iOS:${isIOS}`);
      }
      
      // DOM直接更新 + デバッグ状態更新
      updateVolumeDisplay(volumePercent);
      
      // 🔍 デバッグ状態更新: 音量
      debugStateRef.current.lastVolume = volumePercent;
      
      // 周波数検出用のFloat32Array取得
      const floatDataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(floatDataArray);
      
      // 周波数検出
      const [frequency, clarity] = pitchDetectorRef.current.findPitch(floatDataArray, 44100);
      
      // 🔍 デバッグ状態更新: 周波数・明瞭度
      debugStateRef.current.lastFrequency = frequency || 0;
      debugStateRef.current.lastClarity = clarity || 0;
      
      if (frequency && clarity > 0.6 && frequency >= 80 && frequency <= 2000) {
        // DOM直接更新
        updateFrequencyDisplay(frequency);
        updateNoteDisplay(frequency);
        
        setMicState(prev => ({ 
          ...prev, 
          volumeDetected: volumePercent > 1,
          frequencyDetected: true,
          startButtonEnabled: volumePercent > 1
        }));
      } else {
        updateFrequencyDisplay(null);
        updateNoteDisplay(null);
        
        setMicState(prev => ({ 
          ...prev, 
          volumeDetected: volumePercent > 1,
          frequencyDetected: false
        }));
      }
      
      animationFrameRef.current = requestAnimationFrame(processAudio);
    };
    
    processAudio();
  }, [updateFrequencyDisplay, updateNoteDisplay, updateVolumeDisplay]);
  
  // 強化クリーンアップ（マイクOFFタイミング検証対応） + デバッグ状態更新
  const cleanup = useCallback(() => {
    // 🔍 デバッグ状態更新: クリーンアップ実行回数
    debugStateRef.current.cleanupCallCount += 1;
    
    console.log('🗿 マイクリソースクリーンアップ開始');
    
    // 1. アニメーションフレーム停止
    if (animationFrameRef.current) {
      console.log('⚙️ アニメーションフレーム停止');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // 2. MediaStream停止（最重要）
    if (micStreamRef.current) {
      console.log('🎤 MediaStreamトラック停止');
      micStreamRef.current.getTracks().forEach((track, index) => {
        console.log(`  - トラック${index}: ${track.kind} (${track.label}) 停止`);
        track.stop();
      });
      micStreamRef.current = null;
    }
    
    // 3. AudioContext閉鎖
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log('🔊 AudioContext閉鎖');
      audioContextRef.current.close().catch(err => {
        console.warn('⚠️ AudioContext閉鎖エラー:', err);
      });
      audioContextRef.current = null;
    }
    
    // 4. フィルターRefs初期化
    console.log('🔧 フィルターRefs初期化');
    highPassFilterRef.current = null;
    lowPassFilterRef.current = null;
    notchFilterRef.current = null;
    gainNodeRef.current = null;
    previousVolumeRef.current = 0;
    
    // 5. UIリセット
    if (volumeBarRef.current) {
      volumeBarRef.current.style.width = '0%';
    }
    if (volumePercentRef.current) {
      volumePercentRef.current.innerHTML = '<span class="text-sm text-neutral-700 font-medium">0%</span>';
    }
    if (frequencyDisplayRef.current) {
      frequencyDisplayRef.current.innerHTML = '<div class="text-center text-neutral-600">🎵 音声を発声してください</div>';
    }
    if (noteDisplayRef.current) {
      noteDisplayRef.current.innerHTML = `
        <div class="text-center text-neutral-600 space-y-2">
          <div class="text-lg">🎵 音声を発声してください</div>
        </div>
      `;
    }
    
    // 🔍 デバッグ状態リセット + チカチカ対策リセット
    debugStateRef.current.audioContextState = 'closed';
    debugStateRef.current.micStreamActive = false;
    debugStateRef.current.analyserConnected = false;
    debugStateRef.current.pitchDetectorReady = false;
    debugStateRef.current.lastFrequency = 0;
    debugStateRef.current.lastVolume = 0;
    debugStateRef.current.lastClarity = 0;
    
    // 音名表示のチカチカ対策もリセット
    lastNoteDisplayRef.current = null;
    
    console.log('✅ マイクリソースクリーンアップ完了');
  }, []);
  
  // イベントリスナー管理用のRef
  const eventListenersSetupRef = useRef<boolean>(false);
  const cleanupEventListenersRef = useRef<(() => void) | null>(null);

  // 🎵 音響特化手動管理システム: React依存を排除して音声処理の安定性確保
  const setupEventListenersManually = useCallback(() => {
    if (eventListenersSetupRef.current) return; // 重複設定防止
    
    console.log('🎵 音響特化イベントリスナー設定開始');
    
    // ページ離脱時の緊急音声リソース解放
    const handleBeforeUnload = () => {
      console.log('🚨 緊急音声リソース解放: ページ離脱検出');
      cleanup(); // AudioContext・MediaStream即座停止
    };
    
    // タブ非アクティブ時の音声処理一時停止（音響アプリ専用）
    const handleVisibilityChange = () => {
      console.log(`🎵 音響処理制御: タブ=${document.hidden ? '非アクティブ' : 'アクティブ'}`);
      
      // 音響処理中のタブ切り替えでノイズ・遅延回避
      if (document.hidden) {
        // React state に依存せず、直接音声リソース状態をチェック
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          console.log('🎵 タブ非アクティブ: 音声処理を安全停止');
          cleanup(); // React state更新前に音声リソース解放
          setMicState(prev => ({ ...prev, micPermission: 'pending' })); // UI更新は後
        }
      }
    };
    
    // 音響処理用イベントリスナー登録（通常のWebアプリより優先度高）
    window.addEventListener('beforeunload', handleBeforeUnload, { passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    
    // 音響特化クリーンアップ関数（AudioContext優先）
    cleanupEventListenersRef.current = () => {
      console.log('🎵 音響リソース完全解放開始');
      
      // 1. 音声処理を最優先で停止
      cleanup();
      
      // 2. イベントリスナー削除
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // 3. 管理状態リセット
      eventListenersSetupRef.current = false;
      cleanupEventListenersRef.current = null;
      
      console.log('🎵 音響リソース完全解放完了');
    };
    
    eventListenersSetupRef.current = true;
    
    // 🔍 デバッグ状態更新: イベントリスナー設定完了
    debugStateRef.current.eventListenersActive = true;
    
    console.log('🎵 音響特化イベントリスナー設定完了');
  }, [cleanup]); // micState依存を削除: 音声処理の安定性優先

  // 手動クリーンアップ関数（useEffectの代替） + デバッグ状態更新
  const manualComponentCleanup = useCallback(() => {
    console.log('📱 手動コンポーネントクリーンアップ開始');
    
    if (cleanupEventListenersRef.current) {
      cleanupEventListenersRef.current();
    }
    
    // 🔍 デバッグ状態更新: イベントリスナー無効化
    debugStateRef.current.eventListenersActive = false;
    
    console.log('📱 手動コンポーネントクリーンアップ完了');
  }, []);
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        
        {/* ヘッダー */}
        <header style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease-in-out'
              }}>
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                戻る
              </Link>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0
              }}>
                マイクロフォンテスト
              </h1>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Version 3.0 - Updated: {new Date().toLocaleString('ja-JP')}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ padding: '32px 0' }}>
          {/* 選択されたモード表示 */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: selectedMode.id === 'random' ? '#d1fae5' : selectedMode.id === 'continuous' ? '#fed7aa' : '#e9d5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: selectedMode.id === 'random' ? '#059669' : selectedMode.id === 'continuous' ? '#ea580c' : '#9333ea'
            }}>
              {selectedMode.id === 'random' ? '🎵' : selectedMode.id === 'continuous' ? '🔄' : '🎹'}
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: 0
            }}>
              {selectedMode.name}
            </h2>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.5',
            margin: 0
          }}>
            {selectedMode.description}
          </p>
        </div>
        
        {/* マイクロフォン許可セクション */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Mic style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0
              }}>
                マイクロフォンの許可
              </h3>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: 0
            }}>
              音程検出のためにマイクロフォンへのアクセスを許可してください。
              許可後、「ド」を発声してマイクの動作確認を行ってください。
            </p>
          </div>
          <div>
            {micState.micPermission === 'pending' && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={requestMicrophonePermission} style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto 16px auto',
                  transition: 'background-color 0.2s ease-in-out'
                }}>
                  <Mic style={{ width: '16px', height: '16px' }} />
                  マイクロフォンを許可
                </button>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  ブラウザでマイクロフォンへのアクセス許可を求められます
                </p>
              </div>
            )}
            
            {micState.micPermission === 'granted' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#059669',
                  marginBottom: '16px'
                }}>
                  <Volume2 style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontWeight: '500' }}>マイクロフォン許可済み</span>
                </div>
                
                {/* リアルタイム表示（DDAS - DOM直接更新） */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#1a1a1a',
                    margin: '0 0 16px 0'
                  }}>リアルタイム検出</h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500',
                        margin: '0 0 8px 0'
                      }}>周波数</p>
                      <div ref={frequencyDisplayRef} style={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ textAlign: 'center', color: '#6b7280' }}>
                          🎵 音声を発声してください
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500',
                        margin: '0 0 8px 0'
                      }}>🎵 音名・オクターブ</p>
                      <div ref={noteDisplayRef} style={{
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ textAlign: 'center', color: '#6b7280' }}>
                          <div style={{ fontSize: '16px' }}>🎵 音声を発声してください</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 音量バー（DDAS - DOM直接更新） */}
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '500',
                      margin: '0 0 8px 0'
                    }}>音量レベル</p>
                    <div style={{
                      width: '100%',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '9999px',
                      height: '12px',
                      marginBottom: '8px'
                    }}>
                      <div 
                        ref={volumeBarRef}
                        // CLAUDE.md準拠: 初期style属性は設定せず、JavaScript制御のみ
                      />
                    </div>
                    <div ref={volumePercentRef} style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>0%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {micState.micPermission === 'error' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  marginBottom: '16px'
                }}>
                  <VolumeX style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontWeight: '500' }}>マイクロフォンアクセスエラー</span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  marginBottom: '16px'
                }}>{error}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      console.log('🔄 エラー状態からの再試行: クリーンアップ後再試行');
                      manualComponentCleanup(); // useEffectの代わりに手動クリーンアップ
                      cleanup(); // エラー状態からの再試行時にクリーンアップ
                      requestMicrophonePermission();
                    }}
                    style={{
                      backgroundColor: 'white',
                      color: '#1a1a1a',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease-in-out'
                    }}
                  >
                    再試行
                  </button>
                  <button 
                    onClick={() => {
                      console.log('📱 手動マイクOFF: ユーザー操作で即座停止');
                      manualComponentCleanup(); // useEffectの代わりに手動クリーンアップ
                      cleanup();
                      setMicState(prev => ({ ...prev, micPermission: 'pending' }));
                      setError('');
                    }}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#1a1a1a',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease-in-out'
                    }}
                  >
                    マイクOFF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* レッスンスタートボタン */}
        {micState.micPermission === 'granted' && (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 8px 0'
              }}>
                レッスンを開始
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5',
                margin: 0
              }}>
                音量バーが反応し、周波数が検出されることを確認してからボタンを押してください
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              {micState.startButtonEnabled ? (
                <Link href={selectedMode.targetPath} style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease-in-out',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  {selectedMode.name}を開始
                </Link>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#d1d5db',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'not-allowed',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                  {selectedMode.name}を開始
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* フッター */}
        <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: '48px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 0',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
              <span>Version 3.0</span>
              <span>•</span>
              <span>Powered by Next.js</span>
            </div>
          </div>
        </footer>
        </main>
        
      </div>
    </div>
  );
}

export default function MicrophoneTestPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p style={{
            color: '#6b7280',
            fontWeight: '500',
            margin: 0
          }}>読み込み中...</p>
        </div>
      </div>
    }>
      <MicrophoneTestContent />
    </Suspense>
  );
}
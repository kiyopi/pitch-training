'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  
  // DOM直接操作関数（DDAS）
  const updateFrequencyDisplay = useCallback((frequency: number | null) => {
    if (frequencyDisplayRef.current) {
      if (frequency && frequency > 80 && frequency < 2000) {
        frequencyDisplayRef.current.innerHTML = `
          <div class="h-10 flex items-center justify-center">
            <div class="text-xl sm:text-2xl font-bold text-blue-800">${frequency.toFixed(1)} Hz</div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="h-10 flex items-center justify-center">
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
        const noteTypeClass = isSharpNote ? 'bg-yellow-100 border-yellow-300' : 'bg-blue-100 border-blue-300';
        
        // 🔍 デバッグ状態更新: 詳細音名情報
        debugStateRef.current.lastFrequency = frequency;
        
        // 前回表示内容を更新
        lastNoteDisplayRef.current = noteKey;
        
        noteDisplayRef.current.innerHTML = `
          <div class="text-center space-y-2">
            <div class="flex items-center justify-center space-x-3">
              <div class="text-2xl">${noteTypeIcon}</div>
              <div class="text-xl sm:text-2xl font-bold ${getOctaveColor(octave)}">${displayName}</div>
            </div>
            <div class="flex justify-center space-x-2">
              <div class="px-3 py-1 rounded-full text-xs font-medium ${noteTypeClass} border">
                ${frequency.toFixed(1)} Hz
              </div>
              <div class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border-gray-300 border">
                ${note}${octave}
              </div>
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
      
      // ノイズリダクションフィルター作成（無音時ノイズ抑制強化）
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.setValueAtTime(80, audioContext.currentTime); // より高い周波数でカット
      highPassFilter.Q.setValueAtTime(1.0, audioContext.currentTime);
      
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
      lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);
      
      const notchFilter = audioContext.createBiquadFilter();
      notchFilter.type = 'notch';
      notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
      notchFilter.Q.setValueAtTime(30, audioContext.currentTime);
      
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(1.0, audioContext.currentTime); // 無音時ノイズを抑制するためゲインを調整
      
      // MediaStreamSource作成・接続
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(notchFilter);
      notchFilter.connect(gainNode);
      gainNode.connect(analyser);
      
      // Refs保存
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
      // pitchy-clean準拠：音量計算スケーリング
      const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
      
      // iPhone専用音量オフセット方式（発声検出連動）+ PC無音時ノイズフロア改善
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const baseVolume = calculatedVolume / 12 * 100;
      
      let volumePercent;
      if (isIOS) {
        // iPhone専用音量オフセット方式（発声検出連動）- 成功実装復元
        if (calculatedVolume > 3) { // 発声検出閾値
          const iOSOffset = 40; // 40%のベースオフセット
          const iOSMultiplier = 2.0; // 発声時の増幅倍率
          volumePercent = Math.min(Math.max((baseVolume * iOSMultiplier) + iOSOffset, 0), 100);
        } else {
          // 無音時: 通常計算（オフセットなし）
          volumePercent = Math.min(Math.max(baseVolume, 0), 100);
        }
      } else {
        // PC: 無音時のみノイズフロア削減を追加
        if (calculatedVolume <= 3) {
          // 無音時: ノイズフロア削減（18%→3%程度）
          volumePercent = Math.min(Math.max(baseVolume * 0.2, 0), 100);
        } else {
          // 発声時: 従来通り
          volumePercent = Math.min(Math.max(baseVolume, 0), 100);
        }
      }
      // const normalizedVolume = volumePercent / 100; // 0-1正規化（未使用のため削除）
      
      // 音量スムージング（より安定した表示）
      const smoothingFactor = 0.2;
      const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
      previousVolumeRef.current = smoothedVolume;
      
      // DOM直接更新 + デバッグ状態更新
      updateVolumeDisplay(smoothedVolume);
      
      // 🔍 デバッグ状態更新: 音量
      debugStateRef.current.lastVolume = smoothedVolume;
      
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
          volumeDetected: smoothedVolume > 1,
          frequencyDetected: true,
          startButtonEnabled: smoothedVolume > 1
        }));
      } else {
        updateFrequencyDisplay(null);
        updateNoteDisplay(null);
        
        setMicState(prev => ({ 
          ...prev, 
          volumeDetected: smoothedVolume > 1,
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        
        {/* ヘッダー */}
        <div className="flex items-center mb-6 sm:mb-8">
          <Button asChild variant="outline" className="mr-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            マイクロフォンテスト
          </h1>
        </div>
        
        {/* 選択されたモード表示 */}
        <Card className="mb-6 border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg text-neutral-900">
              <div className={`w-10 h-10 rounded-full ${selectedMode.bgColor} flex items-center justify-center`}>
                <selectedMode.icon className={`w-5 h-5 ${selectedMode.iconColor}`} />
              </div>
              {selectedMode.name}
            </CardTitle>
            <CardDescription className="text-neutral-700">
              {selectedMode.description}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* マイクロフォン許可セクション */}
        <Card className="mb-6 border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-neutral-900">
              <Mic className="w-6 h-6" />
              マイクロフォンの許可
            </CardTitle>
            <CardDescription className="text-neutral-700">
              音程検出のためにマイクロフォンへのアクセスを許可してください。
              許可後、「ド」を発声してマイクの動作確認を行ってください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {micState.micPermission === 'pending' && (
              <div className="text-center space-y-4">
                <Button onClick={requestMicrophonePermission} className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="w-4 h-4 mr-2" />
                  マイクロフォンを許可
                </Button>
                <p className="text-sm text-neutral-700">
                  ブラウザでマイクロフォンへのアクセス許可を求められます
                </p>
              </div>
            )}
            
            {micState.micPermission === 'granted' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium">マイクロフォン許可済み</span>
                </div>
                
                {/* リアルタイム表示（DDAS - DOM直接更新） */}
                <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-neutral-900">リアルタイム検出</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-700 font-medium mb-2">周波数</p>
                      <div ref={frequencyDisplayRef} className="text-lg">
                        <div className="text-center text-neutral-600">
                          🎵 音声を発声してください
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-700 font-medium mb-2">🎵 音名・オクターブ</p>
                      <div ref={noteDisplayRef} className="text-lg min-h-[80px] flex items-center justify-center">
                        <div className="text-center text-neutral-600">
                          <div className="text-xl sm:text-2xl">🎵 音声を発声してください</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 音量バー（DDAS - DOM直接更新） */}
                  <div>
                    <p className="text-sm text-neutral-700 font-medium mb-2">音量レベル</p>
                    <div className="w-full bg-neutral-200 rounded-full h-3 mb-2">
                      <div 
                        ref={volumeBarRef}
                        className="h-3 rounded-full transition-all duration-100"
                      />
                    </div>
                    <div ref={volumePercentRef} className="text-right">
                      <span className="text-sm text-neutral-700 font-medium">0%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {micState.micPermission === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <VolumeX className="w-5 h-5" />
                  <span className="font-medium">マイクロフォンアクセスエラー</span>
                </div>
                <p className="text-sm text-red-700">{error}</p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      console.log('🔄 エラー状態からの再試行: クリーンアップ後再試行');
                      manualComponentCleanup(); // useEffectの代わりに手動クリーンアップ
                      cleanup(); // エラー状態からの再試行時にクリーンアップ
                      requestMicrophonePermission();
                    }} 
                    variant="outline"
                  >
                    再試行
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('📱 手動マイクOFF: ユーザー操作で即座停止');
                      manualComponentCleanup(); // useEffectの代わりに手動クリーンアップ
                      cleanup();
                      setMicState(prev => ({ ...prev, micPermission: 'pending' }));
                      setError('');
                    }}
                    variant="secondary"
                  >
                    マイクOFF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* レッスンスタートボタン */}
        {micState.micPermission === 'granted' && (
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle className="text-neutral-900">レッスンを開始</CardTitle>
              <CardDescription className="text-neutral-700">
                音量バーが反応し、周波数が検出されることを確認してからボタンを押してください
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                asChild 
                disabled={!micState.startButtonEnabled} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-neutral-300 disabled:text-neutral-500 px-8 py-3 text-lg font-bold border-2 disabled:border-neutral-200"
              >
                <Link href={selectedMode.targetPath}>
                  🎵 {selectedMode.name}を開始
                </Link>
              </Button>
              
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}

export default function MicrophoneTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-neutral-700 font-medium">読み込み中...</p>
      </div>
    </div>}>
      <MicrophoneTestContent />
    </Suspense>
  );
}
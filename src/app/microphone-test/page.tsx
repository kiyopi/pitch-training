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

// 音名変換テーブル
const NOTE_CONVERSION: Record<string, string> = {
  'C3': 'ド（低）', 'C4': 'ド（中）', 'C5': 'ド（高）',
  'D3': 'レ（低）', 'D4': 'レ（中）', 'D5': 'レ（高）',
  'E3': 'ミ（低）', 'E4': 'ミ（中）', 'E5': 'ミ（高）',
  'F3': 'ファ（低）', 'F4': 'ファ（中）', 'F5': 'ファ（高）',
  'G3': 'ソ（低）', 'G4': 'ソ（中）', 'G5': 'ソ（高）',
  'A3': 'ラ（低）', 'A4': 'ラ（中）', 'A5': 'ラ（高）',
  'B3': 'シ（低）', 'B4': 'シ（中）', 'B5': 'シ（高）',
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
  
  // Audio処理用Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // ノイズリダクションフィルター用Refs
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // 音量スムージング用
  const previousVolumeRef = useRef<number>(0);
  
  // DOM直接操作関数（DDAS）
  const updateFrequencyDisplay = useCallback((frequency: number | null) => {
    if (frequencyDisplayRef.current) {
      if (frequency && frequency > 80 && frequency < 2000) {
        frequencyDisplayRef.current.innerHTML = `
          <div class="h-10 flex items-center justify-center">
            <div class="text-xl font-bold text-blue-800">${frequency.toFixed(1)} Hz</div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="h-10 flex items-center justify-center">
            <div class="text-lg text-neutral-600">🎵 音声を発声してください</div>
          </div>
        `;
      }
    }
  }, []);
  
  const updateNoteDisplay = useCallback((frequency: number | null) => {
    if (noteDisplayRef.current) {
      if (frequency && frequency > 80 && frequency < 2000) {
        const { note, octave } = frequencyToNote(frequency);
        const noteKey = `${note}${octave}`;
        const displayName = NOTE_CONVERSION[noteKey] || `${note}${octave}`;
        
        noteDisplayRef.current.innerHTML = `
          <div class="text-center">
            <div class="text-lg sm:text-xl font-medium text-purple-800">${displayName}</div>
          </div>
        `;
      } else {
        noteDisplayRef.current.innerHTML = `
          <div class="text-center text-neutral-600">
            音名が表示されます
          </div>
        `;
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
      
      // AudioContext セットアップ
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
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
      
      // Pitchy セットアップ
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      
      setMicState(prev => ({ ...prev, micPermission: 'granted' }));
      
      // 音量バー初期化（iPhoneレンダリング問題対応）
      if (volumeBarRef.current) {
        volumeBarRef.current.style.width = '0%';
        volumeBarRef.current.style.backgroundColor = '#10b981';
        volumeBarRef.current.style.height = '12px';
        volumeBarRef.current.style.borderRadius = '9999px';
        volumeBarRef.current.style.transition = 'all 0.1s ease-out';
      }
      
      // リアルタイム処理開始
      startFrequencyDetection();
      
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
      
      // プラットフォーム別音量計算（iPhone成功パターン維持 + PC無音時改善）
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const baseVolume = calculatedVolume / 12 * 100;
      
      let volumePercent;
      if (isIOS) {
        // iPhone: 成功パターンを完全維持
        if (calculatedVolume > 3) { // 発声検出閾値
          const iOSOffset = 40; // 40%のベースオフセット（発声時のみ）
          const iOSMultiplier = 2.0; // 発声時の増幅倍率
          volumePercent = Math.min(Math.max((baseVolume * iOSMultiplier) + iOSOffset, 0), 100);
        } else {
          // 無音時: 通常計算（オフセットなし）
          volumePercent = Math.min(Math.max(baseVolume, 0), 100);
        }
      } else {
        // PC: 無音時ノイズフロア補正追加
        if (calculatedVolume <= 3) {
          // 無音時: ノイズフロア削減（18% → 3%程度）
          const noiseFloor = 2.5; // ノイズフロア基準値
          volumePercent = Math.min(Math.max(baseVolume - noiseFloor, 0), 100);
        } else {
          // 発声時: 通常計算
          volumePercent = Math.min(Math.max(baseVolume, 0), 100);
        }
      }
      const normalizedVolume = volumePercent / 100; // 0-1正規化
      
      // 音量スムージング（より安定した表示）
      const smoothingFactor = 0.2;
      const smoothedVolume = previousVolumeRef.current + smoothingFactor * (volumePercent - previousVolumeRef.current);
      previousVolumeRef.current = smoothedVolume;
      
      // DOM直接更新
      updateVolumeDisplay(smoothedVolume);
      
      // 周波数検出用のFloat32Array取得
      const floatDataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(floatDataArray);
      
      // 周波数検出
      const [frequency, clarity] = pitchDetectorRef.current.findPitch(floatDataArray, 44100);
      
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
  
  // クリーンアップ
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // フィルターRefs初期化
    highPassFilterRef.current = null;
    lowPassFilterRef.current = null;
    notchFilterRef.current = null;
    gainNodeRef.current = null;
    previousVolumeRef.current = 0;
  }, []);
  
  // コンポーネントクリーンアップ
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
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
                      <p className="text-sm text-neutral-700 font-medium mb-2">音名</p>
                      <div ref={noteDisplayRef} className="text-lg">
                        <div className="text-center text-neutral-600">
                          音名が表示されます
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
                <Button onClick={requestMicrophonePermission} variant="outline">
                  再試行
                </Button>
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
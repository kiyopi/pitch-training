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

interface FrequencyInfo {
  hz: number;
  note: string;
  noteName: string;
  octave: string;
  displayName: string;
  volume: number;
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
  
  // 状態管理
  const [micState, setMicState] = useState<MicTestState>({
    micPermission: 'pending',
    volumeDetected: false,
    frequencyDetected: false,
    startButtonEnabled: false
  });
  
  const [frequencyInfo, setFrequencyInfo] = useState<FrequencyInfo>({
    hz: 0,
    note: 'C4',
    noteName: 'ド',
    octave: '中',
    displayName: 'ド（中）',
    volume: 0
  });
  
  const [error, setError] = useState<string>('');
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
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
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;
      
      // マイク入力接続
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Pitchy セットアップ
      pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
      
      setMicState(prev => ({ ...prev, micPermission: 'granted' }));
      
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
  
  // 周波数検出処理
  const startFrequencyDetection = useCallback(() => {
    const processAudio = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) return;
      
      const bufferLength = analyserRef.current.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(dataArray);
      
      // 音量計算
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = Math.min(100, Math.max(0, Math.round(rms * 500)));
      
      // 周波数検出
      const [frequency, clarity] = pitchDetectorRef.current.findPitch(dataArray, 44100);
      
      if (frequency && clarity > 0.7 && frequency >= 80 && frequency <= 2000) {
        const { note, octave } = frequencyToNote(frequency);
        const noteKey = `${note}${octave}`;
        const displayName = NOTE_CONVERSION[noteKey] || `${note}${octave}`;
        
        setFrequencyInfo({
          hz: frequency,
          note: noteKey,
          noteName: note,
          octave: octave === 3 ? '低' : octave === 4 ? '中' : '高',
          displayName,
          volume
        });
        
        setMicState(prev => ({ 
          ...prev, 
          volumeDetected: volume > 10,
          frequencyDetected: true 
        }));
      } else {
        setFrequencyInfo(prev => ({ ...prev, volume }));
        setMicState(prev => ({ 
          ...prev, 
          volumeDetected: volume > 10 
        }));
      }
      
      animationFrameRef.current = requestAnimationFrame(processAudio);
    };
    
    processAudio();
  }, []);
  
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
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-10 h-10 rounded-full ${selectedMode.bgColor} flex items-center justify-center`}>
                <selectedMode.icon className={`w-5 h-5 ${selectedMode.iconColor}`} />
              </div>
              {selectedMode.name}
            </CardTitle>
            <CardDescription>
              {selectedMode.description}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* マイクロフォン許可セクション */}
        <Card className="mb-6 border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Mic className="w-6 h-6" />
              マイクロフォンの許可
            </CardTitle>
            <CardDescription>
              音程検出のためにマイクロフォンへのアクセスを許可してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            {micState.micPermission === 'pending' && (
              <div className="text-center space-y-4">
                <Button onClick={requestMicrophonePermission} className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="w-4 h-4 mr-2" />
                  マイクロフォンを許可
                </Button>
                <p className="text-sm text-neutral-600">
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
                
                {/* リアルタイム周波数表示 */}
                <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-neutral-900">リアルタイム検出</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">周波数</p>
                      <p className="text-lg font-mono">{frequencyInfo.hz.toFixed(1)} Hz</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-neutral-600">音名</p>
                      <p className="text-lg font-medium">{frequencyInfo.displayName}</p>
                    </div>
                  </div>
                  
                  {/* 音量バー */}
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">音量レベル</p>
                    <div className="w-full bg-neutral-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-100 ${
                          frequencyInfo.volume > 80 ? 'bg-red-500' :
                          frequencyInfo.volume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${frequencyInfo.volume}%` }}
                      />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{frequencyInfo.volume}%</p>
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
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={requestMicrophonePermission} variant="outline">
                  再試行
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 次のステップ案内 */}
        {micState.micPermission === 'granted' && (
          <Card className="border-neutral-200">
            <CardHeader>
              <CardTitle>次のステップ</CardTitle>
              <CardDescription>
                「ド」を発声してマイクの動作確認を行ってください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-4">
                音量バーが反応し、周波数が検出されることを確認してから、
                レッスンを開始してください。
              </p>
              
              <Button asChild disabled={!micState.volumeDetected || !micState.frequencyDetected}>
                <Link href={selectedMode.targetPath}>
                  レッスンスタート
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
        <p className="text-neutral-600">読み込み中...</p>
      </div>
    </div>}>
      <MicrophoneTestContent />
    </Suspense>
  );
}
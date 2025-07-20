'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, RotateCcw, CheckCircle, Volume2 } from "lucide-react";
import { useMicrophoneManager } from "@/hooks/useMicrophoneManager";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { PitchDetector } from "pitchy";
import * as Tone from 'tone';

// Phase管理システム
type TrainingPhase = 'welcome' | 'micTest' | 'training' | 'evaluation' | 'results';

// 基音データベース（実装計画書仕様準拠）
interface BaseTone {
  name: string;
  note: string;
  frequency: number;
  tonejs: string;
}

const BASE_TONES: BaseTone[] = [
  { name: 'Bb3', note: 'シ♭3', frequency: 233.08, tonejs: 'Bb3' },
  { name: 'C4',  note: 'ド4',   frequency: 261.63, tonejs: 'C4' },
  { name: 'Db4', note: 'レ♭4', frequency: 277.18, tonejs: 'Db4' },
  { name: 'D4',  note: 'レ4',   frequency: 293.66, tonejs: 'D4' },
  { name: 'Eb4', note: 'ミ♭4', frequency: 311.13, tonejs: 'Eb4' },
  { name: 'E4',  note: 'ミ4',   frequency: 329.63, tonejs: 'E4' },
  { name: 'F4',  note: 'ファ4', frequency: 349.23, tonejs: 'F4' },
  { name: 'Gb4', note: 'ソ♭4', frequency: 369.99, tonejs: 'Gb4' },
  { name: 'G4',  note: 'ソ4',   frequency: 392.00, tonejs: 'G4' },
  { name: 'Ab4', note: 'ラ♭4', frequency: 415.30, tonejs: 'Ab4' }
];

// 基音管理フック
const useBaseFrequency = () => {
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初期化
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      const sampler = new Tone.Sampler({
        urls: {
          A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
          A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
          A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
          A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
          A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
          A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
          A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
          A7: "A7.mp3", C8: "C8.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        attack: 0.1,
        release: 0.3,
      }).toDestination();

      sampler.volume.value = -12;
      samplerRef.current = sampler;

      await new Promise<void>((resolve) => {
        const checkLoaded = () => {
          if (sampler.loaded) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });

      setIsLoaded(true);
      console.log('✅ 基音システム初期化完了');
      return true;
    } catch (error) {
      console.error('❌ 基音システム初期化失敗:', error);
      setError(error instanceof Error ? error.message : '基音システム初期化に失敗しました');
      return false;
    }
  }, []);

  // ランダム基音選択
  const selectRandomBaseTone = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * BASE_TONES.length);
    const selectedTone = BASE_TONES[randomIndex];
    setCurrentBaseTone(selectedTone);
    console.log(`🎲 ランダム基音選択: ${selectedTone.note} (${selectedTone.frequency}Hz)`);
    return selectedTone;
  }, []);

  // 基音再生
  const playBaseTone = useCallback(async (duration: number = 2): Promise<void> => {
    try {
      if (!samplerRef.current || !currentBaseTone) {
        throw new Error('基音システムが準備されていません');
      }

      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      if (isPlaying) {
        stopBaseTone();
      }

      setIsPlaying(true);
      samplerRef.current.triggerAttack(currentBaseTone.tonejs);
      console.log(`🎹 基音再生開始: ${currentBaseTone.note} (${duration}秒)`);

      timeoutRef.current = setTimeout(() => {
        if (samplerRef.current && currentBaseTone) {
          samplerRef.current.triggerRelease(currentBaseTone.tonejs);
        }
        setIsPlaying(false);
        console.log('🎹 基音再生終了');
      }, duration * 1000);

    } catch (error) {
      console.error('❌ 基音再生エラー:', error);
      setError(error instanceof Error ? error.message : '基音再生に失敗しました');
      setIsPlaying(false);
    }
  }, [currentBaseTone, isPlaying]);

  // 基音停止
  const stopBaseTone = useCallback(() => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (samplerRef.current && currentBaseTone) {
        samplerRef.current.triggerRelease(currentBaseTone.tonejs);
      }

      setIsPlaying(false);
      console.log('🛑 基音再生停止');
    } catch (error) {
      console.error('❌ 基音停止エラー:', error);
    }
  }, [currentBaseTone]);

  // クリーンアップ
  const cleanup = useCallback(() => {
    try {
      stopBaseTone();
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      setIsLoaded(false);
      setCurrentBaseTone(null);
      setError(null);
      console.log('🧹 基音システムクリーンアップ完了');
    } catch (error) {
      console.error('❌ 基音システムクリーンアップエラー:', error);
    }
  }, [stopBaseTone]);

  return {
    currentBaseTone,
    isLoaded,
    isPlaying,
    error,
    initialize,
    selectRandomBaseTone,
    playBaseTone,
    stopBaseTone,
    cleanup
  };
};

export default function RandomTrainingPage() {
  // Phase状態管理
  const [currentPhase, setCurrentPhase] = useState<TrainingPhase>('welcome');
  const [error, setError] = useState<string | null>(null);
  
  // 基音システム統合
  const baseFrequency = useBaseFrequency();

  // Phase遷移関数
  const goToPhase = useCallback((phase: TrainingPhase) => {
    setCurrentPhase(phase);
    setError(null);
  }, []);

  // エラーリセット
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 mb-8 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md">
          <div className="flex items-center space-x-3 mb-3">
            <span className="font-bold text-red-800">エラー発生</span>
          </div>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={resetError}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            エラーリセット
          </button>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {currentPhase === 'welcome' && (
          <WelcomePhase onNext={() => goToPhase('micTest')} />
        )}
        
        {currentPhase === 'micTest' && (
          <MicTestPhase 
            onNext={() => goToPhase('training')} 
            onBack={() => goToPhase('welcome')}
            onError={setError}
          />
        )}
        
        {currentPhase === 'training' && (
          <TrainingPhase 
            onEvaluation={() => goToPhase('evaluation')}
            onEnd={() => goToPhase('results')}
            onError={setError}
            baseFrequency={baseFrequency}
          />
        )}
        
        {currentPhase === 'evaluation' && (
          <EvaluationPhase 
            onNext={() => goToPhase('training')}
            onEnd={() => goToPhase('results')}
          />
        )}
        
        {currentPhase === 'results' && (
          <ResultsPhase 
            onRestart={() => goToPhase('welcome')}
          />
        )}
      </div>

      {/* 戻るボタン（ウェルカム画面のみ） */}
      {currentPhase === 'welcome' && (
        <div className="mt-12">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>メインメニューに戻る</span>
          </Link>
        </div>
      )}
    </div>
  );
}

// Phase 0: ウェルカム画面コンポーネント
function WelcomePhase({ onNext }: { onNext: () => void }) {
  return (
    <>
      {/* ヘッダー */}
      <div className="mb-12">
        <div className="text-8xl mb-6">🎲</div>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          ランダム基音モード
        </h1>
        <p className="text-2xl text-gray-600 mb-8">相対音感トレーニング</p>
      </div>

      {/* アプリの目的説明 */}
      <div className="mb-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 text-left max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎵 相対音感とは</h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            相対音感とは、基準となる音（基音）からの音程の関係を正確に聞き分ける能力です。
          </p>
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="font-semibold text-blue-800 mb-2">このトレーニングでは：</p>
            <ul className="space-y-2 text-blue-700">
              <li>• 10種類の異なる基音からランダムに選択</li>
              <li>• 基音を聞いた後、ドレミファソラシドを正確に歌う</li>
              <li>• あなたの歌声をリアルタイムで音程分析</li>
              <li>• 目標音程との誤差をセント単位で評価</li>
            </ul>
          </div>
          <p className="text-center font-semibold text-purple-700">
            継続的な練習により、どんな基音からでも正確な相対音程を歌えるようになります。
          </p>
        </div>
      </div>

      {/* トレーニングの流れ */}
      <div className="mb-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 トレーニングの流れ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <h4 className="font-semibold text-gray-800">マイクテスト</h4>
                <p className="text-gray-600 text-sm">マイクロフォンの許可を取得<br/>音量レベルが適切かテスト</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <h4 className="font-semibold text-gray-800">基音再生</h4>
                <p className="text-gray-600 text-sm">10種類（Bb3〜Ab4）からランダム選択<br/>ピアノ音で2秒間再生</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <h4 className="font-semibold text-gray-800">8音階歌唱</h4>
                <p className="text-gray-600 text-sm">ド→レ→ミ→ファ→ソ→ラ→シ→ド を順番に<br/>各音程をリアルタイム検出・表示</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <div>
                <h4 className="font-semibold text-gray-800">個別評価</h4>
                <p className="text-gray-600 text-sm">8音すべての誤差をセント単位で評価<br/>合格/不合格を判定</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <div>
                <h4 className="font-semibold text-gray-800">総合結果</h4>
                <p className="text-gray-600 text-sm">複数サイクルの統計<br/>苦手な音程の分析</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 目標設定 */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-700">📊 初級〜中級</div>
            <div className="text-purple-600">難易度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">⏱️ 5-10分</div>
            <div className="text-blue-600">1セッション</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">🎯 ±20セント</div>
            <div className="text-green-600">目標精度</div>
          </div>
        </div>
      </div>

      {/* 開始ボタン */}
      <div className="mb-8">
        <button
          onClick={onNext}
          className="group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex items-center space-x-3">
            <Mic className="w-8 h-8" />
            <span>🎤 マイクテストを開始して相対音感を鍛える</span>
          </div>
        </button>
      </div>

      {/* 補助説明 */}
      <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-3">💡 ヒント</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-yellow-700">
          <div>• 静かな環境での使用を推奨</div>
          <div>• イヤホン使用で基音がより聞き取りやすくなります</div>
          <div>• 1日10分の継続練習が効果的です</div>
        </div>
      </div>
    </>
  );
}

// Phase 1: マイクテスト（DOM直接操作対応）
function MicTestPhase({ 
  onNext, 
  onBack, 
  onError 
}: { 
  onNext: () => void; 
  onBack: () => void; 
  onError: (error: string) => void; 
}) {
  const { microphoneState, startRecording, stopRecording, resetError } = useMicrophoneManager();
  // const [testCompleted, setTestCompleted] = useState(false); // テスト停止ボタン削除に伴い不要
  const [hasBeenGood, setHasBeenGood] = useState(false);
  
  // DOM直接操作用のref
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeTextRef = useRef<HTMLDivElement>(null);
  const volumeStatusRef = useRef<HTMLDivElement>(null);
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  
  // 音程検出用
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 周波数から音程名（C3形式）への変換
  const frequencyToNoteName = useCallback((frequency: number): string => {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // A4を基準に半音単位の差分を計算
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    
    // オクターブとノート名を計算
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    const noteIndex = ((semitonesFromA4 + 9) % 12 + 12) % 12;
    
    return `${noteNames[noteIndex]}${octave}`;
  }, []);

  // DOM直接更新関数（React state不使用）
  const updateVolumeDisplay = useCallback((volume: number) => {
    if (volumeBarRef.current) {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      volumeBarRef.current.style.width = `${clampedVolume}%`;
      
      // 音量レベルに応じた色変更
      if (volume > 30) {
        volumeBarRef.current.className = 'h-full transition-all duration-100 ease-out bg-gradient-to-r from-green-400 to-green-600';
      } else if (volume > 10) {
        volumeBarRef.current.className = 'h-full transition-all duration-100 ease-out bg-gradient-to-r from-yellow-400 to-yellow-600';
      } else {
        volumeBarRef.current.className = 'h-full transition-all duration-100 ease-out bg-gradient-to-r from-red-400 to-red-600';
      }
    }
    
    if (volumeTextRef.current) {
      volumeTextRef.current.textContent = `${volume.toFixed(1)}%`;
      volumeTextRef.current.className = `text-2xl font-bold ${
        volume > 30 ? 'text-green-600' : 
        volume > 10 ? 'text-yellow-600' : 
        'text-red-600'
      }`;
    }
    
    if (volumeStatusRef.current) {
      volumeStatusRef.current.textContent = 
        volume > 30 ? '✅ 良好' : 
        volume > 10 ? '⚠️ やや小さい' : 
        '❌ 音声が小さすぎます';
    }
  }, []);

  // 周波数表示更新関数
  const updateFrequencyDisplay = useCallback((freq: number | null) => {
    if (frequencyDisplayRef.current) {
      if (freq && freq > 80 && freq < 1200) {
        const noteName = frequencyToNoteName(freq);
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center">
            <div class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ${noteName} - ${freq.toFixed(1)} Hz
            </div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center text-gray-400">
            🎵 ドの音を発声してください
          </div>
        `;
      }
    }
  }, [frequencyToNoteName]);

  // 音量レベル監視（DOM直接更新）
  useEffect(() => {
    if (microphoneState.isRecording) {
      const volumePercent = microphoneState.audioLevel * 100;
      updateVolumeDisplay(volumePercent);
      
      // TODO: 音程検出機能も統合予定
      // 現在はマイクマネージャーからの音程データ取得が必要
    }
  }, [microphoneState.audioLevel, microphoneState.isRecording, updateVolumeDisplay]);

  // マイクテスト開始
  const handleStartTest = useCallback(async () => {
    const success = await startRecording();
    if (!success && microphoneState.error) {
      onError(microphoneState.error);
    }
  }, [startRecording, microphoneState.error, onError]);

  // マイクテスト停止（将来の機能用）
  // const handleStopTest = useCallback(() => {
  //   stopRecording();
  //   setTestCompleted(true);
  // }, [stopRecording]);

  // 音量状態判定
  const isVolumeGood = microphoneState.audioLevel > 0.3;
  
  // 一度音量が良好になったらエフェクト固定
  useEffect(() => {
    if (isVolumeGood && microphoneState.isRecording) {
      setHasBeenGood(true);
    }
  }, [isVolumeGood, microphoneState.isRecording]);

  return (
    <>
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🎤</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          マイクロフォンテスト
        </h2>
        <p className="text-xl text-gray-600">マイクロフォンの許可と音量レベルを確認します</p>
      </div>

      {/* テスト手順説明 */}
      <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-blue-800 mb-4">📋 テスト手順</h3>
        <div className="space-y-3 text-blue-700 text-left">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <span>「マイクテスト開始」ボタンをクリック</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <span>マイクロフォンの許可を与える</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span>「ドの音を発声」して音量バーと音程を確認</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <span>音量レベルを確認したらトレーニング開始</span>
          </div>
        </div>
      </div>

      {/* 音量レベル + 音程表示統合 */}
      {microphoneState.isRecording && (
        <div className="mb-8">
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🎵 音量レベル + 音程検出</h3>
          
          {/* 音量バー（DOM直接操作） */}
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-6 w-full overflow-hidden">
              <div 
                ref={volumeBarRef}
                className="h-full transition-all duration-100 ease-out bg-gradient-to-r from-red-400 to-red-600"
                style={{ width: '0%' }}
              />
            </div>
          </div>
          
          {/* 音量パーセンテージ（DOM直接操作） */}
          <div className="text-center mb-4">
            <div ref={volumeTextRef} className="text-2xl font-bold text-red-600">
              0.0%
            </div>
            <div ref={volumeStatusRef} className="text-sm text-gray-500 mt-1">
              ❌ 音声が小さすぎます
            </div>
          </div>

          {/* 音程表示（統合） */}
          <div className="text-center mb-4">
            <div className="h-16 flex items-center justify-center">
              <div ref={frequencyDisplayRef}>
                <div className="text-center text-gray-400">
                  🎵 ドの音を発声してください
                </div>
              </div>
            </div>
          </div>

          {/* 音量ガイド */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ドの音を発声してマイクテストをしてください
            </p>
            {isVolumeGood && microphoneState.isRecording && (
              <p className="text-sm text-green-600 mt-2 font-bold animate-pulse">
                ✅ マイクテスト良好！トレーニングを開始できます
              </p>
            )}
          </div>
          </div>
        </div>
      )}

      {/* 制御ボタン */}
      <div className="mb-8 space-y-4">
        {!microphoneState.isRecording ? (
          <div className="relative inline-block">
            {/* パルス効果の背景レイヤー1 */}
            <div 
              className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-400/70 to-green-400/70 border border-blue-300"
              style={{
                animation: 'pulse-expand 2s ease-out infinite'
              }}
            />
            {/* パルス効果の背景レイヤー2 */}
            <div 
              className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-400/70 to-green-400/70 border border-blue-300"
              style={{
                animation: 'pulse-expand 2s ease-out 1s infinite'
              }}
            />
            <button
              onClick={handleStartTest}
              className="relative px-10 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 hover:scale-105"
            >
              <div className="flex items-center space-x-3">
                <Mic className="w-6 h-6" />
                <span>🎤 マイクテスト開始</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="px-10 py-4 text-xl text-gray-600">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-pulse">
                <Mic className="w-6 h-6 text-green-600" />
              </div>
              <span>🎤 マイクテスト中...</span>
            </div>
          </div>
        )}
      </div>

      {/* マイク不許可時のメッセージ */}
      {microphoneState.permission === 'denied' && !microphoneState.isRecording && (
        <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-300 max-w-md mx-auto">
          <h4 className="font-bold text-orange-800 mb-3">🎤 マイクの許可が必要です</h4>
          <p className="text-orange-700 mb-4">
            マイクを許可しないとトレーニングができません。<br/>
            もう一度マイクの許可をお願いします。
          </p>
          <button
            onClick={handleStartTest}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-bold"
          >
            <Mic className="w-5 h-5 inline mr-2" />
            マイクを許可する
          </button>
        </div>
      )}

      {/* テスト完了・進行ボタン */}
      <div className="space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          戻る
        </button>
        
        {microphoneState.permission === 'denied' && !microphoneState.isRecording ? (
          <button
            onClick={onNext}
            disabled
            className="px-8 py-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed shadow-lg font-bold"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            トレーニング開始
          </button>
        ) : hasBeenGood && microphoneState.isRecording ? (
          <div className="relative inline-block">
            {/* パルス効果の背景レイヤー1 */}
            <div 
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-green-400/70 to-blue-400/70 border border-green-300"
              style={{
                animation: 'pulse-expand 2s ease-out infinite'
              }}
            />
            {/* パルス効果の背景レイヤー2 */}
            <div 
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-green-400/70 to-blue-400/70 border border-green-300"
              style={{
                animation: 'pulse-expand 2s ease-out 1s infinite'
              }}
            />
            <button
              onClick={onNext}
              className="relative px-8 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 hover:scale-105 shadow-lg font-bold"
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              トレーニング開始
            </button>
          </div>
        ) : (
          <button
            onClick={onNext}
            className="px-8 py-3 rounded-xl transition-all duration-300 shadow-lg font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 hover:scale-105"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            トレーニング開始
          </button>
        )}
      </div>

      {/* ヒント */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200 max-w-md mx-auto">
        <h4 className="font-bold text-yellow-800 mb-2">💡 ヒント</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>• マイクに近づきすぎないでください</div>
          <div>• 周囲の騒音を最小限に抑えてください</div>
          <div>• ドの音程で明瞭に発声してください</div>
          <div>• 音程が表示されない場合は、より大きな声で発声してください</div>
        </div>
      </div>
    </>
  );
}

// Phase 2: トレーニング（Step 3統合: 録音・検出システム実装）
function TrainingPhase({ 
  onEvaluation, 
  onEnd, 
  onError,
  baseFrequency
}: { 
  onEvaluation: () => void; 
  onEnd: () => void; 
  onError: (error: string) => void;
  baseFrequency: ReturnType<typeof useBaseFrequency>;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'baseTone' | 'recording'>('baseTone');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  // マイクロフォン・音程検出統合
  const { microphoneState, startRecording, stopRecording } = useMicrophoneManager();
  const pitchDetection = usePitchDetection({
    clarityThreshold: 0.15,
    minFrequency: 80,
    maxFrequency: 1200,
    volumeThreshold: 3
  });
  
  // ドレミファソラシド音階名
  const SCALE_NOTES = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド(高)'];
  
  // DOM直接操作用refs（60FPS更新）
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const noteProgressRef = useRef<HTMLDivElement>(null);
  
  // 目標周波数計算（相対音程）
  const getTargetFrequencies = useCallback((baseFreq: number): number[] => {
    const semitoneRatio = Math.pow(2, 1/12);
    return [
      baseFreq,                           // ド
      baseFreq * Math.pow(semitoneRatio, 2),  // レ
      baseFreq * Math.pow(semitoneRatio, 4),  // ミ
      baseFreq * Math.pow(semitoneRatio, 5),  // ファ
      baseFreq * Math.pow(semitoneRatio, 7),  // ソ
      baseFreq * Math.pow(semitoneRatio, 9),  // ラ
      baseFreq * Math.pow(semitoneRatio, 11), // シ
      baseFreq * 2                        // ド(高)
    ];
  }, []);
  
  // 周波数から音程名への変換
  const frequencyToNoteName = useCallback((frequency: number): string => {
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    const noteIndex = ((semitonesFromA4 + 9) % 12 + 12) % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }, []);
  
  // DOM直接操作更新関数（60FPS対応）
  const updateFrequencyDisplay = useCallback((freq: number | null, targetFreq: number | null, currentNote: string) => {
    if (frequencyDisplayRef.current) {
      if (freq && targetFreq) {
        const noteName = frequencyToNoteName(freq);
        const difference = freq - targetFreq;
        const cents = Math.round(1200 * Math.log2(freq / targetFreq));
        const isAccurate = Math.abs(cents) <= 20; // ±20セント以内で合格
        
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center space-y-2">
            <div class="text-lg font-semibold text-gray-700">目標: ${currentNote} (${targetFreq.toFixed(1)}Hz)</div>
            <div class="text-3xl font-bold ${isAccurate ? 'text-green-600' : 'text-blue-600'}">
              ${noteName} - ${freq.toFixed(1)} Hz
            </div>
            <div class="text-lg font-semibold ${isAccurate ? 'text-green-600' : Math.abs(cents) <= 50 ? 'text-yellow-600' : 'text-red-600'}">
              ${cents > 0 ? '+' : ''}${cents} セント ${isAccurate ? '✅' : ''}
            </div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center text-gray-400">
            <div class="text-2xl mb-2">🎵 ${currentNote} を歌ってください</div>
            <div class="text-lg">音声を検出中...</div>
          </div>
        `;
      }
    }
  }, [frequencyToNoteName]);
  
  const updateVolumeDisplay = useCallback((volume: number) => {
    if (volumeBarRef.current) {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      volumeBarRef.current.style.width = `${clampedVolume}%`;
      volumeBarRef.current.style.backgroundColor = 
        volume > 30 ? '#10b981' : volume > 10 ? '#f59e0b' : '#ef4444';
    }
  }, []);
  
  const updateNoteProgress = useCallback((noteIndex: number, total: number) => {
    if (noteProgressRef.current) {
      const progress = ((noteIndex + 1) / total) * 100;
      noteProgressRef.current.innerHTML = `
        <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
        </div>
        <div class="text-center text-sm text-gray-600">進行状況: ${noteIndex + 1} / ${total}</div>
      `;
    }
  }, []);

  // 初期化とランダム基音選択
  useEffect(() => {
    const initializeTraining = async () => {
      try {
        console.log('🔄 基音システム初期化開始...');
        const success = await baseFrequency.initialize();
        if (success) {
          console.log('✅ 基音システム初期化成功');
          const selectedTone = baseFrequency.selectRandomBaseTone();
          console.log('🎲 基音選択完了:', selectedTone);
          setIsInitialized(true);
        } else {
          console.error('❌ 基音システム初期化失敗');
          onError('基音システムの初期化に失敗しました。ページを再読み込みしてください。');
        }
      } catch (error) {
        console.error('❌ トレーニング初期化エラー:', error);
        onError('トレーニングの初期化に失敗しました。ページを再読み込みしてください。');
      }
    };

    if (!isInitialized) {
      // 少し遅延して初期化（DOM準備完了後）
      const timer = setTimeout(() => {
        initializeTraining();
      }, 500);
      
      return () => clearTimeout(timer);
    }

    // クリーンアップ
    return () => {
      baseFrequency.cleanup();
    };
  }, [baseFrequency, isInitialized, onError]);
  
  // リアルタイム音程検出・表示更新（60FPS）
  useEffect(() => {
    if (!isRecording || !baseFrequency.currentBaseTone) return;
    
    const targetFreqs = getTargetFrequencies(baseFrequency.currentBaseTone.frequency);
    const currentTargetFreq = targetFreqs[currentNoteIndex];
    const currentNote = SCALE_NOTES[currentNoteIndex];
    
    const updateLoop = () => {
      if (isRecording) {
        // 音程検出更新
        const { frequency, clarity } = pitchDetection.updateDetection();
        
        // 音量表示更新
        const volumePercent = microphoneState.audioLevel * 100;
        updateVolumeDisplay(volumePercent);
        
        // 音程表示更新
        updateFrequencyDisplay(frequency, currentTargetFreq, currentNote);
        
        // 進行状況更新
        updateNoteProgress(currentNoteIndex, SCALE_NOTES.length);
        
        requestAnimationFrame(updateLoop);
      }
    };
    
    if (isRecording) {
      updateLoop();
    }
  }, [isRecording, baseFrequency.currentBaseTone, currentNoteIndex, getTargetFrequencies, pitchDetection, microphoneState.audioLevel, updateVolumeDisplay, updateFrequencyDisplay, updateNoteProgress]);

  // 基音再生ハンドラー
  const handlePlayBaseTone = useCallback(async () => {
    try {
      // 基音が選択されていない場合、強制的に選択
      if (!baseFrequency.currentBaseTone) {
        console.log('🔧 基音未選択のため強制選択実行');
        baseFrequency.selectRandomBaseTone();
      }
      
      await baseFrequency.playBaseTone(2); // 2秒間再生
    } catch (error) {
      console.error('基音再生エラー:', error);
      onError('基音の再生に失敗しました。ページを再読み込みしてください。');
    }
  }, [baseFrequency, onError]);

  // 新しい基音を選択
  const handleNewBaseTone = useCallback(() => {
    baseFrequency.selectRandomBaseTone();
    setRecordingMode('baseTone');
    setCurrentNoteIndex(0);
    setIsRecording(false);
  }, [baseFrequency]);
  
  // 8音階録音開始
  const handleStartRecording = useCallback(async () => {
    try {
      // 基音が選択されていない場合、強制的に選択
      if (!baseFrequency.currentBaseTone) {
        console.log('🔧 録音開始時に基音強制選択');
        const selectedTone = baseFrequency.selectRandomBaseTone();
        if (!selectedTone) {
          // それでも失敗した場合、デフォルト基音を使用
          console.log('🔧 デフォルト基音（C4）を使用');
          // baseFrequency.currentBaseTone が更新されるまで少し待つ
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const success = await startRecording();
      if (success && microphoneState.audioContext && microphoneState.analyser) {
        // 基音が確定した状態で目標周波数を設定
        const currentTone = baseFrequency.currentBaseTone || BASE_TONES[1]; // デフォルトC4
        const targetFreqs = getTargetFrequencies(currentTone.frequency);
        pitchDetection.setTargetFrequencies(targetFreqs);
        
        // 音程検出開始
        pitchDetection.startDetection(microphoneState.audioContext, microphoneState.analyser);
        
        setRecordingMode('recording');
        setCurrentNoteIndex(0);
        setIsRecording(true);
        console.log('✅ 8音階録音開始:', currentTone);
      } else {
        onError('録音の開始に失敗しました。マイクロフォンの許可を確認してください。');
      }
    } catch (error) {
      console.error('録音開始エラー:', error);
      onError('録音の開始に失敗しました。ページを再読み込みしてください。');
    }
  }, [startRecording, baseFrequency, microphoneState.audioContext, microphoneState.analyser, getTargetFrequencies, pitchDetection, onError]);
  
  // 次の音階に進む
  const handleNextNote = useCallback(() => {
    if (currentNoteIndex < SCALE_NOTES.length - 1) {
      setCurrentNoteIndex(prev => prev + 1);
    } else {
      // 8音階完了
      setIsRecording(false);
      stopRecording();
      pitchDetection.stopDetection();
      console.log('✅ 8音階録音完了');
      onEvaluation();
    }
  }, [currentNoteIndex, stopRecording, pitchDetection, onEvaluation]);
  
  // 録音停止
  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingMode('baseTone');
    stopRecording();
    pitchDetection.stopDetection();
    console.log('🛑 録音停止');
  }, [stopRecording, pitchDetection]);

  if (!isInitialized) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">🎼</div>
        <h2 className="text-3xl font-bold mb-6">🎵 トレーニング準備中</h2>
        <p className="mb-8 text-gray-600">基音システムを初期化しています...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <>
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          ランダム基音トレーニング
        </h2>
        <p className="text-xl text-gray-600">基音を聞いて、ドレミファソラシドを正確に歌いましょう</p>
      </div>

      {/* 基音表示エリア */}
      {baseFrequency.currentBaseTone && (
        <div className="mb-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎹 現在の基音</h3>
          
          {/* 基音情報表示 */}
          <div className="text-center mb-6">
            <div className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {baseFrequency.currentBaseTone.note}
            </div>
            <div className="text-3xl text-gray-700 mb-2">
              {baseFrequency.currentBaseTone.name}
            </div>
            <div className="text-xl text-gray-600">
              {baseFrequency.currentBaseTone.frequency.toFixed(1)} Hz
            </div>
          </div>

          {/* 基音制御ボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handlePlayBaseTone}
              disabled={baseFrequency.isPlaying}
              className={`group flex items-center space-x-3 px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
                baseFrequency.isPlaying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <Volume2 className="w-6 h-6" />
              <span>{baseFrequency.isPlaying ? '🎵 再生中...' : '🎹 基音を聞く (2秒)'}</span>
            </button>
            
            <button
              onClick={handleNewBaseTone}
              disabled={baseFrequency.isPlaying}
              className="group flex items-center space-x-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
              <span>🎲 別の基音にする</span>
            </button>
            
            {/* 緊急用：手動基音選択 */}
            {!baseFrequency.currentBaseTone && isInitialized && (
              <button
                onClick={() => {
                  const randomTone = BASE_TONES[Math.floor(Math.random() * BASE_TONES.length)];
                  console.log('🔧 手動基音選択:', randomTone);
                  // 直接基音設定を試行
                  handleNewBaseTone();
                }}
                className="group flex items-center space-x-3 px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition-all duration-300 hover:scale-105 border border-orange-300"
              >
                <RotateCcw className="w-5 h-5" />
                <span>🔧 基音を手動選択</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3 統合: 8音階録音システム */}
      {recordingMode === 'recording' && (
        <div className="mb-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎵 8音階歌唱録音</h3>
          
          {/* 進行状況バー */}
          <div ref={noteProgressRef} className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300" style={{width: `${((currentNoteIndex + 1) / SCALE_NOTES.length) * 100}%`}}></div>
            </div>
            <div className="text-center text-sm text-gray-600">進行状況: {currentNoteIndex + 1} / {SCALE_NOTES.length}</div>
          </div>
          
          {/* 現在の音階表示 */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {SCALE_NOTES[currentNoteIndex]}
            </div>
            <div className="text-xl text-gray-600">
              ({currentNoteIndex + 1}/{SCALE_NOTES.length})
            </div>
          </div>
          
          {/* 音量レベル表示 */}
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className="text-lg font-semibold text-gray-700">音量レベル</span>
            </div>
            <div className="bg-gray-200 rounded-full h-4 w-full overflow-hidden">
              <div 
                ref={volumeBarRef}
                className="h-full transition-all duration-100 ease-out"
                style={{ width: '0%', backgroundColor: '#ef4444' }}
              />
            </div>
          </div>
          
          {/* リアルタイム音程検出表示 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div ref={frequencyDisplayRef} className="min-h-[120px] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">🎵 {SCALE_NOTES[currentNoteIndex]} を歌ってください</div>
                <div className="text-lg">音声を検出中...</div>
              </div>
            </div>
          </div>
          
          {/* 録音制御ボタン */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleNextNote}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 shadow-lg font-bold"
            >
              {currentNoteIndex < SCALE_NOTES.length - 1 ? '次の音階へ' : '録音完了'}
            </button>
            <button
              onClick={handleStopRecording}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              録音停止
            </button>
          </div>
        </div>
      )}

      {/* Step 3 進行状況（基音モード時表示） */}
      {recordingMode === 'baseTone' && (
        <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-blue-800 mb-4">📋 Step 3: 録音・検出システム実装完了</h3>
          <div className="space-y-3 text-blue-700 text-left">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span>Pitchy統合音程検出フック作成</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span>8音階順次録音システム実装</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span>リアルタイム周波数表示機能</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
              <span>進行状況管理システム</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">→</span>
              <span className="font-semibold">準備完了: 8音階歌唱録音を開始できます</span>
            </div>
          </div>
        </div>
      )}

      {/* デバッグ情報表示 */}
      {recordingMode === 'baseTone' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto">
          <h4 className="font-bold text-gray-700 mb-2">🔍 システム状態</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>初期化状態: {isInitialized ? '✅ 完了' : '⏳ 処理中...'}</div>
            <div>基音システム: {baseFrequency.isLoaded ? '✅ 読み込み完了' : '⏳ 読み込み中...'}</div>
            <div>基音選択: {baseFrequency.currentBaseTone ? `✅ ${baseFrequency.currentBaseTone.note}` : '❌ 未選択'}</div>
            <div>録音ボタン: {!baseFrequency.currentBaseTone ? '❌ 無効（基音未選択）' : '✅ 有効'}</div>
          </div>
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="space-x-4">
        {recordingMode === 'baseTone' && (
          <button
            onClick={handleStartRecording}
            disabled={!isInitialized}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="w-5 h-5 inline mr-2" />
            {!isInitialized ? '⏳ 初期化中...' : '🎵 8音階歌唱録音開始'}
          </button>
        )}
        <button
          onClick={onEnd}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
        >
          トレーニング終了
        </button>
      </div>

      {/* ヒント */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200 max-w-md mx-auto">
        <h4 className="font-bold text-yellow-800 mb-2">💡 使い方</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          {recordingMode === 'baseTone' ? (
            <>
              <div>• 「基音を聞く」で2秒間基音が再生されます</div>
              <div>• 基音を覚えたら「8音階歌唱録音開始」をクリック</div>
              <div>• ドレミファソラシドを順番に正確に歌いましょう</div>
              <div>• リアルタイムで音程と誤差が表示されます</div>
            </>
          ) : (
            <>
              <div>• 表示された音階名を見て正確に歌ってください</div>
              <div>• 目標周波数と現在の音程が表示されます</div>
              <div>• ±20セント以内で緑色の✅が表示されます</div>
              <div>• 「次の音階へ」で進む、「録音完了」で評価に進みます</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Phase 3: 評価（仮実装）
function EvaluationPhase({ 
  onNext, 
  onEnd 
}: { 
  onNext: () => void; 
  onEnd: () => void; 
}) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-6">📊 個別評価</h2>
      <p className="mb-8 text-gray-600">8音階の評価結果を表示します</p>
      
      <div className="space-x-4">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          次の基音へ
        </button>
        <button
          onClick={onEnd}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          トレーニング終了
        </button>
      </div>
    </div>
  );
}

// Phase 4: 総合結果（仮実装）
function ResultsPhase({ 
  onRestart 
}: { 
  onRestart: () => void; 
}) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-6">🏆 総合結果</h2>
      <p className="mb-8 text-gray-600">トレーニングセッションの総合評価を表示します</p>
      
      <div className="space-x-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <RotateCcw className="w-5 h-5 inline mr-2" />
          もう一度トレーニング
        </button>
      </div>
    </div>
  );
}
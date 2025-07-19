'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Play, RotateCcw, CheckCircle } from "lucide-react";
import { useMicrophoneManager } from "@/hooks/useMicrophoneManager";
import { PitchDetector } from "pitchy";

// Phase管理システム
type TrainingPhase = 'welcome' | 'micTest' | 'training' | 'evaluation' | 'results';

export default function RandomTrainingPage() {
  // Phase状態管理
  const [currentPhase, setCurrentPhase] = useState<TrainingPhase>('welcome');
  const [error, setError] = useState<string | null>(null);

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
  const [testCompleted, setTestCompleted] = useState(false);
  
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
            <div class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              ${noteName}
            </div>
            <div class="text-2xl text-gray-700 font-semibold">
              ${freq.toFixed(1)} Hz
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

  // マイクテスト停止
  const handleStopTest = useCallback(() => {
    stopRecording();
    setTestCompleted(true);
  }, [stopRecording]);

  // テスト完了判定（音量30%以上）
  const isVolumeGood = microphoneState.audioLevel > 0.3;
  const canComplete = microphoneState.isRecording && isVolumeGood && testCompleted;

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
            <span>音量が30%以上になることを確認</span>
          </div>
        </div>
      </div>

      {/* 音量レベル + 音程表示 */}
      {microphoneState.isRecording && (
        <div className="mb-8 space-y-6">
          {/* 音程表示 */}
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🎵 検出された音程</h3>
            <div className="h-24 flex items-center justify-center">
              <div ref={frequencyDisplayRef}>
                <div className="text-center text-gray-400">
                  🎵 ドの音を発声してください
                </div>
              </div>
            </div>
          </div>
          
          {/* 音量レベル表示 */}
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔊 音量レベル</h3>
          
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
          <div className="text-center">
            <div ref={volumeTextRef} className="text-2xl font-bold text-red-600">
              0.0%
            </div>
            <div ref={volumeStatusRef} className="text-sm text-gray-500 mt-1">
              ❌ 音声が小さすぎます
            </div>
          </div>

          {/* 音量ガイド */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              ドの音を発声して<br/>
              <span className="font-bold text-green-600">30%以上</span>になるよう調整してください
            </p>
          </div>
          </div>
        </div>
      )}

      {/* 制御ボタン */}
      <div className="mb-8 space-y-4">
        {!microphoneState.isRecording ? (
          <button
            onClick={handleStartTest}
            className="group relative overflow-hidden px-10 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <Mic className="w-6 h-6" />
              <span>🎤 マイクテスト開始</span>
            </div>
          </button>
        ) : (
          <button
            onClick={handleStopTest}
            className="group relative overflow-hidden px-10 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-3">
              <MicOff className="w-6 h-6" />
              <span>🛑 テスト停止</span>
            </div>
          </button>
        )}
      </div>

      {/* テスト完了・進行ボタン */}
      <div className="space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          戻る
        </button>
        
        {canComplete && (
          <button
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            テスト完了 - トレーニング開始
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

// Phase 2: トレーニング（仮実装）
function TrainingPhase({ 
  onEvaluation, 
  onEnd, 
  onError 
}: { 
  onEvaluation: () => void; 
  onEnd: () => void; 
  onError: (error: string) => void; 
}) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-6">🎵 トレーニング中</h2>
      <p className="mb-8 text-gray-600">基音再生と8音階歌唱を行います</p>
      
      <div className="space-x-4">
        <button
          onClick={onEvaluation}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          評価へ
        </button>
        <button
          onClick={onEnd}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          終了
        </button>
      </div>
    </div>
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
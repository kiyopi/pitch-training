'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Mic, MicOff } from "lucide-react";
import { VanillaAudioEngine, PROTOTYPE_BASE_TONES, type BaseTone } from "@/utils/vanillaAudioEngine";
import { HybridAudioInterface, createHybridAudioInterfaceFromRefs, type AudioDisplayData } from "@/utils/hybridAudioInterface";
import { useMicrophoneManager } from "@/hooks/useMicrophoneManager";
import { frequencyToNote, evaluateRelativePitchAccuracy } from "@/utils/noteUtils";

export default function HybridAudioTestPage() {
  // React状態管理（SSR hydration問題対策）
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPlayingPiano, setIsPlayingPiano] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    baseTone: BaseTone;
    userFreq: number;
    accuracy: string;
    score: number;
    timestamp: Date;
  }>>([]);

  // DOM直接操作用のRef
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeTextRef = useRef<HTMLSpanElement>(null);
  const volumeStatusRef = useRef<HTMLDivElement>(null);
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const noteDisplayRef = useRef<HTMLDivElement>(null);
  const clarityDisplayRef = useRef<HTMLDivElement>(null);
  const debugLogRef = useRef<HTMLDivElement>(null);

  // ハイブリッドシステム用のRef
  const audioEngineRef = useRef<VanillaAudioEngine | null>(null);
  const hybridInterfaceRef = useRef<HybridAudioInterface | null>(null);

  // マイクロフォン管理フック
  const { microphoneState, startRecording, stopRecording } = useMicrophoneManager();

  // 音程検出用の状態
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [pitchClarity, setPitchClarity] = useState(0);
  const [detectedNote, setDetectedNote] = useState({ note: '', octave: 0, fullNote: '' });

  /**
   * Hydration完了処理
   */
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /**
   * コンポーネント初期化
   */
  useEffect(() => {
    if (!isHydrated) return;
    
    console.log('🚀 HybridAudioTest: 初期化開始');

    // VanillaAudioEngine初期化
    audioEngineRef.current = new VanillaAudioEngine({
      volume: 6,    // プロトタイプ準拠（iPhone音量問題解決済み）
      velocity: 0.8, // プロトタイプ準拠
      duration: 2000 // プロトタイプ準拠の2秒再生
    });

    // ハイブリッドインターフェース初期化（DOM直接操作）
    hybridInterfaceRef.current = createHybridAudioInterfaceFromRefs({
      volumeBarRef,
      volumeTextRef,
      volumeStatusRef,
      frequencyDisplayRef,
      noteDisplayRef,
      clarityDisplayRef,
      debugLogRef
    });

    console.log('✅ HybridAudioTest: 初期化完了');

    // クリーンアップ
    return () => {
      if (hybridInterfaceRef.current) {
        hybridInterfaceRef.current.dispose();
      }
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
    };
  }, [isHydrated]);

  /**
   * 音声データ取得コールバック（60FPS用）
   */
  const getAudioDisplayData = useCallback((): AudioDisplayData => {
    // マイクロフォンからのデータを使用
    const volume = microphoneState.audioLevel;
    const frequency = detectedFrequency;
    const isValidSound = volume > 5 && frequency > 80;
    
    return {
      volume,
      frequency,
      note: detectedNote.note,
      octave: detectedNote.octave,
      clarity: pitchClarity,
      isValidSound
    };
  }, [microphoneState.audioLevel, detectedFrequency, detectedNote.note, detectedNote.octave, pitchClarity]);

  /**
   * マイクロフォン開始（自動でDOM可視化開始）
   */
  const handleStartMicrophone = async () => {
    try {
      console.log('🎤 マイクロフォン開始');
      
      const success = await startRecording();
      
      if (success && hybridInterfaceRef.current) {
        // DOM直接操作による60FPS可視化開始
        hybridInterfaceRef.current.start(() => {
          const currentLevel = microphoneState.audioLevel || 0;
          const mockFreq = currentLevel > 10 ? 220 + (currentLevel * 2) : 0;
          const mockClarity = currentLevel > 10 ? Math.min(currentLevel / 50, 1) : 0;
          
          return {
            volume: currentLevel,
            frequency: mockFreq,
            note: detectedNote.note || '—',
            octave: detectedNote.octave || 0,
            clarity: mockClarity,
            isValidSound: mockFreq > 80 && mockClarity > 0.3
          };
        });
        hybridInterfaceRef.current.addDebugMessage('マイクロフォン＋可視化開始');
        
        console.log('🚀 HybridAudioInterface: 60FPS更新開始');
      } else {
        console.error('❌ マイクロフォン開始失敗');
      }
      
    } catch (error) {
      console.error('❌ マイクロフォン開始エラー:', error);
    }
  };

  /**
   * マイクロフォン停止
   */
  const handleStopMicrophone = () => {
    console.log('🛑 マイクロフォン停止');
    
    stopRecording();
    
    if (hybridInterfaceRef.current) {
      hybridInterfaceRef.current.stop();
      hybridInterfaceRef.current.addDebugMessage('マイクロフォン＋可視化停止');
      console.log('⏹️ HybridAudioInterface: 60FPS更新停止');
    }
    
    // 検出データリセット
    setDetectedFrequency(0);
    setPitchClarity(0);
    setDetectedNote({ note: '', octave: 0, fullNote: '' });
    
    console.log('✅ マイクロフォン＋可視化停止完了');
  };

  /**
   * ランダム基音再生（VanillaAudioEngine使用）
   */
  const handlePlayRandomBaseTone = async () => {
    if (isPlayingPiano || !audioEngineRef.current) {
      console.warn('⚠️ ピアノ再生スキップ（再生中または未初期化）');
      return;
    }

    setIsPlayingPiano(true);
    
    try {
      console.log('🎲 ランダム基音再生開始');
      
      // VanillaAudioEngine でランダム基音再生
      const selectedTone = await audioEngineRef.current.playRandomBaseTone();
      
      if (selectedTone) {
        setCurrentBaseTone(selectedTone);
        
        if (hybridInterfaceRef.current) {
          hybridInterfaceRef.current.addDebugMessage(`基音: ${selectedTone.note} (${selectedTone.frequency}Hz)`);
        }
        
        console.log(`✅ 基音再生: ${selectedTone.note} (${selectedTone.frequency}Hz)`);
        
        // プロトタイプ準拠の2秒後に自動停止
        setTimeout(() => {
          setIsPlayingPiano(false);
          console.log('🔇 基音再生終了');
        }, 2000);
        
      } else {
        throw new Error('基音再生失敗');
      }
      
    } catch (error) {
      console.error('❌ 基音再生エラー:', error);
      setIsPlayingPiano(false);
      
      if (hybridInterfaceRef.current) {
        hybridInterfaceRef.current.addDebugMessage(`基音再生エラー: ${error}`);
      }
    }
  };

  /**
   * 音程検出処理（将来的にPitchy統合用プレースホルダー）
   */
  useEffect(() => {
    if (microphoneState.isRecording && microphoneState.audioLevel > 10) {
      // TODO: Pitchy統合で実際の周波数検出を追加
      // 現在は音量レベルのみを使用したモックデータ
      const mockFreq = 220 + (microphoneState.audioLevel * 2); // A3ベースのモック
      const mockClarity = Math.min(microphoneState.audioLevel / 50, 1);
      
      setDetectedFrequency(mockFreq);
      setPitchClarity(mockClarity);
      
      // 音名計算
      if (mockFreq > 80 && mockClarity > 0.3) {
        const noteInfo = frequencyToNote(mockFreq);
        setDetectedNote({
          note: noteInfo.note,
          octave: noteInfo.octave,
          fullNote: noteInfo.fullNote
        });
      }
    } else {
      setDetectedFrequency(0);
      setPitchClarity(0);
      setDetectedNote({ note: '', octave: 0, fullNote: '' });
    }
  }, [
    microphoneState.isRecording,
    microphoneState.audioLevel
  ]);

  /**
   * 精度評価記録
   */
  const recordAccuracy = () => {
    if (!currentBaseTone || detectedFrequency <= 0) {
      console.warn('⚠️ 精度記録スキップ（基音なしまたは周波数検出なし）');
      return;
    }

    // 相対音程精度評価
    const baseFreq = currentBaseTone.frequency;
    const userFreq = detectedFrequency;
    const cents = Math.round(1200 * Math.log2(userFreq / baseFreq));
    const accuracy = evaluateRelativePitchAccuracy(cents);
    
    const result = {
      baseTone: currentBaseTone,
      userFreq,
      accuracy: accuracy.accuracy,
      score: accuracy.score,
      timestamp: new Date()
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // 最大10件保持
    
    console.log(`📊 精度記録: ${accuracy.accuracy} (${accuracy.score}点)`);
    
    if (hybridInterfaceRef.current) {
      hybridInterfaceRef.current.addDebugMessage(`精度: ${accuracy.accuracy} (${accuracy.score}点)`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg">
        🧪 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="inline-block mb-4">
            <span className="text-6xl">🎵🔬</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            ハイブリッドオーディオテスト
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            React UI + Vanilla JS Audio のハイブリッド実装検証
          </p>
          <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
            プロトタイプ準拠音声 + DOM直接操作可視化
          </div>
        </div>

        {/* 制御ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 基音再生ボタン */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎹 基音再生</h3>
            <button
              onClick={handlePlayRandomBaseTone}
              disabled={isPlayingPiano}
              className={`w-full px-6 py-4 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                isPlayingPiano
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-6 h-6" />
                <span>{isPlayingPiano ? '🎵 再生中...' : '🎲 ランダム基音'}</span>
              </div>
            </button>
            
            {/* 現在の基音表示（SSR対策） */}
            {isHydrated && currentBaseTone && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">基音:</span> {currentBaseTone.note}
                </p>
                <p className="text-xs text-blue-600">
                  {currentBaseTone.frequency.toFixed(2)} Hz
                </p>
              </div>
            )}
          </div>

          {/* マイクロフォン制御 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 マイクロフォン</h3>
            
            {!microphoneState.isRecording ? (
              <button
                onClick={handleStartMicrophone}
                className="w-full px-6 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Mic className="w-6 h-6" />
                  <span>🎤 録音開始</span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleStopMicrophone}
                className="w-full px-6 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <MicOff className="w-6 h-6" />
                  <span>⏹️ 録音停止</span>
                </div>
              </button>
            )}
            
            {/* 精度記録ボタン */}
            {microphoneState.isRecording && currentBaseTone && (
              <button
                onClick={recordAccuracy}
                className="w-full mt-3 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all duration-300"
              >
                📊 精度記録
              </button>
            )}
          </div>
        </div>

        {/* ハイブリッド可視化パネル */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🔬 ハイブリッド音声可視化 (DOM直接操作)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 音量可視化 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700">🔊 音量レベル</h4>
              
              {/* 音量バー（DOM直接操作） */}
              <div className="relative">
                <div className="bg-gray-200 rounded-full h-8 w-full overflow-hidden">
                  <div 
                    ref={volumeBarRef}
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100 ease-out"
                    style={{ width: '0%' }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold">
                    <span ref={volumeTextRef}>0.0%</span>
                  </span>
                </div>
              </div>
              
              {/* 音量ステータス（DOM直接操作） */}
              <div ref={volumeStatusRef} className="text-sm text-gray-500">
                音量検出待ち...
              </div>
            </div>

            {/* 周波数・音名検出 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700">🎵 音程検出</h4>
              
              {/* 周波数表示（DOM直接操作） */}
              <div ref={frequencyDisplayRef} className="text-lg text-gray-400">
                🎤 音声を検出中...
              </div>
              
              {/* 音名表示（DOM直接操作） */}
              <div ref={noteDisplayRef} className="text-lg text-gray-400">
                ♪ ---
              </div>
              
              {/* クラリティ表示（DOM直接操作） */}
              <div ref={clarityDisplayRef} className="text-sm text-gray-500">
                🎯 精度: --- (検出中)
              </div>
            </div>
          </div>
        </div>

        {/* デバッグログ（DOM直接操作） */}
        <div className="bg-gray-50 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📝 デバッグログ（リアルタイム）</h3>
          <div ref={debugLogRef} className="text-xs text-gray-600 font-mono space-y-1 max-h-32 overflow-y-auto">
            デバッグログなし
          </div>
        </div>

        {/* テスト結果履歴 */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 精度テスト履歴</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-semibold">{result.baseTone.note}</span>
                    <span className="text-gray-600 ml-2">{result.userFreq.toFixed(1)}Hz</span>
                  </div>
                  <div className={`font-bold ${
                    result.accuracy === 'perfect' ? 'text-green-600' :
                    result.accuracy === 'excellent' ? 'text-blue-600' :
                    result.accuracy === 'good' ? 'text-cyan-600' :
                    result.accuracy === 'fair' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {result.score}点
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <Link 
          href="/test/accuracy-test-v2"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>精度テストv2に戻る</span>
        </Link>
      </div>
    </div>
  );
}
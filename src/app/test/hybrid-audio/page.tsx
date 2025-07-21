'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Mic, MicOff, AlertCircle, Activity, Volume2 } from "lucide-react";
import * as Tone from "tone";
import { useMicrophoneManager } from "@/hooks/useMicrophoneManager";
import { HybridAudioInterface, type AudioDisplayData } from "@/utils/hybridAudioInterface";

// 基音データベース（random-training準拠）
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

// random-training準拠の基音管理フック
const useBaseFrequency = () => {
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初期化（iPhone Safari対応強化）
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 基音システム初期化開始...');
      
      // プロトタイプ準拠のシンプル音量実装（iPhone音量問題解決）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3", 
          "A4": "A4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,     // 自然な減衰
        volume: 6         // プロトタイプと同じ音量設定
      }).toDestination(); // 直接接続（プロトタイプ準拠）

      samplerRef.current = sampler;

      console.log('🎹 ピアノ音源読み込み中...');
      await Tone.loaded();
      
      setIsLoaded(true);
      console.log('✅ 基音システム初期化完了（Salamander Piano）');
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

  // 基音再生（iPhone Safari対応強化）
  const playBaseTone = useCallback(async (duration: number = 2): Promise<void> => {
    try {
      if (!samplerRef.current || !currentBaseTone) {
        throw new Error('基音システムが準備されていません');
      }

      // iPhone Safari: ユーザーインタラクション後にTone.js再初期化
      if (Tone.context.state !== 'running') {
        console.log('🔄 AudioContext再開中...');
        await Tone.start();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (isPlaying) {
        stopBaseTone();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setIsPlaying(true);
      console.log(`🎹 基音再生開始: ${currentBaseTone.note} (${duration}秒)`);
      
      samplerRef.current.triggerAttack(currentBaseTone.tonejs, undefined, 0.8);
      
      setTimeout(() => {
        if (samplerRef.current && currentBaseTone) {
          samplerRef.current.triggerRelease(currentBaseTone.tonejs);
        }
      }, duration * 1000);
      
      timeoutRef.current = setTimeout(() => {
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

export default function HybridAudioTestPage() {
  // 基音システム統合
  const baseFrequency = useBaseFrequency();
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  // マイクロフォンシステム
  const { microphoneState, startRecording, stopRecording } = useMicrophoneManager();
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  // DOM直接操作用のRef（random-trainingスタイル）
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeTextRef = useRef<HTMLSpanElement>(null);
  const volumeStatusRef = useRef<HTMLDivElement>(null);
  const frequencyDisplayRef = useRef<HTMLDivElement>(null);
  const debugLogRef = useRef<HTMLDivElement>(null);

  // ハイブリッドシステム用のRef
  const hybridInterfaceRef = useRef<HybridAudioInterface | null>(null);

  // DOM直接更新関数（random-training準拠）
  const updateVolumeDisplay = useCallback((volume: number) => {
    if (volumeBarRef.current) {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      
      volumeBarRef.current.style.width = `${clampedVolume}%`;
      volumeBarRef.current.style.minWidth = clampedVolume > 0 ? '2px' : '0px';
      
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
        // TODO: 音程名変換機能を統合
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center">
            <div class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ${freq.toFixed(1)} Hz
            </div>
          </div>
        `;
      } else {
        frequencyDisplayRef.current.innerHTML = `
          <div class="text-center text-gray-400">
            🎵 音声を発声してください
          </div>
        `;
      }
    }
  }, []);

  // マイク音量監視（DOM直接更新）
  useEffect(() => {
    if (microphoneState.isRecording) {
      updateVolumeDisplay(microphoneState.audioLevel);
    }
  }, [microphoneState.audioLevel, microphoneState.isRecording, updateVolumeDisplay]);
  
  /**
   * コンポーネント初期化（random-trainingベース）
   */
  useEffect(() => {
    addLog('🚀 HybridAudioTest: 初期化開始');
    
    // 基音システム初期化
    baseFrequency.initialize();
    
    addLog('✅ HybridAudioTest: 初期化完了');
    
    return () => {
      baseFrequency.cleanup();
    };
  }, []);

  /**
   * ランダム基音再生（random-training準拠）
   */
  const handlePlayRandomBaseTone = useCallback(async () => {
    try {
      if (!baseFrequency.isLoaded) {
        addLog('⚠️ 基音システム未初期化');
        await baseFrequency.initialize();
      }
      
      // ランダム基音選択
      const selectedTone = baseFrequency.selectRandomBaseTone();
      addLog(`🎲 ランダム基音: ${selectedTone.note} (${selectedTone.frequency}Hz)`);
      
      // 基音再生
      await baseFrequency.playBaseTone(2);
      addLog(`🎵 基音再生: ${selectedTone.note}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ 基音再生エラー: ${errorMessage}`);
      setError(errorMessage);
    }
  }, [baseFrequency]);

  /**
   * マイクロフォン開始（random-training準拠）
   */
  const handleStartMicrophone = useCallback(async () => {
    try {
      addLog('🎤 マイクロフォン開始');
      
      const success = await startRecording();
      if (success) {
        addLog('✅ マイクロフォン開始成功');
      } else {
        addLog('❌ マイクロフォン開始失敗');
        if (microphoneState.error) {
          setError(microphoneState.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ マイクロフォンエラー: ${errorMessage}`);
      setError(errorMessage);
    }
  }, [startRecording, microphoneState.error]);
  
  /**
   * マイクロフォン停止（random-training準拠）
   */
  const handleStopMicrophone = useCallback(() => {
    addLog('🛑 マイクロフォン停止');
    stopRecording();
    addLog('✅ マイクロフォン停止完了');
  }, [stopRecording]);





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
              disabled={baseFrequency.isPlaying}
              className={`w-full px-6 py-4 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                baseFrequency.isPlaying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-6 h-6" />
                <span>{baseFrequency.isPlaying ? '🎵 再生中...' : '🎲 ランダム基音'}</span>
              </div>
            </button>
            
            {/* 現在の基音表示 */}
            {baseFrequency.currentBaseTone && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">基音:</span> {baseFrequency.currentBaseTone.note}
                </p>
                <p className="text-xs text-blue-600">
                  {baseFrequency.currentBaseTone.frequency.toFixed(2)} Hz
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
              
              {/* 音名表示（将来実装予定） */}
              <div className="text-lg text-gray-400">
                ♪ --- (音程検出準備中)
              </div>
              
              {/* クラリティ表示（将来実装予定） */}
              <div className="text-sm text-gray-500">
                🎯 精度: --- (音程検出準備中)
              </div>
            </div>
          </div>
        </div>


        {/* テスト結果履歴（将来実装予定） */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 テスト機能（準備中）</h3>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">🚧</div>
            <p className="text-lg">精度テスト機能は将来実装予定です</p>
            <p className="text-sm mt-2">現在は基本的な音声機能の動作確認中</p>
          </div>
        </div>

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
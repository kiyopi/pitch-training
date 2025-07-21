'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import * as Tone from 'tone';

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

export default function SimpleBaseTonePage() {
  // DOM操作用のRef
  const statusRef = useRef<HTMLDivElement>(null);
  const currentToneRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // 音源システム
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // DOM直接更新関数
  const updateStatus = (message: string, color: string = 'blue') => {
    if (statusRef.current) {
      statusRef.current.innerHTML = `<span class="text-${color}-600 font-bold">${message}</span>`;
    }
  };

  const updateCurrentTone = (tone: BaseTone | null) => {
    if (currentToneRef.current) {
      if (tone) {
        currentToneRef.current.innerHTML = `
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-2xl font-bold text-blue-800">${tone.note}</div>
            <div class="text-sm text-blue-600">${tone.frequency.toFixed(2)} Hz</div>
          </div>
        `;
      } else {
        currentToneRef.current.innerHTML = `
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-gray-500">基音を選択してください</div>
          </div>
        `;
      }
    }
  };

  const updatePlayButton = (playing: boolean) => {
    if (playButtonRef.current) {
      if (playing) {
        playButtonRef.current.disabled = true;
        playButtonRef.current.className = 'w-full px-6 py-4 rounded-xl text-lg font-bold text-white bg-gray-400 cursor-not-allowed';
        playButtonRef.current.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <span>🎵 再生中...</span>
          </div>
        `;
      } else {
        playButtonRef.current.disabled = false;
        playButtonRef.current.className = 'w-full px-6 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105 transition-all duration-300 shadow-lg';
        playButtonRef.current.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <span>🎲 ランダム基音再生</span>
          </div>
        `;
      }
    }
  };

  const addLog = (message: string) => {
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
  };

  // 初期化関数
  const initializeAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (isInitializedRef.current) {
        return true;
      }

      addLog('🔄 音声システム初期化開始...');
      updateStatus('初期化中...', 'yellow');

      // Salamander Piano音源（iPhone対応強化版）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
          "D#4": "Ds4.mp3", 
          "F#4": "Fs4.mp3",
          "A4": "A4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6 // iPhone音量問題解決のため
      }).toDestination();

      samplerRef.current = sampler;

      addLog('🎹 ピアノ音源読み込み中...');
      await Tone.loaded();

      isInitializedRef.current = true;
      addLog('✅ 音声システム初期化完了');
      updateStatus('準備完了', 'green');
      
      return true;
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
      addLog(`❌ 初期化失敗: ${error}`);
      updateStatus('初期化失敗', 'red');
      return false;
    }
  }, []);

  // ランダム基音再生
  const playRandomBaseTone = useCallback(async () => {
    try {
      if (isPlayingRef.current) {
        return;
      }

      // 初期化チェック
      if (!isInitializedRef.current) {
        const success = await initializeAudio();
        if (!success) return;
      }

      // AudioContext再開（iPhone対応）
      if (Tone.context.state !== 'running') {
        addLog('🔄 AudioContext再開中...');
        await Tone.start();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // ランダム基音選択
      const randomIndex = Math.floor(Math.random() * BASE_TONES.length);
      const selectedTone = BASE_TONES[randomIndex];

      isPlayingRef.current = true;
      updatePlayButton(true);
      updateCurrentTone(selectedTone);
      updateStatus(`再生中: ${selectedTone.note}`, 'blue');
      addLog(`🎲 ランダム選択: ${selectedTone.note} (${selectedTone.frequency}Hz)`);

      if (samplerRef.current) {
        // 2秒間再生
        samplerRef.current.triggerAttack(selectedTone.tonejs, undefined, 0.8);
        
        setTimeout(() => {
          if (samplerRef.current) {
            samplerRef.current.triggerRelease(selectedTone.tonejs);
          }
          
          isPlayingRef.current = false;
          updatePlayButton(false);
          updateStatus('再生完了', 'green');
          addLog('🎹 基音再生終了');
        }, 2000);

        addLog(`🎵 基音再生開始: ${selectedTone.note}`);
      }

    } catch (error) {
      console.error('❌ 再生エラー:', error);
      addLog(`❌ 再生エラー: ${error}`);
      updateStatus('再生失敗', 'red');
      
      isPlayingRef.current = false;
      updatePlayButton(false);
    }
  }, [initializeAudio]);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-blue-50">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg">
        🧪 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full max-w-2xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="inline-block mb-4">
            <span className="text-6xl">🎹</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            シンプル基音テスト
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            基音再生のみ - iPhone音声確認用
          </p>
          <div className="inline-block bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
            DOM直接操作 + Salamander Piano
          </div>
        </div>

        {/* システム状態 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 システム状態</h3>
          <div ref={statusRef} className="text-lg">
            <span className="text-gray-500">システム準備中...</span>
          </div>
        </div>

        {/* 現在の基音表示 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎵 現在の基音</h3>
          <div ref={currentToneRef}>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-gray-500">基音を選択してください</div>
            </div>
          </div>
        </div>

        {/* 再生ボタン */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎮 制御</h3>
          <button
            ref={playButtonRef}
            onClick={playRandomBaseTone}
            className="w-full px-6 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <Play className="w-6 h-6" />
              <span>🎲 ランダム基音再生</span>
            </div>
          </button>
        </div>

        {/* ログ表示 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📝 ログ</h3>
          <div ref={logRef} className="space-y-1 max-h-32 overflow-y-auto">
            <div className="text-sm text-gray-500">ログが表示されます...</div>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 テスト内容</h3>
          <div className="text-left space-y-2 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ランダムに基音を選択（10種類から）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Salamander Piano音源で2秒間再生</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">📱</span>
              <span>iPhone Safari音量問題の確認</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-2">🔧 技術実装</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✅ Tone.js Salamander Piano（volume: 6）</div>
              <div>✅ DOM直接操作（React state最小化）</div>
              <div>✅ iPhone AudioContext.resume()対応</div>
              <div>✅ シンプル構成（複雑性除去）</div>
            </div>
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
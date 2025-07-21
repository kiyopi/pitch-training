'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TestTube2 } from 'lucide-react';
import * as Tone from 'tone';

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

  // コンポーネント初期化
  useEffect(() => {
    addLog('🚀 分離型音声システム開始');
    updateSystemStatus('システム初期化中...', 'yellow');
  }, [addLog, updateSystemStatus]);
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
          <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
            Step 1-3: 基音再生システム単体（マイクなし）
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
            <div ref={phaseIndicatorRef}>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">⚡</span>
                <span className="text-yellow-600 font-semibold">Step 1-3: 基音再生システム単体（実装中）</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span className="text-gray-500">Step 1-4: マイクロフォンシステム単体</span>
            </div>
          </div>
        </div>

        {/* 基音再生テスト表示エリア */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🎵 基音再生テスト結果</h3>
          <div ref={testDisplayRef} className="text-lg">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-gray-500">基音再生テスト待機中...</div>
            </div>
          </div>
        </div>

        {/* 基音再生システム制御ボタン */}
        <div className="mb-6 space-y-4">
          <div className="flex space-x-4 justify-center">
            <button
              onClick={initializeBaseToneSystem}
              disabled={isInitialized}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              🎹 基音システム初期化
            </button>
            <button
              onClick={playBaseTone}
              disabled={!isInitialized}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              🎲 ランダム基音再生
            </button>
          </div>
          <div className="text-center text-sm text-gray-600">
            {!isInitialized && "まず基音システムを初期化してください"}
            {isInitialized && "基音システム準備完了 - ランダム基音再生をテストできます"}
          </div>
        </div>

        {/* DOM操作テストボタン */}
        <div className="mb-8">
          <button
            onClick={handleDomTest}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg"
          >
            🔬 DOM直接操作テスト実行
          </button>
        </div>

        {/* 設計コンセプト */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Direct DOM Audio System</h3>
          <div className="text-left space-y-2 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>完全分離設計: 基音再生時はマイクOFF</span>
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
              <span>段階的実装: 問題の早期特定・解決</span>
            </div>
          </div>
        </div>

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
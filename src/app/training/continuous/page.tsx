'use client';

import { useState, useRef } from "react";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square } from "lucide-react";
import * as Tone from "tone";

export default function ContinousChallengePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [playCount, setPlayCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  
  // 10種類の基音候補（ランダム基音モードと同じ）
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
    'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-5), message]);
  };

  const playRandomNote = async () => {
    try {
      // ランダムな基音を選択
      const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      setCurrentBaseNote(randomNote);
      setPlayCount(prev => prev + 1);
      
      addLog(`🎲 ${playCount + 1}回目: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]}`);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // 高品質ピアノ音源作成（C4単一音源 + 自動ピッチシフト）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 0 // 最大音量
      }).toDestination();
      
      // 音源読み込み待機
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.6);
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
      }, 1700);
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
    }
  };

  const continuousPlay = async () => {
    if (!isPlayingRef.current) return;
    
    await playRandomNote();
    
    // 2.7秒後に次の音を再生（1.7秒再生 + 1秒間隔）
    setTimeout(() => {
      if (isPlayingRef.current) {
        addLog('⏰ 次の音を準備中...');
        continuousPlay();
      }
    }, 2700);
  };

  const handleStart = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    isPlayingRef.current = true;
    setPlayCount(0);
    addLog('🚀 連続チャレンジ開始');
    
    // 連続再生開始
    continuousPlay();
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    addLog(`⏹️ 停止 (${playCount}回再生)`);
  };

  // コンポーネントのクリーンアップ
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🔄</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            連続チャレンジモード
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            ランダム基音が連続再生・相対音感の持続的トレーニング
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            音源テスト版
          </div>
          
          {/* 現在の基音表示 */}
          {currentBaseNote && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <p className="text-lg font-bold text-purple-800">
                🎵 第{playCount}回: <span className="text-2xl">{baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}</span>
              </p>
              <p className="text-sm text-purple-600 mt-1">
                この基音でドレミファソラシドを歌ってください
              </p>
            </div>
          )}
        </div>

        {/* 制御ボタン */}
        <div className="mb-12 flex gap-4 justify-center">
          <button
            onClick={handleStart}
            disabled={isPlaying}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6" />
              <span>🚀 開始</span>
            </div>
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              !isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Square className="w-6 h-6" />
              <span>⏹️ 停止</span>
            </div>
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">音源テスト内容</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ランダム基音を1.7秒再生</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>1秒間隔を空ける</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>次のランダム基音を再生（継続）</span>
            </div>
          </div>
          
          {/* テスト項目 */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl">
            <h4 className="font-bold text-purple-700 mb-3">🧪 テスト検証項目</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-purple-600">
              <div>✓ 連続ランダム選択の動作確認</div>
              <div>✓ iPhone Safari での継続動作</div>
              <div>✓ メモリリーク・パフォーマンス確認</div>
              <div>✓ 停止・再開制御の確実性</div>
              <div>✓ タイミング制御の精度</div>
            </div>
          </div>
        </div>

        {/* デバッグログ表示 */}
        {debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-2">📝 動作ログ:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {debugLog.map((log, index) => (
                <div key={index} className="font-mono">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>トップページに戻る</span>
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef } from "react";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, ArrowUp, ArrowDown } from "lucide-react";
import * as Tone from "tone";

export default function ChromaticScalePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'ascending' | 'descending'>('ascending');
  const isPlayingRef = useRef(false);
  
  // 12音階 + オクターブ（13音）
  const chromaticScale = [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 
    'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
  ];
  
  const chromaticNoteNames = {
    'C4': 'ド', 'C#4': 'ド♯', 'D4': 'レ', 'D#4': 'レ♯', 'E4': 'ミ', 'F4': 'ファ',
    'F#4': 'ファ♯', 'G4': 'ソ', 'G#4': 'ソ♯', 'A4': 'ラ', 'A#4': 'ラ♯', 'B4': 'シ', 'C5': 'ド（高）'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-6), message]);
  };

  const playNote = async (note: string, sequenceIndex: number) => {
    try {
      setCurrentNote(note);
      setCurrentIndex(sequenceIndex);
      
      addLog(`🎵 ${sequenceIndex + 1}/13: ${chromaticNoteNames[note as keyof typeof chromaticNoteNames]} (${note}) [${direction}]`);
      
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
      
      // 選択された音を0.8秒間再生
      sampler.triggerAttack(note, undefined, 0.6);
      
      // 0.8秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(note);
        addLog(`🔇 再生終了: ${note}`);
      }, 800);
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
    }
  };

  const playSequence = async (sequenceDirection: 'ascending' | 'descending') => {
    if (!isPlayingRef.current) return;
    
    const sequence = sequenceDirection === 'ascending' ? chromaticScale : [...chromaticScale].reverse();
    
    for (let i = 0; i < sequence.length; i++) {
      if (!isPlayingRef.current) break;
      
      // 現在の方向を確実に設定
      setDirection(sequenceDirection);
      
      await playNote(sequence[i], i);
      
      // 最後の音でない場合は1秒間隔
      if (i < sequence.length - 1 && isPlayingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (isPlayingRef.current) {
      addLog(`✅ ${sequenceDirection === 'ascending' ? '上行' : '下行'}完了`);
      handleStop(); // 完了時に確実に状態リセット
    }
  };

  const handleStart = async (selectedDirection: 'ascending' | 'descending') => {
    if (isPlaying) return;
    
    // 状態を確実にリセット
    setIsPlaying(true);
    isPlayingRef.current = true;
    setDirection(selectedDirection);
    setCurrentIndex(0);
    setCurrentNote('');
    addLog(`🚀 ${selectedDirection === 'ascending' ? '上行' : '下行'}開始`);
    
    // シーケンス再生開始（方向を明示的に渡す）
    playSequence(selectedDirection);
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    // 完了時に状態をクリア
    setCurrentNote('');
    setCurrentIndex(0);
    addLog(`⏹️ 停止 (${currentIndex + 1}/13で停止)`);
  };

  // コンポーネントのクリーンアップ
  React.useEffect(() => {
    return () => {
      isPlayingRef.current = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎼</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            12音階モード
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            クロマチックスケール上行・下行で完全制覇
          </p>
          <div className="inline-block bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-6 py-3 rounded-full text-lg font-bold">
            音源テスト版
          </div>
          
          {/* 現在の音表示 */}
          {currentNote && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <p className="text-lg font-bold text-orange-800">
                🎵 {currentIndex + 1}/13: <span className="text-2xl">{chromaticNoteNames[currentNote as keyof typeof chromaticNoteNames]}</span>
              </p>
              <p className="text-sm text-orange-600 mt-1">
                {direction === 'ascending' ? '上行' : '下行'}: {currentNote}
              </p>
            </div>
          )}
        </div>

        {/* 制御ボタン */}
        <div className="mb-12 flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => handleStart('ascending')}
            disabled={isPlaying}
            className={`group relative overflow-hidden px-6 py-4 rounded-2xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
              isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ArrowUp className="w-5 h-5" />
              <span>⬆️ 上行</span>
            </div>
          </button>
          
          <button
            onClick={() => handleStart('descending')}
            disabled={isPlaying}
            className={`group relative overflow-hidden px-6 py-4 rounded-2xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
              isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ArrowDown className="w-5 h-5" />
              <span>⬇️ 下行</span>
            </div>
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className={`group relative overflow-hidden px-6 py-4 rounded-2xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
              !isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Square className="w-5 h-5" />
              <span>⏹️ 停止</span>
            </div>
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">音源テスト内容</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>13音のクロマチックスケールを連続再生</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>各音0.8秒再生 + 1秒間隔</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>上行・下行の両方向をテスト</span>
            </div>
          </div>
          
          {/* クロマチックスケール表示 */}
          <div className="mt-6 p-4 bg-orange-50 rounded-xl">
            <h4 className="font-bold text-orange-700 mb-3">🎼 クロマチックスケール（13音）</h4>
            <div className="grid grid-cols-4 gap-2 text-sm text-orange-600">
              {chromaticScale.map((note, index) => (
                <div key={note} className={`flex justify-between p-2 rounded ${
                  currentNote === note ? 'bg-orange-200 font-bold' : ''
                }`}>
                  <span className="font-mono">{note}</span>
                  <span>{chromaticNoteNames[note as keyof typeof chromaticNoteNames]}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* テスト項目 */}
          <div className="mt-6 p-4 bg-orange-50 rounded-xl">
            <h4 className="font-bold text-orange-700 mb-3">🧪 テスト検証項目</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-orange-600">
              <div>✓ 13音連続再生の完走確認</div>
              <div>✓ ピッチシフト精度の聴感確認</div>
              <div>✓ iPhone Safari での動作確認</div>
              <div>✓ 上行・下行両方向の動作確認</div>
              <div>✓ 停止制御の確実性</div>
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
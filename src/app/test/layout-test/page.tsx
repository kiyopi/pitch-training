'use client';

import { useState } from "react";
import { Play } from "lucide-react";
import * as Tone from "tone";
import TrainingLayout from "@/components/TrainingLayout";
import TrainingCard, { InstructionCard } from "@/components/TrainingCard";

export default function LayoutTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  
  // 10種類の基音候補
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
    'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  const handleStart = async () => {
    // 再生中は新しい音を開始しない
    if (isPlaying) {
      addLog('⚠️ 既に再生中のため新しい音をスキップ');
      return;
    }
    
    // ランダムな基音を選択
    const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
    setCurrentBaseNote(randomNote);
    
    setIsPlaying(true);
    
    try {
      addLog(`🎲 ランダム基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]}`);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // 高品質ピアノ音源作成
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6
      }).toDestination();
      
      // 音源読み込み待機
      addLog('ピアノ音源読み込み中...');
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.8);
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
        setIsPlaying(false);
      }, 1700);
      
    } catch (error) {
      addLog(`❌ ピアノ音再生エラー: ${error}`);
      setIsPlaying(false);
    }
  };

  return (
    <TrainingLayout
      title="ランダム基音モード"
      subtitle="10種類の基音からランダムに選択してドレミファソラシドを発声"
      icon="🎲"
      badge="初心者向け"
      colorScheme="green"
      debugLog={debugLog}
    >
      {/* 現在の基音表示 */}
      {currentBaseNote && (
        <TrainingCard
          colorScheme="green"
          title="🎵 現在の基音"
          mainText={baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}
          subText="この音を基準にドレミファソラシドを歌ってください"
        />
      )}
      
      {/* スタートボタン */}
      <div className="mb-12">
        <button
          onClick={handleStart}
          disabled={isPlaying}
          className={`group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg ${
            isPlaying 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Play className="w-8 h-8" />
            <span>{isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}</span>
          </div>
          
          {/* ホバーエフェクト */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          )}
        </button>
      </div>

      {/* 説明 */}
      <InstructionCard
        title="使い方"
        steps={[
          { number: '1', text: 'ボタンを押してランダムな基音を聞く（10種類からランダム選択）' },
          { number: '2', text: '表示された基音を覚えて、ドレミファソラシドを正確に発声' },
          { number: '3', text: '繰り返し練習して様々な基音に対応できる相対音感を鍛える' }
        ]}
        colorScheme="green"
      />
      
      {/* 基音一覧 */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-700 mb-3">🎵 基音候補（10種類）</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          {Object.entries(baseNoteNames).map(([note, name]) => (
            <div key={note} className="flex justify-between">
              <span className="font-mono">{note}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </TrainingLayout>
  );
}
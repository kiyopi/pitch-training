'use client';

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';

export default function RandomTrainingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  
  // Pitchy統合基盤
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  
  // AudioContext・AnalyserNode基盤
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // マイクストリーム管理
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // 音程検出用（React非依存）
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const bufferLength = useRef<number>(0);
  
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

  // マイクストリーム取得関数
  const initializeMicrophone = async () => {
    try {
      // AudioContext初期化
      if (!audioContextRef.current) {
        const AudioCtx = (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).AudioContext || 
                        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx({
          sampleRate: 44100
        });
      }
      
      // AnalyserNode作成
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
      
      // マイクアクセス許可取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      
      micStreamRef.current = stream;
      
      // MediaStreamSource作成とAnalyserNode接続
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Pitchy初期化
      if (!pitchDetectorRef.current) {
        bufferLength.current = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Float32Array(bufferLength.current);
        pitchDetectorRef.current = PitchDetector.forFloat32Array(bufferLength.current);
      }
      
      addLog('🎤 マイク初期化完了');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ マイク初期化エラー: ${errorMessage}`);
      return false;
    }
  };
  
  // 基本音程検出ループ（React非依存の直接操作）
  const detectPitch = () => {
    if (!analyserRef.current || !dataArrayRef.current || !pitchDetectorRef.current) {
      return;
    }
    
    // 音声データ取得
    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    
    // Pitchyで周波数検出
    const [frequency, clarity] = pitchDetectorRef.current.findPitch(dataArrayRef.current, audioContextRef.current!.sampleRate);
    
    // 有効な周波数が検出された場合のみ処理
    if (frequency > 0 && clarity > 0.9) {
      // TODO: 周波数表示の更新（Step 1-6で実装）
      console.log(`Frequency: ${frequency.toFixed(1)} Hz, Clarity: ${clarity.toFixed(2)}`);
    }
    
    // 次フレームの予約
    animationFrameRef.current = requestAnimationFrame(detectPitch);
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
      
      // 高品質ピアノ音源作成（C4単一音源 + 自動ピッチシフト）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6 // プロトタイプ準拠の音量設定（iPhone最適化）
      }).toDestination();
      
      // 音源読み込み待機
      addLog('ピアノ音源読み込み中...');
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生（C4から自動ピッチシフト）
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.8); // プロトタイプ準拠のvelocity設定
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
        setIsPlaying(false); // 再生状態をリセット
      }, 1700);
      
    } catch (error) {
      addLog(`❌ ピアノ音再生エラー: ${error}`);
      setIsPlaying(false); // エラー時も再生状態をリセット
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎲</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
            ランダム基音モード
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            10種類の基音からランダムに選択してドレミファソラシドを発声
          </p>
          <div className="inline-block bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-6 py-3 rounded-full text-lg font-bold">
            初心者向け
          </div>
          
          {/* 現在の基音表示 */}
          {currentBaseNote && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <p className="text-lg font-bold text-blue-800">
                🎵 現在の基音: <span className="text-2xl">{baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}</span>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                この音を基準にドレミファソラシドを歌ってください
              </p>
            </div>
          )}
        </div>

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
            
            {/* ホバーエフェクト（再生中は無効） */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">使い方</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ボタンを押してランダムな基音を聞く（10種類からランダム選択）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>表示された基音を覚えて、ドレミファソラシドを正確に発声</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>繰り返し練習して様々な基音に対応できる相対音感を鍛える</span>
            </div>
          </div>
          
          {/* 基音一覧 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
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
        </div>

        {/* デバッグログ表示 */}
        {debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-2">📝 デバッグログ:</h4>
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
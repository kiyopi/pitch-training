'use client';

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity } from "lucide-react";
import * as Tone from "tone";

interface FrequencyData {
  frequency: number;
  amplitude: number;
  timestamp: number;
}

export default function AccuracyTestV2Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  
  // マイクロフォン関連状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
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

  // 周波数検出関数（test/simple-frequencyから移植）
  const detectFrequency = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    // 周波数データ取得
    analyser.getByteFrequencyData(dataArray);
    
    // 最大振幅を持つ周波数を検出
    let maxAmplitude = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxAmplitude) {
        maxAmplitude = dataArray[i];
        maxIndex = i;
      }
    }
    
    // 周波数計算
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const frequency = (maxIndex * sampleRate) / (analyser.fftSize * 2);
    
    // 振幅が十分な場合のみ更新（ノイズフィルタリング）
    if (maxAmplitude > 10) {
      const detectedFrequency = Math.round(frequency * 10) / 10;
      
      setFrequencyData({
        frequency: detectedFrequency,
        amplitude: maxAmplitude,
        timestamp: Date.now()
      });
    }
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectFrequency);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      addLog('🎤 マイクロフォン開始...');
      
      // マイクロフォン許可取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      streamRef.current = stream;
      
      // AudioContext作成
      const audioContext = new AudioContext({ sampleRate: 44100 });
      const analyser = audioContext.createAnalyser();
      
      // AnalyserNode設定
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // MediaStreamSource作成・接続
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // データ配列初期化
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Refs保存
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      setIsRecording(true);
      
      // 周波数検出開始
      detectFrequency();
      
      addLog('✅ マイクロフォン開始完了');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
      addLog(`❌ マイクエラー: ${errorMessage}`);
    }
  }, [detectFrequency]);

  const stopRecording = useCallback(() => {
    try {
      // アニメーションフレーム停止
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // MediaStream停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // AudioContext閉じる
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Refs初期化
      analyserRef.current = null;
      dataArrayRef.current = null;
      
      setIsRecording(false);
      setFrequencyData(null);
      
      addLog('🛑 マイクロフォン停止');
      
    } catch (err) {
      console.error('❌ 停止エラー:', err);
    }
  }, []);

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
        volume: 0 // 最大音量
      }).toDestination();
      
      // 音源読み込み待機
      addLog('ピアノ音源読み込み中...');
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生（C4から自動ピッチシフト）
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.6);
      
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
      <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎯</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            精度テスト v2
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            確実動作ベース：基音とユーザー音声の相対音程精度測定
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            Step 2: ピアノ音 + マイクロフォン検出
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

        {/* システム状態表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 システム状態</h3>
          
          <div className="flex items-center justify-center space-x-8">
            {/* ピアノ音状態 */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isPlaying ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {isPlaying ? '🎹' : '🎵'}
              </div>
              <div className="text-sm text-gray-600">ピアノ音</div>
              <div className="text-xs text-gray-500">
                {isPlaying ? '再生中' : '待機中'}
              </div>
            </div>
            
            {/* マイク状態 */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                error ? 'text-red-600' :
                isRecording ? 'text-green-600' : 'text-gray-600'
              }`}>
                {error ? '❌' : isRecording ? '🎤' : '⭕'}
              </div>
              <div className="text-sm text-gray-600">マイク</div>
              <div className="text-xs text-gray-500">
                {error ? 'エラー' : isRecording ? '録音中' : '待機中'}
              </div>
            </div>
            
            {/* 検出状態 */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                frequencyData ? 'text-green-600' : 'text-gray-600'
              }`}>
                {frequencyData ? '📈' : '📊'}
              </div>
              <div className="text-sm text-gray-600">検出</div>
              <div className="text-xs text-gray-500">
                {frequencyData ? '検出中' : '待機中'}
              </div>
            </div>
          </div>
        </div>

        {/* 周波数検出表示 */}
        {isRecording && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <Activity className="w-6 h-6" />
              <span>リアルタイム周波数検出</span>
            </h3>
            
            {frequencyData ? (
              <div className="space-y-6">
                {/* 周波数表示 */}
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {frequencyData.frequency.toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-600 font-semibold">
                    Hz
                  </div>
                </div>
                
                {/* 振幅表示 */}
                <div className="flex justify-center items-center space-x-4">
                  <span className="text-gray-600">音量:</span>
                  <div className="w-48 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(frequencyData.amplitude / 255) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round((frequencyData.amplitude / 255) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-lg">音声を検出中...</p>
                <p className="text-sm mt-2">声を出すか楽器を演奏してください</p>
              </div>
            )}
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-800">エラー発生</span>
            </div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* 制御ボタン */}
        <div className="mb-12 space-y-6">
          {/* ピアノ音再生ボタン */}
          <div className="text-center">
            <button
              onClick={handleStart}
              disabled={isPlaying}
              className={`group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg ${
                isPlaying 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Play className="w-8 h-8" />
                <span>{isPlaying ? '🎹 再生中...' : '🎯 基音テスト再生'}</span>
              </div>
              
              {/* ホバーエフェクト（再生中は無効） */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
            </button>
          </div>
          
          {/* マイクロフォン制御ボタン */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={startRecording}
              disabled={isRecording}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
                isRecording
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Play className="w-6 h-6" />
                <span>🎤 マイク開始</span>
              </div>
            </button>
            
            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
                !isRecording
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Square className="w-6 h-6" />
                <span>🛑 マイク停止</span>
              </div>
            </button>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 2 確認項目</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ピアノ音再生が正常に動作する（Step 1確認済み）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>マイクロフォン許可が取得される</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>ユーザーの音声・楽器が検出される</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>リアルタイム周波数表示（Hz・音量）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🎯</span>
              <span>iPhone Safari で両機能（ピアノ音 + マイク）が動作</span>
            </div>
          </div>
          
          {/* 技術情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🔧 技術実装</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div>✅ Tone.js + Salamander Piano（ピアノ音源）</div>
              <div>✅ Web Audio API（マイクロフォン処理）</div>
              <div>✅ リアルタイム周波数解析（FFT 2048）</div>
              <div>✅ ノイズフィルタリング（振幅閾値 > 10）</div>
              <div>✅ iPhone Safari対応（44.1kHz, モノラル）</div>
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
          href="/test/simple-frequency"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Phase 2ページに戻る</span>
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity } from "lucide-react";
import * as Tone from "tone";
import { 
  frequencyToNote, 
  calculateRelativeInterval, 
  evaluateRelativePitchAccuracy,
  isValidMusicalFrequency 
} from "@/utils/noteUtils";
import { PitchDetector } from "pitchy";

interface FrequencyData {
  frequency: number;
  amplitude: number;
  timestamp: number;
}

interface RelativePitchData {
  baseFrequency: number;
  userFrequency: number;
  cents: number;
  semitones: number;
  intervalName: string;
  accuracy: ReturnType<typeof evaluateRelativePitchAccuracy>;
  userNote: ReturnType<typeof frequencyToNote>;
}

interface TestResult {
  id: number;
  baseNote: string;
  baseFrequency: number;
  userNote: string;
  userFrequency: number;
  cents: number;
  score: number;
  accuracy: string;
  intervalName: string;
  timestamp: number;
}

interface SessionStats {
  totalTests: number;
  averageScore: number;
  averageCents: number;
  bestScore: number;
  worstScore: number;
  accuracyDistribution: { [key: string]: number };
  completed: boolean;
}

export default function AccuracyTestV2Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [currentBaseFrequency, setCurrentBaseFrequency] = useState<number>(0);
  
  // マイクロフォン関連状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
  const [relativePitchData, setRelativePitchData] = useState<RelativePitchData | null>(null);
  
  // 🎯 Step 4: セッション管理状態
  const [sessionActive, setSessionActive] = useState(false);
  const [currentTestNumber, setCurrentTestNumber] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [waitingForUserInput, setWaitingForUserInput] = useState(false);
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  
  // 10種類の基音候補
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
    'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
  };
  
  // 基音の周波数マッピング
  const baseNoteFrequencies: { [key: string]: number } = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  // 周波数検出関数（Pitchy McLeod Pitch Method使用）
  const detectFrequency = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    
    // 時間領域データを取得（Pitchy用）
    const timeDomainData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    // 音量レベル取得（表示用）
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    // 平均音量計算
    const averageAmplitude = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;
    
    // 最小音量閾値チェック
    if (averageAmplitude < 10) {
      // 音量が小さすぎる場合は検出をスキップ
      animationFrameRef.current = requestAnimationFrame(detectFrequency);
      return;
    }
    
    try {
      // PitchDetectorインスタンスを初期化（初回のみ）
      if (!pitchDetectorRef.current) {
        pitchDetectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
        // 明瞭度閾値設定（0.8で高精度）
        pitchDetectorRef.current.clarityThreshold = 0.8;
        // 最小音量設定（-30dB）
        pitchDetectorRef.current.minVolumeDecibels = -30;
      }
      
      // Pitchy（McLeod Pitch Method）で基音検出
      const [frequency, clarity] = pitchDetectorRef.current.findPitch(timeDomainData, sampleRate);
      
      // 明瞭度チェック（0.7以上で信頼できる結果）
      if (clarity > 0.7 && frequency > 80 && frequency < 2000) {
        const detectedFrequency = Math.round(frequency * 10) / 10;
        
        // 有効な周波数検出時刻を記録
        lastDetectionTimeRef.current = Date.now();
        
        setFrequencyData({
          frequency: detectedFrequency,
          amplitude: Math.round(averageAmplitude),
          timestamp: Date.now()
        });
        
        // 🎯 Step 3: 相対音程計算（基音がある場合）
        if (currentBaseFrequency > 0 && isValidMusicalFrequency(detectedFrequency)) {
          const userNote = frequencyToNote(detectedFrequency);
          const relativeInterval = calculateRelativeInterval(currentBaseFrequency, detectedFrequency);
          const accuracy = evaluateRelativePitchAccuracy(relativeInterval.cents);
          
          setRelativePitchData({
            baseFrequency: currentBaseFrequency,
            userFrequency: detectedFrequency,
            cents: relativeInterval.cents,
            semitones: relativeInterval.semitones,
            intervalName: relativeInterval.intervalName,
            accuracy,
            userNote
          });
        }
      }
      
      // タイムアウトベースの周波数表示クリア（500ms無検出でクリア）
      const now = Date.now();
      if (lastDetectionTimeRef.current > 0 && (now - lastDetectionTimeRef.current) > 500) {
        setFrequencyData(null);
        // 相対音程分析もクリア（基音がある場合のみ）
        if (currentBaseFrequency > 0) {
          setRelativePitchData(null);
        }
      }
    } catch (error) {
      // Pitchy処理エラーの場合はスキップ
      console.warn('Pitchy detection error:', error);
    }
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectFrequency);
  }, [currentBaseFrequency]);

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
      pitchDetectorRef.current = null;
      
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
    const baseFrequency = baseNoteFrequencies[randomNote];
    
    setCurrentBaseNote(randomNote);
    setCurrentBaseFrequency(baseFrequency);
    setRelativePitchData(null); // リセット
    
    setIsPlaying(true);
    
    try {
      addLog(`🎲 ランダム基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]} (${baseFrequency.toFixed(1)}Hz)`);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // 🎯 基音再生前にマイクロフォンを自動開始
      if (!isRecording) {
        addLog('🎤 自動マイク開始...');
        await startRecording();
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
        addLog('🎯 基音を覚えて同じ音程で歌ってください');
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
            Step 3 完了: 基音再生 → マイク自動開始 → 相対音程分析
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

        {/* 🎯 Step 3: 相対音程分析表示 */}
        {relativePitchData && currentBaseNote && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span>相対音程分析</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基音情報 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-bold text-blue-800 mb-3">🎵 基音</h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}
                  </div>
                  <div className="text-sm text-blue-600">
                    {currentBaseNote} ({relativePitchData.baseFrequency.toFixed(1)}Hz)
                  </div>
                </div>
              </div>
              
              {/* ユーザー音声情報 */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-bold text-green-800 mb-3">🎤 あなたの音程</h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {relativePitchData.userNote.fullNote}
                  </div>
                  <div className="text-sm text-green-600">
                    {relativePitchData.userFrequency.toFixed(1)}Hz
                  </div>
                </div>
              </div>
            </div>
            
            {/* 相対音程結果 */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <div className="text-center space-y-4">
                <div className="text-lg font-bold text-gray-800">
                  音程関係: <span className="text-purple-600">{relativePitchData.intervalName}</span>
                </div>
                
                <div className="flex justify-center items-center space-x-8">
                  {/* セント偏差 */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      relativePitchData.accuracy.color === 'green' ? 'text-green-600' :
                      relativePitchData.accuracy.color === 'blue' ? 'text-blue-600' :
                      relativePitchData.accuracy.color === 'cyan' ? 'text-cyan-600' :
                      relativePitchData.accuracy.color === 'orange' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {relativePitchData.cents > 0 ? '+' : ''}{relativePitchData.cents}
                    </div>
                    <div className="text-sm text-gray-600">セント</div>
                  </div>
                  
                  {/* 精度評価 */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      relativePitchData.accuracy.color === 'green' ? 'text-green-600' :
                      relativePitchData.accuracy.color === 'blue' ? 'text-blue-600' :
                      relativePitchData.accuracy.color === 'cyan' ? 'text-cyan-600' :
                      relativePitchData.accuracy.color === 'orange' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {relativePitchData.accuracy.score}
                    </div>
                    <div className="text-sm text-gray-600">点</div>
                  </div>
                </div>
                
                {/* 精度メッセージ */}
                <div className={`text-lg font-semibold ${
                  relativePitchData.accuracy.color === 'green' ? 'text-green-600' :
                  relativePitchData.accuracy.color === 'blue' ? 'text-blue-600' :
                  relativePitchData.accuracy.color === 'cyan' ? 'text-cyan-600' :
                  relativePitchData.accuracy.color === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {relativePitchData.accuracy.message}
                </div>
              </div>
            </div>
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
          
          {/* マイクロフォン制御（自動化のため非表示） */}
          <div className="text-center text-gray-500 text-sm">
            <p>🎯 <strong>自動化フロー</strong>: 基音再生 → マイク自動開始 → 音程検出</p>
            <p className="mt-1">マイクロフォンの手動操作は不要です</p>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Step 3 完了: 相対音程分析機能</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>「基音テスト再生」ボタンクリック</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>マイクロフォンが自動で開始される</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>ランダム基音（ピアノ音）が1.7秒再生</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>基音終了後、同じ音程で歌う</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>リアルタイム周波数検出・表示（Hz・音量）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🎯</span>
              <span>相対音程分析・精度評価（セント偏差・スコア）</span>
            </div>
          </div>
          
          {/* 技術情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🔧 技術実装</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div>✅ Tone.js + Salamander Piano（ピアノ音源）</div>
              <div>✅ Web Audio API（マイクロフォン処理）</div>
              <div>✅ リアルタイム周波数解析（FFT 2048）</div>
              <div>✅ ノイズフィルタリング（振幅閾値 &gt; 10）</div>
              <div>✅ 相対音程計算（セント・音程名・精度評価）</div>
              <div>✅ 音名表示（C4, D4等）＋周波数マッピング</div>
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
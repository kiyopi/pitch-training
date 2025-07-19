'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity, Music, Volume2, Pause } from 'lucide-react';
import { frequencyToNote, isValidMusicalFrequency, evaluatePitchAccuracy, getNoteColor, TRAINING_BASE_TONES, calculateRelativeInterval, evaluateRelativePitchAccuracy, BaseTone } from '../../../utils/noteUtils';
import { useTonePlayer } from '../../../hooks/useTonePlayer';

/**
 * Phase 2: 基音再生機能統合ページ
 * 
 * 目的: 基音再生 + マイクロフォン音声の相対音程検出・表示
 * 機能: 
 * - 基音再生（ドレミファソラシド）
 * - リアルタイム周波数検出
 * - 相対音程計算とセント偏差表示
 * - 相対音感精度評価
 */

interface FrequencyData {
  frequency: number;
  amplitude: number;
  timestamp: number;
  note?: {
    note: string;
    octave: number;
    fullNote: string;
    cents: number;
  };
  // 相対音程情報
  relativeInterval?: {
    cents: number;
    semitones: number;
    intervalName: string;
    accuracy: {
      accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
      color: string;
      score: number;
      message: string;
    };
  };
}

export default function SimpleFrequencyTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
  
  // Phase 2: 基音再生機能
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  const [trainingMode, setTrainingMode] = useState<'absolute' | 'relative'>('absolute');
  
  // Tone.js プレイヤー
  const { playerState, playTone, stopTone } = useTonePlayer();
  
  // Audio processing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 時刻表示の更新（hydration mismatch対策）
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8));
    };
    
    // クライアントサイドでのみ実行
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // hydration完了まで時刻を非表示
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 周波数検出関数（Phase 2対応）
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
      
      // 音名変換（音楽的に有効な周波数の場合のみ）
      let noteInfo = undefined;
      let relativeInterval = undefined;
      
      if (isValidMusicalFrequency(detectedFrequency)) {
        noteInfo = frequencyToNote(detectedFrequency);
        
        // 相対音程モードかつ基音が設定されている場合
        if (trainingMode === 'relative' && currentBaseTone) {
          const interval = calculateRelativeInterval(currentBaseTone.frequency, detectedFrequency);
          const accuracy = evaluateRelativePitchAccuracy(interval.cents);
          relativeInterval = {
            ...interval,
            accuracy
          };
        }
      }
      
      setFrequencyData({
        frequency: detectedFrequency,
        amplitude: maxAmplitude,
        timestamp: Date.now(),
        note: noteInfo,
        relativeInterval
      });
    }
    
    // 次のフレーム
    animationFrameRef.current = requestAnimationFrame(detectFrequency);
  }, [trainingMode, currentBaseTone]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
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
      
      console.log('🎵 周波数検出開始');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
      console.error('❌ 周波数検出開始失敗:', err);
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
      
      console.log('🛑 周波数検出停止');
      
    } catch (err) {
      console.error('❌ 停止エラー:', err);
    }
  }, []);

  const resetError = () => {
    setError(null);
  };
  
  // Phase 2: 基音再生機能
  const playRandomBaseTone = useCallback(async () => {
    try {
      if (!playerState.isLoaded) {
        setError('音声プレイヤーが初期化されていません');
        return;
      }
      
      // ランダムな基音を選択
      const randomIndex = Math.floor(Math.random() * TRAINING_BASE_TONES.length);
      const selectedTone = TRAINING_BASE_TONES[randomIndex];
      
      setCurrentBaseTone(selectedTone);
      setTrainingMode('relative');
      
      // 2秒間再生
      await playTone(selectedTone, 2);
      
      console.log('🎵 基音再生:', selectedTone);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '基音再生エラー';
      setError(`基音再生エラー: ${errorMessage}`);
    }
  }, [playerState.isLoaded, playTone]);
  
  const stopBaseTone = useCallback(() => {
    stopTone();
  }, [stopTone]);
  
  const resetTraining = useCallback(() => {
    setCurrentBaseTone(null);
    setTrainingMode('absolute');
    setFrequencyData(null);
    stopTone();
  }, [stopTone]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示（hydration mismatch対策） */}
      {isClient && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
          📱 {currentTime}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎤</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {trainingMode === 'relative' ? '相対音感トレーニング' : '周波数・音名表示'}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {trainingMode === 'relative' 
              ? '基音を聞いて、同じ音程で歌ってください' 
              : 'マイクロフォン音声の周波数と音名をリアルタイム表示'
            }
          </p>
          <div className={`inline-block bg-gradient-to-r px-6 py-3 rounded-full text-lg font-bold ${
            trainingMode === 'relative'
              ? 'from-green-100 to-blue-100 text-green-700'
              : 'from-blue-100 to-purple-100 text-blue-700'
          }`}>
            {trainingMode === 'relative' ? 'Phase 2: 相対音程モード' : 'Phase 1: 絶対音程モード'}
          </div>
        </div>

        {/* 状態表示 */}
        <div className="mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 システム状態</h3>
          
          <div className="flex items-center justify-center space-x-6">
            {/* マイクロフォン状態 */}
            <div className="flex items-center space-x-2">
              {error ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : isRecording ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
              <span className={`text-lg font-bold ${
                error ? 'text-red-600' :
                isRecording ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {error ? 'エラー' : isRecording ? 'マイク検出中' : 'マイク停止中'}
              </span>
            </div>
            
            {/* 音声プレイヤー状態 */}
            <div className="flex items-center space-x-2">
              {playerState.error ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : playerState.isLoaded ? (
                playerState.isPlaying ? (
                  <Volume2 className="w-6 h-6 text-blue-500 animate-pulse" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
              <span className={`text-lg font-bold ${
                playerState.error ? 'text-red-600' :
                playerState.isLoaded ? (
                  playerState.isPlaying ? 'text-blue-600' : 'text-blue-600'
                ) : 'text-gray-600'
              }`}>
                {playerState.error ? 'プレイヤーエラー' :
                 playerState.isLoaded ? (
                   playerState.isPlaying ? '基音再生中' : 'プレイヤー準備完了'
                 ) : 'プレイヤー初期化中'}
              </span>
            </div>
          </div>
          
          {/* 現在の基音表示 */}
          {currentBaseTone && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-center">
                <span className="text-gray-600 mr-2">基音:</span>
                <span 
                  className="text-2xl font-bold text-white px-4 py-2 rounded-lg"
                  style={{ backgroundColor: getNoteColor(currentBaseTone.note) }}
                >
                  {currentBaseTone.fullNote}
                </span>
                <span className="text-gray-600 ml-2">({currentBaseTone.frequency.toFixed(1)}Hz)</span>
              </div>
            </div>
          )}
        </div>

        {/* 周波数・音名表示 */}
        {isRecording && (
          <div className="mb-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center justify-center space-x-2">
              <Activity className="w-6 h-6" />
              <span>{trainingMode === 'relative' ? '相対音程検出' : 'リアルタイム検出'}</span>
            </h3>
            
            {frequencyData ? (
              <div className="space-y-8">
                {/* 相対音程表示（相対音程モードの場合） */}
                {trainingMode === 'relative' && frequencyData.relativeInterval && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="text-6xl font-bold mb-4">
                        {frequencyData.relativeInterval.intervalName}
                      </div>
                      <div className="flex justify-center items-center space-x-6 mb-4">
                        <div className="text-center">
                          <div className="text-gray-600 text-sm">相対音程</div>
                          <div className={`text-2xl font-bold text-${frequencyData.relativeInterval.accuracy.color}-600`}>
                            {frequencyData.relativeInterval.cents >= 0 ? '+' : ''}{frequencyData.relativeInterval.cents}¢
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600 text-sm">精度</div>
                          <div className={`px-4 py-2 rounded-full text-white font-bold bg-${frequencyData.relativeInterval.accuracy.color}-500`}>
                            {frequencyData.relativeInterval.accuracy.score}点
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold text-${frequencyData.relativeInterval.accuracy.color}-600`}>
                        {frequencyData.relativeInterval.accuracy.message}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 音名表示（音楽的周波数の場合） */}
                {frequencyData.note && (
                  <div className="text-center">
                    <div className="mb-4">
                      <div 
                        className={`${trainingMode === 'relative' ? 'text-4xl' : 'text-8xl'} font-bold mb-2 inline-block px-6 py-4 rounded-2xl text-white shadow-lg`}
                        style={{ backgroundColor: getNoteColor(frequencyData.note.note) }}
                      >
                        {frequencyData.note.fullNote}
                      </div>
                    </div>
                    
                    {/* セント偏差表示（絶対音程モードの場合） */}
                    {trainingMode === 'absolute' && (
                      <div className="flex justify-center items-center space-x-4 mb-6">
                        <Music className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600">音程精度:</span>
                        <span 
                          className={`text-lg font-bold text-${evaluatePitchAccuracy(frequencyData.note.cents).color}-600`}
                        >
                          {frequencyData.note.cents >= 0 ? '+' : ''}{frequencyData.note.cents}¢
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-${evaluatePitchAccuracy(frequencyData.note.cents).color}-500`}>
                          {evaluatePitchAccuracy(frequencyData.note.cents).accuracy}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 周波数表示 */}
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
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
                
                {/* 無効な音楽周波数の場合 */}
                {!frequencyData.note && (
                  <div className="text-center">
                    <div className="text-gray-500 bg-gray-100 px-4 py-2 rounded-lg inline-block">
                      音楽的範囲外の周波数
                    </div>
                  </div>
                )}
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
              onClick={resetError}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* Phase 2: 基音再生コントロール */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🎵 基音再生コントロール</h3>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={playRandomBaseTone}
              disabled={!playerState.isLoaded || playerState.isPlaying}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                !playerState.isLoaded || playerState.isPlaying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5" />
                <span>🎵 基音再生</span>
              </div>
            </button>
            
            <button
              onClick={stopBaseTone}
              disabled={!playerState.isPlaying}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                !playerState.isPlaying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Pause className="w-5 h-5" />
                <span>⏸️ 停止</span>
              </div>
            </button>
            
            <button
              onClick={resetTraining}
              className="group relative overflow-hidden px-6 py-3 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex items-center space-x-2">
                <Square className="w-5 h-5" />
                <span>🔄 リセット</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* マイクロフォン制御ボタン */}
        <div className="mb-12 flex gap-4 justify-center">
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
              <span>🎤 検出開始</span>
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
              <span>🛑 検出停止</span>
            </div>
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 使用方法</h3>
          
          {trainingMode === 'relative' ? (
            // 相対音感トレーニングモード
            <div className="text-left space-y-3 text-gray-600">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>「基音再生」ボタンで基音を聞く</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>「検出開始」でマイクロフォンを開始</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>基音と同じ音程で歌う</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>相対音程・精度がリアルタイム表示</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🎯</span>
                <span>±10セント以内で「完璧な音程」判定</span>
              </div>
            </div>
          ) : (
            // 絶対音程モード
            <div className="text-left space-y-3 text-gray-600">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>「検出開始」ボタンをクリック</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>マイクロフォンの許可を承認</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>声を出すか楽器を演奏</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>周波数・音名・音程精度がリアルタイム表示</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">🎵</span>
                <span>基音再生で相対音感トレーニングモードに切替</span>
              </div>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <Link 
          href="/test/microphone"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>マイクテストに戻る</span>
        </Link>
      </div>
    </div>
  );
}
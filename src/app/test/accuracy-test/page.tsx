'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity, Volume2, BarChart3, Target } from 'lucide-react';
import { frequencyToNote, isValidMusicalFrequency, TRAINING_BASE_TONES, calculateRelativeInterval, evaluateRelativePitchAccuracy, BaseTone, getNoteColor } from '../../../utils/noteUtils';
import { useTonePlayer } from '../../../hooks/useTonePlayer';

/**
 * 精度テストページ
 * 
 * 目的: 基音とユーザー音声の相対音程検出精度を簡単にテスト
 * 機能:
 * - ランダム基音再生
 * - ユーザー歌唱の相対音程検出
 * - 精度結果の簡易表示
 * - テスト統計（成功率・平均精度）
 */

interface TestResult {
  testNumber: number;
  baseTone: BaseTone;
  userFrequency: number;
  userNote: string;
  relativeCents: number;
  accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  timestamp: number;
}

interface TestSession {
  totalTests: number;
  completedTests: number;
  results: TestResult[];
  averageScore: number;
  perfectCount: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  poorCount: number;
}

export default function AccuracyTestPage() {
  // 基本状態
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // テスト関連状態
  const [currentBaseTone, setCurrentBaseTone] = useState<BaseTone | null>(null);
  const [testSession, setTestSession] = useState<TestSession>({
    totalTests: 5,
    completedTests: 0,
    results: [],
    averageScore: 0,
    perfectCount: 0,
    excellentCount: 0,
    goodCount: 0,
    fairCount: 0,
    poorCount: 0,
  });
  const [isTestActive, setIsTestActive] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<{
    frequency: number;
    note: string;
    relativeCents: number;
    accuracy: {
      accuracy: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';
      color: string;
      score: number;
      message: string;
    };
  } | null>(null);
  
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
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // hydration完了まで時刻を非表示
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 周波数検出関数（テスト用）
  const detectFrequency = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isTestActive || !currentBaseTone) return;

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
    if (maxAmplitude > 20 && isValidMusicalFrequency(frequency)) {
      const detectedFrequency = Math.round(frequency * 10) / 10;
      const noteInfo = frequencyToNote(detectedFrequency);
      
      // 相対音程計算
      const interval = calculateRelativeInterval(currentBaseTone.frequency, detectedFrequency);
      const accuracy = evaluateRelativePitchAccuracy(interval.cents);
      
      setCurrentDetection({
        frequency: detectedFrequency,
        note: noteInfo.fullNote,
        relativeCents: interval.cents,
        accuracy
      });
    }
    
    // 次のフレーム
    if (isTestActive) {
      animationFrameRef.current = requestAnimationFrame(detectFrequency);
    }
  }, [isTestActive, currentBaseTone]);

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
      if (isTestActive) {
        detectFrequency();
      }
      
      console.log('🎵 精度テスト開始');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError(`マイクロフォンエラー: ${errorMessage}`);
      console.error('❌ 精度テスト開始失敗:', err);
    }
  }, [detectFrequency, isTestActive]);

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
      setCurrentDetection(null);
      
      console.log('🛑 精度テスト停止');
      
    } catch (err) {
      console.error('❌ 停止エラー:', err);
    }
  }, []);

  // テスト開始
  const startTest = useCallback(async () => {
    if (!playerState.isLoaded) {
      setError('音声プレイヤーが初期化されていません');
      return;
    }
    
    // テストセッション初期化
    setTestSession({
      totalTests: 5,
      completedTests: 0,
      results: [],
      averageScore: 0,
      perfectCount: 0,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      poorCount: 0,
    });
    
    setIsTestActive(true);
    await playNextBaseTone();
  }, [playerState.isLoaded]);

  // 次の基音再生
  const playNextBaseTone = useCallback(async () => {
    try {
      // ランダムな基音を選択
      const randomIndex = Math.floor(Math.random() * TRAINING_BASE_TONES.length);
      const selectedTone = TRAINING_BASE_TONES[randomIndex];
      
      setCurrentBaseTone(selectedTone);
      setCurrentDetection(null);
      
      // 2秒間再生
      await playTone(selectedTone, 2);
      
      console.log('🎵 テスト基音:', selectedTone);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '基音再生エラー';
      setError(`基音再生エラー: ${errorMessage}`);
    }
  }, [playTone]);

  // 結果記録
  const recordResult = useCallback(() => {
    if (!currentBaseTone || !currentDetection) return;
    
    const result: TestResult = {
      testNumber: testSession.completedTests + 1,
      baseTone: currentBaseTone,
      userFrequency: currentDetection.frequency,
      userNote: currentDetection.note,
      relativeCents: currentDetection.relativeCents,
      accuracy: currentDetection.accuracy.accuracy,
      score: currentDetection.accuracy.score,
      timestamp: Date.now()
    };
    
    const newResults = [...testSession.results, result];
    const newCompletedTests = testSession.completedTests + 1;
    
    // 統計計算
    const averageScore = newResults.reduce((sum, r) => sum + r.score, 0) / newResults.length;
    const perfectCount = newResults.filter(r => r.accuracy === 'perfect').length;
    const excellentCount = newResults.filter(r => r.accuracy === 'excellent').length;
    const goodCount = newResults.filter(r => r.accuracy === 'good').length;
    const fairCount = newResults.filter(r => r.accuracy === 'fair').length;
    const poorCount = newResults.filter(r => r.accuracy === 'poor').length;
    
    setTestSession({
      ...testSession,
      completedTests: newCompletedTests,
      results: newResults,
      averageScore,
      perfectCount,
      excellentCount,
      goodCount,
      fairCount,
      poorCount,
    });
    
    // テスト完了チェック
    if (newCompletedTests >= testSession.totalTests) {
      setIsTestActive(false);
      stopRecording();
      console.log('✅ テスト完了');
    } else {
      // 次のテストを1秒後に開始
      setTimeout(() => {
        playNextBaseTone();
      }, 1000);
    }
  }, [currentBaseTone, currentDetection, testSession, stopRecording, playNextBaseTone]);

  // テストリセット
  const resetTest = useCallback(() => {
    setIsTestActive(false);
    setCurrentBaseTone(null);
    setCurrentDetection(null);
    stopRecording();
    stopTone();
    setTestSession({
      totalTests: 5,
      completedTests: 0,
      results: [],
      averageScore: 0,
      perfectCount: 0,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      poorCount: 0,
    });
  }, [stopRecording, stopTone]);

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
      {/* タイムスタンプ表示 */}
      {isClient && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
          🎯 {currentTime}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎯</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            相対音程精度テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            基音とユーザー音声の相対音程検出精度を簡単にテスト
          </p>
          <div className="inline-block bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-6 py-3 rounded-full text-lg font-bold">
            精度測定・統計分析
          </div>
        </div>

        {/* テスト進行状況 */}
        <div className="mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 テスト進行状況</h3>
          
          <div className="flex items-center justify-center space-x-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {testSession.completedTests}
              </div>
              <div className="text-gray-600">完了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {testSession.totalTests}
              </div>
              <div className="text-gray-600">合計</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {testSession.averageScore.toFixed(1)}
              </div>
              <div className="text-gray-600">平均スコア</div>
            </div>
          </div>
          
          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(testSession.completedTests / testSession.totalTests) * 100}%` }}
            ></div>
          </div>
          
          {/* 現在の基音表示 */}
          {currentBaseTone && isTestActive && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="text-center">
                <span className="text-gray-600 mr-2">テスト中の基音:</span>
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

        {/* 現在の検出結果 */}
        {isTestActive && currentDetection && (
          <div className="mb-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center justify-center space-x-2">
              <Activity className="w-6 h-6" />
              <span>リアルタイム検出結果</span>
            </h3>
            
            <div className="space-y-6">
              {/* 検出音名 */}
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {currentDetection.note}
                </div>
                <div className="text-gray-600">検出音名</div>
              </div>
              
              {/* 相対音程 */}
              <div className="flex justify-center items-center space-x-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold text-${currentDetection.accuracy.color}-600`}>
                    {currentDetection.relativeCents >= 0 ? '+' : ''}{currentDetection.relativeCents}¢
                  </div>
                  <div className="text-gray-600">相対音程</div>
                </div>
                <div className="text-center">
                  <div className={`px-4 py-2 rounded-full text-white font-bold bg-${currentDetection.accuracy.color}-500`}>
                    {currentDetection.accuracy.score}点
                  </div>
                  <div className="text-gray-600">精度スコア</div>
                </div>
              </div>
              
              {/* 精度評価 */}
              <div className={`text-lg font-bold text-${currentDetection.accuracy.color}-600`}>
                {currentDetection.accuracy.message}
              </div>
              
              {/* 結果記録ボタン */}
              <button
                onClick={recordResult}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-105"
              >
                ✅ この結果を記録
              </button>
            </div>
          </div>
        )}

        {/* テスト結果統計 */}
        {testSession.results.length > 0 && (
          <div className="mb-12 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center justify-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>テスト結果統計</span>
            </h3>
            
            {/* 精度分布 */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{testSession.perfectCount}</div>
                <div className="text-sm text-green-700">Perfect</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testSession.excellentCount}</div>
                <div className="text-sm text-blue-700">Excellent</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">{testSession.goodCount}</div>
                <div className="text-sm text-cyan-700">Good</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{testSession.fairCount}</div>
                <div className="text-sm text-orange-700">Fair</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{testSession.poorCount}</div>
                <div className="text-sm text-red-700">Poor</div>
              </div>
            </div>
            
            {/* 詳細結果リスト */}
            <div className="space-y-2">
              {testSession.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {result.testNumber}
                    </span>
                    <span 
                      className="px-3 py-1 rounded text-white font-bold text-sm"
                      style={{ backgroundColor: getNoteColor(result.baseTone.note) }}
                    >
                      {result.baseTone.fullNote}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="font-mono text-blue-600">{result.userNote}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-gray-600">
                      {result.relativeCents >= 0 ? '+' : ''}{result.relativeCents}¢
                    </span>
                    <span className={`px-2 py-1 rounded text-white text-sm font-bold bg-${
                      result.accuracy === 'perfect' ? 'green' :
                      result.accuracy === 'excellent' ? 'blue' :
                      result.accuracy === 'good' ? 'cyan' :
                      result.accuracy === 'fair' ? 'orange' : 'red'
                    }-500`}>
                      {result.score}
                    </span>
                  </div>
                </div>
              ))}
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

        {/* コントロールボタン */}
        <div className="mb-12 space-y-4">
          {/* テスト制御 */}
          <div className="flex gap-4 justify-center">
            {!isTestActive ? (
              <button
                onClick={startTest}
                disabled={!playerState.isLoaded}
                className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  !playerState.isLoaded
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-2xl'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Target className="w-6 h-6" />
                  <span>🎯 精度テスト開始</span>
                </div>
              </button>
            ) : (
              <button
                onClick={resetTest}
                className="group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <Square className="w-6 h-6" />
                  <span>🛑 テスト停止</span>
                </div>
              </button>
            )}
          </div>
          
          {/* マイクロフォン制御 */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={startRecording}
              disabled={isRecording || !isTestActive}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                isRecording || !isTestActive
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>🎤 マイク開始</span>
              </div>
            </button>
            
            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className={`group relative overflow-hidden px-6 py-3 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg ${
                !isRecording
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Square className="w-5 h-5" />
                <span>🛑 マイク停止</span>
              </div>
            </button>
          </div>
        </div>

        {/* 使用方法 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 使用方法</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>「精度テスト開始」でテストセッション開始</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>ランダム基音を聞いて覚える</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>「マイク開始」で音声検出開始</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>基音と同じ音程で歌い、「結果を記録」</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>5回テスト後、統計結果を確認</span>
            </div>
          </div>
        </div>

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
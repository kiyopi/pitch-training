'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Music, Zap, Target, TrendingUp } from 'lucide-react';
import { useMicrophoneManager } from '../../../hooks/useMicrophoneManager';
import { useAudioProcessor } from '../../../hooks/useAudioProcessor';

/**
 * Pitch検出 テストページ - Step 4
 * 
 * 目的: Pitchy音程検出システムの動作確認
 * 機能: リアルタイム音程検出、音程判定、検出品質評価
 */

export default function PitchDetectorTestPage() {
  const { microphoneState, startRecording, stopRecording, resetError } = useMicrophoneManager();
  const { 
    processorState, 
    startProcessing, 
    stopProcessing, 
    getProcessedData, 
    getFilteredData, 
    enableNoiseFiltering, 
    enablePitchDetection,
    pitchDetector,
    noiseFilter, 
    resetError: resetProcessorError 
  } = useAudioProcessor();
  
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isNoiseFilteringEnabled, setIsNoiseFilteringEnabled] = useState(true);
  const [isPitchDetectionEnabled, setIsPitchDetectionEnabled] = useState(true);
  const [pitchHistory, setPitchHistory] = useState<Array<{
    note: string;
    pitch: number;
    cents: number;
    clarity: number;
    timestamp: number;
  }>>([]);
  
  // クライアントサイドでのみ時刻を更新（hydration mismatch回避）
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Pitch検出結果の履歴更新（修正版）
  useEffect(() => {
    if (!processorState.isProcessing || !pitchDetector.pitchState.isDetecting) {
      return;
    }
    
    console.log('🎵 リアルタイムPitch検出ループ開始');

    const interval = setInterval(() => {
      const pitchResult = pitchDetector.getPitchResult();
      
      if (pitchResult) {
        setPitchHistory(prev => {
          const newHistory = [...prev, {
            note: pitchResult.note,
            pitch: pitchResult.pitch,
            cents: pitchResult.cents,
            clarity: pitchResult.clarity,
            timestamp: pitchResult.timestamp,
          }].slice(-20); // 最新20件を保持
          
          return newHistory;
        });
      }
    }, 200); // 200ms間隔で更新

    return () => {
      console.log('🛑 リアルタイムPitch検出ループ停止');
      clearInterval(interval);
    };
  }, [processorState.isProcessing, pitchDetector.pitchState.isDetecting]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev.slice(-8), logMessage]);
  };

  const handleStart = useCallback(async () => {
    try {
      addLog('🎵 Step 4統合テスト開始');
      
      // Step 1: マイクロフォン開始
      addLog('🎙️ Step 1: マイクロフォン許可要求');
      const micSuccess = await startRecording();
      if (!micSuccess) {
        addLog('❌ Step 1: マイクロフォン開始失敗');
        return;
      }
      addLog('✅ Step 1: マイクロフォン開始成功');
      
      // Step 2: 音声処理開始
      addLog('🎵 Step 2: 音声処理パイプライン開始');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      
      const processorSuccess = await startProcessing(stream);
      if (!processorSuccess) {
        addLog('❌ Step 2: 音声処理開始失敗');
        return;
      }
      addLog('✅ Step 2: 音声処理開始成功');
      
      // Step 3: ノイズフィルタリング有効化
      if (isNoiseFilteringEnabled) {
        addLog('🔧 Step 3: ノイズフィルタリング有効化');
        enableNoiseFiltering(true);
        addLog('✅ Step 3: ノイズフィルタリング適用完了');
      }

      // Step 4: Pitch検出有効化
      if (isPitchDetectionEnabled) {
        addLog('🎵 Step 4: Pitch検出有効化');
        enablePitchDetection(true);
        addLog('✅ Step 4: Pitch検出開始完了');
      }
      
      addLog('🎯 Step 4統合テスト完了');
      
    } catch (error) {
      addLog(`❌ 統合テスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [startRecording, startProcessing, enableNoiseFiltering, enablePitchDetection, isNoiseFilteringEnabled, isPitchDetectionEnabled]);

  const handleStop = useCallback(() => {
    addLog('🛑 Step 4統合停止開始');
    
    // Step 4: Pitch検出無効化
    enablePitchDetection(false);
    addLog('✅ Step 4: Pitch検出停止');
    
    // Step 3: ノイズフィルタリング無効化
    enableNoiseFiltering(false);
    addLog('✅ Step 3: ノイズフィルタリング無効化');
    
    // Step 2: 音声処理停止
    stopProcessing();
    addLog('✅ Step 2: 音声処理停止');
    
    // Step 1: マイクロフォン停止
    stopRecording();
    addLog('✅ Step 1: マイクロフォン停止');
    
    // 履歴クリア
    setPitchHistory([]);
    
    addLog('🎯 Step 4統合停止完了');
  }, [stopProcessing, stopRecording, enableNoiseFiltering, enablePitchDetection]);

  const handleResetError = () => {
    addLog('🔄 エラーリセット');
    resetError();
    resetProcessorError();
    noiseFilter.resetError();
    pitchDetector.resetError();
  };

  const handleToggleNoiseFiltering = useCallback(() => {
    const newState = !isNoiseFilteringEnabled;
    setIsNoiseFilteringEnabled(newState);
    
    if (processorState.isProcessing) {
      enableNoiseFiltering(newState);
      addLog(`🔧 リアルタイム切り替え: ノイズフィルタリング${newState ? '有効' : '無効'}`);
    }
  }, [isNoiseFilteringEnabled, processorState.isProcessing, enableNoiseFiltering]);

  const handleTogglePitchDetection = useCallback(() => {
    const newState = !isPitchDetectionEnabled;
    setIsPitchDetectionEnabled(newState);
    
    if (processorState.isProcessing) {
      enablePitchDetection(newState);
      addLog(`🎵 リアルタイム切り替え: Pitch検出${newState ? '有効' : '無効'}`);
    }
  }, [isPitchDetectionEnabled, processorState.isProcessing, enablePitchDetection]);

  const getStatusIcon = (isActive: boolean, hasError: boolean) => {
    if (hasError) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (isActive) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = (isActive: boolean, hasError: boolean) => {
    if (hasError) return 'エラー';
    if (isActive) return '動作中';
    return '停止中';
  };

  const isSystemActive = microphoneState.isRecording && processorState.isProcessing;
  const hasError = microphoneState.error || processorState.error || noiseFilter.filterState.error || pitchDetector.pitchState.error;
  
  // 検出統計とデバッグ情報
  const detectionStats = pitchDetector.getDetectionStats();
  const detectionQuality = pitchDetector.getDetectionQuality();
  const debugInfo = pitchDetector.getDebugInfo();
  const formattedDisplay = pitchDetector.getFormattedDisplay();
  
  // 最新のPitch検出結果
  const currentPitch = pitchDetector.pitchState;

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {currentTime}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎵</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Pitch検出 テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Step 4: Pitchy音程検出システム テスト
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            McLeod Pitch Method版
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 システム状態</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: マイクロフォン状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Step 1: マイク</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(microphoneState.isRecording, !!microphoneState.error)}
                  <span className={`font-bold ${
                    microphoneState.error ? 'text-red-600' :
                    microphoneState.isRecording ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {getStatusText(microphoneState.isRecording, !!microphoneState.error)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: 音声処理状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Step 2: 音声処理</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(processorState.isProcessing, !!processorState.error)}
                  <span className={`font-bold ${
                    processorState.error ? 'text-red-600' :
                    processorState.isProcessing ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {getStatusText(processorState.isProcessing, !!processorState.error)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: ノイズフィルタリング状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Step 3: フィルター</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(noiseFilter.filterState.isFiltering, !!noiseFilter.filterState.error)}
                  <span className={`font-bold ${
                    noiseFilter.filterState.error ? 'text-red-600' :
                    noiseFilter.filterState.isFiltering ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {getStatusText(noiseFilter.filterState.isFiltering, !!noiseFilter.filterState.error)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Pitch検出状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Step 4: Pitch検出</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(pitchDetector.pitchState.isDetecting, !!pitchDetector.pitchState.error)}
                  <span className={`font-bold ${
                    pitchDetector.pitchState.error ? 'text-red-600' :
                    pitchDetector.pitchState.isDetecting ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {getStatusText(pitchDetector.pitchState.isDetecting, !!pitchDetector.pitchState.error)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 機能制御パネル */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">🔧 機能制御</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ノイズフィルタリング制御 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
              <span className="font-semibold text-gray-700">ノイズフィルタリング</span>
              <button
                onClick={handleToggleNoiseFiltering}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isNoiseFilteringEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isNoiseFilteringEnabled ? '✅ 有効' : '❌ 無効'}
              </button>
            </div>

            {/* Pitch検出制御 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <span className="font-semibold text-gray-700">Pitch検出</span>
              <button
                onClick={handleTogglePitchDetection}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  isPitchDetectionEnabled
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isPitchDetectionEnabled ? '✅ 有効' : '❌ 無効'}
              </button>
            </div>
          </div>
        </div>

        {/* リアルタイムPitch検出結果 */}
        {pitchDetector.pitchState.isDetecting && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <Music className="w-5 h-5" />
              <span>リアルタイム音程検出</span>
            </h3>
            
            {currentPitch.currentNote ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 現在の音程情報 */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-3">検出結果</h4>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-600">
                      {currentPitch.currentNote}
                    </div>
                    <div className="text-lg text-gray-600">
                      {currentPitch.frequency?.toFixed(2)} Hz
                    </div>
                    <div className={`text-lg font-semibold ${
                      currentPitch.currentCents && Math.abs(currentPitch.currentCents) < 10 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                    }`}>
                      {currentPitch.currentCents !== null 
                        ? `${currentPitch.currentCents >= 0 ? '+' : ''}${currentPitch.currentCents.toFixed(0)}¢`
                        : '--¢'
                      }
                    </div>
                  </div>
                </div>

                {/* 信頼度と品質 */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-3">検出品質</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">信頼度:</span>
                      <span className={`font-bold ${
                        currentPitch.clarity > 0.8 ? 'text-green-600' : 
                        currentPitch.clarity > 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(currentPitch.clarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">品質:</span>
                      <span className={`font-bold ${
                        detectionQuality.quality === 'excellent' ? 'text-green-600' :
                        detectionQuality.quality === 'good' ? 'text-blue-600' :
                        detectionQuality.quality === 'fair' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {detectionQuality.quality}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">スコア:</span>
                      <span className="font-bold text-purple-600">
                        {detectionQuality.score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* 統計情報 */}
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-3">検出統計</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">成功率:</span>
                      <span className="font-bold text-green-600">
                        {(detectionStats.detectionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">検出回数:</span>
                      <span className="font-bold text-blue-600">
                        {detectionStats.successfulDetections}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均音程:</span>
                      <span className="font-bold text-purple-600">
                        {detectionStats.averagePitch.toFixed(1)} Hz
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">音程を検出中...</p>
                <p className="text-sm mt-2">歌ったり楽器を演奏してください</p>
              </div>
            )}
          </div>
        )}

        {/* Pitch検出履歴 */}
        {pitchHistory.length > 0 && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>検出履歴（最新20件）</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
              {pitchHistory.slice(-20).reverse().map((pitch, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-center">
                  <div className="font-bold text-purple-600">{pitch.note}</div>
                  <div className="text-sm text-gray-600">{pitch.pitch.toFixed(1)}Hz</div>
                  <div className={`text-xs font-semibold ${
                    Math.abs(pitch.cents) < 10 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {pitch.cents >= 0 ? '+' : ''}{pitch.cents.toFixed(0)}¢
                  </div>
                  <div className="text-xs text-gray-500">
                    {(pitch.clarity * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {hasError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-800">エラー発生</span>
            </div>
            <div className="space-y-2">
              {microphoneState.error && (
                <p className="text-red-700">Step 1: {microphoneState.error}</p>
              )}
              {processorState.error && (
                <p className="text-red-700">Step 2: {processorState.error}</p>
              )}
              {noiseFilter.filterState.error && (
                <p className="text-red-700">Step 3: {noiseFilter.filterState.error}</p>
              )}
              {pitchDetector.pitchState.error && (
                <p className="text-red-700">Step 4: {pitchDetector.pitchState.error}</p>
              )}
            </div>
            <button
              onClick={handleResetError}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* 制御ボタン */}
        <div className="mb-8 flex gap-4 justify-center">
          <button
            onClick={handleStart}
            disabled={isSystemActive}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              isSystemActive
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6" />
              <span>🎵 統合開始</span>
            </div>
          </button>
          
          <button
            onClick={handleStop}
            disabled={!isSystemActive}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              !isSystemActive
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Square className="w-6 h-6" />
              <span>🛑 統合停止</span>
            </div>
          </button>
        </div>

        {/* テスト項目 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Step 4 テスト項目</span>
          </h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>McLeod Pitch Method による高精度音程検出</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>リアルタイム音程・音名・セント偏差表示</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>検出信頼度と品質評価システム</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Step 1-3統合による前処理済み音声活用</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>検出統計と履歴による性能監視</span>
            </div>
          </div>
        </div>

        {/* デバッグログ表示 */}
        {debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-2">📝 デバッグログ:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {debugLog.map((log, index) => (
                <div key={index} className="font-mono text-left">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <Link 
          href="/test/noise-filter"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Step 3 テストに戻る</span>
        </Link>
      </div>
    </div>
  );
}
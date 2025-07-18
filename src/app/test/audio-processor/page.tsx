'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity, BarChart3 } from 'lucide-react';
import { useMicrophoneManager } from '../../../hooks/useMicrophoneManager';
import { useAudioProcessor } from '../../../hooks/useAudioProcessor';

/**
 * AudioProcessor テストページ - Step 2
 * 
 * 目的: AudioContext・音声処理基盤の動作確認
 * 機能: 音声処理パイプライン、リアルタイムデータ表示、統合テスト
 */

export default function AudioProcessorTestPage() {
  const { microphoneState, startRecording, stopRecording, resetError } = useMicrophoneManager();
  const { processorState, startProcessing, stopProcessing, getProcessedData, resetError: resetProcessorError } = useAudioProcessor();
  
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioStats, setAudioStats] = useState({
    rms: 0,
    peak: 0,
    averageRms: 0,
    averagePeak: 0,
    sampleCount: 0,
  });
  
  // クライアントサイドでのみ時刻を更新（hydration mismatch回避）
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // 音声データ統計の更新
  useEffect(() => {
    if (!processorState.isProcessing) return;

    const interval = setInterval(() => {
      const data = getProcessedData();
      if (data.timedomainData) {
        setAudioStats(prev => {
          const newSampleCount = prev.sampleCount + 1;
          const newAverageRms = (prev.averageRms * prev.sampleCount + data.rms) / newSampleCount;
          const newAveragePeak = (prev.averagePeak * prev.sampleCount + data.peak) / newSampleCount;
          
          return {
            rms: data.rms,
            peak: data.peak,
            averageRms: newAverageRms,
            averagePeak: newAveragePeak,
            sampleCount: newSampleCount,
          };
        });
      }
    }, 100); // 100ms間隔で更新

    return () => clearInterval(interval);
  }, [processorState.isProcessing, getProcessedData]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev.slice(-8), logMessage]);
  };

  const handleStart = useCallback(async () => {
    try {
      addLog('🎵 Step 2統合テスト開始');
      
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
      // マイクロフォンのMediaStreamを取得して音声処理に渡す
      // 実際の実装では、useMicrophoneManagerからstreamを取得する必要がある
      // 今回はテスト用に新しくMediaStreamを取得
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
      addLog('🎯 Step 2統合テスト完了');
      
    } catch (error) {
      addLog(`❌ 統合テスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [startRecording, startProcessing]);

  const handleStop = useCallback(() => {
    addLog('🛑 Step 2統合停止開始');
    
    // Step 2: 音声処理停止
    stopProcessing();
    addLog('✅ Step 2: 音声処理停止');
    
    // Step 1: マイクロフォン停止
    stopRecording();
    addLog('✅ Step 1: マイクロフォン停止');
    
    // 統計リセット
    setAudioStats({
      rms: 0,
      peak: 0,
      averageRms: 0,
      averagePeak: 0,
      sampleCount: 0,
    });
    
    addLog('🎯 Step 2統合停止完了');
  }, [stopProcessing, stopRecording]);

  const handleResetError = () => {
    addLog('🔄 エラーリセット');
    resetError();
    resetProcessorError();
  };

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
  const hasError = microphoneState.error || processorState.error;

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {currentTime}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎵</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AudioProcessor テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Step 2: AudioContext・音声処理基盤テスト
          </p>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-6 py-3 rounded-full text-lg font-bold">
            統合テスト版
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 システム状態</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: マイクロフォン状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">Step 1: マイクロフォン</span>
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
              <div className="text-sm text-gray-600">
                音声レベル: {microphoneState.audioLevel.toFixed(2)}
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
              <div className="text-sm text-gray-600">
                サンプリング: {processorState.sampleRate}Hz
              </div>
            </div>
          </div>
        </div>

        {/* 音声データ統計 */}
        {processorState.isProcessing && (
          <div className="mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>リアルタイム音声データ</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 現在値 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-3">現在値</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">RMS:</span>
                    <span className="font-bold text-blue-600">{audioStats.rms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak:</span>
                    <span className="font-bold text-purple-600">{audioStats.peak.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* 平均値 */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-3">平均値</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均RMS:</span>
                    <span className="font-bold text-green-600">{audioStats.averageRms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均Peak:</span>
                    <span className="font-bold text-emerald-600">{audioStats.averagePeak.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              サンプル数: {audioStats.sampleCount}
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
        <div className="mb-12 flex gap-4 justify-center">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Step 2 テスト項目</span>
          </h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>AudioContext初期化・最適化設定</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>AnalyserNode設定・音声データ処理</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Step 1マイクロフォン機能との統合</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>リアルタイム音声データ可視化</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>Tone.js AudioContextとの協調</span>
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
          href="/test/microphone"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Step 1 テストに戻る</span>
        </Link>
      </div>
    </div>
  );
}
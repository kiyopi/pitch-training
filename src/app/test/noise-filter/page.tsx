'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, AlertCircle, CheckCircle, Activity, Settings, Filter } from 'lucide-react';
import { useMicrophoneManager } from '../../../hooks/useMicrophoneManager';
import { useAudioProcessor } from '../../../hooks/useAudioProcessor';

/**
 * ノイズフィルタリング テストページ - Step 3
 * 
 * 目的: 1段階ノイズフィルタリングの動作確認
 * 機能: 3段階フィルター、音声品質改善、リアルタイム比較
 */

export default function NoiseFilterTestPage() {
  const { microphoneState, startRecording, stopRecording, resetError } = useMicrophoneManager();
  const { processorState, startProcessing, stopProcessing, getProcessedData, getFilteredData, enableNoiseFiltering, noiseFilter, resetError: resetProcessorError } = useAudioProcessor();
  
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isNoiseFilteringEnabled, setIsNoiseFilteringEnabled] = useState(false);
  const [audioComparison, setAudioComparison] = useState({
    original: {
      rms: 0,
      peak: 0,
      averageRms: 0,
      averagePeak: 0,
    },
    filtered: {
      rms: 0,
      peak: 0,
      averageRms: 0,
      averagePeak: 0,
    },
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

  // 音声データ比較の更新
  useEffect(() => {
    if (!processorState.isProcessing) return;

    const interval = setInterval(() => {
      const originalData = getProcessedData();
      const filteredData = getFilteredData();
      
      if (originalData.timedomainData && filteredData.timedomainData) {
        setAudioComparison(prev => {
          const newSampleCount = prev.sampleCount + 1;
          
          // 元音声の平均値更新
          const newOriginalAverageRms = (prev.original.averageRms * prev.sampleCount + originalData.rms) / newSampleCount;
          const newOriginalAveragePeak = (prev.original.averagePeak * prev.sampleCount + originalData.peak) / newSampleCount;
          
          // フィルタリング済み音声の平均値更新
          const newFilteredAverageRms = (prev.filtered.averageRms * prev.sampleCount + filteredData.rms) / newSampleCount;
          const newFilteredAveragePeak = (prev.filtered.averagePeak * prev.sampleCount + filteredData.peak) / newSampleCount;
          
          return {
            original: {
              rms: originalData.rms,
              peak: originalData.peak,
              averageRms: newOriginalAverageRms,
              averagePeak: newOriginalAveragePeak,
            },
            filtered: {
              rms: filteredData.rms,
              peak: filteredData.peak,
              averageRms: newFilteredAverageRms,
              averagePeak: newFilteredAveragePeak,
            },
            sampleCount: newSampleCount,
          };
        });
      }
    }, 100); // 100ms間隔で更新

    return () => clearInterval(interval);
  }, [processorState.isProcessing, getProcessedData, getFilteredData]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP') || new Date().toTimeString().slice(0, 8);
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev.slice(-8), logMessage]);
  };

  const handleStart = useCallback(async () => {
    try {
      addLog('🔧 Step 3統合テスト開始');
      
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
      
      addLog('🎯 Step 3統合テスト完了');
      
    } catch (error) {
      addLog(`❌ 統合テスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [startRecording, startProcessing, enableNoiseFiltering, isNoiseFilteringEnabled]);

  const handleStop = useCallback(() => {
    addLog('🛑 Step 3統合停止開始');
    
    // Step 3: ノイズフィルタリング無効化
    enableNoiseFiltering(false);
    addLog('✅ Step 3: ノイズフィルタリング無効化');
    
    // Step 2: 音声処理停止
    stopProcessing();
    addLog('✅ Step 2: 音声処理停止');
    
    // Step 1: マイクロフォン停止
    stopRecording();
    addLog('✅ Step 1: マイクロフォン停止');
    
    // 統計リセット
    setAudioComparison({
      original: {
        rms: 0,
        peak: 0,
        averageRms: 0,
        averagePeak: 0,
      },
      filtered: {
        rms: 0,
        peak: 0,
        averageRms: 0,
        averagePeak: 0,
      },
      sampleCount: 0,
    });
    
    addLog('🎯 Step 3統合停止完了');
  }, [stopProcessing, stopRecording, enableNoiseFiltering]);

  const handleResetError = () => {
    addLog('🔄 エラーリセット');
    resetError();
    resetProcessorError();
    noiseFilter.resetError();
  };

  const handleToggleNoiseFiltering = useCallback(() => {
    const newState = !isNoiseFilteringEnabled;
    setIsNoiseFilteringEnabled(newState);
    
    if (processorState.isProcessing) {
      enableNoiseFiltering(newState);
      addLog(`🔧 リアルタイム切り替え: ノイズフィルタリング${newState ? '有効' : '無効'}`);
    }
  }, [isNoiseFilteringEnabled, processorState.isProcessing, enableNoiseFiltering]);

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
  const hasError = microphoneState.error || processorState.error || noiseFilter.filterState.error;
  const snrImprovement = audioComparison.sampleCount > 0 ? 
    20 * Math.log10(audioComparison.filtered.averageRms / audioComparison.original.averageRms) : 0;

  return (
    <div className="max-w-6xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {currentTime}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🔧</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            ノイズフィルタリング テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Step 3: 1段階ノイズフィルタリング テスト
          </p>
          <div className="inline-block bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-6 py-3 rounded-full text-lg font-bold">
            3段階フィルター版
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 システム状態</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <span className="font-semibold text-gray-700">Step 3: ノイズフィルター</span>
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
          </div>
        </div>

        {/* ノイズフィルタリング制御 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>ノイズフィルタリング制御</span>
          </h3>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleToggleNoiseFiltering}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                isNoiseFilteringEnabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>ノイズフィルタリング</span>
            </button>
            
            <div className="text-sm text-gray-600">
              {isNoiseFilteringEnabled ? (
                <span className="text-green-600 font-semibold">✅ 有効</span>
              ) : (
                <span className="text-gray-500">❌ 無効</span>
              )}
            </div>
          </div>
        </div>

        {/* 音声品質比較 */}
        {processorState.isProcessing && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>音声品質比較</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 元音声データ */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-3">元音声（フィルタリング前）</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在 RMS:</span>
                    <span className="font-bold text-red-600">{audioComparison.original.rms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均 RMS:</span>
                    <span className="font-bold text-orange-600">{audioComparison.original.averageRms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在 Peak:</span>
                    <span className="font-bold text-red-600">{audioComparison.original.peak.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* フィルタリング済み音声データ */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-3">フィルタリング済み音声</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在 RMS:</span>
                    <span className="font-bold text-green-600">{audioComparison.filtered.rms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">平均 RMS:</span>
                    <span className="font-bold text-blue-600">{audioComparison.filtered.averageRms.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在 Peak:</span>
                    <span className="font-bold text-green-600">{audioComparison.filtered.peak.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <h4 className="font-semibold text-gray-700 mb-3">フィルタリング効果</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">SNR改善:</span>
                  <span className={`font-bold ${snrImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {snrImprovement > 0 ? '+' : ''}{snrImprovement.toFixed(2)} dB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">サンプル数:</span>
                  <span className="font-bold text-purple-600">{audioComparison.sampleCount}</span>
                </div>
              </div>
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
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Play className="w-6 h-6" />
              <span>🔧 統合開始</span>
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
            <Filter className="w-5 h-5" />
            <span>Step 3 テスト項目</span>
          </h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ハイパスフィルター（60Hz以下カット）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>ローパスフィルター（8kHz以上カット）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>ノッチフィルター（電源ノイズ除去）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>リアルタイム音声品質比較</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>フィルタリング効果の可視化</span>
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
          href="/test/audio-processor"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Step 2 テストに戻る</span>
        </Link>
      </div>
    </div>
  );
}
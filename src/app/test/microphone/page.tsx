'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, MicOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useMicrophoneManager } from '../../../hooks/useMicrophoneManager';

/**
 * マイクロフォンテストページ - Step 1
 * 
 * 目的: 基本マイクロフォン許可・音声取得のテスト
 * 機能: 許可取得、開始・停止制御、エラーハンドリング
 * 
 * テスト項目:
 * - マイクロフォン許可取得
 * - 開始・停止制御
 * - エラーハンドリング
 * - iPhone Safari対応
 */

export default function MicrophoneTestPage() {
  const { microphoneState, startRecording, stopRecording, resetError } = useMicrophoneManager();
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev.slice(-8), logMessage]);
  };

  const handleStart = async () => {
    addLog('🎙️ マイクロフォン開始要求');
    const success = await startRecording();
    if (success) {
      addLog('✅ マイクロフォン開始成功');
    } else {
      addLog('❌ マイクロフォン開始失敗');
    }
  };

  const handleStop = () => {
    addLog('🛑 マイクロフォン停止要求');
    stopRecording();
    addLog('✅ マイクロフォン停止完了');
  };

  const handleResetError = () => {
    addLog('🔄 エラーリセット');
    resetError();
  };

  const getPermissionIcon = () => {
    switch (microphoneState.permission) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPermissionText = () => {
    switch (microphoneState.permission) {
      case 'granted':
        return 'マイクロフォン許可済み';
      case 'denied':
        return 'マイクロフォン拒否';
      default:
        return '許可待機中';
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎙️</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            マイクロフォンテスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Step 1: 基本許可・音声取得テスト
          </p>
          <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-3 rounded-full text-lg font-bold">
            基本機能テスト版
          </div>
        </div>

        {/* 状態表示 */}
        <div className="mb-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📊 マイクロフォン状態</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 録音状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">録音状態</span>
                {microphoneState.isRecording ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 font-bold">録音中</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-600">停止中</span>
                  </div>
                )}
              </div>
            </div>

            {/* 許可状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">許可状態</span>
                <div className="flex items-center space-x-2">
                  {getPermissionIcon()}
                  <span className={`font-bold ${
                    microphoneState.permission === 'granted' ? 'text-green-600' :
                    microphoneState.permission === 'denied' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {getPermissionText()}
                  </span>
                </div>
              </div>
            </div>

            {/* 初期化状態 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">初期化状態</span>
                <span className={`font-bold ${
                  microphoneState.isInitialized ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {microphoneState.isInitialized ? '初期化済み' : '未初期化'}
                </span>
              </div>
            </div>

            {/* 音声レベル */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">音声レベル</span>
                <span className="font-bold text-blue-600">
                  {microphoneState.audioLevel.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {microphoneState.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="font-bold text-red-800">エラー発生</span>
            </div>
            <p className="text-red-700 mb-4">{microphoneState.error}</p>
            <button
              onClick={handleResetError}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              エラーリセット
            </button>
          </div>
        )}

        {/* 制御ボタン */}
        <div className="mb-12 flex gap-4 justify-center">
          <button
            onClick={handleStart}
            disabled={microphoneState.isRecording}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              microphoneState.isRecording
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Mic className="w-6 h-6" />
              <span>🎙️ 開始</span>
            </div>
          </button>
          
          <button
            onClick={handleStop}
            disabled={!microphoneState.isRecording}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-lg ${
              !microphoneState.isRecording
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MicOff className="w-6 h-6" />
              <span>🛑 停止</span>
            </div>
          </button>
        </div>

        {/* テスト項目 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Step 1 テスト項目</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>マイクロフォン許可取得</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>MediaStream の確実な停止</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>リソースリークの確認</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>iPhone Safari での動作確認</span>
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
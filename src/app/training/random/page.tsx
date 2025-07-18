'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { useTonePlayer } from "@/hooks/useTonePlayer";
import { usePermissionManager } from "@/hooks/usePermissionManager";

export default function RandomTrainingPage() {
  const [isStarted, setIsStarted] = useState(false);
  
  const { 
    playerState, 
    playTone, 
    generateRandomBaseTone, 
    initialize 
  } = useTonePlayer();
  
  const { 
    permissionState, 
    isPermissionGranted 
  } = usePermissionManager();

  const handleStart = async () => {
    try {
      setIsStarted(true);
      
      // Initialize tone player if not already done
      if (!playerState.isLoaded) {
        await initialize();
      }
      
      // Generate and play random base tone
      const randomTone = generateRandomBaseTone();
      await playTone(randomTone, 2);
      
      console.log(`基音: ${randomTone.note}${randomTone.octave} (${randomTone.frequency}Hz)`);
      
    } catch (error) {
      console.error('Failed to start training:', error);
    } finally {
      setIsStarted(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* 権限状態表示 */}
      {isPermissionGranted && (
        <div className="fixed top-20 right-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold z-50 shadow-lg backdrop-blur-sm">
          ✅ Permission Granted
        </div>
      )}

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
        </div>

        {/* スタートボタン */}
        <div className="mb-12">
          <button
            onClick={handleStart}
            disabled={isStarted || (!playerState.isLoaded && !playerState.error)}
            className={`
              group relative overflow-hidden
              px-12 py-6 rounded-3xl
              text-2xl font-bold text-white
              transition-all duration-300
              ${isStarted || (!playerState.isLoaded && !playerState.error)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl'
              }
              shadow-lg
            `}
          >
            <div className="flex items-center space-x-3">
              <Play className={`w-8 h-8 ${isStarted ? 'animate-pulse' : ''}`} />
              <span>
                {isStarted 
                  ? '🎹 再生中...' 
                  : playerState.isLoaded 
                    ? '🎹 スタート' 
                    : '🎹 準備中...'
                }
              </span>
            </div>
            
            {/* ホバーエフェクト */}
            {playerState.isLoaded && !isStarted && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
          </button>
        </div>

        {/* ステータス表示 */}
        {playerState.error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            エラー: {playerState.error}
          </div>
        )}

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">使い方</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>スタートボタンを押してランダムな基音を聞く</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>基音を覚えて、ドレミファソラシドを正確に発声</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>繰り返し練習して相対音感を鍛える</span>
            </div>
          </div>
        </div>

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
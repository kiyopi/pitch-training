'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";
import { createVolumeBooster, isIOS } from "@/utils/iOSVolumeBooster";

export default function PianoVolumeTestPage() {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentVolume, setCurrentVolume] = useState<number>(6);
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-9), message]);
  };

  // 各音量設定でテスト
  const volumeSettings = [
    { value: -12, label: "-12dB (旧設定)" },
    { value: 0, label: "0dB (標準)" },
    { value: 6, label: "6dB (プロトタイプ)" },
    { value: 12, label: "12dB (増強)" },
    { value: 18, label: "18dB (最大増強)" },
    { value: 999, label: "iOS特殊増幅 (+36dB)" } // iOS用特殊処理
  ];

  const playBaseTone = async (volume: number) => {
    try {
      const isSpecialVolume = volume === 999;
      const displayVolume = isSpecialVolume ? "iOS特殊増幅" : `${volume}dB`;
      
      addLog(`🎹 音量設定: ${displayVolume}`);
      setCurrentVolume(volume);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // iOS特殊増幅処理の分岐
      if (isSpecialVolume && isIOS()) {
        addLog('📱 iOS検出: 特殊増幅チェーン使用');
        
        // iOS用音量ブースター作成
        const volumeBooster = createVolumeBooster();
        if (!volumeBooster) {
          addLog('❌ ブースター作成失敗');
          return;
        }
        
        // Sampler作成（基本音量）
        const sampler = new Tone.Sampler({
          urls: { "C4": "C4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1.5,
          volume: 6 // 基本音量
        });
        
        // ブースターチェーンに接続
        const finalOutput = volumeBooster.connect(sampler);
        finalOutput.toDestination();
        
        addLog('🔗 増幅チェーン接続完了 (3段階×12dB = +36dB)');
        
        // 音源読み込み待機
        await Tone.loaded();
        
        // C4を1.7秒間再生
        addLog(`♪ 再生中: C4 (iOS特殊増幅)`);
        sampler.triggerAttack("C4", undefined, 0.8);
        
        setTimeout(() => {
          sampler.triggerRelease("C4");
          addLog(`🔇 再生終了: C4 (iOS特殊増幅)`);
          
          // リソース解放
          volumeBooster.dispose();
          sampler.dispose();
        }, 1700);
        
      } else {
        // 通常処理（PC用またはiOS以外の特殊増幅なし）
        if (isSpecialVolume) {
          addLog('💻 PC環境: 通常処理を使用');
          volume = 18; // PCでは18dBに置き換え
        }
        
        const sampler = new Tone.Sampler({
          urls: { "C4": "C4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1.5,
          volume: volume
        }).toDestination();
        
        addLog('ピアノ音源読み込み中...');
        await Tone.loaded();
        
        addLog(`♪ 再生中: C4 (${volume}dB)`);
        sampler.triggerAttack("C4", undefined, 0.8);
        
        setTimeout(() => {
          sampler.triggerRelease("C4");
          addLog(`🔇 再生終了: C4 (${volume}dB)`);
        }, 1700);
      }
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        🧪 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🎹</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ピアノ音量テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            iPhone音量問題の切り分けテスト
          </p>
          
          {/* 現在の音量表示 */}
          <div className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-6 py-3 rounded-full text-lg font-bold">
            現在の音量: <span className="text-2xl text-red-600">{currentVolume}dB</span>
          </div>
        </div>

        {/* 音量テストボタン群 */}
        <div className="mb-12 space-y-4">
          <h3 className="text-xl font-bold text-gray-800 mb-6">各音量設定でテスト</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {volumeSettings.map((setting) => (
              <button
                key={setting.value}
                onClick={() => playBaseTone(setting.value)}
                className={`group relative overflow-hidden px-6 py-4 rounded-xl text-lg font-bold text-white transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-2xl ${
                  setting.value === currentVolume
                    ? 'bg-gradient-to-r from-red-600 to-pink-600'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold">{setting.value}dB</span>
                  <span className="text-sm opacity-90">{setting.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* テスト手順 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">テスト手順</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>各音量ボタンを押してC4音を再生</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>iPhoneとPCで音量の違いを比較</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>音量が変化する設定を特定</span>
            </div>
          </div>
          
          {/* 技術情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🔧 技術情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Tone.Sampler直接実装（useTonePlayer未使用）</p>
              <p>• Salamander Grand Piano音源</p>
              <p>• velocity: 0.8（プロトタイプ準拠）</p>
              <p>• release: 1.5秒</p>
            </div>
          </div>
        </div>

        {/* デバッグログ表示 */}
        {debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl max-w-2xl mx-auto">
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
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { useAudioEngine, AudioSystemPhase } from '@/hooks/useAudioEngine';

export default function AudioEngineTestPage() {
  const [testLog, setTestLog] = useState<string[]>([]);
  
  // useAudioEngine Hook テスト
  const audioEngine = useAudioEngine({
    mode: 'random',
    enablePitchDetection: true,
    enableHarmonicCorrection: true,
    baseNotes: ['C4', 'D4', 'E4', 'F4', 'G4']
  });
  
  const addLog = (message: string) => {
    console.log(message);
    setTestLog(prev => [...prev.slice(-8), `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const testBaseTone = async (note: string) => {
    try {
      addLog(`🎹 ${note} 再生テスト開始`);
      await audioEngine.playBaseTone(note);
      addLog(`✅ ${note} 再生成功`);
      
      // 1.7秒後に停止（既存モード互換）
      setTimeout(() => {
        audioEngine.stopBaseTone();
        addLog(`🔇 ${note} 再生停止`);
      }, 1700);
      
    } catch (error) {
      addLog(`❌ ${note} 再生エラー: ${error}`);
    }
  };
  
  const testNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">🔧</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            useAudioEngine テスト
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Tone.js + Pitchy + 倍音補正統合テスト
          </p>
          <div className="inline-block bg-gradient-to-r from-blue-100 to-orange-100 text-orange-700 px-6 py-3 rounded-full text-lg font-bold">
            Step 1-1D 完了テスト
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">システム状態</h3>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="font-bold text-gray-700">Phase:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                audioEngine.phase === AudioSystemPhase.IDLE ? 'bg-green-100 text-green-700' :
                audioEngine.phase === AudioSystemPhase.BASE_TONE_PHASE ? 'bg-blue-100 text-blue-700' :
                audioEngine.phase === AudioSystemPhase.SCORING_PHASE ? 'bg-purple-100 text-purple-700' :
                audioEngine.phase === AudioSystemPhase.ERROR_STATE ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {audioEngine.phase}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-700">Playing:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                audioEngine.isPlaying ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {audioEngine.isPlaying ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
          
          {/* Pitchy検出情報表示 */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-bold text-purple-700 mb-2">🎤 Pitchy + 倍音補正検出 (Step 1-1D)</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-bold text-purple-600">元周波数:</span>
                <span className="ml-2 text-gray-800 font-semibold">
                  {audioEngine.currentPitch ? `${audioEngine.currentPitch.toFixed(1)} Hz` : 'なし'}
                </span>
              </div>
              <div>
                <span className="font-bold text-purple-600">補正後:</span>
                <span className="ml-2 text-gray-800 font-semibold">
                  {audioEngine.correctedPitch ? `${audioEngine.correctedPitch.toFixed(1)} Hz` : 'なし'}
                </span>
              </div>
              <div>
                <span className="font-bold text-purple-600">信頼度:</span>
                <span className="ml-2 text-gray-800 font-semibold">
                  {audioEngine.confidence ? `${(audioEngine.confidence * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div>
                <span className="font-bold text-purple-600">補正効果:</span>
                <span className="ml-2 text-gray-800 font-semibold">
                  {audioEngine.currentPitch && audioEngine.correctedPitch 
                    ? `${Math.abs(audioEngine.currentPitch - audioEngine.correctedPitch).toFixed(1)} Hz`
                    : '0 Hz'
                  }
                </span>
              </div>
            </div>
          </div>
          
          {audioEngine.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="font-bold text-red-700">Error:</span>
              <span className="ml-2 text-red-600">{audioEngine.error}</span>
            </div>
          )}
        </div>

        {/* テストボタン */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">音源再生テスト</h3>
          <div className="grid grid-cols-4 gap-3">
            {testNotes.map((note) => (
              <button
                key={note}
                onClick={() => testBaseTone(note)}
                disabled={audioEngine.isPlaying}
                className={`px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                  audioEngine.isPlaying 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:scale-105 shadow-lg'
                }`}
              >
                <Play className="w-4 h-4 mx-auto mb-1" />
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* 停止ボタン */}
        <div className="mb-8">
          <button
            onClick={() => {
              audioEngine.stopBaseTone();
              audioEngine.stopPitchDetection();
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Square className="w-5 h-5 inline mr-2" />
            全停止
          </button>
        </div>

        {/* マイクロフォンテスト */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
          <h3 className="text-xl font-bold text-purple-800 mb-4">🎤 Pitchy音程検出テスト</h3>
          <div className="space-y-4">
            <button
              onClick={audioEngine.startPitchDetection}
              disabled={audioEngine.phase === AudioSystemPhase.SCORING_PHASE}
              className={`w-full px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                audioEngine.phase === AudioSystemPhase.SCORING_PHASE
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 hover:scale-105 shadow-lg'
              }`}
            >
              {audioEngine.phase === AudioSystemPhase.SCORING_PHASE ? '🎤 検出中...' : '🎤 音程検出開始'}
            </button>
            <button
              onClick={audioEngine.stopPitchDetection}
              disabled={audioEngine.phase !== AudioSystemPhase.SCORING_PHASE}
              className={`w-full px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                audioEngine.phase !== AudioSystemPhase.SCORING_PHASE
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105 shadow-lg'
              }`}
            >
              🔇 音程検出停止
            </button>
            <div className="text-sm text-purple-600 bg-purple-100 p-3 rounded-lg">
              <strong>使い方:</strong> 「音程検出開始」ボタンを押した後、マイクに向かって歌うと倍音補正された正確な周波数が表示されます。元周波数と補正後の差で倍音補正効果を確認できます。
            </div>
          </div>
        </div>

        {/* テストログ表示 */}
        {testLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl text-left">
            <h4 className="font-bold text-gray-800 mb-2">📝 テストログ:</h4>
            <div className="space-y-1 text-sm text-gray-600 max-h-48 overflow-y-auto">
              {testLog.map((log, index) => (
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
'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";

// === 型定義 ===
type MicrophoneState = 'checking' | 'granted' | 'denied' | 'prompt' | 'error';

export default function RandomTrainingPage() {
  // === マイク状態管理 ===
  const [micState, setMicState] = useState<MicrophoneState>('checking');
  const [micError, setMicError] = useState<string | null>(null);
  
  // === 基音再生状態 ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  
  // 10種類の基音候補
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
    'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
  };
  
  // === マイク許可チェック関数 ===
  const checkMicrophonePermission = useCallback(async (): Promise<MicrophoneState> => {
    try {
      // Navigator permissions API で状態確認
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return permissionStatus.state as MicrophoneState;
      }
      
      // Fallback: 実際にマイクアクセスを試行
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('マイク許可確認エラー:', errorMessage);
      
      if (errorMessage.includes('Permission denied')) {
        return 'denied';
      } else if (errorMessage.includes('NotFoundError')) {
        return 'error';
      } else {
        return 'prompt';
      }
    }
  }, []);

  // === 初期化: マイク状態検出 ===
  useEffect(() => {
    const initializeMicrophoneState = async () => {
      try {
        const state = await checkMicrophonePermission();
        setMicState(state);
        setMicError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setMicState('error');
        setMicError(errorMessage);
      }
    };

    initializeMicrophoneState();
  }, [checkMicrophonePermission]);

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-4), message]);
  };

  const handleStart = async () => {
    // 再生中は新しい音を開始しない
    if (isPlaying) {
      addLog('⚠️ 既に再生中のため新しい音をスキップ');
      return;
    }
    
    // ランダムな基音を選択
    const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
    setCurrentBaseNote(randomNote);
    
    setIsPlaying(true);
    
    try {
      addLog(`🎲 ランダム基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]}`);
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // 高品質ピアノ音源作成（C4単一音源 + 自動ピッチシフト）
      const sampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5,
        volume: 6 // プロトタイプ準拠の音量設定（iPhone最適化）
      }).toDestination();
      
      // 音源読み込み待機
      addLog('ピアノ音源読み込み中...');
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生（C4から自動ピッチシフト）
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.8); // プロトタイプ準拠のvelocity設定
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
        setIsPlaying(false); // 再生状態をリセット
      }, 1700);
      
    } catch (error) {
      addLog(`❌ ピアノ音再生エラー: ${error}`);
      setIsPlaying(false); // エラー時も再生状態をリセット
    }
  };

  // === レンダリング関数 ===
  const renderMicrophonePermissionRequired = () => (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '16px'
        }}>
          ⚠️ マイクアクセスが必要です
        </div>
        <div style={{
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          このトレーニングには音声入力が必要です。<br />
          推奨: マイクテストページで音声確認後ご利用ください。
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Link 
          href="/microphone-test"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            backgroundColor: '#059669',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        >
          マイクテストページに移動
        </Link>
        
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#ffffff',
            color: '#059669',
            border: '2px solid #059669',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          直接マイク許可を取得
        </button>
      </div>
    </div>
  );

  const renderMicrophoneError = () => (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '16px'
        }}>
          🔇 マイクアクセスに問題があります
        </div>
        <div style={{
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          考えられる原因:<br />
          • マイク許可が取り消された<br />
          • マイクデバイスが利用できない<br />
          • ブラウザの設定変更<br />
          {micError && <><br />エラー詳細: {micError}</>}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <Link 
          href="/microphone-test"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            backgroundColor: '#059669',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'background-color 0.2s',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
        >
          マイクテストページで確認
        </Link>
        
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#ffffff',
            color: '#059669',
            border: '2px solid #059669',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          再度マイク許可を取得
        </button>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '32px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        🔍 マイク状態を確認中...
      </div>
    </div>
  );

  // マイク状態に応じた表示分岐
  if (micState === 'checking') {
    return (
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
        {renderLoadingState()}
      </div>
    );
  }

  if (micState === 'denied' || micState === 'prompt') {
    return (
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
        {renderMicrophonePermissionRequired()}
      </div>
    );
  }

  if (micState === 'error') {
    return (
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
        {renderMicrophoneError()}
      </div>
    );
  }

  // マイク許可済み: メイントレーニング画面
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm">
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center">
        {/* マイク準備完了表示 */}
        <div style={{
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          🎤 マイク準備完了
        </div>

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

        {/* スタートボタン */}
        <div className="mb-12">
          <button
            onClick={handleStart}
            disabled={isPlaying}
            className={`group relative overflow-hidden px-12 py-6 rounded-3xl text-2xl font-bold text-white transition-all duration-300 shadow-lg ${
              isPlaying 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 hover:scale-105 hover:shadow-2xl'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Play className="w-8 h-8" />
              <span>{isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}</span>
            </div>
            
            {/* ホバーエフェクト（再生中は無効） */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
          </button>
        </div>

        {/* 説明 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">使い方</h3>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>ボタンを押してランダムな基音を聞く（10種類からランダム選択）</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>表示された基音を覚えて、ドレミファソラシドを正確に発声</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>繰り返し練習して様々な基音に対応できる相対音感を鍛える</span>
            </div>
          </div>
          
          {/* 基音一覧 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-gray-700 mb-3">🎵 基音候補（10種類）</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              {Object.entries(baseNoteNames).map(([note, name]) => (
                <div key={note} className="flex justify-between">
                  <span className="font-mono">{note}</span>
                  <span>{name}</span>
                </div>
              ))}
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
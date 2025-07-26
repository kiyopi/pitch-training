'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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

  // === ピアノ音源初期化 ===
  const initializeSampler = useCallback(async () => {
    if (sampler) return sampler;

    try {
      addLog('🎵 ピアノ音源初期化開始');
      
      // AudioContext開始
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        addLog('AudioContext開始完了');
      }
      
      // ピアノ音源作成
      const newSampler = new Tone.Sampler({
        urls: {
          "C4": "C4.mp3",
          "D4": "D4.mp3", 
          "E4": "E4.mp3",
          "F4": "F4.mp3",
          "G4": "G4.mp3",
          "A4": "A4.mp3",
          "B4": "B4.mp3",
          "C5": "C5.mp3",
          "D5": "D5.mp3",
          "E5": "E5.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1.5
      }).toDestination();
      
      // 音源読み込み待機
      addLog('音源読み込み中...');
      await Tone.loaded();
      addLog('✅ ピアノ音源初期化完了');
      
      setSampler(newSampler);
      return newSampler;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ピアノ音源初期化エラー: ${errorMessage}`);
      throw error;
    }
  }, [sampler]);

  // === ランダム基音再生ハンドラー ===
  const handleRandomBasePlay = async () => {
    if (isPlaying || isLoading) return;

    try {
      setIsLoading(true);
      setIsPlaying(true);
      
      addLog('🎲 ランダム基音再生開始');
      
      // サンプラー初期化
      const samplerInstance = await initializeSampler();
      
      // ランダム基音選択
      const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      setCurrentBaseNote(randomNote);
      
      addLog(`選択された基音: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]} (${randomNote})`);
      
      // 音声再生（2秒間）
      samplerInstance.triggerAttackRelease(randomNote, "2n");
      addLog('🎵 ピアノ音再生中...');
      
      // 2.5秒後に完了
      setTimeout(() => {
        setIsPlaying(false);
        addLog('✅ ランダム基音再生完了');
      }, 2500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ランダム基音再生エラー: ${errorMessage}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
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
          マイクテストページで音量・周波数を事前確認し、<br />
          ご自身の声の特性を把握してからトレーニングにお進みください。
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
      <div style={{ width: '100%', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-start' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>
                <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                ホーム
              </Link>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main style={{ flex: 1, padding: '32px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
            {renderLoadingState()}
          </div>
        </main>
      </div>
    );
  }

  if (micState === 'denied' || micState === 'prompt') {
    return (
      <div style={{ width: '100%', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-start' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>
                <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                ホーム
              </Link>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main style={{ flex: 1, padding: '32px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
            {renderMicrophonePermissionRequired()}
          </div>
        </main>
      </div>
    );
  }

  if (micState === 'error') {
    return (
      <div style={{ width: '100%', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-start' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>
                <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                ホーム
              </Link>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                ランダム基音トレーニング
              </h1>
            </div>
          </div>
        </header>
        
        <main style={{ flex: 1, padding: '32px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
            {renderMicrophoneError()}
          </div>
        </main>
      </div>
    );
  }

  // マイク許可済み: メイントレーニング画面
  return (
    <div style={{ width: '100%', margin: 0, padding: 0, minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* タイムスタンプ表示 */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        background: 'linear-gradient(to right, #059669, #16a34a)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(4px)'
      }}>
        📱 {new Date().toLocaleTimeString('ja-JP')}
      </div>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'flex-start' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>
              <ArrowLeft style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              ホーム
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
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
          <div style={{ marginBottom: '48px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: '24px' }}>
              <span style={{ fontSize: '96px' }}>🎲</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              ランダム基音トレーニング
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '0' }}>
              10種類の基音からランダムに選択してトレーニング
            </p>
          </div>

          {/* 基音再生セクション - PC/Mobile レスポンシブ対応 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <button 
              onClick={handleRandomBasePlay}
              disabled={isPlaying || isLoading}
              style={{
                width: '100%',
                maxWidth: '320px',
                backgroundColor: isPlaying || isLoading ? '#9ca3af' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '20px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: isPlaying || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px',
                opacity: isPlaying || isLoading ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isPlaying && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#047857';
                }
              }}
              onMouseOut={(e) => {
                if (!isPlaying && !isLoading) {
                  e.currentTarget.style.backgroundColor = '#059669';
                }
              }}
            >
              {isLoading ? '🔄 初期化中...' : isPlaying ? '🎵 再生中...' : '🎲 ランダム基音再生'}
            </button>
            
            {/* 現在の基音表示 */}
            {currentBaseNote && (
              <div style={{
                padding: '12px 24px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                🎵 現在の基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}
              </div>
            )}
          </div>

          {/* ドレミファソラシドガイドセクション - アニメーション表示エリア */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '32px',
            minHeight: '140px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px', textAlign: 'center' }}>
              🎵 ガイドアニメーション
            </h3>
            
            {/* レスポンシブ対応: PC横並び / Mobile縦並び */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? 'repeat(8, 1fr)' : 'repeat(4, 1fr)',
              gap: window.innerWidth > 768 ? '12px' : '8px',
              justifyContent: 'center',
              maxWidth: window.innerWidth > 768 ? '600px' : '300px',
              margin: '0 auto'
            }}>
              {['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'].map((note, index) => (
                <div
                  key={`${note}-${index}`}
                  style={{
                    width: window.innerWidth > 768 ? '56px' : '48px',
                    height: window.innerWidth > 768 ? '56px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: window.innerWidth > 768 ? '16px' : '14px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: '2px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    transform: 'scale(1)',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>

          {/* 音程検出・採点表示エリア - 固定高さ */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', lineHeight: '1.5' }}>
              🎵 音程を検出中...
            </div>
            
            {/* 採点結果表示エリア（非表示状態） */}
            <div style={{ 
              display: 'none', // トレーニング時は非表示
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>
                🎯 採点結果
              </div>
              <div style={{ fontSize: '14px', color: '#166534' }}>
                精度: 95% • 音程: ド → レ
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '24px 0', marginTop: '48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
              <span>Version 3.0</span>
              <span>•</span>
              <span>Powered by Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
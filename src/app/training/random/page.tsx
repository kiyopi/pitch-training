'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';
import { UnifiedAudioProcessor } from '@/utils/audioProcessing';
import styles from './page.module.css';

// === 型定義 ===
type MicrophoneState = 'checking' | 'granted' | 'denied' | 'prompt' | 'error';

interface ScaleResult {
  note: string;
  correct: boolean;
  cents: number;
}

// === メインコンポーネント ===
export default function RandomTrainingPage() {
  // === マイク状態管理 ===
  const [micState, setMicState] = useState<MicrophoneState>('checking');
  const [micError, setMicError] = useState<string | null>(null);

  // === 基音再生状態 ===
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [currentBaseFreq, setCurrentBaseFreq] = useState<number | null>(null);

  // === ガイドシステム状態 ===
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [currentScaleIndex, setCurrentScaleIndex] = useState(0);
  const [scaleResults, setScaleResults] = useState<ScaleResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // === 音程検出状態 ===
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<{
    frequency: number;
    note: string;
    cents: number;
  } | null>(null);

  // === DOM参照 ===
  const scaleGuideRef = useRef<HTMLDivElement | null>(null);
  const relativePitchRef = useRef<HTMLDivElement | null>(null);

  // === 音響処理参照 ===
  const audioProcessorRef = useRef<UnifiedAudioProcessor | null>(null);
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // === 定数 ===
  const scaleNotes = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド4', 'D4': 'レ4', 'E4': 'ミ4', 'F4': 'ファ4', 'G4': 'ソ4',
    'A4': 'ラ4', 'B4': 'シ4', 'C5': 'ド5', 'D5': 'レ5', 'E5': 'ミ5'
  };

  // === Phase 1: マイク状態検出システム ===
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

  // === レンダリング: マイク許可要求画面 ===
  const renderMicrophonePermissionRequired = () => (
    <div style={{ textAlign: 'left', padding: '40px 0', width: '100%', margin: '0' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>
        ⚠️ マイクアクセスが必要です
      </div>
      <div style={{ fontSize: '16px', color: '#4b5563', marginBottom: '24px', lineHeight: '1.6', textAlign: 'center' }}>
        このトレーニングには音声入力が必要です。<br />
        推奨: マイクテストページで音声確認後ご利用ください。
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%', margin: '0 auto' }}>
        <Link href="/microphone-test" style={{ 
          padding: '16px 32px', 
          borderRadius: '8px', 
          fontWeight: '600', 
          textDecoration: 'none', 
          width: '80%', 
          maxWidth: '500px', 
          minWidth: '250px', 
          textAlign: 'center', 
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '2px solid #3b82f6'
        }}>
          マイクテストページに移動
        </Link>
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          style={{ 
            padding: '16px 32px', 
            borderRadius: '8px', 
            fontWeight: '600', 
            textDecoration: 'none', 
            width: '80%', 
            maxWidth: '500px', 
            minWidth: '250px', 
            textAlign: 'center', 
            fontSize: '16px',
            backgroundColor: 'white',
            color: '#3b82f6',
            border: '2px solid #3b82f6',
            cursor: 'pointer'
          }}
        >
          直接マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: マイクエラー回復画面 ===
  const renderMicrophoneErrorRecovery = () => (
    <div style={{ textAlign: 'left', padding: '40px 0', width: '100%', margin: '0' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>
        🔇 マイクアクセスに問題があります
      </div>
      <div style={{ fontSize: '16px', color: '#4b5563', marginBottom: '24px', lineHeight: '1.6', textAlign: 'center' }}>
        考えられる原因:<br />
        • マイク許可が取り消された<br />
        • マイクデバイスが利用できない<br />
        • ブラウザの設定変更<br />
        {micError && <><br />エラー詳細: {micError}</>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%', margin: '0 auto' }}>
        <Link href="/microphone-test" style={{ 
          padding: '16px 32px', 
          borderRadius: '8px', 
          fontWeight: '600', 
          textDecoration: 'none', 
          width: '80%', 
          maxWidth: '500px', 
          minWidth: '250px', 
          textAlign: 'center', 
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '2px solid #3b82f6'
        }}>
          マイクテストページで確認
        </Link>
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          style={{ 
            padding: '16px 32px', 
            borderRadius: '8px', 
            fontWeight: '600', 
            textDecoration: 'none', 
            width: '80%', 
            maxWidth: '500px', 
            minWidth: '250px', 
            textAlign: 'center', 
            fontSize: '16px',
            backgroundColor: 'white',
            color: '#3b82f6',
            border: '2px solid #3b82f6',
            cursor: 'pointer'
          }}
        >
          再度マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: ローディング画面 ===
  const renderLoadingState = () => (
    <div style={{ textAlign: 'left', padding: '40px 0', width: '100%', margin: '0' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px', textAlign: 'center' }}>
        🔍 マイク状態を確認中...
      </div>
    </div>
  );

  // === レンダリング: メイントレーニング画面（Phase 2で実装予定） ===
  const renderTrainingInterface = () => (
    <div>
      {/* マイク準備完了状態表示 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '12px', 
        borderRadius: '8px', 
        textAlign: 'center', 
        fontWeight: '600',
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0'
      }}>
        🎤 マイク準備完了
      </div>

      {/* 基音再生セクション（Phase 2で実装） */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <button 
          disabled={isPlaying}
          onClick={() => {
            // Phase 2で実装予定
            console.log('基音再生機能は Phase 2 で実装予定');
          }}
          style={{
            background: isPlaying ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            boxShadow: isPlaying ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          <Play className="w-5 h-5 mr-2" />
          {isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}
        </button>
        
        {currentBaseNote && (
          <div style={{ marginTop: '16px', fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>
            基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]} ({currentBaseFreq?.toFixed(1)}Hz)
          </div>
        )}
      </div>

      {/* ドレミファソラシドガイドセクション（Phase 2で実装） */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          🎵 ドレミファソラシド ガイド
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={scaleGuideRef} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '12px',
            width: '100%',
            maxWidth: '100%'
          }}>
            {scaleNotes.map((note, index) => (
              <div
                key={note}
                style={{
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  transform: 'scale(1)',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 相対音程表示セクション（Phase 2で実装） */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f3f4f6',
        borderRadius: '10px',
        border: '1px solid #d1d5db'
      }}>
        <div ref={relativePitchRef} style={{
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {currentPitch 
            ? `🎵 現在: ${currentPitch.note} (${currentPitch.cents}セント)`
            : '🎵 音程を検出中...'
          }
        </div>
      </div>

      {/* 結果表示セクション（Phase 2で実装） */}
      {showResults && scaleResults.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f0f9ff',
          borderRadius: '12px',
          border: '2px solid #3b82f6'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            🎉 オクターブ完了！結果
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {scaleResults.map((result, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  color: result.correct ? '#059669' : '#dc2626'
                }}>
                  {result.note}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {Math.round(result.cents)}セント
                </div>
              </div>
            ))}
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#1e40af'
          }}>
            平均誤差: {Math.round(scaleResults.reduce((sum, r) => sum + r.cents, 0) / scaleResults.length)}セント
          </div>
        </div>
      )}
    </div>
  );

  // === メインレンダリング: 状態別分岐 ===
  const renderContent = () => {
    switch (micState) {
      case 'granted':
        return renderTrainingInterface();
      case 'denied':
      case 'prompt':
        return renderMicrophonePermissionRequired();
      case 'error':
        return renderMicrophoneErrorRecovery();
      case 'checking':
        return renderLoadingState();
      default:
        return renderLoadingState();
    }
  };


  return (
    <div 
      style={{ 
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: 0
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ margin: '0', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '24px 0', gap: '24px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', textDecoration: 'none', fontWeight: '500' }}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              ホーム
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ margin: '0', padding: '32px 16px' }}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: '48px' }}>
        <div style={{ margin: '0', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '24px 0',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
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
'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';
import { UnifiedAudioProcessor } from '@/utils/audioProcessing';

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
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      maxWidth: '672px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '12px'
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Link 
          href="/microphone-test"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: 'none',
            padding: '12px 24px',
            width: '100%',
            maxWidth: '448px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
          }}
        >
          マイクテストページに移動
        </Link>
        <button 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: '2px solid #059669',
            backgroundColor: '#ffffff',
            color: '#059669',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '12px 24px',
            width: '100%',
            maxWidth: '448px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
            e.currentTarget.style.color = '#047857';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#059669';
          }}
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
        >
          直接マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: マイクエラー回復画面 ===
  const renderMicrophoneErrorRecovery = () => (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      maxWidth: '672px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#dc2626',
          marginBottom: '12px'
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <Link 
          href="/microphone-test"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: 'none',
            padding: '12px 24px',
            width: '100%',
            maxWidth: '448px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
          }}
        >
          マイクテストページで確認
        </Link>
        <button 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            border: '2px solid #059669',
            backgroundColor: '#ffffff',
            color: '#059669',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            padding: '12px 24px',
            width: '100%',
            maxWidth: '448px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
            e.currentTarget.style.color = '#047857';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#059669';
          }}
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
        >
          再度マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: ローディング画面 ===
  const renderLoadingState = () => (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      maxWidth: '672px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          🔍 マイク状態を確認中...
        </div>
      </div>
    </div>
  );

  // === レンダリング: メイントレーニング画面（Phase 2で実装予定） ===
  const renderTrainingInterface = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* マイク準備完了状態表示 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '672px',
        margin: '0 auto'
      }}>
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: '600',
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0'
        }}>
          🎤 マイク準備完了
        </div>
      </div>

      {/* 基音再生セクション（Phase 2で実装） */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '672px',
        margin: '0 auto'
      }}>
        <div style={{
          padding: '24px 24px 0 24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '0'
          }}>
            🎲 ランダム基音再生
          </div>
        </div>
        <div style={{
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <button 
            disabled={isPlaying}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              background: isPlaying ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: 'none',
              padding: '12px 24px',
              width: '100%',
              maxWidth: '448px',
              opacity: isPlaying ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (!isPlaying) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)';
              }
            }}
            onMouseOut={(e) => {
              if (!isPlaying) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
              }
            }}
            onClick={() => {
              // Phase 2で実装予定
              console.log('基音再生機能は Phase 2 で実装予定');
            }}
          >
            <Play className="w-5 h-5 mr-2" />
            {isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}
          </button>
          
          {currentBaseNote && (
            <div style={{
              marginTop: '16px',
              fontSize: '16px',
              color: '#1f2937',
              fontWeight: '600'
            }}>
              基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]} ({currentBaseFreq?.toFixed(1)}Hz)
            </div>
          )}
        </div>
      </div>

      {/* ドレミファソラシドガイドセクション（Phase 2で実装） */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '896px',
        margin: '0 auto'
      }}>
        <div style={{
          padding: '24px 24px 0 24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '0'
          }}>
            🎵 ドレミファソラシド ガイド
          </div>
        </div>
        <div style={{
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div 
              ref={scaleGuideRef} 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '100%'
              }}
            >
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
                    transform: 'scale(1.0)',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 相対音程表示セクション（Phase 2で実装） */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        maxWidth: '672px',
        margin: '0 auto'
      }}>
        <div 
          ref={relativePitchRef} 
          style={{
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: '1.5',
            color: '#1f2937'
          }}
        >
          {currentPitch 
            ? `🎵 現在: ${currentPitch.note} (${currentPitch.cents}セント)`
            : '🎵 音程を検出中...'
          }
        </div>
      </div>

      {/* 結果表示セクション（Phase 2で実装） */}
      {showResults && scaleResults.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          maxWidth: '896px',
          margin: '0 auto'
        }}>
          <div style={{
            padding: '24px 24px 0 24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#15803d',
              marginBottom: '0'
            }}>
              🎉 オクターブ完了！結果
            </div>
          </div>
          <div style={{
            padding: '24px'
          }}>
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
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: result.correct ? '#16a34a' : '#dc2626'
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
              color: '#166534'
            }}>
              平均誤差: {Math.round(scaleResults.reduce((sum, r) => sum + r.cents, 0) / scaleResults.length)}セント
            </div>
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
    <div className="w-full m-0 p-0 min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6 justify-start">
            <Link href="/" className="flex items-center text-gray-600 no-underline transition-colors duration-300 font-medium hover:text-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              ホーム
            </Link>
            <h1 className="text-xl font-bold text-gray-900 m-0">
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-gray-600 text-center">
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
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
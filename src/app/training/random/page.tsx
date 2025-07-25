'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import * as Tone from "tone";
import { PitchDetector } from 'pitchy';
import { UnifiedAudioProcessor } from '@/utils/audioProcessing';
import styles from './page.module.css';
import { cn } from '@/lib/utils';  // shadcn/ui ユーティリティ

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
    <div className="bg-card text-card-foreground rounded-xl border py-8 px-6 shadow-sm">
      <div className="text-center">
        <div className="text-xl font-bold text-destructive mb-4">
          ⚠️ マイクアクセスが必要です
        </div>
        <div className="text-muted-foreground mb-6 leading-relaxed">
          このトレーニングには音声入力が必要です。<br />
          推奨: マイクテストページで音声確認後ご利用ください。
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/microphone-test" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8">
            マイクテストページに移動
          </Link>
          <button 
            onClick={async () => {
              const state = await checkMicrophonePermission();
              setMicState(state);
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
          >
            直接マイク許可を取得
          </button>
        </div>
      </div>
    </div>
  );

  // === レンダリング: マイクエラー回復画面 ===
  const renderMicrophoneErrorRecovery = () => (
    <div className="bg-card text-card-foreground rounded-xl border py-8 px-6 shadow-sm">
      <div className="text-center">
        <div className="text-xl font-bold text-destructive mb-4">
          🔇 マイクアクセスに問題があります
        </div>
        <div className="text-muted-foreground mb-6 leading-relaxed">
          考えられる原因:<br />
          • マイク許可が取り消された<br />
          • マイクデバイスが利用できない<br />
          • ブラウザの設定変更<br />
          {micError && <><br />エラー詳細: {micError}</>}
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/microphone-test" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8">
            マイクテストページで確認
          </Link>
          <button 
            onClick={async () => {
              const state = await checkMicrophonePermission();
              setMicState(state);
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
          >
            再度マイク許可を取得
          </button>
        </div>
      </div>
    </div>
  );

  // === レンダリング: ローディング画面 ===
  const renderLoadingState = () => (
    <div className="bg-card text-card-foreground rounded-xl border py-8 px-6 shadow-sm">
      <div className="text-center">
        <div className="text-xl font-bold text-primary">
          🔍 マイク状態を確認中...
        </div>
      </div>
    </div>
  );

  // === レンダリング: メイントレーニング画面（Phase 2で実装予定） ===
  const renderTrainingInterface = () => (
    <div>
      {/* マイク準備完了状態表示 - shadcn/ui テーマ */}
      <div className="mb-5 p-3 rounded-lg text-center font-semibold bg-green-50 text-green-900 border border-green-200">
        🎤 マイク準備完了
      </div>

      {/* 基音再生セクション（Phase 2で実装） - shadcn/ui テーマ */}
      <div className="mb-8 text-center">
        <button 
          disabled={isPlaying}
          onClick={() => {
            // Phase 2で実装予定
            console.log('基音再生機能は Phase 2 で実装予定');
          }}
          className={cn(
            "inline-flex items-center justify-center rounded-xl text-lg font-bold transition-all",
            "shadow-md hover:shadow-lg px-8 py-4",
            isPlaying 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
          )}
        >
          <Play className="w-5 h-5 mr-2" />
          {isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}
        </button>
        
        {currentBaseNote && (
          <div className="mt-4 text-foreground font-semibold">
            基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]} ({currentBaseFreq?.toFixed(1)}Hz)
          </div>
        )}
      </div>

      {/* ドレミファソラシドガイドセクション（Phase 2で実装） - shadcn/ui テーマ */}
      <div className="mt-8 p-6 bg-muted rounded-xl border">
        <div className="text-center font-bold mb-4">
          🎵 ドレミファソラシド ガイド
        </div>
        <div className="flex justify-center">
          <div ref={scaleGuideRef} className="grid grid-cols-8 gap-3 w-full max-w-full">
            {scaleNotes.map((note, index) => (
              <div
                key={note}
                className="w-14 h-14 flex items-center justify-center text-lg font-bold rounded-lg border-2 border-border bg-background text-muted-foreground transform scale-100 shadow-none transition-all duration-300 ease-in-out"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 相対音程表示セクション（Phase 2で実装） - shadcn/ui テーマ */}
      <div className="mt-6 p-5 bg-muted rounded-lg border">
        <div ref={relativePitchRef} className="font-semibold text-center leading-relaxed">
          {currentPitch 
            ? `🎵 現在: ${currentPitch.note} (${currentPitch.cents}セント)`
            : '🎵 音程を検出中...'
          }
        </div>
      </div>

      {/* 結果表示セクション（Phase 2で実装） - shadcn/ui テーマ */}
      {showResults && scaleResults.length > 0 && (
        <div className="mt-6 p-5 bg-blue-50 rounded-xl border-2 border-primary">
          <div className="text-lg font-bold text-primary mb-4 text-center">
            🎉 オクターブ完了！結果
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {scaleResults.map((result, index) => (
              <div key={index} className="text-center p-2 bg-background rounded-md border">
                <div className={cn(
                  "text-sm font-bold mb-1",
                  result.correct ? "text-green-600" : "text-destructive"
                )}>
                  {result.note}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(result.cents)}セント
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-primary">
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - shadcn/ui テーマ */}
      <header className="border-b">
        <div className="px-4">
          <div className="flex items-center justify-start py-6 gap-6">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors font-medium">
              <ArrowLeft className="w-5 h-5 mr-2" />
              ホーム
            </Link>
            <h1 className="text-xl font-bold">
              ランダム基音トレーニング
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content - shadcn/ui テーマ */}
      <main className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Footer - shadcn/ui テーマ */}
      <footer className="border-t mt-12">
        <div className="px-4">
          <div className="flex flex-col items-center justify-between py-6 gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
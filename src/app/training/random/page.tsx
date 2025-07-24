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
    <div className={styles.micPermissionSection}>
      <div className={styles.micPermissionTitle}>
        ⚠️ マイクアクセスが必要です
      </div>
      <div className={styles.micPermissionDescription}>
        このトレーニングには音声入力が必要です。<br />
        推奨: マイクテストページで音声確認後ご利用ください。
      </div>
      <div className={styles.micPermissionButtons}>
        <Link href="/microphone-test" className={`${styles.micPermissionButton} ${styles.primary}`}>
          マイクテストページに移動
        </Link>
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          className={`${styles.micPermissionButton} ${styles.secondary}`}
        >
          直接マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: マイクエラー回復画面 ===
  const renderMicrophoneErrorRecovery = () => (
    <div className={styles.micPermissionSection}>
      <div className={styles.micPermissionTitle}>
        🔇 マイクアクセスに問題があります
      </div>
      <div className={styles.micPermissionDescription}>
        考えられる原因:<br />
        • マイク許可が取り消された<br />
        • マイクデバイスが利用できない<br />
        • ブラウザの設定変更<br />
        {micError && <><br />エラー詳細: {micError}</>}
      </div>
      <div className={styles.micPermissionButtons}>
        <Link href="/microphone-test" className={`${styles.micPermissionButton} ${styles.primary}`}>
          マイクテストページで確認
        </Link>
        <button 
          onClick={async () => {
            const state = await checkMicrophonePermission();
            setMicState(state);
          }}
          className={`${styles.micPermissionButton} ${styles.secondary}`}
        >
          再度マイク許可を取得
        </button>
      </div>
    </div>
  );

  // === レンダリング: ローディング画面 ===
  const renderLoadingState = () => (
    <div className={styles.micPermissionSection}>
      <div className={styles.micPermissionTitle}>
        🔍 マイク状態を確認中...
      </div>
    </div>
  );

  // === レンダリング: メイントレーニング画面（Phase 2で実装予定） ===
  const renderTrainingInterface = () => (
    <div>
      {/* マイク準備完了状態表示 */}
      <div className={`${styles.microphoneStatus} ${styles.granted}`}>
        🎤 マイク準備完了
      </div>

      {/* 基音再生セクション（Phase 2で実装） */}
      <div className={styles.baseToneSection}>
        <button 
          className={styles.baseToneButton}
          disabled={isPlaying}
          onClick={() => {
            // Phase 2で実装予定
            console.log('基音再生機能は Phase 2 で実装予定');
          }}
        >
          <Play className="w-5 h-5 mr-2" />
          {isPlaying ? '🎹 再生中...' : '🎲 ランダム基音再生'}
        </button>
        
        {currentBaseNote && (
          <div className={styles.baseToneInfo}>
            基音: {baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]} ({currentBaseFreq?.toFixed(1)}Hz)
          </div>
        )}
      </div>

      {/* ドレミファソラシドガイドセクション（Phase 2で実装） */}
      <div className={styles.scaleGuideSection}>
        <div className={styles.scaleGuideTitle}>
          🎵 ドレミファソラシド ガイド
        </div>
        <div className={styles.scaleGuideContainer}>
          <div ref={scaleGuideRef} className={styles.scaleGuideGrid}>
            {scaleNotes.map((note, index) => (
              <div
                key={note}
                className={styles.scaleNoteItem}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 相対音程表示セクション（Phase 2で実装） */}
      <div className={styles.relativePitchSection}>
        <div ref={relativePitchRef} className={styles.relativePitchDisplay}>
          {currentPitch 
            ? `🎵 現在: ${currentPitch.note} (${currentPitch.cents}セント)`
            : '🎵 音程を検出中...'
          }
        </div>
      </div>

      {/* 結果表示セクション（Phase 2で実装） */}
      {showResults && scaleResults.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsTitle}>
            🎉 オクターブ完了！結果
          </div>
          <div className={styles.resultsGrid}>
            {scaleResults.map((result, index) => (
              <div key={index} className={styles.resultItem}>
                <div className={`${styles.resultNote} ${result.correct ? styles.correct : styles.incorrect}`}>
                  {result.note}
                </div>
                <div className={styles.resultCents}>
                  {Math.round(result.cents)}セント
                </div>
              </div>
            ))}
          </div>
          <div className={styles.resultsAverage}>
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
    <div className={styles.mainContainer}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.homeLink}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            ホーム
          </Link>
          <h1 className={styles.pageTitle}>
            ランダム基音トレーニング
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.pageMain}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className={styles.pageFooter}>
        <div className={styles.footerContent}>
          <div className={styles.copyright}>
            © 2024 相対音感トレーニング. All rights reserved.
          </div>
          <div className={styles.version}>
            <span>Version 3.0</span>
            <span>•</span>
            <span>Powered by Next.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
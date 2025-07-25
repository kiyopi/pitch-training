'use client';

import { useState, useRef } from "react";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square } from "lucide-react";
import * as Tone from "tone";

export default function ContinousChallengePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentBaseNote, setCurrentBaseNote] = useState<string>('');
  const [playCount, setPlayCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  
  // 10種類の基音候補（ランダム基音モードと同じ）
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
  const baseNoteNames = {
    'C4': 'ド（低）', 'D4': 'レ（低）', 'E4': 'ミ（低）', 'F4': 'ファ（低）', 'G4': 'ソ（低）',
    'A4': 'ラ（中）', 'B4': 'シ（中）', 'C5': 'ド（高）', 'D5': 'レ（高）', 'E5': 'ミ（高）'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-5), message]);
  };

  const playRandomNote = async () => {
    try {
      // ランダムな基音を選択
      const randomNote = baseNotes[Math.floor(Math.random() * baseNotes.length)];
      setCurrentBaseNote(randomNote);
      setPlayCount(prev => prev + 1);
      
      addLog(`🎲 ${playCount + 1}回目: ${baseNoteNames[randomNote as keyof typeof baseNoteNames]}`);
      
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
      await Tone.loaded();
      
      // ランダム選択された基音を1.7秒間再生
      addLog(`♪ 再生中: ${randomNote}`);
      sampler.triggerAttack(randomNote, undefined, 0.8); // プロトタイプ準拠のvelocity設定
      
      // 1.7秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(randomNote);
        addLog(`🔇 再生終了: ${randomNote}`);
      }, 1700);
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
    }
  };

  const continuousPlay = async () => {
    if (!isPlayingRef.current) return;
    
    await playRandomNote();
    
    // 2.7秒後に次の音を再生（1.7秒再生 + 1秒間隔）
    setTimeout(() => {
      if (isPlayingRef.current) {
        addLog('⏰ 次の音を準備中...');
        continuousPlay();
      }
    }, 2700);
  };

  const handleStart = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    isPlayingRef.current = true;
    setPlayCount(0);
    addLog('🚀 連続チャレンジ開始');
    
    // 連続再生開始
    continuousPlay();
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    addLog(`⏹️ 停止 (${playCount}回再生)`);
  };

  // コンポーネントのクリーンアップ
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* ヘッダー */}
        <header style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease-in-out'
              }}>
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                戻る
              </Link>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: 0
              }}>連続チャレンジモード</h1>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Version 3.0 - Updated: {new Date().toLocaleString('ja-JP')}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main style={{ padding: '32px 0' }}>
          {/* メインエリア */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '48px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔄</div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 16px 0'
              }}>連続チャレンジモード</h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}>
                ランダム基音が連続再生・相対音感の持続的トレーニング
              </p>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#e9d5ff',
                color: '#7c3aed',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                音源テスト版
              </div>
            </div>
          
            {/* 現在の基音表示 */}
            {currentBaseNote && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f5f3ff',
                border: '1px solid #c4b5fd',
                borderRadius: '12px'
              }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#6b21a8',
                  margin: '0 0 4px 0'
                }}>
                  🎵 第{playCount}回: <span style={{ fontSize: '24px' }}>{baseNoteNames[currentBaseNote as keyof typeof baseNoteNames]}</span>
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#7c3aed',
                  margin: 0
                }}>
                  この基音でドレミファソラシドを歌ってください
                </p>
              </div>
            )}
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleStart}
              disabled={isPlaying}
              style={{
                backgroundColor: isPlaying ? '#9ca3af' : '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Play style={{ width: '16px', height: '16px' }} />
              <span>🚀 開始</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              style={{
                backgroundColor: !isPlaying ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: !isPlaying ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.2s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Square style={{ width: '16px', height: '16px' }} />
              <span>⏹️ 停止</span>
            </button>
          </div>

          {/* 使い方説明 */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '48px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 8px 0'
              }}>音源テスト内容</h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.5',
                margin: 0
              }}>
                連続チャレンジシステムの動作確認
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {[
                { step: 1, title: "基音再生", desc: "ランダム基音を1.7秒再生" },
                { step: 2, title: "間隔制御", desc: "1秒間隔を空ける" },
                { step: 3, title: "連続実行", desc: "次のランダム基音を再生（継続）" }
              ].map((item) => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1a1a1a'
                  }}>
                    {item.step}
                  </div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: '0 0 8px 0'
                  }}>{item.title}</h4>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    lineHeight: '1.4',
                    margin: 0
                  }}>{item.desc}</p>
                </div>
              ))}
            </div>
            
            {/* テスト項目 */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f5f3ff',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#7c3aed',
                margin: '0 0 12px 0'
              }}>🧪 テスト検証項目</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '8px',
                fontSize: '14px',
                color: '#7c3aed'
              }}>
                <div>✓ 連続ランダム選択の動作確認</div>
                <div>✓ iPhone Safari での継続動作</div>
                <div>✓ メモリリーク・パフォーマンス確認</div>
                <div>✓ 停止・再開制御の確実性</div>
                <div>✓ タイミング制御の精度</div>
              </div>
            </div>
          </div>

          {/* デバッグログ表示 */}
          {debugLog.length > 0 && (
            <div style={{
              marginBottom: '32px',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>📝 動作ログ:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {debugLog.map((log, index) => (
                  <div key={index} style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>{log}</div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* フッター */}
        <footer style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '48px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <span>Version 3.0</span>
              <span>•</span>
              <span>Powered by Next.js</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
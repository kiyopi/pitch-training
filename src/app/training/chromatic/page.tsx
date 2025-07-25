'use client';

import { useState, useRef } from "react";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, ArrowUp, ArrowDown } from "lucide-react";
import * as Tone from "tone";

export default function ChromaticScalePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'ascending' | 'descending'>('ascending');
  const isPlayingRef = useRef(false);
  
  // 12音階 + オクターブ（13音）
  const chromaticScale = [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 
    'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
  ];
  
  const chromaticNoteNames = {
    'C4': 'ド', 'C#4': 'ド♯', 'D4': 'レ', 'D#4': 'レ♯', 'E4': 'ミ', 'F4': 'ファ',
    'F#4': 'ファ♯', 'G4': 'ソ', 'G#4': 'ソ♯', 'A4': 'ラ', 'A#4': 'ラ♯', 'B4': 'シ', 'C5': 'ド（高）'
  };
  
  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-6), message]);
  };

  const playNote = async (note: string, sequenceIndex: number) => {
    try {
      setCurrentNote(note);
      setCurrentIndex(sequenceIndex);
      
      addLog(`🎵 ${sequenceIndex + 1}/13: ${chromaticNoteNames[note as keyof typeof chromaticNoteNames]} (${note}) [${direction}]`);
      
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
      
      // 選択された音を0.8秒間再生
      sampler.triggerAttack(note, undefined, 0.8); // プロトタイプ準拠のvelocity設定
      
      // 0.8秒後に手動でリリース
      setTimeout(() => {
        sampler.triggerRelease(note);
        addLog(`🔇 再生終了: ${note}`);
      }, 800);
      
    } catch (error) {
      addLog(`❌ エラー: ${error}`);
    }
  };

  const playSequence = async (sequenceDirection: 'ascending' | 'descending') => {
    if (!isPlayingRef.current) return;
    
    const sequence = sequenceDirection === 'ascending' ? chromaticScale : [...chromaticScale].reverse();
    
    for (let i = 0; i < sequence.length; i++) {
      if (!isPlayingRef.current) break;
      
      // 現在の方向を確実に設定
      setDirection(sequenceDirection);
      
      await playNote(sequence[i], i);
      
      // 最後の音でない場合は1秒間隔
      if (i < sequence.length - 1 && isPlayingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (isPlayingRef.current) {
      addLog(`✅ ${sequenceDirection === 'ascending' ? '上行' : '下行'}完了`);
      handleStop(); // 完了時に確実に状態リセット
    }
  };

  const handleStart = async (selectedDirection: 'ascending' | 'descending') => {
    if (isPlaying) return;
    
    // 状態を確実にリセット
    setIsPlaying(true);
    isPlayingRef.current = true;
    setDirection(selectedDirection);
    setCurrentIndex(0);
    setCurrentNote('');
    addLog(`🚀 ${selectedDirection === 'ascending' ? '上行' : '下行'}開始`);
    
    // シーケンス再生開始（方向を明示的に渡す）
    playSequence(selectedDirection);
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    // 完了時に状態をクリア
    setCurrentNote('');
    setCurrentIndex(0);
    addLog(`⏹️ 停止 (${currentIndex + 1}/13で停止)`);
  };

  // コンポーネントのクリーンアップ
  React.useEffect(() => {
    return () => {
      isPlayingRef.current = false;
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
              }}>12音階モード</h1>
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
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎼</div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                margin: '0 0 16px 0'
              }}>12音階モード</h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}>
                クロマチックスケール上行・下行で完全制覇
              </p>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#fed7aa',
                color: '#ea580c',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                音源テスト版
              </div>
            </div>
          
            {/* 現在の音表示 */}
            {currentNote && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: '12px'
              }}>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#c2410c',
                  margin: '0 0 4px 0'
                }}>
                  🎵 {currentIndex + 1}/13: <span style={{ fontSize: '24px' }}>{chromaticNoteNames[currentNote as keyof typeof chromaticNoteNames]}</span>
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#ea580c',
                  margin: 0
                }}>
                  {direction === 'ascending' ? '上行' : '下行'}: {currentNote}
                </p>
              </div>
            )}
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handleStart('ascending')}
              disabled={isPlaying}
              style={{
                backgroundColor: isPlaying ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
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
              <ArrowUp style={{ width: '16px', height: '16px' }} />
              <span>⬆️ 上行</span>
            </button>
            
            <button
              onClick={() => handleStart('descending')}
              disabled={isPlaying}
              style={{
                backgroundColor: isPlaying ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
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
              <ArrowDown style={{ width: '16px', height: '16px' }} />
              <span>⬇️ 下行</span>
            </button>
            
            <button
              onClick={handleStop}
              disabled={!isPlaying}
              style={{
                backgroundColor: !isPlaying ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
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
                クロマチックスケールの完全テスト
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              {[
                { step: 1, title: "13音連続再生", desc: "クロマチックスケールを連続再生" },
                { step: 2, title: "タイミング制御", desc: "各音0.8秒再生 + 1秒間隔" },
                { step: 3, title: "両方向テスト", desc: "上行・下行の両方向をテスト" }
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
            
            {/* クロマチックスケール表示 */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fff7ed',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ea580c',
                margin: '0 0 12px 0'
              }}>🎼 クロマチックスケール（13音）</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                fontSize: '14px',
                color: '#ea580c'
              }}>
                {chromaticScale.map((note) => (
                  <div key={note} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: currentNote === note ? '#fed7aa' : 'transparent',
                    fontWeight: currentNote === note ? 'bold' : 'normal'
                  }}>
                    <span style={{ fontFamily: 'monospace' }}>{note}</span>
                    <span>{chromaticNoteNames[note as keyof typeof chromaticNoteNames]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* テスト項目 */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fff7ed',
              borderRadius: '12px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ea580c',
                margin: '0 0 12px 0'
              }}>🧪 テスト検証項目</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '8px',
                fontSize: '14px',
                color: '#ea580c'
              }}>
                <div>✓ 13音連続再生の完走確認</div>
                <div>✓ ピッチシフト精度の聴感確認</div>
                <div>✓ iPhone Safari での動作確認</div>
                <div>✓ 上行・下行両方向の動作確認</div>
                <div>✓ 停止制御の確実性</div>
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
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music } from 'lucide-react';
// shadcn/ui コンポーネントをインラインスタイルで実装するため削除

// 型定義
type TrainingPhase = 'ready' | 'playing' | 'listening' | 'completed';
type ScaleResult = { 
  scale: string; 
  correct: boolean; 
  frequency: number;
};

export default function RandomTrainingPage() {
  // 状態管理
  const [phase, setPhase] = useState<TrainingPhase>('ready');
  const [results, setResults] = useState<ScaleResult[]>([]);

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
              }}>ランダム基音トレーニング</h1>
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
          marginBottom: '48px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              margin: '0 0 8px 0'
            }}>トレーニング開始</h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: 0
            }}>
              基音を聞いて、ドレミファソラシドを正確に発声してください
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <p style={{
                color: '#6b7280',
                fontWeight: '400',
                fontSize: '16px',
                margin: 0
              }}>
                🎵 準備ができたらスタートボタンを押してください
              </p>
            </div>
            
            <button style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.2s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}>
              <span style={{ fontSize: '16px' }}>→</span>
              <span>トレーニング開始</span>
            </button>
          </div>
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
            }}>使い方</h3>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: 0
            }}>
              3つのステップで相対音感を効果的にトレーニング
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {[
              { step: 1, title: "基音を聞く", desc: "ランダムに選択された基音を確認" },
              { step: 2, title: "発声する", desc: "ドレミファソラシドを順番に歌う" },
              { step: 3, title: "結果確認", desc: "音程の正確性をチェック" }
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
        </div>

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
        </main>
      </div>
    </div>
  );
}
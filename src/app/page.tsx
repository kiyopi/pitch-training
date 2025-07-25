'use client';

import Link from "next/link";
import { Music, ArrowRight, Mic, Piano, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrowserCompatibilityCheck } from "@/components/BrowserCompatibilityCheck";

export default function HomePage() {
  return (
    <BrowserCompatibilityCheck
      minRequirements={{
        webAudio: true,
        mediaDevices: true,
        localStorage: false
      }}
    >
      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header */}
        <header style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>相対音感トレーニング</h1>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Version 3.0 - Updated: {new Date().toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '48px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              音程の相対的な関係を効果的に鍛える
            </h2>
            <p style={{ fontSize: '18px', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              高精度音程検出とピアノ音源による本格的な相対音感トレーニング
            </p>
          </div>

          {/* Training Modes */}
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '48px' }}>
            {/* Random Mode */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s ease-in-out'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#d1fae5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Music style={{ width: '24px', height: '24px', color: '#059669' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0' }}>ランダム基音モード</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
                  10種類の基音からランダムに選択してトレーニング
                </p>
              </div>
              <Link href="/microphone-test?mode=random" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease-in-out'
                }}>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                  トレーニング開始
                </button>
              </Link>
            </div>

            {/* Continuous Mode */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              opacity: '0.6'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#fed7aa', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Target style={{ width: '24px', height: '24px', color: '#ea580c' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0' }}>連続チャレンジモード</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
                  選択した回数だけ連続で実行し、総合評価を確認
                </p>
              </div>
              <button disabled style={{
                width: '100%',
                backgroundColor: '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'not-allowed'
              }}>
                準備中
              </button>
            </div>

            {/* Chromatic Mode */}
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              opacity: '0.6'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e9d5ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Piano style={{ width: '24px', height: '24px', color: '#9333ea' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 8px 0' }}>12音階モード</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>
                  クロマチックスケールの上行・下行で完全制覇
                </p>
              </div>
              <button disabled style={{
                width: '100%',
                backgroundColor: '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'not-allowed'
              }}>
                準備中
              </button>
            </div>
          </div>

          {/* Features */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '48px'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', margin: '0 0 32px 0' }}>アプリの特徴</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#dbeafe', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Zap style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>高精度音程検出</h4>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4', margin: 0 }}>
                  Pitchy (McLeod Method) による±5セントの精度
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e9d5ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Piano style={{ width: '24px', height: '24px', color: '#9333ea' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>本格ピアノ音源</h4>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4', margin: 0 }}>
                  Salamander Grand Piano の高品質サンプル
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#fef3c7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Mic style={{ width: '24px', height: '24px', color: '#d97706' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>倍音補正システム</h4>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4', margin: 0 }}>
                  人間音声の倍音を自動補正し95%以上の精度
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  backgroundColor: '#dcfce7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <Target style={{ width: '24px', height: '24px', color: '#16a34a' }} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>モバイル対応</h4>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4', margin: 0 }}>
                  iPhone Safari 完全対応のレスポンシブUI
                </p>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '32px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', margin: '0 0 32px 0' }}>使い方</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              {[
                { step: 1, title: "モード選択", desc: "レベルに応じてトレーニングモードを選択" },
                { step: 2, title: "マイク許可", desc: "ブラウザでマイクアクセスを許可" },
                { step: 3, title: "基音を聞く", desc: "高品質ピアノ音源で基音を確認" },
                { step: 4, title: "発声・判定", desc: "ドレミファソラシドを発声して判定" }
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
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>{item.title}</h4>
                  <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #e5e7eb', marginTop: '48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
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
    </BrowserCompatibilityCheck>
  );
}
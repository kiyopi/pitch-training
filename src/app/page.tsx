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
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              音程の相対的な関係を効果的に鍛える
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              高精度音程検出とピアノ音源による本格的な相対音感トレーニング
            </p>
          </div>

          {/* Training Modes */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {/* Random Mode */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>ランダム基音モード</CardTitle>
                <CardDescription>
                  10種類の基音からランダムに選択してトレーニング
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/microphone-test?mode=random">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    トレーニング開始
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Continuous Mode */}
            <Card className="opacity-75">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>連続チャレンジモード</CardTitle>
                <CardDescription>
                  選択した回数だけ連続で実行し、総合評価を確認
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled className="w-full">
                  準備中
                </Button>
              </CardContent>
            </Card>

            {/* Chromatic Mode */}
            <Card className="opacity-75">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Piano className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>12音階モード</CardTitle>
                <CardDescription>
                  クロマチックスケールの上行・下行で完全制覇
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled className="w-full">
                  準備中
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <Card className="mb-12">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">アプリの特徴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-sm">高精度音程検出</h3>
                  <p className="text-xs text-muted-foreground">
                    Pitchy (McLeod Method) による±5セントの精度
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                    <Piano className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-sm">本格ピアノ音源</h3>
                  <p className="text-xs text-muted-foreground">
                    Salamander Grand Piano の高品質サンプル
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                    <Mic className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-sm">倍音補正システム</h3>
                  <p className="text-xs text-muted-foreground">
                    人間音声の倍音を自動補正し95%以上の精度
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm">モバイル対応</h3>
                  <p className="text-xs text-muted-foreground">
                    iPhone Safari 完全対応のレスポンシブUI
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Use */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">使い方</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: 1, title: "モード選択", desc: "レベルに応じてトレーニングモードを選択" },
                  { step: 2, title: "マイク許可", desc: "ブラウザでマイクアクセスを許可" },
                  { step: 3, title: "基音を聞く", desc: "高品質ピアノ音源で基音を確認" },
                  { step: 4, title: "発声・判定", desc: "ドレミファソラシドを発声して判定" }
                ].map((item) => (
                  <div key={item.step} className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-lg font-bold text-primary">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
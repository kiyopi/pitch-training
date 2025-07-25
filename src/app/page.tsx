'use client';

/**
 * ホームページ
 * デザインシステム: shadcn/ui (https://ui.shadcn.com)
 * カラーテーマ: globals.css の CSS変数を使用
 * コンポーネント: Card, Button等のshadcn/uiコンポーネントを使用
 */

import Link from "next/link";
import { Music, ArrowRight, Mic, Piano, Zap, Target } from "lucide-react";
// shadcn/ui コンポーネント
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
      {/* shadcn/ui テーマベースのレイアウト */}
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-2">
                <Music className="w-8 h-8" />
                <h1 className="text-2xl font-bold">相対音感トレーニング</h1>
              </div>
              <div className="text-sm text-muted-foreground">
                Version 3.0 - Updated: {new Date().toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12 pt-12">
            <h2 className="text-4xl font-bold mb-4">
              音程の相対的な関係を効果的に鍛える
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              高精度音程検出とピアノ音源による本格的な相対音感トレーニング
            </p>
          </div>

          {/* Training Modes - shadcn/ui Card コンポーネント使用 */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
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
                <Link href="/microphone-test?mode=random" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    トレーニング開始
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Continuous Mode */}
            <Card className="opacity-60">
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
                <Button className="w-full" disabled>
                  準備中
                </Button>
              </CardContent>
            </Card>

            {/* Chromatic Mode */}
            <Card className="opacity-60">
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
                <Button className="w-full" disabled>
                  準備中
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features - shadcn/ui Card ベース */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-center">アプリの特徴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">高精度音程検出</h4>
                  <p className="text-xs text-muted-foreground">
                    Pitchy (McLeod Method) による±5セントの精度
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Piano className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">本格ピアノ音源</h4>
                  <p className="text-xs text-muted-foreground">
                    Salamander Grand Piano の高品質サンプル
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-6 h-6 text-amber-600" />
                  </div>
                  <h4 className="font-semibold mb-2">倍音補正システム</h4>
                  <p className="text-xs text-muted-foreground">
                    人間音声の倍音を自動補正し95%以上の精度
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">モバイル対応</h4>
                  <p className="text-xs text-muted-foreground">
                    iPhone Safari 完全対応のレスポンシブUI
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Use - shadcn/ui Card ベース */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">使い方</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: 1, title: "モード選択", desc: "レベルに応じてトレーニングモードを選択" },
                  { step: 2, title: "マイク許可", desc: "ブラウザでマイクアクセスを許可" },
                  { step: 3, title: "基音を聞く", desc: "高品質ピアノ音源で基音を確認" },
                  { step: 4, title: "発声・判定", desc: "ドレミファソラシドを発声して判定" }
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold mb-2">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Footer - shadcn/ui テーマベース */}
        <footer className="border-t mt-12">
          <div className="max-w-6xl mx-auto px-4">
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
    </BrowserCompatibilityCheck>
  );
}
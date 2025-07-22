'use client';

import Link from "next/link";
import { Music, RotateCcw, Target, Sparkles, Zap, Mic, Piano } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrowserCompatibilityCheck } from "@/components/BrowserCompatibilityCheck";

export default function Home() {
  return (
    <BrowserCompatibilityCheck
      minRequirements={{
        webAudio: true,
        mediaDevices: true,
        localStorage: false
      }}
    >
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-30"></div>
              <Sparkles className="w-16 h-16 text-purple-600 relative" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900">
            相対音感トレーニング
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            音程の相対的な関係を聞き分ける能力を効果的に鍛える
            <br />
            <span className="text-sm text-neutral-500">
              Powered by Pitchy (McLeod Pitch Method) × Salamander Grand Piano
            </span>
          </p>
        </div>

        {/* トレーニングモード選択 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* ランダム基音モード */}
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-neutral-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Music className="w-7 h-7 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">ランダム基音モード</CardTitle>
              <CardDescription>
                10種類の基音からランダムに選択してトレーニング
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  初心者向け
                </span>
                <span className="text-neutral-400">•</span>
                <span>基本モード</span>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/random-training">
                  トレーニング開始
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 連続チャレンジモード */}
          <Card className="relative overflow-hidden group opacity-75 border-neutral-200">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10" />
            <CardHeader className="relative">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <RotateCcw className="w-7 h-7 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-neutral-600">連続チャレンジモード</CardTitle>
              <CardDescription className="text-neutral-500">
                選択した回数だけ連続で実行し、総合評価を確認
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium opacity-60">
                  中級者向け
                </span>
                <span className="text-neutral-400">•</span>
                <span>準備中</span>
              </div>
              <Button disabled className="w-full">
                準備中
              </Button>
            </CardContent>
          </Card>

          {/* 12音階モード */}
          <Card className="relative overflow-hidden group opacity-75 border-neutral-200">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <CardHeader className="relative">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-neutral-600">12音階モード</CardTitle>
              <CardDescription className="text-neutral-500">
                クロマチックスケールの上行・下行で完全制覇
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium opacity-60">
                  上級者向け
                </span>
                <span className="text-neutral-400">•</span>
                <span>準備中</span>
              </div>
              <Button disabled className="w-full">
                準備中
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 機能説明 */}
        <Card className="mb-8 border-neutral-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">アプリの特徴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-800">高精度音程検出</h3>
                <p className="text-sm text-neutral-600">
                  Pitchy (McLeod Method) による±5セントの精度
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <Piano className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-neutral-800">本格ピアノ音源</h3>
                <p className="text-sm text-neutral-600">
                  Salamander Grand Piano の高品質サンプル
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <Mic className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-neutral-800">倍音補正システム</h3>
                <p className="text-sm text-neutral-600">
                  人間音声の倍音を自動補正し95%以上の精度
                </p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-neutral-800">モバイル対応</h3>
                <p className="text-sm text-neutral-600">
                  iPhone Safari 完全対応のレスポンシブUI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使い方 */}
        <Card className="border-neutral-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: 1, title: "モード選択", desc: "レベルに応じてトレーニングモードを選択" },
                { step: 2, title: "マイク許可", desc: "ブラウザでマイクアクセスを許可" },
                { step: 3, title: "基音を聞く", desc: "高品質ピアノ音源で基音を確認" },
                { step: 4, title: "発声・判定", desc: "ドレミファソラシドを発声して判定" }
              ].map((item) => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mx-auto text-lg font-bold text-neutral-700">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-sm text-neutral-800">{item.title}</h4>
                  <p className="text-xs text-neutral-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center mt-12 text-sm text-neutral-500">
          <p>Version 3.0 - Clean Architecture</p>
          <p className="text-xs mt-1">Next.js + TypeScript + Tone.js + Pitchy</p>
        </div>
      </div>
    </div>
    </BrowserCompatibilityCheck>
  );
}
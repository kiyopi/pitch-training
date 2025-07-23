'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        {/* ヘッダー */}
        <header className="flex items-center justify-between py-6 border-b">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-semibold">ランダム基音トレーニング</h1>
          </div>
          <div className="w-20" /> {/* Spacer for center alignment */}
        </header>

        {/* メインエリア */}
        <Card className="mb-12 border-emerald-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-emerald-700">トレーニング開始</CardTitle>
            <CardDescription className="text-base">
              基音を聞いて、ドレミファソラシドを正確に発声してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-8">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                <p className="text-emerald-700 font-medium text-lg">
                  🎵 準備ができたらスタートボタンを押してください
                </p>
              </div>
              
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-12 py-6 text-xl font-bold rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <span>🎲</span>
                  <span>トレーニング開始</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使い方説明 */}
        <Card className="mb-12 border-neutral-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-neutral-800">使い方</CardTitle>
            <CardDescription>
              3つのステップで相対音感を効果的にトレーニング
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: 1, title: "基音を聞く", desc: "ランダムに選択された基音を確認", icon: "🎵" },
                { step: 2, title: "発声する", desc: "ドレミファソラシドを順番に歌う", icon: "🎤" },
                { step: 3, title: "結果確認", desc: "音程の正確性をチェック", icon: "✅" }
              ].map((item) => (
                <div key={item.step} className="text-center space-y-4 p-4 rounded-xl bg-gradient-to-b from-neutral-50 to-neutral-100 hover:shadow-md transition-all duration-300">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto text-xl font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-base text-neutral-800">{item.title}</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <footer className="border-t pt-6 mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              © 2024 相対音感トレーニング. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
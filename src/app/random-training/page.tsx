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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-emerald-400 to-green-400 opacity-30"></div>
              <Music className="w-16 h-16 text-emerald-600 relative" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            ランダム基音トレーニング
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            10種類の基音からランダムに選択してドレミファソラシドを発声
            <br />
            <span className="text-sm text-neutral-500 mt-1 block">
              初心者向け • 基本モード
            </span>
          </p>
        </div>

        {/* メインエリア */}
        <Card className="mb-8 border-emerald-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-emerald-700">トレーニング開始</CardTitle>
            <CardDescription className="text-base">
              基音を聞いて、ドレミファソラシドを正確に発声してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <p className="text-emerald-700 font-medium">
                  🎵 準備ができたらスタートボタンを押してください
                </p>
              </div>
              
              <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg font-bold"
              >
                🎲 トレーニング開始
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使い方説明 */}
        <Card className="mb-8 border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl">使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: 1, title: "基音を聞く", desc: "ランダムに選択された基音を確認" },
                { step: 2, title: "発声する", desc: "ドレミファソラシドを順番に歌う" },
                { step: 3, title: "結果確認", desc: "音程の正確性をチェック" }
              ].map((item) => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mx-auto text-lg font-bold text-emerald-700">
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
        <div className="flex justify-between items-center">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>トップページに戻る</span>
          </Link>
          
          <div className="text-sm text-neutral-500">
            Version 3.0 - Random Training Mode
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import Link from "next/link";
import { Music, RotateCcw, Target, Sparkles, Zap, Mic, Piano } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrowserCompatibilityCheck } from "@/components/BrowserCompatibilityCheck";
import { memo } from "react";

// メモ化されたトレーニングカードコンポーネント
const TrainingCard = memo(function TrainingCard({
  icon: Icon,
  title,
  description,
  badge,
  href,
  disabled = false,
  gradientFrom,
  gradientTo,
  iconBg,
  iconColor,
  badgeBg,
  badgeText,
  buttonBg,
  buttonHover
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  href: string;
  disabled?: boolean;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  buttonBg: string;
  buttonHover: string;
}) {
  return (
    <Card className={`relative overflow-hidden group transition-all duration-300 border-neutral-200 ${disabled ? 'opacity-75' : 'hover:shadow-xl'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} ${disabled ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
      <CardHeader className="relative pb-3 sm:pb-6">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${iconBg} flex items-center justify-center mb-3 sm:mb-4 ${disabled ? '' : 'group-hover:scale-110'} transition-transform`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
        </div>
        <CardTitle className={`text-lg sm:text-xl ${disabled ? 'text-neutral-700' : 'text-neutral-900'}`}>{title}</CardTitle>
        <CardDescription className={`text-sm sm:text-base ${disabled ? 'text-neutral-600' : 'text-neutral-700'}`}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative pt-0 sm:pt-6">
        <div className={`flex items-center gap-2 text-xs sm:text-sm ${disabled ? 'text-neutral-600' : 'text-neutral-600'} mb-3 sm:mb-4`}>
          <span className={`px-2 py-1 ${badgeBg} ${badgeText} rounded-full text-xs font-medium ${disabled ? 'opacity-70' : ''}`}>
            {badge}
          </span>
          <span className={disabled ? 'text-neutral-500' : 'text-neutral-400'}>•</span>
          <span>{disabled ? '準備中' : '基本モード'}</span>
        </div>
        <Button asChild={!disabled} disabled={disabled} className={`w-full ${disabled ? '' : buttonBg + ' ' + buttonHover} h-11 sm:h-10 text-sm sm:text-base touch-manipulation`}>
          {disabled ? (
            <div>準備中</div>
          ) : (
            <Link href={href}>
              トレーニング開始
            </Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

function Home() {
  return (
    <BrowserCompatibilityCheck
      minRequirements={{
        webAudio: true,
        mediaDevices: true,
        localStorage: false
      }}
    >
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-30"></div>
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 relative" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 px-2">
            相対音感トレーニング
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4">
            音程の相対的な関係を聞き分ける能力を効果的に鍛える
            <br className="hidden sm:block" />
            <span className="block sm:inline text-xs sm:text-sm text-neutral-500 mt-1 sm:mt-0">
              Powered by Pitchy (McLeod Pitch Method) × Salamander Grand Piano
            </span>
          </p>
        </div>

        {/* トレーニングモード選択 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <TrainingCard
            icon={Music}
            title="ランダム基音モード"
            description="10種類の基音からランダムに選択してトレーニング"
            badge="初心者向け"
            href="/random-training"
            gradientFrom="from-emerald-500/10"
            gradientTo="to-teal-500/10"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            badgeBg="bg-emerald-100"
            badgeText="text-emerald-700"
            buttonBg="bg-emerald-600"
            buttonHover="hover:bg-emerald-700"
          />
          
          <TrainingCard
            icon={RotateCcw}
            title="連続チャレンジモード"
            description="選択した回数だけ連続で実行し、総合評価を確認"
            badge="中級者向け"
            href="/training/continuous"
            disabled={true}
            gradientFrom="from-orange-500/10"
            gradientTo="to-amber-500/10"
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            badgeBg="bg-orange-100"
            badgeText="text-orange-700"
            buttonBg=""
            buttonHover=""
          />

          <div className="sm:col-span-2 lg:col-span-1">
            <TrainingCard
              icon={Target}
              title="12音階モード"
              description="クロマチックスケールの上行・下行で完全制覇"
              badge="上級者向け"
              href="/training/chromatic"
              disabled={true}
              gradientFrom="from-purple-500/10"
              gradientTo="to-pink-500/10"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              badgeBg="bg-purple-100"
              badgeText="text-purple-700"
              buttonBg=""
              buttonHover=""
            />
          </div>
        </div>

        {/* 機能説明 */}
        <Card className="mb-6 sm:mb-8 border-neutral-200">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">アプリの特徴</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">高精度音程検出</h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Pitchy (McLeod Method) による±5セントの精度
                </p>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                  <Piano className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">本格ピアノ音源</h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Salamander Grand Piano の高品質サンプル
                </p>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">倍音補正システム</h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  人間音声の倍音を自動補正し95%以上の精度
                </p>
              </div>
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-neutral-800">モバイル対応</h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  iPhone Safari 完全対応のレスポンシブUI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使い方 */}
        <Card className="border-neutral-200">
          <CardHeader className="text-center pb-3 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">使い方</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { step: 1, title: "モード選択", desc: "レベルに応じてトレーニングモードを選択" },
                { step: 2, title: "マイク許可", desc: "ブラウザでマイクアクセスを許可" },
                { step: 3, title: "基音を聞く", desc: "高品質ピアノ音源で基音を確認" },
                { step: 4, title: "発声・判定", desc: "ドレミファソラシドを発声して判定" }
              ].map((item) => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mx-auto text-sm sm:text-lg font-bold text-neutral-700">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-neutral-800">{item.title}</h4>
                  <p className="text-xs text-neutral-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center mt-8 sm:mt-12 text-xs sm:text-sm text-neutral-500">
          <p>Version 3.0 - Clean Architecture</p>
          <p className="text-xs mt-1">Next.js + TypeScript + Tone.js + Pitchy</p>
        </div>
      </div>
    </div>
    </BrowserCompatibilityCheck>
  );
}

// メモ化されたHomeコンポーネントをエクスポート
export default memo(Home);
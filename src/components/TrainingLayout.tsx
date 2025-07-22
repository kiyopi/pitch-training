'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// TrainingLayoutの設定インターフェース
export interface TrainingLayoutProps {
  // 基本情報
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  
  // カラースキーム
  colorScheme: 'green' | 'purple' | 'orange';
  
  // タイムスタンプ表示
  showTimestamp?: boolean;
  
  // 子要素
  children: React.ReactNode;
  
  // デバッグ表示（オプション）
  debugLog?: string[];
}

// カラースキーム定義
const colorSchemes = {
  green: {
    gradient: 'from-emerald-600 to-green-600',
    textGradient: 'from-emerald-600 to-green-600',
    badgeBg: 'from-emerald-100 to-green-100',
    badgeText: 'text-emerald-700',
    timestamp: 'from-emerald-600 to-green-600'
  },
  purple: {
    gradient: 'from-purple-600 to-indigo-600',
    textGradient: 'from-purple-600 to-indigo-600',
    badgeBg: 'from-purple-100 to-indigo-100',
    badgeText: 'text-purple-700',
    timestamp: 'from-purple-600 to-indigo-600'
  },
  orange: {
    gradient: 'from-orange-600 to-red-600',
    textGradient: 'from-orange-600 to-red-600',
    badgeBg: 'from-orange-100 to-red-100',
    badgeText: 'text-orange-700',
    timestamp: 'from-orange-600 to-red-600'
  }
};

export default function TrainingLayout({
  title,
  subtitle,
  icon,
  badge,
  colorScheme,
  showTimestamp = true,
  children,
  debugLog
}: TrainingLayoutProps) {
  const colors = colorSchemes[colorScheme];
  
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center p-6">
      {/* タイムスタンプ表示 */}
      {showTimestamp && (
        <div className={`fixed top-6 right-6 bg-gradient-to-r ${colors.timestamp} text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg backdrop-blur-sm`}>
          📱 {new Date().toLocaleTimeString('ja-JP')}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="text-center w-full">
        {/* ヘッダー */}
        <div className="mb-12">
          <div className="inline-block mb-6">
            <span className="text-8xl">{icon}</span>
          </div>
          <h1 className={`text-5xl font-extrabold bg-gradient-to-r ${colors.textGradient} bg-clip-text text-transparent mb-4`}>
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {subtitle}
          </p>
          {badge && (
            <div className={`inline-block bg-gradient-to-r ${colors.badgeBg} ${colors.badgeText} px-6 py-3 rounded-full text-lg font-bold`}>
              {badge}
            </div>
          )}
        </div>

        {/* 子要素（各モード固有のコンテンツ） */}
        {children}

        {/* デバッグログ表示（開発用） */}
        {debugLog && debugLog.length > 0 && (
          <div className="mb-8 p-4 bg-gray-100 rounded-xl text-left">
            <h4 className="font-bold text-gray-800 mb-2">📝 デバッグログ:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {debugLog.map((log, index) => (
                <div key={index} className="font-mono">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>トップページに戻る</span>
        </Link>
      </div>
    </div>
  );
}


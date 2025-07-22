'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue-green' | 'green-blue' | 'purple-blue' | 'red-orange';
  rippleAnimation?: boolean;
}

/**
 * Ripple効果付きボタンコンポーネント
 * 
 * 元実装: /src/app/random-training/page.tsx (行634-658)
 * CSS Animation: @keyframes pulse-expand (globals.css)
 * 
 * 特徴:
 * - 2層パルス効果 (1秒差で交互実行)
 * - scale(1.0→1.5) + opacity(1→0) アニメーション
 * - 2秒周期の無限ループ
 * - カスタマイズ可能なサイズとカラースキーム
 */
export default function RippleButton({
  children,
  className = '',
  size = 'md',
  colorScheme = 'blue-green',
  rippleAnimation = true,
  disabled = false,
  ...props
}: RippleButtonProps) {
  // サイズ設定
  const sizeStyles = {
    sm: 'px-6 py-3 text-lg rounded-xl',
    md: 'px-8 py-4 text-xl rounded-2xl', 
    lg: 'px-12 py-6 text-2xl rounded-3xl'
  };

  // カラースキーム設定
  const colorSchemes = {
    'blue-green': {
      button: 'from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700',
      ripple: 'from-blue-400/70 to-green-400/70 border-blue-300'
    },
    'green-blue': {
      button: 'from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700',
      ripple: 'from-green-400/70 to-blue-400/70 border-green-300'
    },
    'purple-blue': {
      button: 'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
      ripple: 'from-purple-400/70 to-blue-400/70 border-purple-300'
    },
    'red-orange': {
      button: 'from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700',
      ripple: 'from-red-400/70 to-orange-400/70 border-red-300'
    }
  };

  const currentColorScheme = colorSchemes[colorScheme];

  return (
    <div className={`relative inline-block ${disabled ? 'opacity-50' : ''}`}>
      {/* Ripple効果レイヤー1 (rippleAnimationが有効で、かつ非disabled時のみ) */}
      {rippleAnimation && !disabled && (
        <div 
          className={`absolute inset-0 -z-10 bg-gradient-to-r border ${currentColorScheme.ripple} ${
            size === 'sm' ? 'rounded-xl' : 
            size === 'md' ? 'rounded-2xl' : 
            'rounded-3xl'
          }`}
          style={{
            animation: 'pulse-expand 2s ease-out infinite'
          }}
        />
      )}
      
      {/* Ripple効果レイヤー2 (1秒遅延) */}
      {rippleAnimation && !disabled && (
        <div 
          className={`absolute inset-0 -z-10 bg-gradient-to-r border ${currentColorScheme.ripple} ${
            size === 'sm' ? 'rounded-xl' : 
            size === 'md' ? 'rounded-2xl' : 
            'rounded-3xl'
          }`}
          style={{
            animation: 'pulse-expand 2s ease-out 1s infinite'
          }}
        />
      )}
      
      {/* メインボタン */}
      <button
        className={`
          relative font-bold text-white transition-all duration-200 shadow-lg
          bg-gradient-to-r ${currentColorScheme.button}
          ${sizeStyles[size]}
          ${!disabled ? 'hover:scale-105 hover:shadow-2xl' : 'cursor-not-allowed'}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}

/**
 * 使用例:
 * 
 * // 基本的な使用
 * <RippleButton onClick={handleClick}>
 *   🎤 マイク開始
 * </RippleButton>
 * 
 * // サイズ・カラー・ripple制御
 * <RippleButton 
 *   size="lg" 
 *   colorScheme="purple-blue"
 *   rippleAnimation={isActive}
 *   onClick={handleStart}
 * >
 *   <Mic className="w-6 h-6 inline mr-2" />
 *   🎤 マイクテスト開始
 * </RippleButton>
 * 
 * // 無効状態
 * <RippleButton disabled={!isReady}>
 *   準備中...
 * </RippleButton>
 */
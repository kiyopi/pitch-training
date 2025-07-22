/**
 * UI・コンポーネント関連の型定義
 */

import { ReactNode, ButtonHTMLAttributes } from 'react';

// カラースキーム（統合版）
export type ColorScheme = 'green' | 'purple' | 'orange' | 'blue' | 'red';
export type ButtonColorScheme = 'blue-green' | 'green-blue' | 'purple-blue' | 'red-orange';

// コンポーネントサイズ
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// レイアウトモード
export type LayoutMode = 'horizontal' | 'vertical' | 'grid' | 'flex';

// ボタンのプロパティ（統合版）
export interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ComponentSize;
  colorScheme?: ButtonColorScheme;
  rippleAnimation?: boolean;
}

// 基音情報表示用（AudioControls用）
export interface BaseToneInfo {
  name: string;
  note: string;
  frequency: number;
}

// AudioControls設定
export interface AudioControlsProps {
  // 基音制御
  currentBaseTone?: BaseToneInfo;
  isBaseTonePlaying?: boolean;
  onPlayBaseTone?: () => void;
  onStopBaseTone?: () => void;
  onNewBaseTone?: () => void;
  baseNotes?: string[];
  onPlayNote?: (note: string) => void;
  
  // マイクロフォン制御
  isMicrophoneActive?: boolean;
  onStartMicrophone?: () => void;
  onStopMicrophone?: () => void;
  
  // 全停止
  onStopAll?: () => void;
  
  // UI設定
  layout?: LayoutMode;
  showBaseToneInfo?: boolean;
  showNoteGrid?: boolean;
  showMicrophoneControls?: boolean;
  showStopAll?: boolean;
  
  // カスタマイズ
  className?: string;
  disabled?: boolean;
  rippleEffect?: boolean;
}

// TrainingLayoutのプロパティ
export interface TrainingLayoutProps {
  // 基本情報
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  
  // 色・レイアウト設定
  colorScheme: ColorScheme;
  showTimestamp?: boolean;
  
  // コンテンツ
  children: ReactNode;
  debugLog?: string[];
  
  // カスタマイズ
  className?: string;
  backgroundPattern?: 'default' | 'gradient' | 'dots' | 'none';
}

// TrainingCardのプロパティ
export interface TrainingCardProps {
  colorScheme: ColorScheme;
  title: string;
  mainText: string | ReactNode;
  className?: string;
}

// InstructionCardのプロパティ
export interface InstructionCardProps {
  title: string;
  steps: { number: string; text: string }[];
  colorScheme: ColorScheme;
  className?: string;
}

// フィードバック・ステータス表示用
export interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'loading';
  message: string;
  icon?: ReactNode;
  className?: string;
}

// プログレスバー
export interface ProgressBarProps {
  progress: number;  // 0-100
  colorScheme?: ColorScheme;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

// 音程表示用の設定
export interface PitchDisplayProps {
  // 音程データ
  frequency?: number | null;
  targetFrequency?: number | null;
  noteName?: string;
  cents?: number;
  confidence?: number;
  
  // 表示設定
  showFrequency?: boolean;
  showNoteName?: boolean;
  showCents?: boolean;
  showConfidence?: boolean;
  showVisualIndicator?: boolean;
  
  // レイアウト・デザイン
  size?: ComponentSize;
  colorScheme?: ColorScheme;
  layout?: 'compact' | 'detailed' | 'minimal';
  className?: string;
}
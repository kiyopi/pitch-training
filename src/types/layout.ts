/**
 * レイアウト・ページ構造関連の型定義
 */

import { ReactNode } from 'react';
import { ColorScheme } from './ui';

// ページレイアウトモード
export type PageLayoutMode = 'centered' | 'sidebar' | 'fullwidth' | 'split';

// ヘッダー設定
export interface HeaderConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  showBackButton?: boolean;
  showTimestamp?: boolean;
  actions?: ReactNode;
}

// フッター設定
export interface FooterConfig {
  showVersion?: boolean;
  showLinks?: boolean;
  customContent?: ReactNode;
  sticky?: boolean;
}

// サイドバー設定
export interface SidebarConfig {
  position: 'left' | 'right';
  width?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  content: ReactNode;
}

// メインページレイアウト設定
export interface PageLayoutProps {
  // 基本設定
  mode: PageLayoutMode;
  colorScheme: ColorScheme;
  
  // コンテンツ
  children: ReactNode;
  
  // セクション設定
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  
  // スタイリング
  className?: string;
  containerMaxWidth?: string;
  padding?: boolean;
  
  // 特殊機能
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'waves';
  enableScrollToTop?: boolean;
  stickyHeader?: boolean;
}

// トレーニングページ専用レイアウト
export interface TrainingPageLayoutProps {
  // トレーニング情報
  trainingMode: 'random' | 'continuous' | 'chromatic';
  phase: 'setup' | 'training' | 'evaluation' | 'results';
  
  // プログレス
  currentStep?: number;
  totalSteps?: number;
  sessionProgress?: number; // 0-100
  
  // コンテンツエリア
  header: HeaderConfig;
  mainContent: ReactNode;
  controls?: ReactNode;
  statusPanel?: ReactNode;
  debugPanel?: ReactNode;
  
  // 設定
  colorScheme: ColorScheme;
  showProgressBar?: boolean;
  enableKeyboardShortcuts?: boolean;
}

// レスポンシブブレークポイント
export interface BreakpointConfig {
  xs: number;  // ~575px
  sm: number;  // 576px~
  md: number;  // 768px~
  lg: number;  // 992px~
  xl: number;  // 1200px~
  xxl: number; // 1400px~
}

// レスポンシブレイアウト設定
export interface ResponsiveLayoutConfig {
  breakpoints: BreakpointConfig;
  
  // 各ブレークポイントでの表示設定
  mobile: {
    hideSidebar: boolean;
    stackVertically: boolean;
    compactHeader: boolean;
  };
  
  tablet: {
    showSidebar: boolean;
    twoColumnLayout: boolean;
  };
  
  desktop: {
    fullFeatured: boolean;
    multiColumnLayout: boolean;
  };
}
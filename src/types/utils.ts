/**
 * ユーティリティ・汎用型定義
 */

// 汎用的な結果型
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 非同期結果型
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// オプショナル型のヘルパー
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 深い部分型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// イベントハンドラー型
export type EventHandler<T = void> = (data: T) => void | Promise<void>;
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>;

// コールバック型
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// 音程関連のユーティリティ型
export interface NoteInfo {
  note: string;           // 'C', 'D#', 'F' など
  octave: number;         // オクターブ番号
  fullNote: string;       // 'C4', 'D#5' など
  frequency: number;      // 周波数
  cents: number;          // 理想値からのずれ（セント）
}

// 音程精度評価
export type AccuracyLevel = 'perfect' | 'excellent' | 'good' | 'fair' | 'poor';

export interface AccuracyEvaluation {
  accuracy: AccuracyLevel;
  score: number;          // 0-100点
  color: string;          // UI表示用色
  message: string;        // フィードバックメッセージ
}

// 音程間隔計算
export interface IntervalInfo {
  semitones: number;      // 半音数
  cents: number;          // セント数
  intervalName: string;   // '完全5度', '短3度' など
  direction: 'up' | 'down' | 'unison';
}

// デバッグ情報
export interface DebugInfo {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: unknown;
}

// パフォーマンス測定
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;      // ミリ秒
  memoryUsage?: number;   // バイト
  operationCount?: number;
  
  // 音声処理特有のメトリクス
  audioLatency?: number;   // ミリ秒
  processingLoad?: number; // 0-100%
  dropframleerCount?: number;
}

// エラー情報の拡張
export interface ExtendedError extends Error {
  code?: string;
  category: 'audio' | 'microphone' | 'pitch' | 'ui' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
  timestamp: Date;
  userAgent?: string;
  recoverable: boolean;
}

// 設定の検証結果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

// フィルター・検索条件
export interface FilterCriteria<T> {
  field: keyof T;
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: string | number | boolean | Date;
  caseSensitive?: boolean;
}

// ソート条件
export interface SortCriteria<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

// ページネーション
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total?: number;
}

// API レスポンス型（将来のクラウド機能用）
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;
}

// 環境変数・設定値の型安全アクセス
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_BUILD_DATE: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_DEBUG_MODE?: boolean;
}
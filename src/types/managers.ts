/**
 * マネージャー・ユーティリティ関連の型定義
 */

import { BaseTone } from './tone';
import { TrainingMode, DifficultyLevel } from './config';

// セッション管理
export interface TrainingSession {
  id: string;
  mode: TrainingMode;
  difficulty: DifficultyLevel;
  baseTone: BaseTone;
  startTime: Date;
  endTime?: Date;
  results?: TrainingResult[];
  score?: number;
  completed: boolean;
}

// トレーニング結果
export interface TrainingResult {
  targetFrequency: number;
  detectedFrequency: number;
  accuracy: number;        // セント偏差
  timestamp: Date;
  confidence: number;
  noteIndex: number;       // ドレミファソラシドの何番目か
  passed: boolean;         // 合格判定
}

// 統計情報
export interface TrainingStatistics {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  totalTime: number;       // 分単位
  
  // 詳細統計
  accuracyByNote: { [note: string]: number };
  progressOverTime: { date: string; score: number }[];
  difficultyProgression: { level: DifficultyLevel; unlockedAt: Date }[];
  
  // 弱点分析
  weakNotes: string[];
  strongNotes: string[];
  recommendedFocus: string[];
}

// セッションマネージャー
export interface SessionManager {
  // セッション制御
  startSession: (mode: TrainingMode, difficulty: DifficultyLevel) => Promise<TrainingSession>;
  endSession: (sessionId: string, results: TrainingResult[]) => Promise<void>;
  pauseSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  
  // 現在のセッション
  currentSession: TrainingSession | null;
  isSessionActive: boolean;
  
  // 結果記録
  recordResult: (result: TrainingResult) => void;
  getCurrentResults: () => TrainingResult[];
  
  // セッション履歴
  getSessionHistory: (limit?: number) => Promise<TrainingSession[]>;
  deleteSession: (sessionId: string) => Promise<void>;
}

// 統計マネージャー
export interface StatisticsManager {
  // 統計計算
  calculateStatistics: () => Promise<TrainingStatistics>;
  getProgressData: (period: 'week' | 'month' | 'year') => Promise<{ date: string; score: number; sessionCount: number }[]>;
  
  // 分析機能
  analyzeWeakPoints: () => Promise<string[]>;
  suggestNextDifficulty: () => Promise<DifficultyLevel>;
  generateProgressReport: () => Promise<string>;
  
  // データエクスポート
  exportStatistics: () => Promise<string>; // CSV形式
  exportProgressChart: () => Promise<Blob>; // チャート画像
}

// プログレスマネージャー
export interface ProgressManager {
  // プログレス追跡
  updateProgress: (sessionId: string, progress: number) => void;
  getCurrentProgress: () => number;
  
  // マイルストーン
  checkMilestones: () => Promise<string[]>; // 達成したマイルストーン
  getNextMilestone: () => Promise<string>;
  
  // レベルシステム
  getCurrentLevel: () => number;
  getExperiencePoints: () => number;
  addExperience: (points: number) => void;
  
  // アチーブメント
  unlockAchievement: (achievementId: string) => void;
  getUnlockedAchievements: () => string[];
  getAvailableAchievements: () => { id: string; name: string; description: string }[];
}

// データ永続化マネージャー
export interface PersistenceManager {
  // ローカルストレージ
  saveToLocal: (key: string, data: unknown) => Promise<void>;
  loadFromLocal: (key: string) => Promise<unknown>;
  clearLocal: () => Promise<void>;
  
  // クラウド同期（将来用）
  syncToCloud?: (data: unknown) => Promise<void>;
  loadFromCloud?: () => Promise<unknown>;
  
  // データ移行・バックアップ
  exportAllData: () => Promise<string>; // JSON形式
  importData: (jsonData: string) => Promise<void>;
  createBackup: () => Promise<Blob>;
  restoreFromBackup: (backup: File) => Promise<void>;
}
// 総合評価システムの型定義

export type TrainingMode = 'random' | 'continuous' | 'chromatic';
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

// 基本スコアデータ
export interface BaseScoreData {
  mode: TrainingMode;
  timestamp: Date;
  duration: number;
  totalNotes: number;
  measuredNotes: number;
  averageAccuracy: number;
  overallGrade: Grade;
}

// 音程結果
export interface NoteResult {
  name: string;
  cents: number | null;
  targetFreq: number | null;
  detectedFreq: number | null;
  diff: number | null;
  accuracy: number | 'notMeasured';
}

// グレード分布
export interface GradeDistribution {
  excellent: number;
  good: number;
  pass: number;
  needWork: number;
  notMeasured: number;
}

// ランダムモードスコア
export interface RandomModeScore extends BaseScoreData {
  mode: 'random';
  baseNote: string;
  baseFrequency: number;
  noteResults: NoteResult[];
  distribution: GradeDistribution;
}

// 基音ごとの結果
export interface BaseNoteResult {
  baseNote: string;
  baseFrequency: number;
  total: number;
  success: number;
  accuracy: number;
  successRate: number;
  streaks?: number[];
  maxStreak?: number;
}

// 連続モードスコア
export interface ContinuousModeScore extends BaseScoreData {
  mode: 'continuous';
  totalSessions: number;
  baseNoteResults: BaseNoteResult[];
  overallStats: {
    totalAttempts: number;
    totalSuccess: number;
    averageAccuracy: number;
    maxStreak: number;
  };
}

// クロマチック結果
export interface ChromaticResult {
  [note: string]: number; // 各音の精度
}

// 12音階モードスコア
export interface ChromaticModeScore extends BaseScoreData {
  mode: 'chromatic';
  baseNoteResults: Array<{
    baseNote: string;
    chromaticResults: ChromaticResult;
  }>;
  overallChromaticAccuracy: ChromaticResult;
  difficultNotes: string[];
}

// 統合スコアタイプ
export type UnifiedScore = RandomModeScore | ContinuousModeScore | ChromaticModeScore;

// グレード定義
export interface GradeDefinition {
  name: string;
  icon: any; // Lucide icon component
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

// 簡易評価データ
export interface QuickEvaluation {
  baseNote: string;
  correctRate: number;
  avgAccuracy: number;
  currentStreak?: number;
  chromaticProgress?: ChromaticResult;
}
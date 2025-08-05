// localStorage用セッション管理型定義
// 既存の scoring.ts と完全互換性を持つ

import type { TrainingMode, Grade, NoteResult, GradeDistribution } from './scoring';

// 4段階評価（個別セッション用）
export type SessionGrade = 'excellent' | 'good' | 'pass' | 'needWork';

// 音域タイプ
export type VoiceRangeType = 'low' | 'middle' | 'high' | 'extended';

// 外れ値情報
export interface OutlierInfo {
  name: string;                    // 音名（ド、レ、ミ...）
  cents: number;                   // セント誤差
  severity: 'attention' | 'critical'; // ±50-100¢ | ±100¢超
}

// セッション結果（1セッション = 8音練習）
export interface SessionResult {
  sessionId: number;               // 1-8 (セッション番号)
  baseNote: string;               // "C4", "D4", etc. (基音)
  baseName: string;               // "ド（低）", "レ（低）", etc. (基音名)
  grade: SessionGrade;            // 4段階評価
  accuracy: number;               // 0-100 (精度%)
  averageError: number;           // セント誤差平均
  completedAt: string;            // ISO日時文字列
  duration: number;               // 秒 (セッション時間)
  noteResults: NoteResult[];      // 8音詳細結果（既存型使用）
  outliers: OutlierInfo[];        // 外れ値情報
  distribution: GradeDistribution; // グレード分布（既存型使用）
  isCompleted: boolean;           // 完了フラグ
}

// 全体進行管理（8セッション完走追跡）
export interface TrainingProgress {
  // 基本情報
  mode: 'random';                 // モード固定（将来拡張可能）
  version: string;                // データバージョン（互換性管理）
  createdAt: string;              // 開始日時（ISO文字列）
  lastUpdatedAt: string;          // 最終更新日時（ISO文字列）
  
  // セッション管理
  sessionHistory: SessionResult[]; // 完了セッション履歴（最大8個）
  currentSessionId: number;        // 現在のセッション番号（1-8）
  isCompleted: boolean;           // 8セッション完走フラグ
  
  // 統計情報（8セッション完了時に計算）
  overallGrade?: Grade;           // S-E級総合評価（既存型使用）
  overallAccuracy?: number;       // 全体精度平均
  totalPlayTime?: number;         // 総プレイ時間（秒）
  
  // 基音管理
  availableBaseNotes: string[];   // 使用可能基音リスト
  usedBaseNotes: string[];        // 使用済み基音リスト
  voiceRange: VoiceRangeType;     // 選択された音域タイプ
}

// localStorage用統合スコアデータ（UnifiedScoreResultFixed.svelte用）
export interface UnifiedScoreData {
  mode: TrainingMode;             // 既存型使用
  sessionHistory: Array<{
    sessionId: number;
    grade: SessionGrade;
    accuracy: number;
    baseNote: string;
    baseName: string;
    noteResults: NoteResult[];    // 既存型使用
    completedAt: string;
  }>;
  overallGrade?: Grade;           // 既存型使用
  overallAccuracy?: number;
  isCompleted: boolean;
  totalSessions: number;
  targetSessions: number;         // 8 (random/continuous) or 12 (chromatic)
}

// localStorage キー定数
export const STORAGE_KEYS = {
  TRAINING_PROGRESS: 'pitch-training-random-progress-v1',
  SETTINGS: 'pitch-training-settings-v1',
  TEMP_SESSION: 'pitch-training-temp-session-v1'
} as const;

// バックアップ・復旧用キー
export const BACKUP_KEYS = {
  LAST_BACKUP: 'pitch-training-backup-timestamp',
  PROGRESS_BACKUP: 'pitch-training-progress-backup'
} as const;

// 基音プール定数（中級レベル16種類 - 3オクターブ帯域）
export const BASE_NOTE_POOL = ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb3', 'B3', 'C5', 'D5', 'F3', 'G3'] as const;

// 音域別基音グループ（8種類ずつ）
export const VOICE_RANGE_GROUPS = {
  low: ['F3', 'G3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4'] as const,     // 低音域中心
  middle: ['Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4'] as const,  // 中音域中心  
  high: ['D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4'] as const,    // 高音域中心
  extended: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5', 'D5'] as const     // 拡張音域（オクターブ跨ぎ）
} as const;

// 基音名マッピング（中級レベル16種類対応）
export const BASE_NOTE_NAMES = {
  'C4': 'ド（中）',
  'Db4': 'ド#（中）',
  'D4': 'レ（中）',
  'Eb4': 'レ#（中）',
  'E4': 'ミ（中）',
  'F4': 'ファ（中）',
  'Gb4': 'ファ#（中）',
  'G4': 'ソ（中）',
  'Ab4': 'ラb（中）',
  'A4': 'ラ（中）',
  'Bb3': 'シb（低）',
  'B3': 'シ（低）',
  'C5': 'ド（高）',
  'D5': 'レ（高）',
  'F3': 'ファ（低）',
  'G3': 'ソ（低）'
} as const;

// データバージョン（将来の互換性管理用）
export const DATA_VERSION = '1.0.0';

// SessionGrade から Grade への変換マッピング
export const SESSION_TO_OVERALL_GRADE_MAP: Record<SessionGrade, number> = {
  excellent: 4,
  good: 3,
  pass: 2,
  needWork: 1
};

// 評価基準定数
export const EVALUATION_THRESHOLDS = {
  // 個別セッション評価基準（セント誤差）
  EXCELLENT: 15,
  GOOD: 25,
  PASS: 40,
  
  // 外れ値検出基準
  OUTLIER_ATTENTION: 50,
  OUTLIER_CRITICAL: 100,
  
  // S-E級総合評価基準（比率）
  S_GRADE: { excellentRatio: 0.9, goodPlusRatio: 0.95 },
  A_GRADE: { excellentRatio: 0.7, goodPlusRatio: 0.85 },
  B_GRADE: { excellentRatio: 0.5, goodPlusRatio: 0.75 },
  C_GRADE: { goodPlusRatio: 0.65 },
  D_GRADE: { goodPlusRatio: 0.50 }
} as const;

// 型ガード関数
export function isSessionResult(obj: any): obj is SessionResult {
  return (
    typeof obj === 'object' &&
    typeof obj.sessionId === 'number' &&
    typeof obj.baseNote === 'string' &&
    typeof obj.grade === 'string' &&
    typeof obj.accuracy === 'number' &&
    Array.isArray(obj.noteResults) &&
    typeof obj.isCompleted === 'boolean'
  );
}

export function isTrainingProgress(obj: any): obj is TrainingProgress {
  return (
    typeof obj === 'object' &&
    obj.mode === 'random' &&
    typeof obj.version === 'string' &&
    Array.isArray(obj.sessionHistory) &&
    typeof obj.currentSessionId === 'number' &&
    typeof obj.isCompleted === 'boolean'
  );
}

// ユーティリティ型
export type BaseNote = typeof BASE_NOTE_POOL[number];
export type BaseNoteName = typeof BASE_NOTE_NAMES[keyof typeof BASE_NOTE_NAMES];
export type VoiceRangeNote = typeof VOICE_RANGE_GROUPS[VoiceRangeType][number];
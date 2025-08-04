/**
 * GradeDefinitions - 評価表示定義統一管理
 * 
 * 目的: UI表示用の評価定義を一元化
 * - アイコン・色・名前・説明の統一
 * - 表示の一貫性保証
 */

import { Trophy, Star, ThumbsUp, Frown, AlertCircle, Crown, Award, Meh, Sprout } from 'lucide-svelte';

/**
 * 音程評価定義（個別音程用）
 */
export const NOTE_GRADE_DEFINITIONS = {
  excellent: { 
    name: '優秀', 
    icon: Trophy, 
    range: '±30¢以内', 
    color: 'text-yellow-500', 
    colorValue: '#eab308',
    bgColor: '#fffbeb', 
    borderColor: '#fbbf24' 
  },
  good: { 
    name: '良好', 
    icon: Star, 
    range: '±60¢以内', 
    color: 'text-green-500', 
    colorValue: '#10b981',
    bgColor: '#ecfdf5', 
    borderColor: '#10b981' 
  },
  pass: { 
    name: '合格', 
    icon: ThumbsUp, 
    range: '±120¢以内', 
    color: 'text-blue-500', 
    colorValue: '#3b82f6',
    bgColor: '#eff6ff', 
    borderColor: '#3b82f6' 
  },
  needWork: { 
    name: '要練習', 
    icon: Frown, 
    range: '±121¢以上', 
    color: 'text-red-500', 
    colorValue: '#ef4444',
    bgColor: '#fef2f2', 
    borderColor: '#ef4444' 
  },
  notMeasured: { 
    name: '測定不可', 
    icon: AlertCircle, 
    range: '音声未検出', 
    color: 'text-gray-500', 
    colorValue: '#9ca3af',
    bgColor: '#f9fafb', 
    borderColor: '#9ca3af' 
  }
} as const;

/**
 * セッション評価定義（8音→セッショングレード用）
 */
export const SESSION_GRADE_DEFINITIONS = {
  excellent: {
    name: '優秀',
    icon: Trophy,
    detail: '合格以上が7個以上 かつ 平均誤差±40¢以内',
    color: 'text-yellow-500',
    colorValue: '#eab308',
    bgColor: '#fffbeb',
    borderColor: '#fbbf24'
  },
  good: {
    name: '良好', 
    icon: Star,
    detail: '合格以上が6個以上 かつ 平均誤差±60¢以内',
    color: 'text-green-500',
    colorValue: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#10b981'
  },
  pass: {
    name: '合格',
    icon: ThumbsUp,
    detail: '合格以上が4個以上 (8音中50%)',
    color: 'text-blue-500',
    colorValue: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  needWork: {
    name: '要練習',
    icon: Frown,
    detail: '基本的な音程感覚を身につけて合格率を向上させましょう',
    color: 'text-red-500',
    colorValue: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444'
  }
} as const;

/**
 * 統合評価定義（S-E級、安定性重視システム）
 */
export const OVERALL_GRADE_DEFINITIONS = {
  S: {
    name: 'S級マスター',
    icon: Trophy,
    description: 'マスター級到達！どんな音程も完璧に判定できます。',
    color: '#a855f7',
    bgColor: 'linear-gradient(135deg, #f3e8ff 0%, #ffffff 100%)',
    borderColor: '#a855f7'
  },
  A: {
    name: 'A級エキスパート',
    icon: Crown,
    description: 'エキスパート級到達！高い安定性と精度を持っています。',
    color: '#eab308',
    bgColor: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)',
    borderColor: '#eab308'
  },
  B: {
    name: 'B級プロフィシエント',
    icon: Star,
    description: 'プロフィシエント級到達！良好な音程判定能力があります。',
    color: '#10b981',
    bgColor: 'linear-gradient(135deg, #d1fae5 0%, #ffffff 100%)',
    borderColor: '#10b981'
  },
  C: {
    name: 'C級アドバンス',
    icon: Award,
    description: 'アドバンス級到達！合格率で着実に成長中です。',
    color: '#3b82f6',
    bgColor: 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)',
    borderColor: '#3b82f6'
  },
  D: {
    name: 'D級ベーシック',
    icon: Meh,
    description: '継続練習で必ず上達！現在の合格率から目標75%へ向けて練習を続けましょう。',
    color: '#f97316',
    bgColor: 'linear-gradient(135deg, #fed7aa 0%, #ffffff 100%)',
    borderColor: '#f97316'
  },
  E: {
    name: 'E級ビギナー',
    icon: Sprout,
    description: '新しいスタート！基礎から着実に音程感覚を身につけていきましょう。',
    color: '#ef4444',
    bgColor: 'linear-gradient(135deg, #fecaca 0%, #ffffff 100%)',
    borderColor: '#ef4444'
  }
} as const;

/**
 * 安定性重視評価基準説明（完走時評価用）
 */
export const STABILITY_CRITERIA_DESCRIPTIONS = {
  title: '完走時の最終評価（安定性重視）',
  warning: '⚠️ 要練習が1つでもあると大幅減点！',
  criteria: {
    S: { condition: '優秀50%以上（要練習なし）' },
    A: { condition: '優秀25%以上 OR 良好以上87.5%以上（要練習なし）' },
    B: { condition: '良好以上50%以上（要練習なし）' },
    C: { condition: '成功率87.5%以上 + 良好以上75%以上（要練習あり）' },
    D: { condition: '成功率75%以上（要練習あり）' },
    E: { condition: '成功率75%未満（要練習あり）' }
  }
} as const;

/**
 * 型定義
 */
export type NoteGradeKey = keyof typeof NOTE_GRADE_DEFINITIONS;
export type SessionGradeKey = keyof typeof SESSION_GRADE_DEFINITIONS;
export type OverallGradeKey = keyof typeof OVERALL_GRADE_DEFINITIONS;

/**
 * グレード定義取得用ヘルパー関数
 */
export class GradeDefinitions {
  
  /**
   * 音程評価定義を取得
   */
  static getNote(grade: NoteGradeKey) {
    return NOTE_GRADE_DEFINITIONS[grade];
  }
  
  /**
   * セッション評価定義を取得
   */
  static getSession(grade: SessionGradeKey) {
    return SESSION_GRADE_DEFINITIONS[grade];
  }
  
  /**
   * 統合評価定義を取得
   */
  static getOverall(grade: OverallGradeKey) {
    return OVERALL_GRADE_DEFINITIONS[grade];
  }
  
  /**
   * 全ての音程評価定義を取得
   */
  static getAllNoteGrades() {
    return NOTE_GRADE_DEFINITIONS;
  }
  
  /**
   * 全てのセッション評価定義を取得
   */
  static getAllSessionGrades() {
    return SESSION_GRADE_DEFINITIONS;
  }
  
  /**
   * 全ての統合評価定義を取得
   */
  static getAllOverallGrades() {
    return OVERALL_GRADE_DEFINITIONS;
  }
  
  /**
   * 安定性重視基準説明を取得
   */
  static getStabilityCriteria() {
    return STABILITY_CRITERIA_DESCRIPTIONS;
  }
}
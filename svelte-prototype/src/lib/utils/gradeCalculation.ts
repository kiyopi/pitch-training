// 統一された評価ロジック
// 全ての評価箇所で同一の基準を使用するための共通関数

import type { NoteResult, SessionGrade } from '$lib/types/scoring';

/**
 * 音程評価を計算（個別の音程）
 */
export function calculateNoteGrade(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return 'notMeasured';
  }
  const absCents = Math.abs(cents);
  if (absCents <= 30) return 'excellent';  // ±30¢以内（実用的精度）
  if (absCents <= 60) return 'good';      // ±60¢以内（半音の半分）
  if (absCents <= 120) return 'pass';     // ±120¢以内（1セミトーン強）
  return 'needWork';
}

/**
 * セッション評価を計算（8音の結果から4段階評価）
 * 技術的ブレを考慮した公正な評価基準
 */
export function calculateSessionGrade(noteResults: NoteResult[]): SessionGrade {
  if (!noteResults || noteResults.length === 0) return 'needWork';
  
  const results = noteResults.reduce((acc, note) => {
    const grade = calculateNoteGrade(note.cents);
    acc[grade] = (acc[grade] || 0) + 1;
    if (grade !== 'notMeasured') {
      acc.totalError += Math.abs(note.cents || 0);
      acc.measuredCount += 1;
    }
    return acc;
  }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });
  
  const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;
  const passCount = results.excellent + results.good + results.pass;
  
  // 技術的ブレを考慮した統一評価基準
  // 測定不可が多すぎる場合
  if (results.notMeasured > 3) return 'needWork';
  if (results.measuredCount === 0) return 'needWork';
  
  // ポジティブ評価を優先（技術的ブレ耐性・緩和版）
  if (averageError <= 40 && results.excellent >= 5) return 'excellent';  // 平均±40¢、優秀5個以上
  if (averageError <= 60 && passCount >= 6) return 'good';               // 平均±60¢、合格6個以上
  if (passCount >= 4) return 'pass'; // 8音中50%が合格以上（大幅緩和）
  
  // 要練習が圧倒的多数（75%以上）の場合のみ要練習判定
  if (results.needWork >= 6) return 'needWork';
  
  return 'needWork';
}

/**
 * 成績分布を計算
 */
export function calculateGradeDistribution(noteResults: NoteResult[]) {
  return noteResults.reduce((acc, note) => {
    const grade = calculateNoteGrade(note.cents);
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0 });
}

/**
 * セッション評価基準の説明
 */
export const SESSION_GRADE_CRITERIA = {
  excellent: '優秀な音程が5個以上かつ平均誤差±40¢以内（実用的精度）',
  good: '合格以上が6個以上かつ平均誤差±60¢以内（実践的音感）',
  pass: '合格以上が4個以上（8音中50%・基礎音感）',
  needWork: '要練習が6個以上または測定不可が4個以上',
  note: '※技術誤差±20-50¢を考慮した公正な評価基準（2025/8/4改訂）'
};
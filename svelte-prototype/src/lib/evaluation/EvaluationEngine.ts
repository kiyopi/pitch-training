/**
 * EvaluationEngine - 統一評価システム
 * 
 * 目的: 全ての評価ロジックを一元化し、一貫性を保証
 * - 音程評価（個別音程）
 * - セッション評価（8音→セッショングレード）
 * - 統合評価（8セッション→統合グレード、安定性重視）
 */

import type { NoteResult, SessionGrade, OverallGrade } from '$lib/types/scoring';

export type NoteGrade = 'excellent' | 'good' | 'pass' | 'needWork' | 'notMeasured';

export interface SessionData {
  grade: SessionGrade;
  accuracy: number;
  averageError: number;
  noteResults: NoteResult[];
  baseNote: string;
  baseFrequency: number;
}

export interface EvaluationCriteria {
  note: {
    excellent: number;  // ±30¢
    good: number;       // ±60¢  
    pass: number;       // ±120¢
  };
  session: {
    excellentThreshold: { avgError: number; excellentCount: number };
    goodThreshold: { avgError: number; passCount: number };
    passThreshold: { passCount: number };
  };
  overall: {
    stabilityFirst: boolean; // 安定性重視フラグ
  };
}

export class EvaluationEngine {
  
  /**
   * 評価基準定義（統一基準）
   */
  private static readonly CRITERIA: EvaluationCriteria = {
    note: {
      excellent: 30,   // ±30¢以内（実用的精度）
      good: 60,        // ±60¢以内（半音の半分）
      pass: 120,       // ±120¢以内（1セミトーン強）
    },
    session: {
      excellentThreshold: { avgError: 40, excellentCount: 5 },  // 平均±40¢、優秀5個以上
      goodThreshold: { avgError: 60, passCount: 6 },            // 平均±60¢、合格6個以上
      passThreshold: { passCount: 4 },                          // 8音中50%が合格以上
    },
    overall: {
      stabilityFirst: true, // 安定性重視（要練習による大幅減点）
    }
  };

  /**
   * 音程評価を計算（個別の音程）
   * @param cents セント差（±の誤差）
   * @returns 音程グレード
   */
  public static evaluateNote(cents: number | null | undefined): NoteGrade {
    if (cents === null || cents === undefined || isNaN(cents)) {
      return 'notMeasured';
    }
    
    const absCents = Math.abs(cents);
    if (absCents <= this.CRITERIA.note.excellent) return 'excellent';
    if (absCents <= this.CRITERIA.note.good) return 'good';
    if (absCents <= this.CRITERIA.note.pass) return 'pass';
    return 'needWork';
  }

  /**
   * セッション評価を計算（8音の結果から4段階評価）
   * @param noteResults 8音の評価結果
   * @returns セッショングレード
   */
  public static evaluateSession(noteResults: NoteResult[]): SessionGrade {
    if (!noteResults || noteResults.length === 0) return 'needWork';
    
    // 音程別グレード集計
    const gradeCount = noteResults.reduce((acc, note) => {
      const grade = this.evaluateNote(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== 'notMeasured') {
        acc.totalError += Math.abs(note.cents || 0);
        acc.measuredCount += 1;
      }
      return acc;
    }, { 
      excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, 
      totalError: 0, measuredCount: 0 
    });
    
    const averageError = gradeCount.measuredCount > 0 ? 
      gradeCount.totalError / gradeCount.measuredCount : 100;
    const passCount = gradeCount.excellent + gradeCount.good + gradeCount.pass;
    
    // 測定不可が多すぎる場合
    if (gradeCount.notMeasured > 3 || gradeCount.measuredCount === 0) {
      return 'needWork';
    }
    
    // 統一評価基準による判定
    const { excellentThreshold, goodThreshold, passThreshold } = this.CRITERIA.session;
    
    if (averageError <= excellentThreshold.avgError && gradeCount.excellent >= excellentThreshold.excellentCount) {
      return 'excellent';
    }
    if (averageError <= goodThreshold.avgError && passCount >= goodThreshold.passCount) {
      return 'good';
    }
    if (passCount >= passThreshold.passCount) {
      return 'pass';
    }
    
    // 要練習が圧倒的多数（75%以上）の場合のみ要練習判定
    if (gradeCount.needWork >= 6) {
      return 'needWork';
    }
    
    return 'needWork';
  }

  /**
   * 統合評価を計算（8セッション完走時の安定性重視評価）
   * @param sessionHistory セッション履歴
   * @returns 統合グレード（S-E級）
   */
  public static evaluateOverall(sessionHistory: SessionData[]): OverallGrade {
    if (!sessionHistory || sessionHistory.length === 0) return 'E';
    
    const total = sessionHistory.length;
    const excellent = sessionHistory.filter(s => s.grade === 'excellent').length;
    const good = sessionHistory.filter(s => s.grade === 'good').length;
    const pass = sessionHistory.filter(s => s.grade === 'pass').length;
    const fail = sessionHistory.filter(s => s.grade === 'needWork').length;
    
    const excellentRate = excellent / total;
    const goodOrBetterRate = (excellent + good) / total;
    const successRate = (excellent + good + pass) / total;
    
    // 安定性重視: 要練習による大幅減点システム
    if (this.CRITERIA.overall.stabilityFirst && fail > 0) {
      // 要練習が1つでもあれば最大でもC級（明らかな音程外しは大減点）
      if (successRate >= 0.875 && goodOrBetterRate >= 0.75) return 'C';
      if (successRate >= 0.75) return 'D';
      return 'E';
    }
    
    // 完走時（要練習なし）の高評価 - どんな音でも合わせられる安定性を評価
    if (excellentRate >= 0.5) return 'S';           // 優秀50%以上
    if (excellentRate >= 0.25) return 'A';          // 優秀25%以上
    if (goodOrBetterRate >= 0.875) return 'A';      // 良好以上87.5%以上
    if (goodOrBetterRate >= 0.75) return 'B';       // 良好以上75%以上
    if (goodOrBetterRate >= 0.5) return 'B';        // 良好以上50%以上
    return 'C';
  }

  /**
   * セッションの分布データを計算
   * @param noteResults 音程結果配列
   * @returns 分布データ
   */
  public static calculateDistribution(noteResults: NoteResult[]) {
    const distribution = { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0 };
    
    noteResults.forEach(note => {
      const grade = this.evaluateNote(note.cents);
      distribution[grade]++;
    });
    
    return distribution;
  }

  /**
   * 精度計算
   * @param noteResults 音程結果配列
   * @returns 精度パーセンテージ
   */
  public static calculateAccuracy(noteResults: NoteResult[]): number {
    if (!noteResults || noteResults.length === 0) return 0;
    
    const passCount = noteResults.filter(note => {
      const grade = this.evaluateNote(note.cents);
      return ['excellent', 'good', 'pass'].includes(grade);
    }).length;
    
    return Math.round((passCount / noteResults.length) * 100);
  }

  /**
   * 平均誤差計算
   * @param noteResults 音程結果配列
   * @returns 平均誤差（セント）
   */
  public static calculateAverageError(noteResults: NoteResult[]): number {
    if (!noteResults || noteResults.length === 0) return 0;
    
    const validResults = noteResults.filter(note => 
      note.cents !== null && note.cents !== undefined && !isNaN(note.cents)
    );
    
    if (validResults.length === 0) return 0;
    
    const totalError = validResults.reduce((sum, note) => sum + Math.abs(note.cents!), 0);
    return Math.round(totalError / validResults.length);
  }

  /**
   * 評価基準を取得（外部参照用）
   * @returns 評価基準オブジェクト
   */
  public static getCriteria(): EvaluationCriteria {
    return { ...this.CRITERIA }; // ディープコピーで安全に提供
  }
}
// localStorage用セッション管理クラス
// シングルトンパターンで一元管理

import type { 
  TrainingProgress, 
  SessionResult, 
  UnifiedScoreData, 
  SessionGrade, 
  BaseNote 
} from '../types/sessionStorage';
import type { Grade, NoteResult } from '../types/scoring';
import { 
  STORAGE_KEYS, 
  BACKUP_KEYS, 
  BASE_NOTE_POOL, 
  BASE_NOTE_NAMES, 
  DATA_VERSION,
  EVALUATION_THRESHOLDS,
  isTrainingProgress,
  isSessionResult
} from '../types/sessionStorage';

export class SessionStorageManager {
  private static instance: SessionStorageManager;
  private progress: TrainingProgress | null = null;

  // シングルトンパターン
  public static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }

  private constructor() {
    // プライベートコンストラクタでシングルトン確保
  }

  // =============================================================================
  // 基本操作 (CRUD)
  // =============================================================================

  /**
   * 進行状況をlocalStorageから読み込み
   */
  public loadProgress(): TrainingProgress | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRAINING_PROGRESS);
      if (!stored) {
        this.progress = null;
        return null;
      }

      const parsed = JSON.parse(stored);
      
      // データ検証
      if (!isTrainingProgress(parsed)) {
        console.warn('[SessionStorageManager] Invalid progress data, creating backup');
        this.createBackup(parsed);
        this.progress = null;
        return null;
      }

      // バージョン互換性チェック
      if (parsed.version !== DATA_VERSION) {
        console.info('[SessionStorageManager] Data version mismatch, attempting migration');
        const migrated = this.migrateDataVersion(parsed);
        if (migrated) {
          this.saveProgress(migrated);
          this.progress = migrated;
          return migrated;
        }
        this.progress = null;
        return null;
      }

      this.progress = parsed;
      return this.progress;
    } catch (error) {
      console.error('[SessionStorageManager] Error loading progress:', error);
      this.progress = null;
      return null;
    }
  }

  /**
   * 進行状況をlocalStorageに保存
   */
  public saveProgress(progress: TrainingProgress): boolean {
    try {
      // データ検証
      if (!isTrainingProgress(progress)) {
        console.error('[SessionStorageManager] Invalid progress data for save');
        return false;
      }

      // 更新日時を設定
      progress.lastUpdatedAt = new Date().toISOString();

      // 自動バックアップ作成
      if (this.progress) {
        this.createBackup(this.progress);
      }

      // localStorage保存
      localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
      this.progress = progress;
      
      console.info('[SessionStorageManager] Progress saved successfully');
      return true;
    } catch (error) {
      console.error('[SessionStorageManager] Error saving progress:', error);
      
      // 容量不足の場合はバックアップを削除して再試行
      if (error.name === 'QuotaExceededError') {
        this.clearBackups();
        try {
          localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
          this.progress = progress;
          console.info('[SessionStorageManager] Progress saved after backup cleanup');
          return true;
        } catch (retryError) {
          console.error('[SessionStorageManager] Failed to save even after cleanup:', retryError);
        }
      }
      
      return false;
    }
  }

  /**
   * 進行状況をリセット
   */
  public resetProgress(): boolean {
    try {
      // バックアップ作成
      if (this.progress) {
        this.createBackup(this.progress);
      }

      // localStorage削除
      localStorage.removeItem(STORAGE_KEYS.TRAINING_PROGRESS);
      this.progress = null;
      
      console.info('[SessionStorageManager] Progress reset successfully');
      return true;
    } catch (error) {
      console.error('[SessionStorageManager] Error resetting progress:', error);
      return false;
    }
  }

  // =============================================================================
  // セッション管理
  // =============================================================================

  /**
   * 新しい進行状況を作成（初回開始時）
   */
  public createNewProgress(): TrainingProgress {
    const newProgress: TrainingProgress = {
      mode: 'random',
      version: DATA_VERSION,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      sessionHistory: [],
      currentSessionId: 1,
      isCompleted: false,
      availableBaseNotes: [...BASE_NOTE_POOL],
      usedBaseNotes: []
    };

    this.progress = newProgress;
    this.saveProgress(newProgress);
    return newProgress;
  }

  /**
   * セッション結果を追加
   */
  public addSessionResult(sessionResult: SessionResult): boolean {
    try {
      // 進行状況確認
      let progress = this.progress || this.loadProgress();
      if (!progress) {
        progress = this.createNewProgress();
      }

      // セッション結果検証
      if (!isSessionResult(sessionResult)) {
        console.error('[SessionStorageManager] Invalid session result');
        return false;
      }

      // セッションID整合性確認
      if (sessionResult.sessionId !== progress.currentSessionId) {
        console.warn('[SessionStorageManager] Session ID mismatch');
        sessionResult.sessionId = progress.currentSessionId;
      }

      // セッション履歴に追加
      progress.sessionHistory.push(sessionResult);
      
      // 使用済み基音に追加
      if (!progress.usedBaseNotes.includes(sessionResult.baseNote)) {
        progress.usedBaseNotes.push(sessionResult.baseNote);
      }

      // 次セッションID更新
      progress.currentSessionId = Math.min(progress.currentSessionId + 1, 9);

      // 8セッション完了チェック
      if (progress.sessionHistory.length >= 8) {
        progress.isCompleted = true;
        progress.overallGrade = this.calculateOverallGrade(progress.sessionHistory);
        progress.overallAccuracy = this.calculateOverallAccuracy(progress.sessionHistory);
        progress.totalPlayTime = progress.sessionHistory.reduce((sum, session) => sum + session.duration, 0);
      }

      // 保存
      return this.saveProgress(progress);
    } catch (error) {
      console.error('[SessionStorageManager] Error adding session result:', error);
      return false;
    }
  }

  /**
   * 現在のセッション番号を取得
   */
  public getCurrentSessionId(): number {
    const progress = this.progress || this.loadProgress();
    return progress?.currentSessionId || 1;
  }

  /**
   * 次の基音を取得（重複回避）
   */
  public getNextBaseNote(): BaseNote {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      // 初回の場合はランダム選択
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }

    // 使用可能な基音リスト
    const availableNotes = BASE_NOTE_POOL.filter(note => !progress.usedBaseNotes.includes(note));
    
    // 全て使用済みの場合はリセット
    if (availableNotes.length === 0) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }

    // ランダム選択
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
  }

  /**
   * 8セッション完了判定
   */
  public isCompleted(): boolean {
    const progress = this.progress || this.loadProgress();
    return progress?.isCompleted || false;
  }

  // =============================================================================
  // 統合採点システム連携
  // =============================================================================

  /**
   * UnifiedScoreResultFixed用データ生成
   */
  public generateUnifiedScoreData(): UnifiedScoreData | null {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      return null;
    }

    return {
      mode: 'random',
      sessionHistory: progress.sessionHistory.map(session => ({
        sessionId: session.sessionId,
        grade: session.grade,
        accuracy: session.accuracy,
        baseNote: session.baseNote,
        baseName: session.baseName,
        noteResults: session.noteResults,
        completedAt: session.completedAt
      })),
      overallGrade: progress.overallGrade,
      overallAccuracy: progress.overallAccuracy,
      isCompleted: progress.isCompleted,
      totalSessions: progress.sessionHistory.length,
      targetSessions: 8
    };
  }

  // =============================================================================
  // 評価計算ロジック
  // =============================================================================

  /**
   * S-E級総合評価を計算
   */
  public calculateOverallGrade(sessionHistory: SessionResult[]): Grade {
    if (sessionHistory.length < 8) return 'E';

    const gradeCount = sessionHistory.reduce((acc, session) => {
      acc[session.grade] = (acc[session.grade] || 0) + 1;
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0 } as Record<SessionGrade, number>);

    const totalSessions = sessionHistory.length;
    const excellentRatio = gradeCount.excellent / totalSessions;
    const goodPlusRatio = (gradeCount.excellent + gradeCount.good + gradeCount.pass) / totalSessions;

    // UnifiedScoreResultFixed.svelteと同じロジック
    if (excellentRatio >= EVALUATION_THRESHOLDS.S_GRADE.excellentRatio && 
        goodPlusRatio >= EVALUATION_THRESHOLDS.S_GRADE.goodPlusRatio) return 'S';
    if (excellentRatio >= EVALUATION_THRESHOLDS.A_GRADE.excellentRatio && 
        goodPlusRatio >= EVALUATION_THRESHOLDS.A_GRADE.goodPlusRatio) return 'A';
    if (excellentRatio >= EVALUATION_THRESHOLDS.B_GRADE.excellentRatio && 
        goodPlusRatio >= EVALUATION_THRESHOLDS.B_GRADE.goodPlusRatio) return 'B';
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.C_GRADE.goodPlusRatio) return 'C';
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.D_GRADE.goodPlusRatio) return 'D';
    return 'E';
  }

  /**
   * 全体精度平均を計算
   */
  public calculateOverallAccuracy(sessionHistory: SessionResult[]): number {
    if (sessionHistory.length === 0) return 0;
    
    const totalAccuracy = sessionHistory.reduce((sum, session) => sum + session.accuracy, 0);
    return Math.round(totalAccuracy / sessionHistory.length);
  }

  /**
   * セッション評価を計算（8音の結果から4段階評価）
   */
  public calculateSessionGrade(noteResults: NoteResult[]): SessionGrade {
    const results = noteResults.reduce((acc, note) => {
      const grade = this.calculateNoteGrade(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== 'notMeasured') {
        acc.totalError += Math.abs(note.cents || 0);
        acc.measuredCount += 1;
      }
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0, totalError: 0, measuredCount: 0 });

    const averageError = results.measuredCount > 0 ? results.totalError / results.measuredCount : 100;
    const passCount = results.excellent + results.good + results.pass;

    // RandomModeScoreResultと同じ判定ロジック
    if (results.notMeasured > 3) return 'needWork';
    if (results.needWork > 2) return 'needWork';
    if (results.measuredCount === 0) return 'needWork';
    if (averageError <= 20 && results.excellent >= 6) return 'excellent';
    if (averageError <= 30 && passCount >= 7) return 'good';
    if (passCount >= 5) return 'pass';
    return 'needWork';
  }

  /**
   * 音程評価を計算
   */
  private calculateNoteGrade(cents: number | null): SessionGrade | 'notMeasured' {
    if (cents === null || cents === undefined || isNaN(cents)) {
      return 'notMeasured';
    }
    const absCents = Math.abs(cents);
    if (absCents <= EVALUATION_THRESHOLDS.EXCELLENT) return 'excellent';
    if (absCents <= EVALUATION_THRESHOLDS.GOOD) return 'good';
    if (absCents <= EVALUATION_THRESHOLDS.PASS) return 'pass';
    return 'needWork';
  }

  // =============================================================================
  // バックアップ・復旧機能
  // =============================================================================

  /**
   * 自動バックアップ作成
   */
  private createBackup(data: any): boolean {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        data: data
      };
      localStorage.setItem(BACKUP_KEYS.PROGRESS_BACKUP, JSON.stringify(backupData));
      localStorage.setItem(BACKUP_KEYS.LAST_BACKUP, backupData.timestamp);
      return true;
    } catch (error) {
      console.warn('[SessionStorageManager] Backup creation failed:', error);
      return false;
    }
  }

  /**
   * バックアップから復旧
   */
  public restoreFromBackup(): TrainingProgress | null {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEYS.PROGRESS_BACKUP);
      if (!backupStr) return null;

      const backup = JSON.parse(backupStr);
      if (isTrainingProgress(backup.data)) {
        console.info('[SessionStorageManager] Restored from backup:', backup.timestamp);
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error('[SessionStorageManager] Restore failed:', error);
      return null;
    }
  }

  /**
   * バックアップクリア
   */
  private clearBackups(): void {
    try {
      localStorage.removeItem(BACKUP_KEYS.PROGRESS_BACKUP);
      localStorage.removeItem(BACKUP_KEYS.LAST_BACKUP);
    } catch (error) {
      console.warn('[SessionStorageManager] Backup cleanup failed:', error);
    }
  }

  // =============================================================================
  // データ互換性・マイグレーション
  // =============================================================================

  /**
   * データバージョンマイグレーション
   */
  private migrateDataVersion(oldData: any): TrainingProgress | null {
    try {
      // v1.0.0への移行（現在のバージョン）
      if (!oldData.version || oldData.version === '1.0.0') {
        return {
          ...oldData,
          version: DATA_VERSION,
          // 不足フィールドの補完
          availableBaseNotes: oldData.availableBaseNotes || [...BASE_NOTE_POOL],
          usedBaseNotes: oldData.usedBaseNotes || [],
          lastUpdatedAt: oldData.lastUpdatedAt || new Date().toISOString()
        };
      }

      // 未知のバージョンは移行不可
      console.warn('[SessionStorageManager] Unknown data version:', oldData.version);
      return null;
    } catch (error) {
      console.error('[SessionStorageManager] Migration failed:', error);
      return null;
    }
  }

  // =============================================================================
  // ユーティリティ・デバッグ
  // =============================================================================

  /**
   * 現在の進行状況を取得（デバッグ用）
   */
  public getProgress(): TrainingProgress | null {
    return this.progress;
  }

  /**
   * localStorage使用量チェック
   */
  public getStorageInfo(): { used: number; available: boolean } {
    try {
      const testKey = 'storage-test';
      const testValue = 'x'.repeat(1024); // 1KB
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      
      const used = JSON.stringify(localStorage).length;
      return { used, available: true };
    } catch (error) {
      return { used: -1, available: false };
    }
  }

  /**
   * 基音名取得
   */
  public getBaseNoteName(baseNote: BaseNote): string {
    return BASE_NOTE_NAMES[baseNote] || baseNote;
  }
}
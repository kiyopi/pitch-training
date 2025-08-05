// localStorage用セッション管理クラス
// シングルトンパターンで一元管理

import type { 
  TrainingProgress, 
  SessionResult, 
  UnifiedScoreData, 
  SessionGrade, 
  BaseNote,
  VoiceRangeType 
} from '../types/sessionStorage';
import type { Grade, NoteResult } from '../types/scoring';
import { 
  STORAGE_KEYS, 
  BACKUP_KEYS, 
  BASE_NOTE_POOL, 
  BASE_NOTE_NAMES,
  VOICE_RANGE_GROUPS,
  DATA_VERSION,
  EVALUATION_THRESHOLDS,
  isTrainingProgress,
  isSessionResult
} from '../types/sessionStorage';
import { EvaluationEngine } from '../evaluation/EvaluationEngine';

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

      // 健康確認（データ整合性チェック）
      const healthCheckResult = this.performHealthCheck(parsed);
      if (!healthCheckResult.isHealthy) {
        console.warn('[SessionStorageManager] Data health check failed:', healthCheckResult.issues);
        this.createBackup(parsed);
        
        // 修復可能な場合は修復を試行
        if (healthCheckResult.canRepair) {
          const repairedData = this.repairProgressData(parsed, healthCheckResult.issues);
          if (repairedData) {
            console.info('[SessionStorageManager] Data repaired successfully');
            this.saveProgress(repairedData);
            this.progress = repairedData;
            return repairedData;
          }
        }
        
        // 修復不可能な場合は初期化
        console.warn('[SessionStorageManager] Data irreparable, creating new progress');
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
  public createNewProgress(voiceRange: VoiceRangeType = 'middle'): TrainingProgress {
    // 音域に応じた基音リストを取得
    const voiceRangeNotes = [...VOICE_RANGE_GROUPS[voiceRange]];
    
    const newProgress: TrainingProgress = {
      mode: 'random',
      version: DATA_VERSION,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      sessionHistory: [],
      currentSessionId: 1,
      isCompleted: false,
      availableBaseNotes: voiceRangeNotes,
      usedBaseNotes: [],
      voiceRange: voiceRange
    };

    this.progress = newProgress;
    this.saveProgress(newProgress);
    console.info(`[SessionStorageManager] 新進行状況作成: 音域=${voiceRange}, 基音数=${voiceRangeNotes.length}`);
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

      // 8セッション完了チェック
      if (progress.sessionHistory.length >= 8) {
        progress.isCompleted = true;
        progress.overallGrade = this.calculateOverallGrade(progress.sessionHistory);
        progress.overallAccuracy = this.calculateOverallAccuracy(progress.sessionHistory);
        progress.totalPlayTime = progress.sessionHistory.reduce((sum, session) => sum + session.duration, 0);
        // 8セッション完了時はセッションIDを増加させない
        console.info('[SessionStorageManager] 8セッション完了: isCompleted=true, currentSessionId維持');
      } else {
        // 8セッション未完了の場合のみセッションID更新
        progress.currentSessionId = progress.currentSessionId + 1;
        console.info(`[SessionStorageManager] 次セッションに進行: ${progress.currentSessionId}`);
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
   * 次の基音を取得（音域対応＋重複回避＋8セッション最適化）
   */
  public getNextBaseNote(): BaseNote {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      // 初回の場合は中音域からランダム選択
      const middleRangeNotes = VOICE_RANGE_GROUPS.middle;
      return middleRangeNotes[Math.floor(Math.random() * middleRangeNotes.length)];
    }

    // 選択された音域の基音リストを取得
    const voiceRangeNotes = VOICE_RANGE_GROUPS[progress.voiceRange];
    
    // 使用可能な基音リスト（音域内での重複回避）
    const availableNotes = voiceRangeNotes.filter(note => !progress.usedBaseNotes.includes(note));
    
    // 8セッション完了または全て使用済みの場合はリセット
    if (availableNotes.length === 0 || progress.sessionHistory.length >= 8) {
      console.info(`[SessionStorageManager] 基音プールリセット - 音域${progress.voiceRange}で新サイクル開始`);
      return voiceRangeNotes[Math.floor(Math.random() * voiceRangeNotes.length)];
    }

    // 8セッション中は完全重複回避でランダム選択
    const selectedNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    console.info(`[SessionStorageManager] 基音選択: ${selectedNote} (音域: ${progress.voiceRange}, 残り選択肢: ${availableNotes.length}/${voiceRangeNotes.length})`);
    
    return selectedNote;
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
   * 統一された評価ロジックを使用
   */
  public calculateSessionGrade(noteResults: NoteResult[]): SessionGrade {
    return EvaluationEngine.evaluateSession(noteResults);
  }

  /**
   * 音程評価を計算
   * 統一された評価ロジックを使用
   */
  private calculateNoteGrade(cents: number | null): SessionGrade | 'notMeasured' {
    const grade = EvaluationEngine.evaluateNote(cents);
    // EvaluationEngineは5段階評価を返すが、SessionGradeは4段階なので'notMeasured'を特別扱い
    return grade === 'notMeasured' ? 'notMeasured' : grade as SessionGrade;
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
          availableBaseNotes: oldData.availableBaseNotes || [...VOICE_RANGE_GROUPS.middle],
          usedBaseNotes: oldData.usedBaseNotes || [],
          voiceRange: oldData.voiceRange || 'middle',
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

  /**
   * 音域変更（セッション進行中は次回サイクルから適用）  
   */
  public setVoiceRange(voiceRange: VoiceRangeType): boolean {
    try {
      const progress = this.progress || this.loadProgress();
      if (!progress) {
        // 新規作成時は指定音域で作成
        this.createNewProgress(voiceRange);
        return true;
      }

      // セッション進行中の場合は次回サイクル設定として保存
      progress.voiceRange = voiceRange;
      progress.availableBaseNotes = [...VOICE_RANGE_GROUPS[voiceRange]];
      
      // 進行中の場合は使用済み基音をリセット（音域変更のため）
      if (progress.sessionHistory.length > 0 && !progress.isCompleted) {
        console.info(`[SessionStorageManager] 音域変更: ${voiceRange} - 使用済み基音リセット`);
        progress.usedBaseNotes = [];
      }

      this.saveProgress(progress);
      console.info(`[SessionStorageManager] 音域設定更新: ${voiceRange}`);
      return true;
    } catch (error) {
      console.error('[SessionStorageManager] 音域設定エラー:', error);
      return false;
    }
  }

  /**
   * 現在の音域取得
   */
  public getVoiceRange(): VoiceRangeType {
    const progress = this.progress || this.loadProgress();
    return progress?.voiceRange || 'middle';
  }

  /**
   * 8セッション完了後の新サイクル開始（自動リセット）
   */
  public startNewCycleIfCompleted(): boolean {
    const progress = this.progress || this.loadProgress();
    
    if (progress && progress.isCompleted && progress.sessionHistory.length >= 8) {
      console.info('[SessionStorageManager] 8セッション完了検出: 新サイクル開始');
      
      // 統合評価データをバックアップ
      const completedCycleData = this.generateUnifiedScoreData();
      if (completedCycleData) {
        this.createCompletedCycleBackup(completedCycleData);
      }
      
      // 新しい進行状況を作成
      const newProgress = this.createNewProgress();
      console.info('[SessionStorageManager] 新サイクル開始完了: セッション1/8から再開');
      
      return true;
    }
    
    return false;
  }

  /**
   * 完了サイクルのバックアップ作成
   */
  private createCompletedCycleBackup(completedData: UnifiedScoreData): void {
    try {
      const backupKey = `completed-cycle-${Date.now()}`;
      const backupData = {
        timestamp: new Date().toISOString(),
        cycleData: completedData
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.info('[SessionStorageManager] 完了サイクルバックアップ作成:', backupKey);
    } catch (error) {
      console.warn('[SessionStorageManager] 完了サイクルバックアップ失敗:', error);
    }
  }

  // =============================================================================
  // 健康確認・データ修復機能
  // =============================================================================

  /**
   * データ健康確認
   */
  private performHealthCheck(progress: TrainingProgress): {
    isHealthy: boolean;
    canRepair: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    let canRepair = true;

    try {
      // 1. セッションID妥当性確認
      if (progress.currentSessionId < 1 || progress.currentSessionId > 8) {
        issues.push(`無効なセッションID: ${progress.currentSessionId}`);
      }

      // 2. セッション履歴整合性確認
      if (progress.sessionHistory.length > 8) {
        issues.push(`セッション履歴過多: ${progress.sessionHistory.length}件`);
      }

      // 3. 完了状態整合性確認
      if (progress.isCompleted && progress.sessionHistory.length < 8) {
        issues.push(`完了フラグ不整合: isCompleted=true but history=${progress.sessionHistory.length}`);
      }

      // 4. 使用基音リスト確認
      if (progress.usedBaseNotes && progress.usedBaseNotes.length > progress.sessionHistory.length) {
        issues.push(`使用基音リスト不整合: used=${progress.usedBaseNotes.length}, history=${progress.sessionHistory.length}`);
      }

      // 5. セッション履歴のID連続性確認
      for (let i = 0; i < progress.sessionHistory.length; i++) {
        const expectedId = i + 1;
        const actualId = progress.sessionHistory[i].sessionId;
        if (actualId !== expectedId) {
          issues.push(`セッション履歴ID不整合: 位置${i} 期待値${expectedId} 実際値${actualId}`);
          break;
        }
      }

      // 6. リロード検出（セッション途中での不整合）
      const isInProgress = progress.currentSessionId > 1 && !progress.isCompleted;
      const hasHistory = progress.sessionHistory.length > 0;
      const lastSessionId = hasHistory ? Math.max(...progress.sessionHistory.map(s => s.sessionId)) : 0;
      
      if (isInProgress && progress.currentSessionId !== lastSessionId + 1) {
        issues.push(`リロード検出: currentSession=${progress.currentSessionId}, lastHistory=${lastSessionId}`);
      }

      // 修復不可能な条件判定
      if (progress.sessionHistory.length > 8 || 
          (progress.sessionHistory.some(s => !s.sessionId || !s.baseNote))) {
        canRepair = false;
      }

      const isHealthy = issues.length === 0;
      
      if (!isHealthy) {
        console.info('[SessionStorageManager] Health check issues detected:', issues);
      }

      return { isHealthy, canRepair, issues };
    } catch (error) {
      console.error('[SessionStorageManager] Health check error:', error);
      return { isHealthy: false, canRepair: false, issues: ['健康確認処理エラー'] };
    }
  }

  /**
   * データ修復処理
   */
  private repairProgressData(progress: TrainingProgress, issues: string[]): TrainingProgress | null {
    try {
      const repairedProgress = { ...progress };
      
      for (const issue of issues) {
        if (issue.includes('無効なセッションID')) {
          // セッションIDを適切な値に修正
          if (repairedProgress.sessionHistory.length === 0) {
            repairedProgress.currentSessionId = 1;
            console.info('[Repair] セッションIDを1に修正（履歴なし）');
          } else {
            const lastSession = Math.max(...repairedProgress.sessionHistory.map(s => s.sessionId));
            repairedProgress.currentSessionId = Math.min(lastSession + 1, 8);
            console.info('[Repair] セッションIDを修正:', repairedProgress.currentSessionId);
          }
        }
        
        else if (issue.includes('完了フラグ不整合')) {
          // 8セッション未満の場合は完了フラグをfalseに修正
          if (repairedProgress.sessionHistory.length < 8) {
            repairedProgress.isCompleted = false;
            console.info('[Repair] 完了フラグをfalseに修正');
          }
        }
        
        else if (issue.includes('使用基音リスト不整合')) {
          // 使用基音リストを履歴から再構築
          repairedProgress.usedBaseNotes = [...new Set(repairedProgress.sessionHistory.map(s => s.baseNote))];
          console.info('[Repair] 使用基音リスト再構築:', repairedProgress.usedBaseNotes.length);
        }
        
        else if (issue.includes('リロード検出')) {
          // リロード時は進行状況をリセット（新セッション開始）
          console.info('[Repair] リロード検出 - 新セッション開始に修正');
          return null; // 新規作成を促す
        }
      }

      // 修復後の最終確認
      const finalCheck = this.performHealthCheck(repairedProgress);
      if (finalCheck.isHealthy) {
        console.info('[SessionStorageManager] データ修復成功');
        return repairedProgress;
      } else {
        console.warn('[SessionStorageManager] 修復後も問題残存:', finalCheck.issues);
        return null;
      }
      
    } catch (error) {
      console.error('[SessionStorageManager] データ修復エラー:', error);
      return null;
    }
  }
}
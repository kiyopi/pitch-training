import { c as create_ssr_component, v as validate_component } from "../../../../chunks/ssr.js";
import "../../../../chunks/client.js";
import { P as PageLayout } from "../../../../chunks/PageLayout.js";
import "../../../../chunks/PitchDetectionDisplay.svelte_svelte_type_style_lang.js";
import "pitchy";
import "tone";
import { d as derived, w as writable } from "../../../../chunks/index.js";
class EvaluationEngine {
  /**
   * 評価基準定義（統一基準）
   */
  static CRITERIA = {
    note: {
      excellent: 30,
      // ±30¢以内（実用的精度）
      good: 60,
      // ±60¢以内（半音の半分）
      pass: 120
      // ±120¢以内（1セミトーン強）
    },
    session: {
      excellentThreshold: { avgError: 40, excellentCount: 5 },
      // 平均±40¢、優秀5個以上
      goodThreshold: { avgError: 60, passCount: 6 },
      // 平均±60¢、合格6個以上
      passThreshold: { passCount: 4 }
      // 8音中50%が合格以上
    },
    overall: {
      stabilityFirst: true
      // 安定性重視（要練習による大幅減点）
    }
  };
  /**
   * 音程評価を計算（個別の音程）
   * @param cents セント差（±の誤差）
   * @returns 音程グレード
   */
  static evaluateNote(cents) {
    if (cents === null || cents === void 0 || isNaN(cents)) {
      return "notMeasured";
    }
    const absCents = Math.abs(cents);
    if (absCents <= this.CRITERIA.note.excellent) return "excellent";
    if (absCents <= this.CRITERIA.note.good) return "good";
    if (absCents <= this.CRITERIA.note.pass) return "pass";
    return "needWork";
  }
  /**
   * セッション評価を計算（8音の結果から4段階評価）
   * @param noteResults 8音の評価結果
   * @returns セッショングレード
   */
  static evaluateSession(noteResults) {
    if (!noteResults || noteResults.length === 0) return "needWork";
    const gradeCount = noteResults.reduce((acc, note) => {
      const grade = this.evaluateNote(note.cents);
      acc[grade] = (acc[grade] || 0) + 1;
      if (grade !== "notMeasured") {
        acc.totalError += Math.abs(note.cents || 0);
        acc.measuredCount += 1;
      }
      return acc;
    }, {
      excellent: 0,
      good: 0,
      pass: 0,
      needWork: 0,
      notMeasured: 0,
      totalError: 0,
      measuredCount: 0
    });
    const averageError = gradeCount.measuredCount > 0 ? gradeCount.totalError / gradeCount.measuredCount : 100;
    const passCount = gradeCount.excellent + gradeCount.good + gradeCount.pass;
    if (gradeCount.notMeasured > 3 || gradeCount.measuredCount === 0) {
      return "needWork";
    }
    const { excellentThreshold, goodThreshold, passThreshold } = this.CRITERIA.session;
    if (averageError <= excellentThreshold.avgError && gradeCount.excellent >= excellentThreshold.excellentCount) {
      return "excellent";
    }
    if (averageError <= goodThreshold.avgError && passCount >= goodThreshold.passCount) {
      return "good";
    }
    if (passCount >= passThreshold.passCount) {
      return "pass";
    }
    if (gradeCount.needWork >= 6) {
      return "needWork";
    }
    return "needWork";
  }
  /**
   * 統合評価を計算（8セッション完走時の安定性重視評価）
   * @param sessionHistory セッション履歴
   * @returns 統合グレード（S-E級）
   */
  static evaluateOverall(sessionHistory2) {
    if (!sessionHistory2 || sessionHistory2.length === 0) return "E";
    const total = sessionHistory2.length;
    const excellent = sessionHistory2.filter((s) => s.grade === "excellent").length;
    const good = sessionHistory2.filter((s) => s.grade === "good").length;
    const pass = sessionHistory2.filter((s) => s.grade === "pass").length;
    const fail = sessionHistory2.filter((s) => s.grade === "needWork").length;
    const excellentRate = excellent / total;
    const goodOrBetterRate = (excellent + good) / total;
    const successRate = (excellent + good + pass) / total;
    if (this.CRITERIA.overall.stabilityFirst && fail > 0) {
      if (successRate >= 0.875 && goodOrBetterRate >= 0.75) return "C";
      if (successRate >= 0.75) return "D";
      return "E";
    }
    if (excellentRate >= 0.5) return "S";
    if (excellentRate >= 0.25) return "A";
    if (goodOrBetterRate >= 0.875) return "A";
    if (goodOrBetterRate >= 0.75) return "B";
    if (goodOrBetterRate >= 0.5) return "B";
    return "C";
  }
  /**
   * セッションの分布データを計算
   * @param noteResults 音程結果配列
   * @returns 分布データ
   */
  static calculateDistribution(noteResults) {
    const distribution = { excellent: 0, good: 0, pass: 0, needWork: 0, notMeasured: 0 };
    noteResults.forEach((note) => {
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
  static calculateAccuracy(noteResults) {
    if (!noteResults || noteResults.length === 0) return 0;
    const passCount = noteResults.filter((note) => {
      const grade = this.evaluateNote(note.cents);
      return ["excellent", "good", "pass"].includes(grade);
    }).length;
    return Math.round(passCount / noteResults.length * 100);
  }
  /**
   * 平均誤差計算
   * @param noteResults 音程結果配列
   * @returns 平均誤差（セント）
   */
  static calculateAverageError(noteResults) {
    if (!noteResults || noteResults.length === 0) return 0;
    const validResults = noteResults.filter(
      (note) => note.cents !== null && note.cents !== void 0 && !isNaN(note.cents)
    );
    if (validResults.length === 0) return 0;
    const totalError = validResults.reduce((sum, note) => sum + Math.abs(note.cents), 0);
    return Math.round(totalError / validResults.length);
  }
  /**
   * 評価基準を取得（外部参照用）
   * @returns 評価基準オブジェクト
   */
  static getCriteria() {
    return { ...this.CRITERIA };
  }
}
const STORAGE_KEYS = {
  TRAINING_PROGRESS: "pitch-training-random-progress-v1",
  SETTINGS: "pitch-training-settings-v1",
  TEMP_SESSION: "pitch-training-temp-session-v1"
};
const BACKUP_KEYS = {
  LAST_BACKUP: "pitch-training-backup-timestamp",
  PROGRESS_BACKUP: "pitch-training-progress-backup"
};
const BASE_NOTE_POOL = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"];
const BASE_NOTE_NAMES = {
  "C4": "ド（低）",
  "D4": "レ（低）",
  "E4": "ミ（低）",
  "F4": "ファ（低）",
  "G4": "ソ（低）",
  "A4": "ラ（中）",
  "B4": "シ（中）",
  "C5": "ド（高）",
  "D5": "レ（高）",
  "E5": "ミ（高）"
};
const DATA_VERSION = "1.0.0";
const EVALUATION_THRESHOLDS = {
  // S-E級総合評価基準（比率）
  S_GRADE: { excellentRatio: 0.9, goodPlusRatio: 0.95 },
  A_GRADE: { excellentRatio: 0.7, goodPlusRatio: 0.85 },
  B_GRADE: { excellentRatio: 0.5, goodPlusRatio: 0.75 },
  C_GRADE: { goodPlusRatio: 0.65 },
  D_GRADE: { goodPlusRatio: 0.5 }
};
function isSessionResult(obj) {
  return typeof obj === "object" && typeof obj.sessionId === "number" && typeof obj.baseNote === "string" && typeof obj.grade === "string" && typeof obj.accuracy === "number" && Array.isArray(obj.noteResults) && typeof obj.isCompleted === "boolean";
}
function isTrainingProgress(obj) {
  return typeof obj === "object" && obj.mode === "random" && typeof obj.version === "string" && Array.isArray(obj.sessionHistory) && typeof obj.currentSessionId === "number" && typeof obj.isCompleted === "boolean";
}
class SessionStorageManager {
  static instance;
  progress = null;
  // シングルトンパターン
  static getInstance() {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }
  constructor() {
  }
  // =============================================================================
  // 基本操作 (CRUD)
  // =============================================================================
  /**
   * 進行状況をlocalStorageから読み込み
   */
  loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRAINING_PROGRESS);
      if (!stored) {
        this.progress = null;
        return null;
      }
      const parsed = JSON.parse(stored);
      if (!isTrainingProgress(parsed)) {
        console.warn("[SessionStorageManager] Invalid progress data, creating backup");
        this.createBackup(parsed);
        this.progress = null;
        return null;
      }
      const healthCheckResult = this.performHealthCheck(parsed);
      if (!healthCheckResult.isHealthy) {
        console.warn("[SessionStorageManager] Data health check failed:", healthCheckResult.issues);
        this.createBackup(parsed);
        if (healthCheckResult.canRepair) {
          const repairedData = this.repairProgressData(parsed, healthCheckResult.issues);
          if (repairedData) {
            console.info("[SessionStorageManager] Data repaired successfully");
            this.saveProgress(repairedData);
            this.progress = repairedData;
            return repairedData;
          }
        }
        console.warn("[SessionStorageManager] Data irreparable, creating new progress");
        this.progress = null;
        return null;
      }
      if (parsed.version !== DATA_VERSION) {
        console.info("[SessionStorageManager] Data version mismatch, attempting migration");
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
      console.error("[SessionStorageManager] Error loading progress:", error);
      this.progress = null;
      return null;
    }
  }
  /**
   * 進行状況をlocalStorageに保存
   */
  saveProgress(progress) {
    try {
      if (!isTrainingProgress(progress)) {
        console.error("[SessionStorageManager] Invalid progress data for save");
        return false;
      }
      progress.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (this.progress) {
        this.createBackup(this.progress);
      }
      localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
      this.progress = progress;
      console.info("[SessionStorageManager] Progress saved successfully");
      return true;
    } catch (error) {
      console.error("[SessionStorageManager] Error saving progress:", error);
      if (error.name === "QuotaExceededError") {
        this.clearBackups();
        try {
          localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
          this.progress = progress;
          console.info("[SessionStorageManager] Progress saved after backup cleanup");
          return true;
        } catch (retryError) {
          console.error("[SessionStorageManager] Failed to save even after cleanup:", retryError);
        }
      }
      return false;
    }
  }
  /**
   * 進行状況をリセット
   */
  resetProgress() {
    try {
      if (this.progress) {
        this.createBackup(this.progress);
      }
      localStorage.removeItem(STORAGE_KEYS.TRAINING_PROGRESS);
      this.progress = null;
      console.info("[SessionStorageManager] Progress reset successfully");
      return true;
    } catch (error) {
      console.error("[SessionStorageManager] Error resetting progress:", error);
      return false;
    }
  }
  // =============================================================================
  // セッション管理
  // =============================================================================
  /**
   * 新しい進行状況を作成（初回開始時）
   */
  createNewProgress() {
    const newProgress = {
      mode: "random",
      version: DATA_VERSION,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
  addSessionResult(sessionResult) {
    try {
      let progress = this.progress || this.loadProgress();
      if (!progress) {
        progress = this.createNewProgress();
      }
      if (!isSessionResult(sessionResult)) {
        console.error("[SessionStorageManager] Invalid session result");
        return false;
      }
      if (sessionResult.sessionId !== progress.currentSessionId) {
        console.warn("[SessionStorageManager] Session ID mismatch");
        sessionResult.sessionId = progress.currentSessionId;
      }
      progress.sessionHistory.push(sessionResult);
      if (!progress.usedBaseNotes.includes(sessionResult.baseNote)) {
        progress.usedBaseNotes.push(sessionResult.baseNote);
      }
      if (progress.sessionHistory.length >= 8) {
        progress.isCompleted = true;
        progress.overallGrade = this.calculateOverallGrade(progress.sessionHistory);
        progress.overallAccuracy = this.calculateOverallAccuracy(progress.sessionHistory);
        progress.totalPlayTime = progress.sessionHistory.reduce((sum, session) => sum + session.duration, 0);
        console.info("[SessionStorageManager] 8セッション完了: isCompleted=true, currentSessionId維持");
      } else {
        progress.currentSessionId = progress.currentSessionId + 1;
        console.info(`[SessionStorageManager] 次セッションに進行: ${progress.currentSessionId}`);
      }
      return this.saveProgress(progress);
    } catch (error) {
      console.error("[SessionStorageManager] Error adding session result:", error);
      return false;
    }
  }
  /**
   * 現在のセッション番号を取得
   */
  getCurrentSessionId() {
    const progress = this.progress || this.loadProgress();
    return progress?.currentSessionId || 1;
  }
  /**
   * 次の基音を取得（重複回避）
   */
  getNextBaseNote() {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }
    const availableNotes = BASE_NOTE_POOL.filter((note) => !progress.usedBaseNotes.includes(note));
    if (availableNotes.length === 0) {
      return BASE_NOTE_POOL[Math.floor(Math.random() * BASE_NOTE_POOL.length)];
    }
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
  }
  /**
   * 8セッション完了判定
   */
  isCompleted() {
    const progress = this.progress || this.loadProgress();
    return progress?.isCompleted || false;
  }
  // =============================================================================
  // 統合採点システム連携
  // =============================================================================
  /**
   * UnifiedScoreResultFixed用データ生成
   */
  generateUnifiedScoreData() {
    const progress = this.progress || this.loadProgress();
    if (!progress) {
      return null;
    }
    return {
      mode: "random",
      sessionHistory: progress.sessionHistory.map((session) => ({
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
  calculateOverallGrade(sessionHistory2) {
    if (sessionHistory2.length < 8) return "E";
    const gradeCount = sessionHistory2.reduce((acc, session) => {
      acc[session.grade] = (acc[session.grade] || 0) + 1;
      return acc;
    }, { excellent: 0, good: 0, pass: 0, needWork: 0 });
    const totalSessions = sessionHistory2.length;
    const excellentRatio = gradeCount.excellent / totalSessions;
    const goodPlusRatio = (gradeCount.excellent + gradeCount.good + gradeCount.pass) / totalSessions;
    if (excellentRatio >= EVALUATION_THRESHOLDS.S_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.S_GRADE.goodPlusRatio) return "S";
    if (excellentRatio >= EVALUATION_THRESHOLDS.A_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.A_GRADE.goodPlusRatio) return "A";
    if (excellentRatio >= EVALUATION_THRESHOLDS.B_GRADE.excellentRatio && goodPlusRatio >= EVALUATION_THRESHOLDS.B_GRADE.goodPlusRatio) return "B";
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.C_GRADE.goodPlusRatio) return "C";
    if (goodPlusRatio >= EVALUATION_THRESHOLDS.D_GRADE.goodPlusRatio) return "D";
    return "E";
  }
  /**
   * 全体精度平均を計算
   */
  calculateOverallAccuracy(sessionHistory2) {
    if (sessionHistory2.length === 0) return 0;
    const totalAccuracy = sessionHistory2.reduce((sum, session) => sum + session.accuracy, 0);
    return Math.round(totalAccuracy / sessionHistory2.length);
  }
  /**
   * セッション評価を計算（8音の結果から4段階評価）
   * 統一された評価ロジックを使用
   */
  calculateSessionGrade(noteResults) {
    return EvaluationEngine.evaluateSession(noteResults);
  }
  /**
   * 音程評価を計算
   * 統一された評価ロジックを使用
   */
  calculateNoteGrade(cents) {
    const grade = EvaluationEngine.evaluateNote(cents);
    return grade === "notMeasured" ? "notMeasured" : grade;
  }
  // =============================================================================
  // バックアップ・復旧機能
  // =============================================================================
  /**
   * 自動バックアップ作成
   */
  createBackup(data) {
    try {
      const backupData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data
      };
      localStorage.setItem(BACKUP_KEYS.PROGRESS_BACKUP, JSON.stringify(backupData));
      localStorage.setItem(BACKUP_KEYS.LAST_BACKUP, backupData.timestamp);
      return true;
    } catch (error) {
      console.warn("[SessionStorageManager] Backup creation failed:", error);
      return false;
    }
  }
  /**
   * バックアップから復旧
   */
  restoreFromBackup() {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEYS.PROGRESS_BACKUP);
      if (!backupStr) return null;
      const backup = JSON.parse(backupStr);
      if (isTrainingProgress(backup.data)) {
        console.info("[SessionStorageManager] Restored from backup:", backup.timestamp);
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error("[SessionStorageManager] Restore failed:", error);
      return null;
    }
  }
  /**
   * バックアップクリア
   */
  clearBackups() {
    try {
      localStorage.removeItem(BACKUP_KEYS.PROGRESS_BACKUP);
      localStorage.removeItem(BACKUP_KEYS.LAST_BACKUP);
    } catch (error) {
      console.warn("[SessionStorageManager] Backup cleanup failed:", error);
    }
  }
  // =============================================================================
  // データ互換性・マイグレーション
  // =============================================================================
  /**
   * データバージョンマイグレーション
   */
  migrateDataVersion(oldData) {
    try {
      if (!oldData.version || oldData.version === "1.0.0") {
        return {
          ...oldData,
          version: DATA_VERSION,
          // 不足フィールドの補完
          availableBaseNotes: oldData.availableBaseNotes || [...BASE_NOTE_POOL],
          usedBaseNotes: oldData.usedBaseNotes || [],
          lastUpdatedAt: oldData.lastUpdatedAt || (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      console.warn("[SessionStorageManager] Unknown data version:", oldData.version);
      return null;
    } catch (error) {
      console.error("[SessionStorageManager] Migration failed:", error);
      return null;
    }
  }
  // =============================================================================
  // ユーティリティ・デバッグ
  // =============================================================================
  /**
   * 現在の進行状況を取得（デバッグ用）
   */
  getProgress() {
    return this.progress;
  }
  /**
   * localStorage使用量チェック
   */
  getStorageInfo() {
    try {
      const testKey = "storage-test";
      const testValue = "x".repeat(1024);
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
  getBaseNoteName(baseNote) {
    return BASE_NOTE_NAMES[baseNote] || baseNote;
  }
  /**
   * 8セッション完了後の新サイクル開始（自動リセット）
   */
  startNewCycleIfCompleted() {
    const progress = this.progress || this.loadProgress();
    if (progress && progress.isCompleted && progress.sessionHistory.length >= 8) {
      console.info("[SessionStorageManager] 8セッション完了検出: 新サイクル開始");
      const completedCycleData = this.generateUnifiedScoreData();
      if (completedCycleData) {
        this.createCompletedCycleBackup(completedCycleData);
      }
      this.createNewProgress();
      console.info("[SessionStorageManager] 新サイクル開始完了: セッション1/8から再開");
      return true;
    }
    return false;
  }
  /**
   * 完了サイクルのバックアップ作成
   */
  createCompletedCycleBackup(completedData) {
    try {
      const backupKey = `completed-cycle-${Date.now()}`;
      const backupData = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cycleData: completedData
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.info("[SessionStorageManager] 完了サイクルバックアップ作成:", backupKey);
    } catch (error) {
      console.warn("[SessionStorageManager] 完了サイクルバックアップ失敗:", error);
    }
  }
  // =============================================================================
  // 健康確認・データ修復機能
  // =============================================================================
  /**
   * データ健康確認
   */
  performHealthCheck(progress) {
    const issues = [];
    let canRepair = true;
    try {
      if (progress.currentSessionId < 1 || progress.currentSessionId > 8) {
        issues.push(`無効なセッションID: ${progress.currentSessionId}`);
      }
      if (progress.sessionHistory.length > 8) {
        issues.push(`セッション履歴過多: ${progress.sessionHistory.length}件`);
      }
      if (progress.isCompleted && progress.sessionHistory.length < 8) {
        issues.push(`完了フラグ不整合: isCompleted=true but history=${progress.sessionHistory.length}`);
      }
      if (progress.usedBaseNotes && progress.usedBaseNotes.length > progress.sessionHistory.length) {
        issues.push(`使用基音リスト不整合: used=${progress.usedBaseNotes.length}, history=${progress.sessionHistory.length}`);
      }
      for (let i = 0; i < progress.sessionHistory.length; i++) {
        const expectedId = i + 1;
        const actualId = progress.sessionHistory[i].sessionId;
        if (actualId !== expectedId) {
          issues.push(`セッション履歴ID不整合: 位置${i} 期待値${expectedId} 実際値${actualId}`);
          break;
        }
      }
      const isInProgress = progress.currentSessionId > 1 && !progress.isCompleted;
      const hasHistory = progress.sessionHistory.length > 0;
      const lastSessionId = hasHistory ? Math.max(...progress.sessionHistory.map((s) => s.sessionId)) : 0;
      if (isInProgress && progress.currentSessionId !== lastSessionId + 1) {
        issues.push(`リロード検出: currentSession=${progress.currentSessionId}, lastHistory=${lastSessionId}`);
      }
      if (progress.sessionHistory.length > 8 || progress.sessionHistory.some((s) => !s.sessionId || !s.baseNote)) {
        canRepair = false;
      }
      const isHealthy = issues.length === 0;
      if (!isHealthy) {
        console.info("[SessionStorageManager] Health check issues detected:", issues);
      }
      return { isHealthy, canRepair, issues };
    } catch (error) {
      console.error("[SessionStorageManager] Health check error:", error);
      return { isHealthy: false, canRepair: false, issues: ["健康確認処理エラー"] };
    }
  }
  /**
   * データ修復処理
   */
  repairProgressData(progress, issues) {
    try {
      const repairedProgress = { ...progress };
      for (const issue of issues) {
        if (issue.includes("無効なセッションID")) {
          if (repairedProgress.sessionHistory.length === 0) {
            repairedProgress.currentSessionId = 1;
            console.info("[Repair] セッションIDを1に修正（履歴なし）");
          } else {
            const lastSession = Math.max(...repairedProgress.sessionHistory.map((s) => s.sessionId));
            repairedProgress.currentSessionId = Math.min(lastSession + 1, 8);
            console.info("[Repair] セッションIDを修正:", repairedProgress.currentSessionId);
          }
        } else if (issue.includes("完了フラグ不整合")) {
          if (repairedProgress.sessionHistory.length < 8) {
            repairedProgress.isCompleted = false;
            console.info("[Repair] 完了フラグをfalseに修正");
          }
        } else if (issue.includes("使用基音リスト不整合")) {
          repairedProgress.usedBaseNotes = [...new Set(repairedProgress.sessionHistory.map((s) => s.baseNote))];
          console.info("[Repair] 使用基音リスト再構築:", repairedProgress.usedBaseNotes.length);
        } else if (issue.includes("リロード検出")) {
          console.info("[Repair] リロード検出 - 新セッション開始に修正");
          return null;
        }
      }
      const finalCheck = this.performHealthCheck(repairedProgress);
      if (finalCheck.isHealthy) {
        console.info("[SessionStorageManager] データ修復成功");
        return repairedProgress;
      } else {
        console.warn("[SessionStorageManager] 修復後も問題残存:", finalCheck.issues);
        return null;
      }
    } catch (error) {
      console.error("[SessionStorageManager] データ修復エラー:", error);
      return null;
    }
  }
}
const trainingProgress = writable(null);
derived(
  trainingProgress,
  ($progress) => $progress?.isCompleted || false
);
const sessionHistory = derived(
  trainingProgress,
  ($progress) => $progress?.sessionHistory || []
);
derived(
  trainingProgress,
  ($progress) => $progress?.overallGrade || null
);
derived(
  trainingProgress,
  ($progress) => $progress?.overallAccuracy || 0
);
derived(
  trainingProgress,
  ($progress) => $progress?.totalPlayTime || 0
);
derived(
  trainingProgress,
  ($progress) => $progress?.usedBaseNotes || []
);
derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return null;
    const manager = SessionStorageManager.getInstance();
    return manager.generateUnifiedScoreData();
  }
);
derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return 0;
    return Math.min($progress.sessionHistory.length / 8 * 100, 100);
  }
);
derived(
  trainingProgress,
  ($progress) => {
    if (!$progress) return 8;
    return Math.max(8 - $progress.sessionHistory.length, 0);
  }
);
derived(
  sessionHistory,
  ($history) => {
    if ($history.length === 0) return null;
    return $history[$history.length - 1];
  }
);
const css = {
  code: ".random-training-page.svelte-10utq8e.svelte-10utq8e{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:var(--space-6)}.page-header.svelte-10utq8e.svelte-10utq8e{text-align:center;margin-bottom:var(--space-6)}.page-title.svelte-10utq8e.svelte-10utq8e{font-size:var(--text-3xl);font-weight:700;color:var(--color-gray-900);margin:0 0 var(--space-3) 0}.page-description.svelte-10utq8e.svelte-10utq8e{font-size:var(--text-lg);color:var(--color-gray-600);margin:0;max-width:600px;margin-left:auto;margin-right:auto}.mic-test-required.svelte-10utq8e.svelte-10utq8e{display:flex;justify-content:center;margin:var(--space-8) 0}.warning-card.svelte-10utq8e.svelte-10utq8e{display:flex;align-items:center;gap:var(--space-4);padding:var(--space-6);background-color:#fef3c7;border:1px solid #fcd34d;border-radius:12px;max-width:500px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}.warning-icon.svelte-10utq8e.svelte-10utq8e{font-size:3rem;flex-shrink:0}.warning-content.svelte-10utq8e h3.svelte-10utq8e{font-size:var(--text-xl);font-weight:600;color:#92400e;margin:0 0 var(--space-2) 0}.warning-content.svelte-10utq8e p.svelte-10utq8e{font-size:var(--text-base);color:#92400e;margin:0 0 var(--space-4) 0;line-height:1.5}.mic-test-button.svelte-10utq8e.svelte-10utq8e{background-color:#f59e0b;color:white;border:none;border-radius:8px;padding:12px 24px;font-size:var(--text-base);font-weight:600;cursor:pointer;transition:all 0.3s ease}.mic-test-button.svelte-10utq8e.svelte-10utq8e:hover{background-color:#d97706;transform:translateY(-1px);box-shadow:0 4px 8px rgba(0, 0, 0, 0.15)}@media(max-width: 768px){.page-title.svelte-10utq8e.svelte-10utq8e{font-size:var(--text-2xl)}.page-description.svelte-10utq8e.svelte-10utq8e{font-size:var(--text-base)}.warning-card.svelte-10utq8e.svelte-10utq8e{flex-direction:column;text-align:center;margin:0 var(--space-4)}.warning-icon.svelte-10utq8e.svelte-10utq8e{font-size:2rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<!--\\nランダム基音トレーニングページ - TrainingCore統合版\\n既存機能を完全に保護しながらTrainingCoreを使用\\n-->\\n\\n<script>\\n  import { onMount } from 'svelte';\\n  import { goto } from '$app/navigation';\\n  import { base } from '$app/paths';\\n  import PageLayout from '$lib/components/PageLayout.svelte';\\n  import TrainingCore from '$lib/components/TrainingCore.svelte';\\n\\n  // マイクテスト完了確認\\n  let micTestCompleted = false;\\n  \\n  onMount(() => {\\n    // マイクテスト完了フラグ確認\\n    micTestCompleted = localStorage.getItem('mic-test-completed') === 'true';\\n    console.log('🎤 [RandomTraining] マイクテスト完了フラグ:', micTestCompleted);\\n  });\\n\\n  // TrainingCore エラーハンドラ\\n  function handleMicrophoneError(error) {\\n    console.error('🚨 [RandomTraining] マイクロフォンエラー:', error);\\n    // マイクエラー時はマイクテストページに誘導\\n    goto(\`\${base}/microphone-test?mode=random\`);\\n  }\\n\\n  function handleStorageError(error) {\\n    console.error('🚨 [RandomTraining] ストレージエラー:', error);\\n  }\\n\\n  // TrainingCore コールバック\\n  function handleSessionComplete() {\\n    console.log('✅ [RandomTraining] セッション完了');\\n  }\\n\\n  function handleAllComplete() {\\n    console.log('🎉 [RandomTraining] 8セッション完了！');\\n  }\\n<\/script>\\n\\n<svelte:head>\\n  <title>ランダム基音トレーニング - 相対音感トレーニング</title>\\n</svelte:head>\\n\\n<PageLayout showBackButton={true}>\\n  <div class=\\"random-training-page\\">\\n    \\n    <!-- ページヘッダー -->\\n    <div class=\\"page-header\\">\\n      <h1 class=\\"page-title\\">🎲 ランダム基音トレーニング</h1>\\n      <p class=\\"page-description\\">\\n        10種類の基音からランダムに選択して、8音階の相対音感を鍛えます\\n      </p>\\n    </div>\\n\\n    <!-- マイクテスト未完了の場合は誘導 -->\\n    {#if !micTestCompleted}\\n      <div class=\\"mic-test-required\\">\\n        <div class=\\"warning-card\\">\\n          <div class=\\"warning-icon\\">⚠️</div>\\n          <div class=\\"warning-content\\">\\n            <h3>マイクテストが必要です</h3>\\n            <p>トレーニングを開始する前に、マイクの動作確認を行ってください。</p>\\n            <button \\n              class=\\"mic-test-button\\"\\n              on:click={() => goto(\`\${base}/microphone-test?mode=random\`)}\\n            >\\n              マイクテストを開始\\n            </button>\\n          </div>\\n        </div>\\n      </div>\\n    {:else}\\n      <!-- TrainingCore統合 -->\\n      <TrainingCore\\n        mode=\\"random\\"\\n        autoPlay={false}\\n        sessionCount={8}\\n        useLocalStorage={true}\\n        sessionKey=\\"random-training-progress\\"\\n        onMicrophoneError={handleMicrophoneError}\\n        onStorageError={handleStorageError}\\n        onSessionComplete={handleSessionComplete}\\n        onAllComplete={handleAllComplete}\\n      />\\n    {/if}\\n\\n  </div>\\n</PageLayout>\\n\\n<style>\\n  .random-training-page {\\n    max-width: 1200px;\\n    margin: 0 auto;\\n    display: flex;\\n    flex-direction: column;\\n    gap: var(--space-6);\\n  }\\n\\n  .page-header {\\n    text-align: center;\\n    margin-bottom: var(--space-6);\\n  }\\n\\n  .page-title {\\n    font-size: var(--text-3xl);\\n    font-weight: 700;\\n    color: var(--color-gray-900);\\n    margin: 0 0 var(--space-3) 0;\\n  }\\n\\n  .page-description {\\n    font-size: var(--text-lg);\\n    color: var(--color-gray-600);\\n    margin: 0;\\n    max-width: 600px;\\n    margin-left: auto;\\n    margin-right: auto;\\n  }\\n\\n  /* マイクテスト必須警告 */\\n  .mic-test-required {\\n    display: flex;\\n    justify-content: center;\\n    margin: var(--space-8) 0;\\n  }\\n\\n  .warning-card {\\n    display: flex;\\n    align-items: center;\\n    gap: var(--space-4);\\n    padding: var(--space-6);\\n    background-color: #fef3c7;\\n    border: 1px solid #fcd34d;\\n    border-radius: 12px;\\n    max-width: 500px;\\n    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\\n  }\\n\\n  .warning-icon {\\n    font-size: 3rem;\\n    flex-shrink: 0;\\n  }\\n\\n  .warning-content h3 {\\n    font-size: var(--text-xl);\\n    font-weight: 600;\\n    color: #92400e;\\n    margin: 0 0 var(--space-2) 0;\\n  }\\n\\n  .warning-content p {\\n    font-size: var(--text-base);\\n    color: #92400e;\\n    margin: 0 0 var(--space-4) 0;\\n    line-height: 1.5;\\n  }\\n\\n  .mic-test-button {\\n    background-color: #f59e0b;\\n    color: white;\\n    border: none;\\n    border-radius: 8px;\\n    padding: 12px 24px;\\n    font-size: var(--text-base);\\n    font-weight: 600;\\n    cursor: pointer;\\n    transition: all 0.3s ease;\\n  }\\n\\n  .mic-test-button:hover {\\n    background-color: #d97706;\\n    transform: translateY(-1px);\\n    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);\\n  }\\n\\n  /* レスポンシブ対応 */\\n  @media (max-width: 768px) {\\n    .page-title {\\n      font-size: var(--text-2xl);\\n    }\\n    \\n    .page-description {\\n      font-size: var(--text-base);\\n    }\\n    \\n    .warning-card {\\n      flex-direction: column;\\n      text-align: center;\\n      margin: 0 var(--space-4);\\n    }\\n    \\n    .warning-icon {\\n      font-size: 2rem;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"AA6FE,mDAAsB,CACpB,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,IAAI,SAAS,CACpB,CAEA,0CAAa,CACX,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IAAI,SAAS,CAC9B,CAEA,yCAAY,CACV,SAAS,CAAE,IAAI,UAAU,CAAC,CAC1B,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,SAAS,CAAC,CAAC,CAC7B,CAEA,+CAAkB,CAChB,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,CAAC,CACT,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,IAAI,CACjB,YAAY,CAAE,IAChB,CAGA,gDAAmB,CACjB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,IAAI,SAAS,CAAC,CAAC,CACzB,CAEA,2CAAc,CACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,IAAI,SAAS,CAAC,CACnB,OAAO,CAAE,IAAI,SAAS,CAAC,CACvB,gBAAgB,CAAE,OAAO,CACzB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,IAAI,CACnB,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAC5C,CAEA,2CAAc,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,CACf,CAEA,+BAAgB,CAAC,iBAAG,CAClB,SAAS,CAAE,IAAI,SAAS,CAAC,CACzB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,OAAO,CACd,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,SAAS,CAAC,CAAC,CAC7B,CAEA,+BAAgB,CAAC,gBAAE,CACjB,SAAS,CAAE,IAAI,WAAW,CAAC,CAC3B,KAAK,CAAE,OAAO,CACd,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,SAAS,CAAC,CAAC,CAAC,CAC5B,WAAW,CAAE,GACf,CAEA,8CAAiB,CACf,gBAAgB,CAAE,OAAO,CACzB,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,SAAS,CAAE,IAAI,WAAW,CAAC,CAC3B,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,GAAG,CAAC,IAAI,CAAC,IACvB,CAEA,8CAAgB,MAAO,CACrB,gBAAgB,CAAE,OAAO,CACzB,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAC1C,CAGA,MAAO,YAAY,KAAK,CAAE,CACxB,yCAAY,CACV,SAAS,CAAE,IAAI,UAAU,CAC3B,CAEA,+CAAkB,CAChB,SAAS,CAAE,IAAI,WAAW,CAC5B,CAEA,2CAAc,CACZ,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,MAAM,CAClB,MAAM,CAAE,CAAC,CAAC,IAAI,SAAS,CACzB,CAEA,2CAAc,CACZ,SAAS,CAAE,IACb,CACF"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `  ${$$result.head += `<!-- HEAD_svelte-1vq2j1p_START -->${$$result.title = `<title>ランダム基音トレーニング - 相対音感トレーニング</title>`, ""}<!-- HEAD_svelte-1vq2j1p_END -->`, ""} ${validate_component(PageLayout, "PageLayout").$$render($$result, { showBackButton: true }, {}, {
    default: () => {
      return `<div class="random-training-page svelte-10utq8e"> <div class="page-header svelte-10utq8e"><h1 class="page-title svelte-10utq8e" data-svelte-h="svelte-1tiu1to">🎲 ランダム基音トレーニング</h1> <p class="page-description svelte-10utq8e" data-svelte-h="svelte-txi64f">10種類の基音からランダムに選択して、8音階の相対音感を鍛えます</p></div>  ${`<div class="mic-test-required svelte-10utq8e"><div class="warning-card svelte-10utq8e"><div class="warning-icon svelte-10utq8e" data-svelte-h="svelte-dwi5dc">⚠️</div> <div class="warning-content svelte-10utq8e"><h3 class="svelte-10utq8e" data-svelte-h="svelte-17kvze2">マイクテストが必要です</h3> <p class="svelte-10utq8e" data-svelte-h="svelte-1fktfmj">トレーニングを開始する前に、マイクの動作確認を行ってください。</p> <button class="mic-test-button svelte-10utq8e" data-svelte-h="svelte-o2l4j9">マイクテストを開始</button></div></div></div>`}</div>`;
    }
  })}`;
});
export {
  Page as default
};

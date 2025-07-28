import { c as create_ssr_component, e as escape, f as each } from "../../../chunks/ssr.js";
class IntervalAnalyzer {
  constructor() {
    this.intervalTypes = {
      unison: {
        name: "同度",
        semitones: 0,
        importance: 0.8,
        description: "基音と同じ高さ",
        difficulty: "基本",
        commonErrors: ["微細なピッチのずれ"]
      },
      minorSecond: {
        name: "短2度",
        semitones: 1,
        importance: 0.9,
        description: "半音上",
        difficulty: "高",
        commonErrors: ["長2度との混同", "音程幅の過大評価"]
      },
      majorSecond: {
        name: "長2度",
        semitones: 2,
        importance: 1,
        description: "全音上（ドレ）",
        difficulty: "基本",
        commonErrors: ["短2度との混同"]
      },
      minorThird: {
        name: "短3度",
        semitones: 3,
        importance: 1,
        description: "短調の3度（ドミ♭）",
        difficulty: "中",
        commonErrors: ["長3度との混同"]
      },
      majorThird: {
        name: "長3度",
        semitones: 4,
        importance: 1,
        description: "長調の3度（ドミ）",
        difficulty: "基本",
        commonErrors: ["短3度との混同", "完全4度への誤認"]
      },
      perfectFourth: {
        name: "完全4度",
        semitones: 5,
        importance: 0.9,
        description: "安定した協和音程（ドファ）",
        difficulty: "基本",
        commonErrors: ["長3度・減5度との混同"]
      },
      tritone: {
        name: "減5度",
        semitones: 6,
        importance: 0.7,
        description: "不安定な音程（ドファ#）",
        difficulty: "高",
        commonErrors: ["完全4度・完全5度との混同"]
      },
      perfectFifth: {
        name: "完全5度",
        semitones: 7,
        importance: 0.9,
        description: "最も安定した音程（ドソ）",
        difficulty: "基本",
        commonErrors: ["減5度・長6度との混同"]
      },
      minorSixth: {
        name: "短6度",
        semitones: 8,
        importance: 0.8,
        description: "短調的色彩（ドラ♭）",
        difficulty: "中",
        commonErrors: ["長6度・完全5度との混同"]
      },
      majorSixth: {
        name: "長6度",
        semitones: 9,
        importance: 0.8,
        description: "明るい響き（ドラ）",
        difficulty: "中",
        commonErrors: ["短6度・短7度との混同"]
      },
      minorSeventh: {
        name: "短7度",
        semitones: 10,
        importance: 0.7,
        description: "属7和音の7度（ドシ♭）",
        difficulty: "中",
        commonErrors: ["長7度・長6度との混同"]
      },
      majorSeventh: {
        name: "長7度",
        semitones: 11,
        importance: 0.7,
        description: "鋭い不協和音程（ドシ）",
        difficulty: "高",
        commonErrors: ["短7度・8度との混同"]
      },
      octave: {
        name: "8度",
        semitones: 12,
        importance: 0.9,
        description: "1オクターブ上（ドド）",
        difficulty: "基本",
        commonErrors: ["HarmonicCorrectionによる倍音誤検出"]
      }
    };
    this.masteryData = /* @__PURE__ */ new Map();
    this.analysisHistory = [];
    this.maxHistoryLength = 100;
    this.debugMode = true;
    this.initializeMasteryData();
    this.log("🎵 IntervalAnalyzer初期化完了", {
      intervalCount: Object.keys(this.intervalTypes).length,
      masteryData: this.masteryData.size
    });
  }
  /**
   * メイン音程分析処理
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - 音程分析結果
   */
  analyzeInterval(baseFreq, targetFreq, detectedFreq) {
    try {
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      const targetInterval = this.identifyInterval(targetSemitones);
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      const detectedInterval = this.identifyInterval(detectedSemitones);
      const accuracy = this.calculateIntervalAccuracy(targetSemitones, detectedSemitones);
      this.updateMastery(targetInterval.key, accuracy);
      const mastery = this.getMastery(targetInterval.key);
      const analysis = {
        targetInterval,
        detectedInterval,
        targetSemitones,
        detectedSemitones,
        accuracy,
        mastery,
        isCorrectInterval: targetInterval.key === detectedInterval.key,
        feedback: this.generateIntervalFeedback(targetInterval, detectedInterval, accuracy),
        timestamp: Date.now()
      };
      this.recordAnalysis(analysis);
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [IntervalAnalyzer] 分析エラー:", error);
      return this.createErrorResult(baseFreq, targetFreq, detectedFreq);
    }
  }
  /**
   * 周波数からセミトーン差を計算
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {number} - セミトーン数（小数点含む）
   */
  calculateSemitones(baseFreq, targetFreq) {
    if (!baseFreq || !targetFreq || baseFreq <= 0 || targetFreq <= 0) {
      return 0;
    }
    const semitones = 12 * Math.log2(targetFreq / baseFreq);
    const normalizedSemitones = (semitones % 12 + 12) % 12;
    return normalizedSemitones;
  }
  /**
   * セミトーン数から音程を特定
   * @param {number} semitones - セミトーン数
   * @returns {Object} - 音程情報
   */
  identifyInterval(semitones) {
    let closestInterval = null;
    let minDistance = Infinity;
    for (const [key, interval] of Object.entries(this.intervalTypes)) {
      const distance = Math.abs(semitones - interval.semitones);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = { key, ...interval, distance };
      }
    }
    return closestInterval;
  }
  /**
   * 音程精度の計算
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {number} - 精度スコア (0-100)
   */
  calculateIntervalAccuracy(targetSemitones, detectedSemitones) {
    const semitoneDiff = Math.abs(targetSemitones - detectedSemitones);
    const accuracy = Math.max(0, 100 - semitoneDiff * 50);
    return Math.min(100, accuracy);
  }
  /**
   * 習得度の更新
   * @param {string} intervalKey - 音程キー
   * @param {number} accuracy - 精度スコア
   */
  updateMastery(intervalKey, accuracy) {
    if (!this.masteryData.has(intervalKey)) {
      this.masteryData.set(intervalKey, {
        attempts: 0,
        totalAccuracy: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        recentAttempts: [],
        lastAttempt: null,
        trend: "stable"
      });
    }
    const mastery = this.masteryData.get(intervalKey);
    mastery.attempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.lastAttempt = Date.now();
    mastery.recentAttempts.push(accuracy);
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
    }
    mastery.trend = this.calculateTrend(mastery.recentAttempts);
    this.masteryData.set(intervalKey, mastery);
  }
  /**
   * 習得度の取得
   * @param {string} intervalKey - 音程キー
   * @returns {Object} - 習得度情報
   */
  getMastery(intervalKey) {
    const mastery = this.masteryData.get(intervalKey);
    if (!mastery) {
      return {
        attempts: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        level: "beginner",
        progress: 0
      };
    }
    const level = this.determineMasteryLevel(mastery.averageAccuracy, mastery.attempts);
    const progress = Math.min(100, mastery.averageAccuracy * mastery.attempts / 500);
    return {
      ...mastery,
      level,
      progress: Math.round(progress)
    };
  }
  /**
   * 習得レベルの判定
   * @param {number} averageAccuracy - 平均精度
   * @param {number} attempts - 試行回数
   * @returns {string} - 習得レベル
   */
  determineMasteryLevel(averageAccuracy, attempts) {
    if (attempts < 3) return "beginner";
    if (averageAccuracy >= 90 && attempts >= 10) return "master";
    if (averageAccuracy >= 80 && attempts >= 7) return "advanced";
    if (averageAccuracy >= 70 && attempts >= 5) return "intermediate";
    if (averageAccuracy >= 50) return "novice";
    return "beginner";
  }
  /**
   * トレンド分析
   * @param {Array} recentAttempts - 直近の試行結果
   * @returns {string} - トレンド ('improving' | 'stable' | 'declining')
   */
  calculateTrend(recentAttempts) {
    if (recentAttempts.length < 3) return "stable";
    const recent = recentAttempts.slice(-3);
    const earlier = recentAttempts.slice(-6, -3);
    if (earlier.length === 0) return "stable";
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    const improvement = recentAvg - earlierAvg;
    if (improvement > 5) return "improving";
    if (improvement < -5) return "declining";
    return "stable";
  }
  /**
   * 音程フィードバック生成
   * @param {Object} targetInterval - 目標音程
   * @param {Object} detectedInterval - 検出音程
   * @param {number} accuracy - 精度
   * @returns {string} - フィードバックメッセージ
   */
  generateIntervalFeedback(targetInterval, detectedInterval, accuracy) {
    const isCorrect = targetInterval.key === detectedInterval.key;
    if (isCorrect && accuracy >= 90) {
      return `🎯 ${targetInterval.name}を完璧に認識しました！`;
    }
    if (isCorrect && accuracy >= 70) {
      return `✅ ${targetInterval.name}の認識は正しいです。精度を上げてみましょう。`;
    }
    if (isCorrect) {
      return `👍 ${targetInterval.name}を認識できています。もう少し正確に。`;
    }
    const errorType = this.analyzeIntervalError(targetInterval, detectedInterval);
    return `❌ ${targetInterval.name}ではなく${detectedInterval.name}と認識されました。${errorType}`;
  }
  /**
   * 音程エラーの分析
   * @param {Object} target - 目標音程
   * @param {Object} detected - 検出音程
   * @returns {string} - エラー分析結果
   */
  analyzeIntervalError(target, detected) {
    const semitoneDiff = detected.semitones - target.semitones;
    if (Math.abs(semitoneDiff) === 1) {
      return semitoneDiff > 0 ? "少し高めに歌っています。" : "少し低めに歌っています。";
    }
    if (Math.abs(semitoneDiff) <= 2) {
      return "音程幅の調整が必要です。";
    }
    if (Math.abs(semitoneDiff) >= 6) {
      return "オクターブ関係の可能性があります。";
    }
    return "音程の特徴を意識してみてください。";
  }
  /**
   * 全音程の習得状況取得
   * @returns {Object} - 全音程習得データ
   */
  getAllMasteryData() {
    const result = {};
    for (const [key, interval] of Object.entries(this.intervalTypes)) {
      result[key] = {
        interval,
        mastery: this.getMastery(key)
      };
    }
    return result;
  }
  /**
   * 弱点音程の特定
   * @param {number} limit - 取得件数制限
   * @returns {Array} - 弱点音程リスト
   */
  getWeakIntervals(limit = 3) {
    const masteryList = Object.entries(this.getAllMasteryData()).filter(([key, data]) => data.mastery.attempts >= 2).sort((a, b) => a[1].mastery.averageAccuracy - b[1].mastery.averageAccuracy).slice(0, limit);
    return masteryList.map(([key, data]) => ({
      key,
      name: data.interval.name,
      accuracy: data.mastery.averageAccuracy,
      attempts: data.mastery.attempts,
      improvement: this.generateImprovementTip(key, data)
    }));
  }
  /**
   * 得意音程の特定
   * @param {number} limit - 取得件数制限
   * @returns {Array} - 得意音程リスト
   */
  getStrongIntervals(limit = 3) {
    const masteryList = Object.entries(this.getAllMasteryData()).filter(([key, data]) => data.mastery.attempts >= 3).sort((a, b) => b[1].mastery.averageAccuracy - a[1].mastery.averageAccuracy).slice(0, limit);
    return masteryList.map(([key, data]) => ({
      key,
      name: data.interval.name,
      accuracy: data.mastery.averageAccuracy,
      attempts: data.mastery.attempts,
      reason: this.generateStrengthReason(key, data)
    }));
  }
  /**
   * 改善提案の生成
   * @param {string} intervalKey - 音程キー
   * @param {Object} data - 音程データ
   * @returns {string} - 改善提案
   */
  generateImprovementTip(intervalKey, data) {
    const interval = data.interval;
    const mastery = data.mastery;
    if (mastery.trend === "improving") {
      return `📈 改善中です！${interval.description}の特徴を意識して練習を続けましょう。`;
    }
    if (interval.commonErrors.length > 0) {
      return `💡 ${interval.commonErrors[0]}に注意してください。`;
    }
    return `🎯 ${interval.description}を意識して、ゆっくりと練習してみましょう。`;
  }
  /**
   * 強み理由の生成
   * @param {string} intervalKey - 音程キー
   * @param {Object} data - 音程データ
   * @returns {string} - 強み理由
   */
  generateStrengthReason(intervalKey, data) {
    const interval = data.interval;
    const mastery = data.mastery;
    if (mastery.averageAccuracy >= 95) {
      return `完璧な精度で${interval.name}を認識できています！`;
    }
    if (mastery.trend === "improving") {
      return `${interval.name}の理解が急速に向上しています。`;
    }
    return `${interval.name}の認識が安定しています。`;
  }
  /**
   * 習得度データの初期化
   */
  initializeMasteryData() {
  }
  /**
   * 分析履歴の記録
   * @param {Object} analysis - 分析結果
   */
  recordAnalysis(analysis) {
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistoryLength) {
      this.analysisHistory.shift();
    }
  }
  /**
   * エラー結果の作成
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - エラー結果
   */
  createErrorResult(baseFreq, targetFreq, detectedFreq) {
    return {
      targetInterval: { name: "不明", key: "unknown" },
      detectedInterval: { name: "不明", key: "unknown" },
      accuracy: 0,
      mastery: { level: "beginner", progress: 0 },
      isCorrectInterval: false,
      feedback: "音程分析でエラーが発生しました。",
      error: true
    };
  }
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🎵 [IntervalAnalyzer] ${analysis.targetInterval.name}分析結果`);
    console.log("🎯 音程分析:", {
      目標: `${analysis.targetInterval.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedInterval.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.isCorrectInterval ? "✅" : "❌",
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    console.log("📊 習得状況:", {
      レベル: analysis.mastery.level,
      試行回数: analysis.mastery.attempts,
      平均精度: `${analysis.mastery.averageAccuracy?.toFixed(1) || 0}%`,
      進捗: `${analysis.mastery.progress}%`,
      トレンド: analysis.mastery.trend
    });
    console.log("💬 フィードバック:", analysis.feedback);
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[IntervalAnalyzer] ${message}`, data);
      } else {
        console.log(`[IntervalAnalyzer] ${message}`);
      }
    }
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalAnalyses: this.analysisHistory.length,
      intervalTypes: Object.keys(this.intervalTypes).length,
      masteryLevels: Object.fromEntries(this.masteryData),
      sessionStartTime: this.sessionStartTime || Date.now()
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.masteryData.clear();
    this.analysisHistory = [];
    this.initializeMasteryData();
    this.log("🔄 IntervalAnalyzer リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.IntervalAnalyzer = IntervalAnalyzer;
}
class DirectionAnalyzer {
  constructor() {
    this.directions = {
      ascending: {
        name: "上行",
        icon: "↗️",
        description: "基音より高い音程",
        color: "#10b981",
        commonErrors: [
          "オクターブ下認識（倍音効果）",
          "音程幅の過小評価",
          "目標音程の手前で停止"
        ]
      },
      descending: {
        name: "下行",
        icon: "↘️",
        description: "基音より低い音程",
        color: "#3b82f6",
        commonErrors: [
          "オクターブ上認識（倍音効果）",
          "音程幅の過大評価",
          "目標音程を通り越す"
        ]
      },
      unison: {
        name: "同音",
        icon: "➡️",
        description: "基音と同じ高さ",
        color: "#6b7280",
        commonErrors: [
          "微細なピッチずれ",
          "倍音による誤認識"
        ]
      }
    };
    this.directionMastery = /* @__PURE__ */ new Map();
    this.analysisHistory = [];
    this.maxHistoryLength = 50;
    this.debugMode = true;
    this.thresholds = {
      unison: 0.5,
      // ±0.5セミトーン以内を同音と判定
      overshoot: 1.5,
      // 目標から1.5セミトーン以上のずれをオーバーシュート
      significant: 3
      // 3セミトーン以上の差を有意な方向性エラー
    };
    this.initializeDirectionMastery();
    this.log("🧭 DirectionAnalyzer初期化完了", {
      directions: Object.keys(this.directions).length,
      thresholds: this.thresholds
    });
  }
  /**
   * メイン方向性分析処理
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - 方向性分析結果
   */
  analyzeDirection(baseFreq, targetFreq, detectedFreq) {
    try {
      const targetDirection = this.determineDirection(baseFreq, targetFreq);
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      const detectedDirection = this.determineDirection(baseFreq, detectedFreq);
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      const directionCorrect = targetDirection.key === detectedDirection.key;
      const overshootAnalysis = this.analyzeOvershoot(targetSemitones, detectedSemitones);
      const accuracy = this.calculateDirectionAccuracy(
        targetDirection.key,
        detectedDirection.key,
        targetSemitones,
        detectedSemitones
      );
      this.updateDirectionMastery(targetDirection.key, accuracy, directionCorrect);
      const mastery = this.getDirectionMastery(targetDirection.key);
      const analysis = {
        targetDirection,
        detectedDirection,
        targetSemitones,
        detectedSemitones,
        directionCorrect,
        accuracy,
        mastery,
        overshoot: overshootAnalysis,
        feedback: this.generateDirectionFeedback(
          targetDirection,
          detectedDirection,
          overshootAnalysis,
          accuracy
        ),
        timestamp: Date.now()
      };
      this.recordAnalysis(analysis);
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [DirectionAnalyzer] 分析エラー:", error);
      return this.createErrorResult(baseFreq, targetFreq, detectedFreq);
    }
  }
  /**
   * 方向性の判定
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {Object} - 方向性情報
   */
  determineDirection(baseFreq, targetFreq) {
    const semitones = this.calculateSemitones(baseFreq, targetFreq);
    if (Math.abs(semitones) <= this.thresholds.unison) {
      return { key: "unison", ...this.directions.unison };
    }
    if (semitones > 0) {
      return { key: "ascending", ...this.directions.ascending };
    } else {
      return { key: "descending", ...this.directions.descending };
    }
  }
  /**
   * セミトーン差の計算
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {number} - セミトーン差（符号付き）
   */
  calculateSemitones(baseFreq, targetFreq) {
    if (!baseFreq || !targetFreq || baseFreq <= 0 || targetFreq <= 0) {
      return 0;
    }
    return 12 * Math.log2(targetFreq / baseFreq);
  }
  /**
   * オーバーシュート・アンダーシュート分析
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {Object} - オーバーシュート分析結果
   */
  analyzeOvershoot(targetSemitones, detectedSemitones) {
    const difference = detectedSemitones - targetSemitones;
    const absDifference = Math.abs(difference);
    let type = "accurate";
    let severity = "none";
    if (absDifference >= this.thresholds.overshoot) {
      if (difference > 0) {
        type = "overshoot";
      } else {
        type = "undershoot";
      }
      if (absDifference >= this.thresholds.significant) {
        severity = "severe";
      } else {
        severity = "moderate";
      }
    }
    return {
      type,
      severity,
      difference,
      absDifference,
      percentage: absDifference / Math.abs(targetSemitones) * 100
    };
  }
  /**
   * 方向性精度の計算
   * @param {string} targetDir - 目標方向
   * @param {string} detectedDir - 検出方向
   * @param {number} targetSemitones - 目標セミトーン
   * @param {number} detectedSemitones - 検出セミトーン
   * @returns {number} - 方向性精度 (0-100)
   */
  calculateDirectionAccuracy(targetDir, detectedDir, targetSemitones, detectedSemitones) {
    if (targetDir !== detectedDir) {
      return Math.max(0, 30 - Math.abs(detectedSemitones - targetSemitones) * 5);
    }
    const semitoneError = Math.abs(detectedSemitones - targetSemitones);
    const accuracy = Math.max(0, 100 - semitoneError * 25);
    return Math.min(100, accuracy);
  }
  /**
   * 方向性習得度の更新
   * @param {string} direction - 方向性
   * @param {number} accuracy - 精度
   * @param {boolean} correct - 正解フラグ
   */
  updateDirectionMastery(direction, accuracy, correct) {
    if (!this.directionMastery.has(direction)) {
      this.directionMastery.set(direction, {
        attempts: 0,
        correctAttempts: 0,
        totalAccuracy: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        successRate: 0,
        recentAttempts: [],
        recentCorrects: [],
        lastAttempt: null,
        trend: "stable"
      });
    }
    const mastery = this.directionMastery.get(direction);
    mastery.attempts++;
    if (correct) mastery.correctAttempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.successRate = mastery.correctAttempts / mastery.attempts * 100;
    mastery.lastAttempt = Date.now();
    mastery.recentAttempts.push(accuracy);
    mastery.recentCorrects.push(correct);
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
      mastery.recentCorrects.shift();
    }
    mastery.trend = this.calculateDirectionTrend(mastery.recentCorrects);
    this.directionMastery.set(direction, mastery);
  }
  /**
   * 方向性習得度の取得
   * @param {string} direction - 方向性
   * @returns {Object} - 習得度情報
   */
  getDirectionMastery(direction) {
    const mastery = this.directionMastery.get(direction);
    if (!mastery) {
      return {
        attempts: 0,
        successRate: 0,
        averageAccuracy: 0,
        level: "beginner",
        progress: 0
      };
    }
    const level = this.determineDirectionLevel(mastery.successRate, mastery.attempts);
    const progress = Math.min(100, mastery.successRate * mastery.attempts / 500);
    return {
      ...mastery,
      level,
      progress: Math.round(progress)
    };
  }
  /**
   * 方向性習得レベルの判定
   * @param {number} successRate - 成功率
   * @param {number} attempts - 試行回数
   * @returns {string} - 習得レベル
   */
  determineDirectionLevel(successRate, attempts) {
    if (attempts < 3) return "beginner";
    if (successRate >= 95 && attempts >= 10) return "master";
    if (successRate >= 85 && attempts >= 7) return "advanced";
    if (successRate >= 75 && attempts >= 5) return "intermediate";
    if (successRate >= 60) return "novice";
    return "beginner";
  }
  /**
   * 方向性トレンド分析
   * @param {Array} recentCorrects - 直近の正解状況
   * @returns {string} - トレンド
   */
  calculateDirectionTrend(recentCorrects) {
    if (recentCorrects.length < 5) return "stable";
    const recent = recentCorrects.slice(-3);
    const earlier = recentCorrects.slice(-6, -3);
    if (earlier.length === 0) return "stable";
    const recentSuccessRate = recent.filter(Boolean).length / recent.length;
    const earlierSuccessRate = earlier.filter(Boolean).length / earlier.length;
    const improvement = recentSuccessRate - earlierSuccessRate;
    if (improvement > 0.2) return "improving";
    if (improvement < -0.2) return "declining";
    return "stable";
  }
  /**
   * 方向性フィードバック生成
   * @param {Object} targetDirection - 目標方向
   * @param {Object} detectedDirection - 検出方向
   * @param {Object} overshoot - オーバーシュート分析
   * @param {number} accuracy - 精度
   * @returns {string} - フィードバックメッセージ
   */
  generateDirectionFeedback(targetDirection, detectedDirection, overshoot, accuracy) {
    const isCorrect = targetDirection.key === detectedDirection.key;
    if (isCorrect && accuracy >= 90) {
      return `🎯 ${targetDirection.name}の方向性が完璧です！`;
    }
    if (isCorrect && accuracy >= 70) {
      return `✅ ${targetDirection.name}の方向は正しいです。距離の調整をしてみましょう。`;
    }
    if (isCorrect) {
      if (overshoot.type === "overshoot") {
        return `👍 ${targetDirection.name}の方向は正しいですが、少し歌いすぎです。`;
      } else if (overshoot.type === "undershoot") {
        return `👍 ${targetDirection.name}の方向は正しいですが、もう少し大きく歌ってみてください。`;
      }
      return `👍 ${targetDirection.name}の方向は認識できています。`;
    }
    if (targetDirection.key === "ascending" && detectedDirection.key === "descending") {
      return `❌ 上行のつもりが下行になっています。基音より高く歌ってください。`;
    }
    if (targetDirection.key === "descending" && detectedDirection.key === "ascending") {
      return `❌ 下行のつもりが上行になっています。基音より低く歌ってください。`;
    }
    if (targetDirection.key !== "unison" && detectedDirection.key === "unison") {
      return `❌ 音程変化が小さすぎます。${targetDirection.name}により大きく歌ってください。`;
    }
    return `❌ ${targetDirection.name}ではなく${detectedDirection.name}と認識されました。`;
  }
  /**
   * 全方向性の習得状況取得
   * @returns {Object} - 全方向性習得データ
   */
  getAllDirectionMastery() {
    const result = {};
    for (const [key, direction] of Object.entries(this.directions)) {
      result[key] = {
        direction,
        mastery: this.getDirectionMastery(key)
      };
    }
    return result;
  }
  /**
   * 方向性比較分析
   * @returns {Object} - 上行・下行の比較結果
   */
  getDirectionComparison() {
    const ascending = this.getDirectionMastery("ascending");
    const descending = this.getDirectionMastery("descending");
    return {
      ascending,
      descending,
      comparison: {
        betterDirection: ascending.successRate > descending.successRate ? "ascending" : "descending",
        difference: Math.abs(ascending.successRate - descending.successRate),
        recommendation: this.generateDirectionRecommendation(ascending, descending)
      }
    };
  }
  /**
   * 方向性改善提案生成
   * @param {Object} ascending - 上行習得度
   * @param {Object} descending - 下行習得度
   * @returns {string} - 改善提案
   */
  generateDirectionRecommendation(ascending, descending) {
    const diff = ascending.successRate - descending.successRate;
    if (Math.abs(diff) < 10) {
      return "上行・下行ともにバランス良く習得できています。";
    }
    if (diff > 10) {
      return "下行の練習を重点的に行うことをお勧めします。下向きの音程により意識を向けてみてください。";
    } else {
      return "上行の練習を重点的に行うことをお勧めします。上向きの音程により意識を向けてみてください。";
    }
  }
  /**
   * 方向性習得度データの初期化
   */
  initializeDirectionMastery() {
    for (const directionKey of Object.keys(this.directions)) {
      if (!this.directionMastery.has(directionKey)) {
        this.directionMastery.set(directionKey, {
          attempts: 0,
          correctAttempts: 0,
          totalAccuracy: 0,
          averageAccuracy: 0,
          bestAccuracy: 0,
          successRate: 0,
          recentAttempts: [],
          recentCorrects: [],
          lastAttempt: null,
          trend: "stable"
        });
      }
    }
  }
  /**
   * 分析履歴の記録
   * @param {Object} analysis - 分析結果
   */
  recordAnalysis(analysis) {
    this.analysisHistory.push(analysis);
    if (this.analysisHistory.length > this.maxHistoryLength) {
      this.analysisHistory.shift();
    }
  }
  /**
   * エラー結果の作成
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {Object} - エラー結果
   */
  createErrorResult(baseFreq, targetFreq, detectedFreq) {
    return {
      targetDirection: { name: "不明", key: "unknown" },
      detectedDirection: { name: "不明", key: "unknown" },
      directionCorrect: false,
      accuracy: 0,
      mastery: { level: "beginner", progress: 0 },
      overshoot: { type: "unknown", severity: "none" },
      feedback: "方向性分析でエラーが発生しました。",
      error: true
    };
  }
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🧭 [DirectionAnalyzer] ${analysis.targetDirection.name}分析結果`);
    console.log("🎯 方向性分析:", {
      目標: `${analysis.targetDirection.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedDirection.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.directionCorrect ? "✅" : "❌",
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    console.log("📊 オーバーシュート分析:", {
      タイプ: analysis.overshoot.type,
      深刻度: analysis.overshoot.severity,
      差分: `${analysis.overshoot.difference.toFixed(1)}セミトーン`,
      誤差率: `${analysis.overshoot.percentage.toFixed(1)}%`
    });
    console.log("📈 習得状況:", {
      レベル: analysis.mastery.level,
      成功率: `${analysis.mastery.successRate?.toFixed(1) || 0}%`,
      試行回数: analysis.mastery.attempts,
      トレンド: analysis.mastery.trend
    });
    console.log("💬 フィードバック:", analysis.feedback);
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[DirectionAnalyzer] ${message}`, data);
      } else {
        console.log(`[DirectionAnalyzer] ${message}`);
      }
    }
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalAnalyses: this.analysisHistory.length,
      directionTypes: Object.keys(this.directions).length,
      masteryData: Object.fromEntries(this.directionMastery),
      thresholds: this.thresholds
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.directionMastery.clear();
    this.analysisHistory = [];
    this.initializeDirectionMastery();
    this.log("🔄 DirectionAnalyzer リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.DirectionAnalyzer = DirectionAnalyzer;
}
class ConsistencyTracker {
  constructor(config = {}) {
    this.config = {
      windowSize: config.windowSize || 5,
      // 一貫性評価のウィンドウサイズ
      maxHistory: config.maxHistory || 100,
      // 最大履歴保持数
      stabilityThreshold: config.stabilityThreshold || 25,
      // 安定性閾値（セント）
      trendWindowSize: config.trendWindowSize || 10,
      // トレンド分析ウィンドウ
      fatigueDetectionWindow: config.fatigueDetectionWindow || 15
      // 疲労検出ウィンドウ
    };
    this.consistencyData = /* @__PURE__ */ new Map();
    this.stabilityHistory = [];
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallConsistency: 0,
      stabilityTrend: "stable",
      fatigueLevel: "fresh",
      concentrationLevel: "high"
    };
    this.debugMode = true;
    this.log("📊 ConsistencyTracker初期化完了", {
      config: this.config,
      sessionStart: new Date(this.sessionData.startTime).toLocaleTimeString()
    });
  }
  /**
   * 新しい試行の記録と一貫性分析
   * @param {string} intervalType - 音程タイプ
   * @param {number} centsDiff - セント差
   * @param {number} accuracy - 精度スコア
   * @param {number} responseTime - 反応時間
   * @returns {Object} - 一貫性分析結果
   */
  recordAttempt(intervalType, centsDiff, accuracy, responseTime) {
    try {
      this.addAttemptData(intervalType, centsDiff, accuracy, responseTime);
      const intervalConsistency = this.calculateIntervalConsistency(intervalType);
      this.updateOverallConsistency();
      const stabilityTrend = this.analyzeStabilityTrend();
      const fatigueAnalysis = this.analyzeFatigue();
      const analysis = {
        intervalType,
        intervalConsistency,
        overallConsistency: this.sessionData.overallConsistency,
        stabilityTrend,
        fatigueAnalysis,
        recommendations: this.generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis),
        timestamp: Date.now()
      };
      this.updateSessionData(analysis);
      if (this.debugMode) {
        this.logConsistencyDetails(analysis);
      }
      return analysis;
    } catch (error) {
      console.error("❌ [ConsistencyTracker] 記録エラー:", error);
      return this.createErrorResult(intervalType);
    }
  }
  /**
   * 試行データの追加
   * @param {string} intervalType - 音程タイプ
   * @param {number} centsDiff - セント差
   * @param {number} accuracy - 精度スコア
   * @param {number} responseTime - 反応時間
   */
  addAttemptData(intervalType, centsDiff, accuracy, responseTime) {
    if (!this.consistencyData.has(intervalType)) {
      this.consistencyData.set(intervalType, {
        attempts: [],
        statistics: {
          count: 0,
          mean: 0,
          standardDeviation: 0,
          variance: 0,
          range: 0,
          consistencyScore: 0
        },
        trend: "stable",
        lastUpdated: Date.now()
      });
    }
    const data = this.consistencyData.get(intervalType);
    const attemptData = {
      centsDiff,
      accuracy,
      responseTime,
      timestamp: Date.now()
    };
    data.attempts.push(attemptData);
    if (data.attempts.length > this.config.maxHistory) {
      data.attempts.shift();
    }
    this.updateStatistics(intervalType);
    this.stabilityHistory.push({
      intervalType,
      centsDiff: Math.abs(centsDiff),
      accuracy,
      timestamp: Date.now()
    });
    if (this.stabilityHistory.length > this.config.maxHistory) {
      this.stabilityHistory.shift();
    }
    this.sessionData.totalAttempts++;
  }
  /**
   * 音程別統計の更新
   * @param {string} intervalType - 音程タイプ
   */
  updateStatistics(intervalType) {
    const data = this.consistencyData.get(intervalType);
    const attempts = data.attempts;
    if (attempts.length === 0) return;
    const centsDiffs = attempts.map((a) => Math.abs(a.centsDiff));
    const count = centsDiffs.length;
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / count;
    const variance = centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    const range = Math.max(...centsDiffs) - Math.min(...centsDiffs);
    const consistencyScore = Math.max(0, 100 - standardDeviation * 2);
    data.statistics = {
      count,
      mean: Math.round(mean * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      range: Math.round(range * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 10) / 10
    };
    data.trend = this.calculateIntervalTrend(attempts);
    data.lastUpdated = Date.now();
  }
  /**
   * 音程別一貫性の計算
   * @param {string} intervalType - 音程タイプ
   * @returns {Object} - 一貫性分析結果
   */
  calculateIntervalConsistency(intervalType) {
    const data = this.consistencyData.get(intervalType);
    if (!data || data.attempts.length < 2) {
      return {
        level: "insufficient_data",
        score: 0,
        description: "データ不足",
        attempts: data?.attempts.length || 0
      };
    }
    const stats = data.statistics;
    const level = this.determineConsistencyLevel(stats.consistencyScore);
    return {
      intervalType,
      level,
      score: stats.consistencyScore,
      statistics: stats,
      trend: data.trend,
      description: this.getConsistencyDescription(level),
      attempts: stats.count,
      recommendation: this.getIntervalRecommendation(intervalType, stats, data.trend)
    };
  }
  /**
   * 一貫性レベルの判定
   * @param {number} score - 一貫性スコア
   * @returns {string} - 一貫性レベル
   */
  determineConsistencyLevel(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "fair";
    if (score >= 40) return "poor";
    return "very_poor";
  }
  /**
   * 一貫性レベルの説明
   * @param {string} level - 一貫性レベル
   * @returns {string} - 説明文
   */
  getConsistencyDescription(level) {
    const descriptions = {
      excellent: "非常に安定した精度で認識できています",
      good: "安定した認識ができています",
      fair: "やや不安定ですが、改善の余地があります",
      poor: "不安定な認識です。練習を重ねましょう",
      very_poor: "非常に不安定です。基礎練習から始めましょう",
      insufficient_data: "データが不足しています"
    };
    return descriptions[level] || "評価不能";
  }
  /**
   * 全体的一貫性の更新
   */
  updateOverallConsistency() {
    if (this.stabilityHistory.length < 5) {
      this.sessionData.overallConsistency = 0;
      return;
    }
    const recentAttempts = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const centsDiffs = recentAttempts.map((a) => a.centsDiff);
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / centsDiffs.length;
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / centsDiffs.length
    );
    this.sessionData.overallConsistency = Math.max(0, 100 - standardDeviation * 2);
  }
  /**
   * 安定性トレンドの分析
   * @returns {Object} - トレンド分析結果
   */
  analyzeStabilityTrend() {
    if (this.stabilityHistory.length < this.config.trendWindowSize) {
      return {
        trend: "insufficient_data",
        direction: "stable",
        confidence: 0,
        description: "データ不足"
      };
    }
    const recentData = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const half = Math.floor(this.config.trendWindowSize / 2);
    const earlierHalf = recentData.slice(0, half);
    const laterHalf = recentData.slice(-half);
    const earlierAvg = earlierHalf.reduce((sum, a) => sum + a.centsDiff, 0) / earlierHalf.length;
    const laterAvg = laterHalf.reduce((sum, a) => sum + a.centsDiff, 0) / laterHalf.length;
    const improvement = earlierAvg - laterAvg;
    const improvementPercent = improvement / earlierAvg * 100;
    let trend, direction, confidence;
    if (Math.abs(improvementPercent) < 10) {
      trend = "stable";
      direction = "stable";
      confidence = 0.7;
    } else if (improvement > 0) {
      trend = "improving";
      direction = "better";
      confidence = Math.min(0.9, Math.abs(improvementPercent) / 20);
    } else {
      trend = "declining";
      direction = "worse";
      confidence = Math.min(0.9, Math.abs(improvementPercent) / 20);
    }
    this.sessionData.stabilityTrend = trend;
    return {
      trend,
      direction,
      confidence: Math.round(confidence * 100) / 100,
      improvement: Math.round(improvement * 10) / 10,
      improvementPercent: Math.round(improvementPercent * 10) / 10,
      description: this.getTrendDescription(trend, direction)
    };
  }
  /**
   * 疲労度・集中力の分析
   * @returns {Object} - 疲労分析結果
   */
  analyzeFatigue() {
    if (this.stabilityHistory.length < this.config.fatigueDetectionWindow) {
      return {
        fatigueLevel: "unknown",
        concentrationLevel: "unknown",
        recommendation: "データ不足のため判定できません"
      };
    }
    const recentData = this.stabilityHistory.slice(-this.config.fatigueDetectionWindow);
    const sessionDuration = Date.now() - this.sessionData.startTime;
    const sessionMinutes = sessionDuration / (1e3 * 60);
    let timeFatigue = "fresh";
    if (sessionMinutes > 30) timeFatigue = "moderate";
    if (sessionMinutes > 60) timeFatigue = "tired";
    if (sessionMinutes > 90) timeFatigue = "exhausted";
    const accuracies = recentData.map((a) => a.accuracy);
    const recentAvgAccuracy = accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;
    const allAccuracies = this.stabilityHistory.map((a) => a.accuracy);
    const overallAvgAccuracy = allAccuracies.reduce((sum, val) => sum + val, 0) / allAccuracies.length;
    const accuracyDrop = overallAvgAccuracy - recentAvgAccuracy;
    let performanceFatigue = "fresh";
    if (accuracyDrop > 5) performanceFatigue = "moderate";
    if (accuracyDrop > 10) performanceFatigue = "tired";
    if (accuracyDrop > 20) performanceFatigue = "exhausted";
    const fatigueLevel = this.combineFatigueFactors(timeFatigue, performanceFatigue);
    const concentrationLevel = this.evaluateConcentration(recentData);
    this.sessionData.fatigueLevel = fatigueLevel;
    this.sessionData.concentrationLevel = concentrationLevel;
    return {
      fatigueLevel,
      concentrationLevel,
      sessionMinutes: Math.round(sessionMinutes),
      accuracyDrop: Math.round(accuracyDrop * 10) / 10,
      recommendation: this.getFatigueRecommendation(fatigueLevel, concentrationLevel)
    };
  }
  /**
   * 疲労要因の統合
   * @param {string} timeFatigue - 時間疲労
   * @param {string} performanceFatigue - パフォーマンス疲労
   * @returns {string} - 総合疲労度
   */
  combineFatigueFactors(timeFatigue, performanceFatigue) {
    const fatigueOrder = ["fresh", "moderate", "tired", "exhausted"];
    const timeIndex = fatigueOrder.indexOf(timeFatigue);
    const performanceIndex = fatigueOrder.indexOf(performanceFatigue);
    const maxIndex = Math.max(timeIndex, performanceIndex);
    return fatigueOrder[maxIndex];
  }
  /**
   * 集中力の評価
   * @param {Array} recentData - 直近データ
   * @returns {string} - 集中力レベル
   */
  evaluateConcentration(recentData) {
    const centsDiffs = recentData.map((a) => a.centsDiff);
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - centsDiffs.reduce((s, v) => s + v, 0) / centsDiffs.length, 2), 0) / centsDiffs.length
    );
    if (standardDeviation <= 15) return "high";
    if (standardDeviation <= 25) return "medium";
    if (standardDeviation <= 40) return "low";
    return "very_low";
  }
  /**
   * 一貫性改善提案の生成
   * @param {Object} intervalConsistency - 音程一貫性
   * @param {Object} fatigueAnalysis - 疲労分析
   * @returns {Array} - 改善提案リスト
   */
  generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis) {
    const recommendations = [];
    if (fatigueAnalysis.fatigueLevel === "tired" || fatigueAnalysis.fatigueLevel === "exhausted") {
      recommendations.push({
        type: "rest",
        priority: "high",
        message: "疲労が見られます。10-15分の休憩をお勧めします。",
        icon: "😴"
      });
    }
    if (fatigueAnalysis.concentrationLevel === "low" || fatigueAnalysis.concentrationLevel === "very_low") {
      recommendations.push({
        type: "focus",
        priority: "medium",
        message: "集中力が低下しています。深呼吸をして、ゆっくりと練習してみてください。",
        icon: "🧘"
      });
    }
    if (intervalConsistency.level === "poor" || intervalConsistency.level === "very_poor") {
      recommendations.push({
        type: "practice",
        priority: "medium",
        message: `${intervalConsistency.intervalType}の練習を重点的に行いましょう。ゆっくりと正確に歌うことを意識してください。`,
        icon: "🎯"
      });
    }
    if (intervalConsistency.trend === "improving") {
      recommendations.push({
        type: "encouragement",
        priority: "low",
        message: "改善が見られます！この調子で練習を続けてください。",
        icon: "📈"
      });
    }
    return recommendations;
  }
  /**
   * 音程別推奨事項の生成
   * @param {string} intervalType - 音程タイプ
   * @param {Object} statistics - 統計データ
   * @param {string} trend - トレンド
   * @returns {string} - 推奨事項
   */
  getIntervalRecommendation(intervalType, statistics, trend) {
    if (statistics.consistencyScore >= 80) {
      return "安定した認識ができています。この精度を維持しましょう。";
    }
    if (trend === "improving") {
      return "改善傾向にあります。継続して練習してください。";
    }
    if (statistics.standardDeviation > 30) {
      return "ばらつきが大きいです。ゆっくりと正確に歌うことを意識してください。";
    }
    return `${intervalType}の特徴を意識して、一定の精度で歌えるよう練習しましょう。`;
  }
  /**
   * トレンド説明の生成
   * @param {string} trend - トレンド
   * @param {string} direction - 方向
   * @returns {string} - 説明文
   */
  getTrendDescription(trend, direction) {
    const descriptions = {
      stable: "安定した精度を維持しています",
      improving: "精度が向上しています",
      declining: "精度が低下しています"
    };
    return descriptions[trend] || "傾向を分析中";
  }
  /**
   * 疲労度推奨事項の生成
   * @param {string} fatigueLevel - 疲労度
   * @param {string} concentrationLevel - 集中力
   * @returns {string} - 推奨事項
   */
  getFatigueRecommendation(fatigueLevel, concentrationLevel) {
    if (fatigueLevel === "exhausted") {
      return "今日はここまでにして、十分な休息を取ることをお勧めします。";
    }
    if (fatigueLevel === "tired") {
      return "15-20分の休憩を取ってから練習を再開しましょう。";
    }
    if (concentrationLevel === "very_low") {
      return "集中力が低下しています。環境を整えて、短時間の集中練習を心がけましょう。";
    }
    if (concentrationLevel === "low") {
      return "深呼吸をして、一つ一つの音程に集中して練習してみてください。";
    }
    return "良い状態です。この調子で練習を続けてください。";
  }
  /**
   * 音程別トレンドの計算
   * @param {Array} attempts - 試行データ
   * @returns {string} - トレンド
   */
  calculateIntervalTrend(attempts) {
    if (attempts.length < 6) return "stable";
    const recent = attempts.slice(-3);
    const earlier = attempts.slice(-6, -3);
    const recentAvg = recent.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / earlier.length;
    const improvement = earlierAvg - recentAvg;
    if (improvement > 5) return "improving";
    if (improvement < -5) return "declining";
    return "stable";
  }
  /**
   * セッションデータの更新
   * @param {Object} analysis - 分析結果
   */
  updateSessionData(analysis) {
    this.sessionData.overallConsistency = analysis.overallConsistency;
    this.sessionData.stabilityTrend = analysis.stabilityTrend.trend;
    this.sessionData.fatigueLevel = analysis.fatigueAnalysis.fatigueLevel;
    this.sessionData.concentrationLevel = analysis.fatigueAnalysis.concentrationLevel;
  }
  /**
   * エラー結果の作成
   * @param {string} intervalType - 音程タイプ
   * @returns {Object} - エラー結果
   */
  createErrorResult(intervalType) {
    return {
      intervalType,
      intervalConsistency: { level: "error", score: 0 },
      overallConsistency: 0,
      stabilityTrend: { trend: "error" },
      fatigueAnalysis: { fatigueLevel: "unknown" },
      recommendations: [],
      error: true
    };
  }
  /**
   * 詳細一貫性ログ出力
   * @param {Object} analysis - 分析結果
   */
  logConsistencyDetails(analysis) {
    console.group(`📊 [ConsistencyTracker] ${analysis.intervalType}一貫性分析`);
    console.log("🎯 音程一貫性:", {
      レベル: analysis.intervalConsistency.level,
      スコア: `${analysis.intervalConsistency.score}%`,
      標準偏差: `${analysis.intervalConsistency.statistics?.standardDeviation || 0}セント`,
      試行回数: analysis.intervalConsistency.attempts
    });
    console.log("📈 トレンド分析:", {
      全体傾向: analysis.stabilityTrend.trend,
      方向: analysis.stabilityTrend.direction,
      信頼度: `${(analysis.stabilityTrend.confidence * 100).toFixed(0)}%`,
      改善度: `${analysis.stabilityTrend.improvement}セント`
    });
    console.log("😴 疲労分析:", {
      疲労度: analysis.fatigueAnalysis.fatigueLevel,
      集中力: analysis.fatigueAnalysis.concentrationLevel,
      セッション時間: `${analysis.fatigueAnalysis.sessionMinutes}分`,
      精度低下: `${analysis.fatigueAnalysis.accuracyDrop}%`
    });
    if (analysis.recommendations.length > 0) {
      console.log("💡 推奨事項:", analysis.recommendations.map((r) => r.message));
    }
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[ConsistencyTracker] ${message}`, data);
      } else {
        console.log(`[ConsistencyTracker] ${message}`);
      }
    }
  }
  /**
   * 全一貫性データの取得
   * @returns {Object} - 全一貫性データ
   */
  getAllConsistencyData() {
    const result = {};
    for (const [intervalType, data] of this.consistencyData.entries()) {
      result[intervalType] = {
        statistics: data.statistics,
        trend: data.trend,
        attempts: data.attempts.length,
        lastUpdated: data.lastUpdated
      };
    }
    return {
      intervalData: result,
      sessionData: this.sessionData,
      overallStats: {
        totalAttempts: this.sessionData.totalAttempts,
        overallConsistency: this.sessionData.overallConsistency,
        sessionDuration: Date.now() - this.sessionData.startTime
      }
    };
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      totalIntervalTypes: this.consistencyData.size,
      totalAttempts: this.sessionData.totalAttempts,
      sessionDuration: Date.now() - this.sessionData.startTime,
      overallConsistency: this.sessionData.overallConsistency,
      stabilityTrend: this.sessionData.stabilityTrend,
      fatigueLevel: this.sessionData.fatigueLevel
    };
  }
  /**
   * データのリセット
   */
  reset() {
    this.consistencyData.clear();
    this.stabilityHistory = [];
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallConsistency: 0,
      stabilityTrend: "stable",
      fatigueLevel: "fresh",
      concentrationLevel: "high"
    };
    this.log("🔄 ConsistencyTracker リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.ConsistencyTracker = ConsistencyTracker;
}
class EnhancedScoringEngine {
  constructor(config = {}) {
    this.config = {
      // 採点重み設定
      weights: {
        pitchAccuracy: config.weights?.pitchAccuracy || 0.4,
        // 音程精度
        recognitionSpeed: config.weights?.recognitionSpeed || 0.2,
        // 認識速度
        intervalMastery: config.weights?.intervalMastery || 0.2,
        // 音程習得度
        directionAccuracy: config.weights?.directionAccuracy || 0.1,
        // 方向性精度
        consistency: config.weights?.consistency || 0.1
        // 一貫性
      },
      // 速度評価設定
      speedThresholds: {
        excellent: config.speedThresholds?.excellent || 1e3,
        // 1秒以内
        good: config.speedThresholds?.good || 2e3,
        // 2秒以内
        fair: config.speedThresholds?.fair || 3e3,
        // 3秒以内
        poor: config.speedThresholds?.poor || 5e3
        // 5秒以内
      },
      // HarmonicCorrection連携設定
      harmonicCorrection: {
        enabled: config.harmonicCorrection?.enabled ?? true,
        tolerance: config.harmonicCorrection?.tolerance || 50
        // セント
      },
      // データ保持設定
      sessionTracking: config.sessionTracking ?? true,
      maxHistorySize: config.maxHistorySize || 100
    };
    this.intervalAnalyzer = new IntervalAnalyzer();
    this.directionAnalyzer = new DirectionAnalyzer();
    this.consistencyTracker = new ConsistencyTracker();
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: "beginner",
      achievements: /* @__PURE__ */ new Set(),
      lastAnalysis: null
    };
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: "stable",
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    this.debugMode = true;
    this.log("🎯 EnhancedScoringEngine初期化完了", {
      weights: this.config.weights,
      analyzers: ["IntervalAnalyzer", "DirectionAnalyzer", "ConsistencyTracker"]
    });
  }
  /**
   * メイン採点処理
   * @param {Object} params - 採点パラメータ
   * @param {number} params.baseFreq - 基音周波数
   * @param {number} params.targetFreq - 目標周波数
   * @param {number} params.detectedFreq - 検出周波数
   * @param {number} params.responseTime - 反応時間(ms)
   * @param {number} params.volume - 音量
   * @param {Object} params.harmonicCorrection - HarmonicCorrection結果
   * @returns {Object} - 統合採点結果
   */
  async analyzePerformance(params) {
    try {
      const {
        baseFreq,
        targetFreq,
        detectedFreq,
        responseTime,
        volume = 50,
        harmonicCorrection = null
      } = params;
      const validation = this.validateInputs(params);
      if (!validation.valid) {
        return this.createErrorResult(validation.error);
      }
      const correctedFreq = this.applyHarmonicCorrection(detectedFreq, harmonicCorrection);
      const analyses = await Promise.all([
        this.intervalAnalyzer.analyzeInterval(baseFreq, targetFreq, correctedFreq),
        this.directionAnalyzer.analyzeDirection(baseFreq, targetFreq, correctedFreq),
        this.consistencyTracker.recordAttempt(
          this.getIntervalType(baseFreq, targetFreq),
          this.calculateCentsDifference(targetFreq, correctedFreq),
          this.calculateRawAccuracy(targetFreq, correctedFreq),
          responseTime
        )
      ]);
      const [intervalAnalysis, directionAnalysis, consistencyAnalysis] = analyses;
      const speedAnalysis = this.analyzeRecognitionSpeed(responseTime);
      const integratedScore = this.calculateIntegratedScore({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        volume
      });
      const performanceEvaluation = this.evaluateOverallPerformance(integratedScore);
      const adaptiveFeedback = this.generateAdaptiveFeedback({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        performanceEvaluation
      });
      const sessionUpdate = this.updateSessionData(integratedScore, performanceEvaluation);
      const result = {
        // 基本情報
        timestamp: Date.now(),
        sessionAttempt: this.sessionData.totalAttempts,
        // 専門分析結果
        analyses: {
          interval: intervalAnalysis,
          direction: directionAnalysis,
          consistency: consistencyAnalysis,
          speed: speedAnalysis
        },
        // 統合評価
        score: integratedScore,
        performance: performanceEvaluation,
        feedback: adaptiveFeedback,
        // セッション情報
        session: sessionUpdate,
        // メタデータ
        metadata: {
          baseFreq,
          targetFreq,
          detectedFreq,
          correctedFreq,
          responseTime,
          volume,
          harmonicCorrectionApplied: !!harmonicCorrection
        }
      };
      this.recordAnalysisResult(result);
      if (this.debugMode) {
        this.logScoringDetails(result);
      }
      return result;
    } catch (error) {
      console.error("❌ [EnhancedScoringEngine] 採点エラー:", error);
      return this.createErrorResult("採点処理中にエラーが発生しました");
    }
  }
  /**
   * 入力値の検証
   * @param {Object} params - パラメータ
   * @returns {Object} - 検証結果
   */
  validateInputs(params) {
    const { baseFreq, targetFreq, detectedFreq, responseTime } = params;
    if (!baseFreq || !targetFreq || !detectedFreq) {
      return { valid: false, error: "必要な周波数データが不足しています" };
    }
    if (baseFreq <= 0 || targetFreq <= 0 || detectedFreq <= 0) {
      return { valid: false, error: "周波数は正の値である必要があります" };
    }
    if (responseTime < 0 || responseTime > 3e4) {
      return { valid: false, error: "反応時間が範囲外です" };
    }
    return { valid: true };
  }
  /**
   * HarmonicCorrectionの適用
   * @param {number} detectedFreq - 検出周波数
   * @param {Object} harmonicCorrection - 補正データ
   * @returns {number} - 補正後周波数
   */
  applyHarmonicCorrection(detectedFreq, harmonicCorrection) {
    if (!this.config.harmonicCorrection.enabled || !harmonicCorrection) {
      return detectedFreq;
    }
    if (harmonicCorrection.correctedFrequency && Math.abs(harmonicCorrection.correctedFrequency - detectedFreq) <= this.config.harmonicCorrection.tolerance) {
      this.log("🔧 HarmonicCorrection適用", {
        original: detectedFreq,
        corrected: harmonicCorrection.correctedFrequency,
        correction: harmonicCorrection.correction
      });
      return harmonicCorrection.correctedFrequency;
    }
    return detectedFreq;
  }
  /**
   * 認識速度の分析
   * @param {number} responseTime - 反応時間(ms)
   * @returns {Object} - 速度分析結果
   */
  analyzeRecognitionSpeed(responseTime) {
    const { speedThresholds } = this.config;
    let level, score, feedback;
    if (responseTime <= speedThresholds.excellent) {
      level = "excellent";
      score = 100;
      feedback = "⚡ 素早い認識です！";
    } else if (responseTime <= speedThresholds.good) {
      level = "good";
      score = 85;
      feedback = "👍 良い反応速度です。";
    } else if (responseTime <= speedThresholds.fair) {
      level = "fair";
      score = 70;
      feedback = "📈 もう少し早く認識できると良いでしょう。";
    } else if (responseTime <= speedThresholds.poor) {
      level = "poor";
      score = 50;
      feedback = "🐌 ゆっくりと確実に認識しましょう。";
    } else {
      level = "very_poor";
      score = 25;
      feedback = "⏰ 時間をかけすぎています。練習を重ねましょう。";
    }
    return {
      level,
      score,
      responseTime,
      feedback,
      comparison: this.compareToAverageSpeed(responseTime)
    };
  }
  /**
   * 統合スコアの計算
   * @param {Object} analyses - 各分析結果
   * @returns {Object} - 統合スコア
   */
  calculateIntegratedScore(analyses) {
    const { weights } = this.config;
    const { intervalAnalysis, directionAnalysis, consistencyAnalysis, speedAnalysis, volume } = analyses;
    const pitchAccuracy = intervalAnalysis.accuracy || 0;
    const recognitionSpeed = speedAnalysis.score || 0;
    const intervalMastery = this.calculateMasteryScore(intervalAnalysis.mastery);
    const directionAccuracy = directionAnalysis.accuracy || 0;
    const consistency = consistencyAnalysis.overallConsistency || 0;
    const totalScore = pitchAccuracy * weights.pitchAccuracy + recognitionSpeed * weights.recognitionSpeed + intervalMastery * weights.intervalMastery + directionAccuracy * weights.directionAccuracy + consistency * weights.consistency;
    const volumeAdjustment = this.calculateVolumeAdjustment(volume);
    const adjustedScore = Math.min(100, totalScore * volumeAdjustment);
    return {
      total: Math.round(adjustedScore * 10) / 10,
      components: {
        pitchAccuracy: Math.round(pitchAccuracy * 10) / 10,
        recognitionSpeed: Math.round(recognitionSpeed * 10) / 10,
        intervalMastery: Math.round(intervalMastery * 10) / 10,
        directionAccuracy: Math.round(directionAccuracy * 10) / 10,
        consistency: Math.round(consistency * 10) / 10
      },
      weights,
      volumeAdjustment: Math.round(volumeAdjustment * 100) / 100,
      grade: this.determineGrade(adjustedScore)
    };
  }
  /**
   * 習得度スコアの計算
   * @param {Object} mastery - 習得度データ
   * @returns {number} - 習得度スコア
   */
  calculateMasteryScore(mastery) {
    if (!mastery || mastery.attempts === 0) return 0;
    const baseScore = mastery.averageAccuracy || 0;
    const attemptBonus = Math.min(20, mastery.attempts * 2);
    const trendBonus = mastery.trend === "improving" ? 10 : 0;
    return Math.min(100, baseScore + attemptBonus + trendBonus);
  }
  /**
   * 音量調整係数の計算
   * @param {number} volume - 音量 (0-100)
   * @returns {number} - 調整係数
   */
  calculateVolumeAdjustment(volume) {
    if (volume < 20) return 0.8;
    if (volume > 80) return 0.95;
    return 1;
  }
  /**
   * 成績の判定
   * @param {number} score - スコア
   * @returns {string} - 成績
   */
  determineGrade(score) {
    if (score >= 95) return "S";
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D+";
    if (score >= 55) return "D";
    return "F";
  }
  /**
   * 総合パフォーマンス評価
   * @param {Object} score - 統合スコア
   * @returns {Object} - パフォーマンス評価
   */
  evaluateOverallPerformance(score) {
    const level = this.determinePerformanceLevel(score.total);
    const strengths = this.identifyStrengths(score.components);
    const weaknesses = this.identifyWeaknesses(score.components);
    const improvement = this.calculateImprovement();
    return {
      level,
      score: score.total,
      grade: score.grade,
      strengths,
      weaknesses,
      improvement,
      recommendation: this.generatePerformanceRecommendation(level, strengths, weaknesses)
    };
  }
  /**
   * パフォーマンスレベルの判定
   * @param {number} score - 総合スコア
   * @returns {string} - パフォーマンスレベル
   */
  determinePerformanceLevel(score) {
    if (score >= 90) return "excellent";
    if (score >= 80) return "good";
    if (score >= 70) return "average";
    if (score >= 60) return "below_average";
    return "needs_improvement";
  }
  /**
   * 強みの特定
   * @param {Object} components - 成分スコア
   * @returns {Array} - 強み一覧
   */
  identifyStrengths(components) {
    const strengths = [];
    Object.entries(components).forEach(([key, value]) => {
      if (value >= 85) {
        strengths.push({
          area: key,
          score: value,
          level: "excellent"
        });
      } else if (value >= 75) {
        strengths.push({
          area: key,
          score: value,
          level: "good"
        });
      }
    });
    return strengths.sort((a, b) => b.score - a.score);
  }
  /**
   * 弱点の特定
   * @param {Object} components - 成分スコア
   * @returns {Array} - 弱点一覧
   */
  identifyWeaknesses(components) {
    const weaknesses = [];
    Object.entries(components).forEach(([key, value]) => {
      if (value < 60) {
        weaknesses.push({
          area: key,
          score: value,
          severity: value < 40 ? "high" : "medium"
        });
      }
    });
    return weaknesses.sort((a, b) => a.score - b.score);
  }
  /**
   * 改善度の計算
   * @returns {Object} - 改善度情報
   */
  calculateImprovement() {
    const history = this.sessionData.performanceHistory;
    if (history.length < 3) {
      return {
        trend: "insufficient_data",
        change: 0,
        description: "データ不足"
      };
    }
    const recent = history.slice(-3);
    const earlier = history.slice(-6, -3);
    if (earlier.length === 0) {
      return {
        trend: "stable",
        change: 0,
        description: "安定"
      };
    }
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    const change = recentAvg - earlierAvg;
    let trend, description;
    if (change > 5) {
      trend = "improving";
      description = "向上中";
    } else if (change < -5) {
      trend = "declining";
      description = "低下中";
    } else {
      trend = "stable";
      description = "安定";
    }
    return { trend, change: Math.round(change * 10) / 10, description };
  }
  /**
   * 適応的フィードバック生成
   * @param {Object} analyses - 各分析結果
   * @returns {Object} - フィードバック
   */
  generateAdaptiveFeedback(analyses) {
    const {
      intervalAnalysis,
      directionAnalysis,
      consistencyAnalysis,
      speedAnalysis,
      performanceEvaluation
    } = analyses;
    const feedback = {
      primary: this.getPrimaryFeedback(performanceEvaluation),
      detailed: {
        interval: intervalAnalysis.feedback || "音程分析結果なし",
        direction: directionAnalysis.feedback || "方向性分析結果なし",
        consistency: this.getConsistencyFeedback(consistencyAnalysis),
        speed: speedAnalysis.feedback || "速度分析結果なし"
      },
      recommendations: this.generateRecommendations(analyses),
      encouragement: this.generateEncouragement(performanceEvaluation),
      nextSteps: this.suggestNextSteps(performanceEvaluation)
    };
    return feedback;
  }
  /**
   * メインフィードバックの生成
   * @param {Object} performance - パフォーマンス評価
   * @returns {string} - メインフィードバック
   */
  getPrimaryFeedback(performance) {
    const { level, grade, score } = performance;
    const messages = {
      excellent: `🎯 素晴らしい！${grade}評価（${score}点）です。`,
      good: `👍 良い結果です！${grade}評価（${score}点）。`,
      average: `📈 平均的な結果です。${grade}評価（${score}点）。`,
      below_average: `💪 練習を続けましょう。${grade}評価（${score}点）。`,
      needs_improvement: `🎓 基礎から練習していきましょう。${grade}評価（${score}点）。`
    };
    return messages[level] || `結果: ${grade}評価（${score}点）`;
  }
  /**
   * 一貫性フィードバックの生成
   * @param {Object} consistency - 一貫性分析
   * @returns {string} - 一貫性フィードバック
   */
  getConsistencyFeedback(consistency) {
    if (consistency.recommendations && consistency.recommendations.length > 0) {
      return consistency.recommendations[0].message;
    }
    const score = consistency.overallConsistency || 0;
    if (score >= 80) return "🎯 一貫した精度を保っています。";
    if (score >= 60) return "📊 まずまずの安定性です。";
    return "📈 一貫性の改善が必要です。";
  }
  /**
   * 推奨事項の生成
   * @param {Object} analyses - 分析結果
   * @returns {Array} - 推奨事項リスト
   */
  generateRecommendations(analyses) {
    const recommendations = [];
    if (analyses.consistencyAnalysis.recommendations) {
      recommendations.push(...analyses.consistencyAnalysis.recommendations);
    }
    const { performanceEvaluation } = analyses;
    if (performanceEvaluation.weaknesses.length > 0) {
      const mainWeakness = performanceEvaluation.weaknesses[0];
      recommendations.push({
        type: "improvement",
        priority: "high",
        message: this.getImprovementSuggestion(mainWeakness.area),
        icon: "🎯"
      });
    }
    return recommendations;
  }
  /**
   * 改善提案の生成
   * @param {string} area - 改善エリア
   * @returns {string} - 改善提案
   */
  getImprovementSuggestion(area) {
    const suggestions = {
      pitchAccuracy: "音程の精度向上のため、ゆっくりと正確に歌う練習をしましょう。",
      recognitionSpeed: "反応速度向上のため、聞いた瞬間に歌う練習をしましょう。",
      intervalMastery: "苦手な音程を重点的に練習しましょう。",
      directionAccuracy: "上行・下行の方向性を意識して練習しましょう。",
      consistency: "一定の精度を保つため、集中力を高めて練習しましょう。"
    };
    return suggestions[area] || "継続的な練習で改善していきましょう。";
  }
  /**
   * 励ましメッセージの生成
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 励ましメッセージ
   */
  generateEncouragement(performance) {
    if (performance.improvement.trend === "improving") {
      return "📈 確実に上達しています！この調子で続けましょう。";
    }
    if (performance.strengths.length > 0) {
      const strength = performance.strengths[0];
      return `⭐ ${this.getAreaName(strength.area)}が得意ですね！`;
    }
    return "🌟 練習を続けることで必ず上達します。頑張りましょう！";
  }
  /**
   * 次のステップの提案
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 次のステップ
   */
  suggestNextSteps(performance) {
    if (performance.level === "excellent") {
      return "🎓 上級レベルに到達しています。より複雑な音程に挑戦してみましょう。";
    }
    if (performance.weaknesses.length > 0) {
      const weakness = performance.weaknesses[0];
      return `🎯 ${this.getAreaName(weakness.area)}の練習に重点を置きましょう。`;
    }
    return "📚 基礎練習を継続し、全体的なレベルアップを目指しましょう。";
  }
  /**
   * エリア名の取得
   * @param {string} area - エリアキー
   * @returns {string} - エリア名
   */
  getAreaName(area) {
    const names = {
      pitchAccuracy: "音程精度",
      recognitionSpeed: "認識速度",
      intervalMastery: "音程習得度",
      directionAccuracy: "方向性認識",
      consistency: "一貫性"
    };
    return names[area] || area;
  }
  /**
   * セッションデータの更新
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   * @returns {Object} - セッション更新情報
   */
  updateSessionData(score, performance) {
    this.sessionData.totalAttempts++;
    this.sessionData.performanceHistory.push(score.total);
    this.sessionData.overallScore = this.calculateSessionAverage();
    this.sessionData.currentLevel = performance.level;
    this.sessionData.lastAnalysis = Date.now();
    if (this.sessionData.performanceHistory.length > this.config.maxHistorySize) {
      this.sessionData.performanceHistory.shift();
    }
    this.updatePerformanceMetrics(score, performance);
    this.checkAchievements(score, performance);
    return {
      attempt: this.sessionData.totalAttempts,
      sessionAverage: this.sessionData.overallScore,
      sessionDuration: Date.now() - this.sessionData.startTime,
      level: this.sessionData.currentLevel,
      newAchievements: Array.from(this.sessionData.achievements)
    };
  }
  /**
   * セッション平均の計算
   * @returns {number} - セッション平均
   */
  calculateSessionAverage() {
    const history = this.sessionData.performanceHistory;
    if (history.length === 0) return 0;
    return history.reduce((sum, val) => sum + val, 0) / history.length;
  }
  /**
   * パフォーマンスメトリクスの更新
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   */
  updatePerformanceMetrics(score, performance) {
    if (score.components.recognitionSpeed > 0) {
      this.performanceMetrics.averageSpeed = (this.performanceMetrics.averageSpeed + score.components.recognitionSpeed) / 2;
    }
    this.performanceMetrics.accuracyTrend = performance.improvement.trend;
    this.performanceMetrics.strengthAreas = performance.strengths.map((s) => s.area);
    this.performanceMetrics.improvementAreas = performance.weaknesses.map((w) => w.area);
    this.performanceMetrics.sessionProgress = Math.min(
      100,
      this.sessionData.totalAttempts / 20 * 100
    );
  }
  /**
   * 達成確認
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   */
  checkAchievements(score, performance) {
    if (this.sessionData.totalAttempts === 1) {
      this.sessionData.achievements.add("first_attempt");
    }
    if (score.total >= 90 && !this.sessionData.achievements.has("high_score")) {
      this.sessionData.achievements.add("high_score");
    }
    if (score.total >= 98 && !this.sessionData.achievements.has("perfect_score")) {
      this.sessionData.achievements.add("perfect_score");
    }
    if (this.sessionData.totalAttempts >= 10 && !this.sessionData.achievements.has("persistent")) {
      this.sessionData.achievements.add("persistent");
    }
    if (performance.improvement.trend === "improving" && !this.sessionData.achievements.has("improving")) {
      this.sessionData.achievements.add("improving");
    }
  }
  /**
   * 平均速度との比較
   * @param {number} responseTime - 反応時間
   * @returns {Object} - 比較結果
   */
  compareToAverageSpeed(responseTime) {
    const sessionAvg = this.performanceMetrics.averageSpeed || 2e3;
    const difference = responseTime - sessionAvg;
    return {
      sessionAverage: sessionAvg,
      difference,
      comparison: difference < -500 ? "much_faster" : difference < -200 ? "faster" : difference < 200 ? "similar" : difference < 500 ? "slower" : "much_slower"
    };
  }
  /**
   * 音程タイプの取得
   * @param {number} baseFreq - 基音周波数
   * @param {number} targetFreq - 目標周波数
   * @returns {string} - 音程タイプ
   */
  getIntervalType(baseFreq, targetFreq) {
    const semitones = Math.round(12 * Math.log2(targetFreq / baseFreq));
    const normalizedSemitones = (semitones % 12 + 12) % 12;
    const intervalMap = {
      0: "unison",
      1: "minorSecond",
      2: "majorSecond",
      3: "minorThird",
      4: "majorThird",
      5: "perfectFourth",
      6: "tritone",
      7: "perfectFifth",
      8: "minorSixth",
      9: "majorSixth",
      10: "minorSeventh",
      11: "majorSeventh"
    };
    return intervalMap[normalizedSemitones] || "unknown";
  }
  /**
   * セント差の計算
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {number} - セント差
   */
  calculateCentsDifference(targetFreq, detectedFreq) {
    if (!targetFreq || !detectedFreq) return 0;
    return 1200 * Math.log2(detectedFreq / targetFreq);
  }
  /**
   * 生精度の計算
   * @param {number} targetFreq - 目標周波数
   * @param {number} detectedFreq - 検出周波数
   * @returns {number} - 生精度 (0-100)
   */
  calculateRawAccuracy(targetFreq, detectedFreq) {
    const centsDiff = Math.abs(this.calculateCentsDifference(targetFreq, detectedFreq));
    return Math.max(0, 100 - centsDiff);
  }
  /**
   * 分析結果の記録
   * @param {Object} result - 結果
   */
  recordAnalysisResult(result) {
    this.sessionData.lastAnalysis = result;
  }
  /**
   * エラー結果の作成
   * @param {string} errorMessage - エラーメッセージ
   * @returns {Object} - エラー結果
   */
  createErrorResult(errorMessage) {
    return {
      timestamp: Date.now(),
      error: true,
      message: errorMessage,
      score: {
        total: 0,
        components: {
          pitchAccuracy: 0,
          recognitionSpeed: 0,
          intervalMastery: 0,
          directionAccuracy: 0,
          consistency: 0
        },
        grade: "F"
      },
      performance: {
        level: "needs_improvement",
        strengths: [],
        weaknesses: [],
        improvement: { trend: "unknown", change: 0 }
      },
      feedback: {
        primary: "エラーが発生しました。もう一度お試しください。",
        detailed: {},
        recommendations: [],
        encouragement: "",
        nextSteps: ""
      }
    };
  }
  /**
   * 詳細採点ログ出力
   * @param {Object} result - 採点結果
   */
  logScoringDetails(result) {
    console.group(`🎯 [EnhancedScoringEngine] 統合採点結果 #${result.sessionAttempt}`);
    console.log("📊 統合スコア:", {
      総合: `${result.score.total}点 (${result.score.grade})`,
      音程精度: `${result.score.components.pitchAccuracy}%`,
      認識速度: `${result.score.components.recognitionSpeed}%`,
      音程習得度: `${result.score.components.intervalMastery}%`,
      方向性精度: `${result.score.components.directionAccuracy}%`,
      一貫性: `${result.score.components.consistency}%`
    });
    console.log("📈 パフォーマンス:", {
      レベル: result.performance.level,
      改善傾向: result.performance.improvement.trend,
      強み: result.performance.strengths.map((s) => s.area),
      弱点: result.performance.weaknesses.map((w) => w.area)
    });
    console.log("💬 フィードバック:", {
      メイン: result.feedback.primary,
      推奨事項: result.feedback.recommendations.length
    });
    console.log("📚 セッション:", {
      試行回数: result.session.attempt,
      平均点: result.session.sessionAverage.toFixed(1),
      継続時間: `${Math.round(result.session.sessionDuration / 6e4)}分`
    });
    console.groupEnd();
  }
  /**
   * デバッグログ出力
   * @param {string} message - ログメッセージ
   * @param {Object} data - 追加データ
   */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[EnhancedScoringEngine] ${message}`, data);
      } else {
        console.log(`[EnhancedScoringEngine] ${message}`);
      }
    }
  }
  /**
   * 統計データの取得
   * @returns {Object} - 統計データ
   */
  getStatistics() {
    return {
      session: this.sessionData,
      performance: this.performanceMetrics,
      analyzers: {
        interval: this.intervalAnalyzer.getStatistics(),
        direction: this.directionAnalyzer.getStatistics(),
        consistency: this.consistencyTracker.getStatistics()
      },
      config: this.config
    };
  }
  /**
   * 設定の更新
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log("⚙️ 設定更新完了", this.config);
  }
  /**
   * データのリセット
   */
  reset() {
    this.intervalAnalyzer.reset();
    this.directionAnalyzer.reset();
    this.consistencyTracker.reset();
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: "beginner",
      achievements: /* @__PURE__ */ new Set(),
      lastAnalysis: null
    };
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: "stable",
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    this.log("🔄 EnhancedScoringEngine リセット完了");
  }
}
if (typeof window !== "undefined" && true) {
  window.EnhancedScoringEngine = EnhancedScoringEngine;
}
const css = {
  code: ".container.svelte-19llkxn.svelte-19llkxn{max-width:1200px;margin:0 auto;padding:20px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif}.header.svelte-19llkxn.svelte-19llkxn{text-align:center;margin-bottom:30px;padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border-radius:12px}.header.svelte-19llkxn h1.svelte-19llkxn{margin:0 0 10px 0;font-size:2.5rem}.header.svelte-19llkxn p.svelte-19llkxn{margin:0 0 15px 0;opacity:0.9}.status.svelte-19llkxn.svelte-19llkxn{display:flex;align-items:center;justify-content:center;gap:8px}.status-indicator.svelte-19llkxn.svelte-19llkxn{width:12px;height:12px;border-radius:50%;background:#ef4444;transition:background 0.3s}.status-indicator.ready.svelte-19llkxn.svelte-19llkxn{background:#10b981}.controls.svelte-19llkxn.svelte-19llkxn{text-align:center;margin-bottom:30px}.btn.svelte-19llkxn.svelte-19llkxn{padding:12px 24px;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.2s;margin:0 8px}.btn.svelte-19llkxn.svelte-19llkxn:disabled{opacity:0.6;cursor:not-allowed}.btn-primary.svelte-19llkxn.svelte-19llkxn{background:#3b82f6;color:white}.btn-primary.svelte-19llkxn.svelte-19llkxn:hover:not(:disabled){background:#2563eb;transform:translateY(-1px)}.btn-secondary.svelte-19llkxn.svelte-19llkxn{background:#6b7280;color:white}.btn-secondary.svelte-19llkxn.svelte-19llkxn:hover:not(:disabled){background:#4b5563;transform:translateY(-1px)}.current-test.svelte-19llkxn.svelte-19llkxn{background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center}.current-test.svelte-19llkxn h3.svelte-19llkxn{margin:0 0 15px 0;color:#1e293b}.progress.svelte-19llkxn.svelte-19llkxn{width:100%;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;margin-bottom:10px}.progress-bar.svelte-19llkxn.svelte-19llkxn{height:100%;background:linear-gradient(90deg, #3b82f6, #8b5cf6);transition:width 0.5s ease}.results.svelte-19llkxn h2.svelte-19llkxn{color:#1e293b;margin-bottom:20px}.result-card.svelte-19llkxn.svelte-19llkxn{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0, 0, 0, 0.1)}.result-header.svelte-19llkxn.svelte-19llkxn{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #e2e8f0}.result-header.svelte-19llkxn h3.svelte-19llkxn{margin:0;color:#1e293b}.timestamp.svelte-19llkxn.svelte-19llkxn{color:#64748b;font-size:0.9rem}.error.svelte-19llkxn.svelte-19llkxn{color:#ef4444;font-weight:600;padding:10px;background:#fef2f2;border-radius:6px}.result-content.svelte-19llkxn.svelte-19llkxn{display:grid;gap:20px}.score-display.svelte-19llkxn.svelte-19llkxn{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}.total-score.svelte-19llkxn.svelte-19llkxn{text-align:center;padding:15px;background:#f8fafc;border-radius:8px}.score-value.svelte-19llkxn.svelte-19llkxn{display:block;font-size:2.5rem;font-weight:bold;line-height:1}.grade.svelte-19llkxn.svelte-19llkxn{display:block;font-size:1.2rem;font-weight:bold;margin-top:5px}.component-scores.svelte-19llkxn.svelte-19llkxn{display:grid;gap:8px}.component.svelte-19llkxn.svelte-19llkxn{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f1f5f9;border-radius:6px}.component.svelte-19llkxn .label.svelte-19llkxn{color:#475569;font-weight:500}.component.svelte-19llkxn .value.svelte-19llkxn{font-weight:600;color:#1e293b}.feedback.svelte-19llkxn.svelte-19llkxn{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:15px}.feedback.svelte-19llkxn h4.svelte-19llkxn{margin:0 0 10px 0;color:#0c4a6e}.primary-feedback.svelte-19llkxn.svelte-19llkxn{font-weight:600;color:#0c4a6e;margin-bottom:15px}.detailed-feedback.svelte-19llkxn.svelte-19llkxn{display:grid;gap:8px}.feedback-item.svelte-19llkxn.svelte-19llkxn{font-size:0.9rem;color:#374151}.expectation.svelte-19llkxn.svelte-19llkxn{padding:10px;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;color:#92400e;font-size:0.9rem}.statistics.svelte-19llkxn.svelte-19llkxn{margin-top:40px}.statistics.svelte-19llkxn h2.svelte-19llkxn{color:#1e293b;margin-bottom:20px}.stats-grid.svelte-19llkxn.svelte-19llkxn{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px}.stat-card.svelte-19llkxn.svelte-19llkxn{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0, 0, 0, 0.1)}.stat-card.svelte-19llkxn h3.svelte-19llkxn{margin:0 0 15px 0;color:#1e293b;font-size:1.1rem}.stat-item.svelte-19llkxn.svelte-19llkxn{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9}.stat-item.svelte-19llkxn.svelte-19llkxn:last-child{border-bottom:none}.stat-item.svelte-19llkxn .label.svelte-19llkxn{color:#64748b;font-weight:500}.stat-item.svelte-19llkxn .value.svelte-19llkxn{font-weight:600;color:#1e293b}@media(max-width: 768px){.container.svelte-19llkxn.svelte-19llkxn{padding:10px}.header.svelte-19llkxn.svelte-19llkxn{padding:15px}.header.svelte-19llkxn h1.svelte-19llkxn{font-size:2rem}.score-display.svelte-19llkxn.svelte-19llkxn{grid-template-columns:1fr}.stats-grid.svelte-19llkxn.svelte-19llkxn{grid-template-columns:1fr}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  import { EnhancedScoringEngine } from '$lib/scoring/EnhancedScoringEngine.js';\\n  \\n  // 採点エンジンのインスタンス\\n  let scoringEngine = null;\\n  let isInitialized = false;\\n  \\n  // テストデータ\\n  let testScenarios = [\\n    {\\n      name: \\"完璧な長3度認識\\",\\n      baseFreq: 440,      // A4\\n      targetFreq: 554.37, // C#5 (長3度上)\\n      detectedFreq: 554.37,\\n      responseTime: 800,\\n      volume: 60,\\n      expected: \\"高得点\\"\\n    },\\n    {\\n      name: \\"やや不正確な完全5度\\",\\n      baseFreq: 261.63,   // C4\\n      targetFreq: 392.00, // G4 (完全5度上)\\n      detectedFreq: 385.00, // 少しフラット\\n      responseTime: 1500,\\n      volume: 50,\\n      expected: \\"中程度の得点\\"\\n    },\\n    {\\n      name: \\"遅い反応での短2度\\",\\n      baseFreq: 293.66,   // D4\\n      targetFreq: 311.13, // D#4 (短2度上)\\n      detectedFreq: 315.00, // 少しシャープ\\n      responseTime: 4000,\\n      volume: 45,\\n      expected: \\"速度減点あり\\"\\n    },\\n    {\\n      name: \\"方向性間違い\\",\\n      baseFreq: 349.23,   // F4\\n      targetFreq: 293.66, // D4 (下行の短3度)\\n      detectedFreq: 415.30, // A4 (上行になってしまった)\\n      responseTime: 2200,\\n      volume: 65,\\n      expected: \\"方向性エラー\\"\\n    }\\n  ];\\n  \\n  // 結果表示用\\n  let currentTest = null;\\n  let testResults = [];\\n  let isRunning = false;\\n  let currentScenarioIndex = 0;\\n  \\n  // 統計表示用\\n  let engineStats = null;\\n  \\n  onMount(() => {\\n    initializeScoringEngine();\\n  });\\n  \\n  /**\\n   * 採点エンジンの初期化\\n   */\\n  function initializeScoringEngine() {\\n    try {\\n      scoringEngine = new EnhancedScoringEngine({\\n        weights: {\\n          pitchAccuracy: 0.40,\\n          recognitionSpeed: 0.20,\\n          intervalMastery: 0.20,\\n          directionAccuracy: 0.10,\\n          consistency: 0.10\\n        },\\n        speedThresholds: {\\n          excellent: 1000,\\n          good: 2000,\\n          fair: 3000,\\n          poor: 5000\\n        }\\n      });\\n      \\n      isInitialized = true;\\n      console.log('✅ EnhancedScoringEngine初期化完了');\\n    } catch (error) {\\n      console.error('❌ EnhancedScoringEngine初期化エラー:', error);\\n    }\\n  }\\n  \\n  /**\\n   * 単一テストシナリオの実行\\n   */\\n  async function runSingleTest(scenario) {\\n    if (!isInitialized) {\\n      console.error('採点エンジンが初期化されていません');\\n      return null;\\n    }\\n    \\n    try {\\n      console.log(\`🧪 テスト実行: \${scenario.name}\`);\\n      \\n      const result = await scoringEngine.analyzePerformance({\\n        baseFreq: scenario.baseFreq,\\n        targetFreq: scenario.targetFreq,\\n        detectedFreq: scenario.detectedFreq,\\n        responseTime: scenario.responseTime,\\n        volume: scenario.volume,\\n        harmonicCorrection: null // テスト用にnull\\n      });\\n      \\n      return {\\n        scenario: scenario.name,\\n        expected: scenario.expected,\\n        result: result,\\n        timestamp: new Date().toLocaleTimeString()\\n      };\\n      \\n    } catch (error) {\\n      console.error('❌ テスト実行エラー:', error);\\n      return {\\n        scenario: scenario.name,\\n        expected: scenario.expected,\\n        error: error.message,\\n        timestamp: new Date().toLocaleTimeString()\\n      };\\n    }\\n  }\\n  \\n  /**\\n   * 全テストシナリオの実行\\n   */\\n  async function runAllTests() {\\n    if (!isInitialized) {\\n      alert('採点エンジンが初期化されていません');\\n      return;\\n    }\\n    \\n    isRunning = true;\\n    testResults = [];\\n    currentTest = null;\\n    currentScenarioIndex = 0;\\n    \\n    for (let i = 0; i < testScenarios.length; i++) {\\n      currentScenarioIndex = i;\\n      currentTest = testScenarios[i];\\n      \\n      // 短い遅延を入れて視覚的な効果を作る\\n      await new Promise(resolve => setTimeout(resolve, 500));\\n      \\n      const result = await runSingleTest(testScenarios[i]);\\n      if (result) {\\n        testResults = [...testResults, result];\\n      }\\n    }\\n    \\n    isRunning = false;\\n    currentTest = null;\\n    \\n    // 統計情報の取得\\n    engineStats = scoringEngine.getStatistics();\\n    \\n    console.log('✅ 全テスト完了');\\n  }\\n  \\n  /**\\n   * エンジンのリセット\\n   */\\n  function resetEngine() {\\n    if (scoringEngine) {\\n      scoringEngine.reset();\\n      testResults = [];\\n      engineStats = null;\\n      console.log('🔄 エンジンリセット完了');\\n    }\\n  }\\n  \\n  /**\\n   * スコアの色分け\\n   */\\n  function getScoreColor(score) {\\n    if (score >= 90) return '#10b981'; // 緑\\n    if (score >= 80) return '#3b82f6'; // 青\\n    if (score >= 70) return '#f59e0b'; // 黄\\n    if (score >= 60) return '#f97316'; // オレンジ\\n    return '#ef4444'; // 赤\\n  }\\n  \\n  /**\\n   * 成績の色分け\\n   */\\n  function getGradeColor(grade) {\\n    if (['S', 'A+', 'A'].includes(grade)) return '#10b981';\\n    if (['B+', 'B'].includes(grade)) return '#3b82f6';\\n    if (['C+', 'C'].includes(grade)) return '#f59e0b';\\n    if (['D+', 'D'].includes(grade)) return '#f97316';\\n    return '#ef4444';\\n  }\\n<\/script>\\n\\n<svelte:head>\\n  <title>Enhanced Scoring Engine - Test Page</title>\\n</svelte:head>\\n\\n<!-- メインコンテナ -->\\n<div class=\\"container\\">\\n  <header class=\\"header\\">\\n    <h1>🎯 Enhanced Scoring Engine</h1>\\n    <p>統合採点エンジンのテストページ</p>\\n    <div class=\\"status\\">\\n      <span class=\\"status-indicator\\" class:ready={isInitialized} class:error={!isInitialized}></span>\\n      <span>{isInitialized ? '準備完了' : '初期化中...'}</span>\\n    </div>\\n  </header>\\n\\n  <!-- コントロールパネル -->\\n  <section class=\\"controls\\">\\n    <button \\n      class=\\"btn btn-primary\\" \\n      on:click={runAllTests} \\n      disabled={!isInitialized || isRunning}\\n    >\\n      {#if isRunning}\\n        🔄 テスト実行中...\\n      {:else}\\n        🧪 全テスト実行\\n      {/if}\\n    </button>\\n    \\n    <button \\n      class=\\"btn btn-secondary\\" \\n      on:click={resetEngine} \\n      disabled={!isInitialized || isRunning}\\n    >\\n      🔄 リセット\\n    </button>\\n  </section>\\n\\n  <!-- 実行中表示 -->\\n  {#if isRunning && currentTest}\\n    <section class=\\"current-test\\">\\n      <h3>📊 実行中: {currentTest.name}</h3>\\n      <div class=\\"progress\\">\\n        <div class=\\"progress-bar\\" style=\\"width: {((currentScenarioIndex + 1) / testScenarios.length) * 100}%\\"></div>\\n      </div>\\n      <p>{currentScenarioIndex + 1} / {testScenarios.length}</p>\\n    </section>\\n  {/if}\\n\\n  <!-- テスト結果表示 -->\\n  {#if testResults.length > 0}\\n    <section class=\\"results\\">\\n      <h2>📋 テスト結果</h2>\\n      \\n      {#each testResults as testResult, index}\\n        <div class=\\"result-card\\">\\n          <div class=\\"result-header\\">\\n            <h3>{testResult.scenario}</h3>\\n            <span class=\\"timestamp\\">{testResult.timestamp}</span>\\n          </div>\\n          \\n          {#if testResult.error}\\n            <div class=\\"error\\">\\n              ❌ エラー: {testResult.error}\\n            </div>\\n          {:else}\\n            <div class=\\"result-content\\">\\n              <!-- スコア表示 -->\\n              <div class=\\"score-display\\">\\n                <div class=\\"total-score\\">\\n                  <span \\n                    class=\\"score-value\\" \\n                    style=\\"color: {getScoreColor(testResult.result.score.total)}\\"\\n                  >\\n                    {testResult.result.score.total}\\n                  </span>\\n                  <span \\n                    class=\\"grade\\" \\n                    style=\\"color: {getGradeColor(testResult.result.score.grade)}\\"\\n                  >\\n                    {testResult.result.score.grade}\\n                  </span>\\n                </div>\\n                \\n                <!-- 成分スコア -->\\n                <div class=\\"component-scores\\">\\n                  <div class=\\"component\\">\\n                    <span class=\\"label\\">音程精度:</span>\\n                    <span class=\\"value\\">{testResult.result.score.components.pitchAccuracy}%</span>\\n                  </div>\\n                  <div class=\\"component\\">\\n                    <span class=\\"label\\">認識速度:</span>\\n                    <span class=\\"value\\">{testResult.result.score.components.recognitionSpeed}%</span>\\n                  </div>\\n                  <div class=\\"component\\">\\n                    <span class=\\"label\\">音程習得度:</span>\\n                    <span class=\\"value\\">{testResult.result.score.components.intervalMastery}%</span>\\n                  </div>\\n                  <div class=\\"component\\">\\n                    <span class=\\"label\\">方向性精度:</span>\\n                    <span class=\\"value\\">{testResult.result.score.components.directionAccuracy}%</span>\\n                  </div>\\n                  <div class=\\"component\\">\\n                    <span class=\\"label\\">一貫性:</span>\\n                    <span class=\\"value\\">{testResult.result.score.components.consistency}%</span>\\n                  </div>\\n                </div>\\n              </div>\\n              \\n              <!-- フィードバック -->\\n              <div class=\\"feedback\\">\\n                <h4>💬 フィードバック</h4>\\n                <p class=\\"primary-feedback\\">{testResult.result.feedback.primary}</p>\\n                \\n                {#if testResult.result.feedback.detailed}\\n                  <div class=\\"detailed-feedback\\">\\n                    <div class=\\"feedback-item\\">\\n                      <strong>音程:</strong> {testResult.result.feedback.detailed.interval}\\n                    </div>\\n                    <div class=\\"feedback-item\\">\\n                      <strong>方向性:</strong> {testResult.result.feedback.detailed.direction}\\n                    </div>\\n                    <div class=\\"feedback-item\\">\\n                      <strong>一貫性:</strong> {testResult.result.feedback.detailed.consistency}\\n                    </div>\\n                    <div class=\\"feedback-item\\">\\n                      <strong>速度:</strong> {testResult.result.feedback.detailed.speed}\\n                    </div>\\n                  </div>\\n                {/if}\\n              </div>\\n              \\n              <!-- 期待値との比較 -->\\n              <div class=\\"expectation\\">\\n                <strong>期待値:</strong> {testResult.expected}\\n              </div>\\n            </div>\\n          {/if}\\n        </div>\\n      {/each}\\n    </section>\\n  {/if}\\n\\n  <!-- 統計情報 -->\\n  {#if engineStats}\\n    <section class=\\"statistics\\">\\n      <h2>📊 エンジン統計</h2>\\n      \\n      <div class=\\"stats-grid\\">\\n        <div class=\\"stat-card\\">\\n          <h3>セッション情報</h3>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">総試行回数:</span>\\n            <span class=\\"value\\">{engineStats.session.totalAttempts}</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">平均スコア:</span>\\n            <span class=\\"value\\">{engineStats.session.overallScore.toFixed(1)}</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">現在レベル:</span>\\n            <span class=\\"value\\">{engineStats.session.currentLevel}</span>\\n          </div>\\n        </div>\\n        \\n        <div class=\\"stat-card\\">\\n          <h3>パフォーマンス</h3>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">平均速度:</span>\\n            <span class=\\"value\\">{engineStats.performance.averageSpeed.toFixed(1)}</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">精度トレンド:</span>\\n            <span class=\\"value\\">{engineStats.performance.accuracyTrend}</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">セッション進捗:</span>\\n            <span class=\\"value\\">{engineStats.performance.sessionProgress}%</span>\\n          </div>\\n        </div>\\n        \\n        <div class=\\"stat-card\\">\\n          <h3>分析器統計</h3>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">音程分析:</span>\\n            <span class=\\"value\\">{engineStats.analyzers.interval.totalAnalyses}回</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">方向性分析:</span>\\n            <span class=\\"value\\">{engineStats.analyzers.direction.totalAnalyses}回</span>\\n          </div>\\n          <div class=\\"stat-item\\">\\n            <span class=\\"label\\">一貫性追跡:</span>\\n            <span class=\\"value\\">{engineStats.analyzers.consistency.totalAttempts}回</span>\\n          </div>\\n        </div>\\n      </div>\\n    </section>\\n  {/if}\\n</div>\\n\\n<style>\\n  .container {\\n    max-width: 1200px;\\n    margin: 0 auto;\\n    padding: 20px;\\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\\n  }\\n  \\n  .header {\\n    text-align: center;\\n    margin-bottom: 30px;\\n    padding: 20px;\\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\\n    color: white;\\n    border-radius: 12px;\\n  }\\n  \\n  .header h1 {\\n    margin: 0 0 10px 0;\\n    font-size: 2.5rem;\\n  }\\n  \\n  .header p {\\n    margin: 0 0 15px 0;\\n    opacity: 0.9;\\n  }\\n  \\n  .status {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    gap: 8px;\\n  }\\n  \\n  .status-indicator {\\n    width: 12px;\\n    height: 12px;\\n    border-radius: 50%;\\n    background: #ef4444;\\n    transition: background 0.3s;\\n  }\\n  \\n  .status-indicator.ready {\\n    background: #10b981;\\n  }\\n  \\n  .controls {\\n    text-align: center;\\n    margin-bottom: 30px;\\n  }\\n  \\n  .btn {\\n    padding: 12px 24px;\\n    border: none;\\n    border-radius: 8px;\\n    font-size: 16px;\\n    font-weight: 600;\\n    cursor: pointer;\\n    transition: all 0.2s;\\n    margin: 0 8px;\\n  }\\n  \\n  .btn:disabled {\\n    opacity: 0.6;\\n    cursor: not-allowed;\\n  }\\n  \\n  .btn-primary {\\n    background: #3b82f6;\\n    color: white;\\n  }\\n  \\n  .btn-primary:hover:not(:disabled) {\\n    background: #2563eb;\\n    transform: translateY(-1px);\\n  }\\n  \\n  .btn-secondary {\\n    background: #6b7280;\\n    color: white;\\n  }\\n  \\n  .btn-secondary:hover:not(:disabled) {\\n    background: #4b5563;\\n    transform: translateY(-1px);\\n  }\\n  \\n  .current-test {\\n    background: #f8fafc;\\n    border: 2px solid #e2e8f0;\\n    border-radius: 12px;\\n    padding: 20px;\\n    margin-bottom: 20px;\\n    text-align: center;\\n  }\\n  \\n  .current-test h3 {\\n    margin: 0 0 15px 0;\\n    color: #1e293b;\\n  }\\n  \\n  .progress {\\n    width: 100%;\\n    height: 8px;\\n    background: #e2e8f0;\\n    border-radius: 4px;\\n    overflow: hidden;\\n    margin-bottom: 10px;\\n  }\\n  \\n  .progress-bar {\\n    height: 100%;\\n    background: linear-gradient(90deg, #3b82f6, #8b5cf6);\\n    transition: width 0.5s ease;\\n  }\\n  \\n  .results h2 {\\n    color: #1e293b;\\n    margin-bottom: 20px;\\n  }\\n  \\n  .result-card {\\n    background: white;\\n    border: 1px solid #e2e8f0;\\n    border-radius: 12px;\\n    padding: 20px;\\n    margin-bottom: 20px;\\n    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .result-header {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    margin-bottom: 15px;\\n    padding-bottom: 10px;\\n    border-bottom: 1px solid #e2e8f0;\\n  }\\n  \\n  .result-header h3 {\\n    margin: 0;\\n    color: #1e293b;\\n  }\\n  \\n  .timestamp {\\n    color: #64748b;\\n    font-size: 0.9rem;\\n  }\\n  \\n  .error {\\n    color: #ef4444;\\n    font-weight: 600;\\n    padding: 10px;\\n    background: #fef2f2;\\n    border-radius: 6px;\\n  }\\n  \\n  .result-content {\\n    display: grid;\\n    gap: 20px;\\n  }\\n  \\n  .score-display {\\n    display: grid;\\n    grid-template-columns: auto 1fr;\\n    gap: 20px;\\n    align-items: start;\\n  }\\n  \\n  .total-score {\\n    text-align: center;\\n    padding: 15px;\\n    background: #f8fafc;\\n    border-radius: 8px;\\n  }\\n  \\n  .score-value {\\n    display: block;\\n    font-size: 2.5rem;\\n    font-weight: bold;\\n    line-height: 1;\\n  }\\n  \\n  .grade {\\n    display: block;\\n    font-size: 1.2rem;\\n    font-weight: bold;\\n    margin-top: 5px;\\n  }\\n  \\n  .component-scores {\\n    display: grid;\\n    gap: 8px;\\n  }\\n  \\n  .component {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    padding: 8px 12px;\\n    background: #f1f5f9;\\n    border-radius: 6px;\\n  }\\n  \\n  .component .label {\\n    color: #475569;\\n    font-weight: 500;\\n  }\\n  \\n  .component .value {\\n    font-weight: 600;\\n    color: #1e293b;\\n  }\\n  \\n  .feedback {\\n    background: #f0f9ff;\\n    border: 1px solid #bae6fd;\\n    border-radius: 8px;\\n    padding: 15px;\\n  }\\n  \\n  .feedback h4 {\\n    margin: 0 0 10px 0;\\n    color: #0c4a6e;\\n  }\\n  \\n  .primary-feedback {\\n    font-weight: 600;\\n    color: #0c4a6e;\\n    margin-bottom: 15px;\\n  }\\n  \\n  .detailed-feedback {\\n    display: grid;\\n    gap: 8px;\\n  }\\n  \\n  .feedback-item {\\n    font-size: 0.9rem;\\n    color: #374151;\\n  }\\n  \\n  .expectation {\\n    padding: 10px;\\n    background: #fef3c7;\\n    border: 1px solid #fbbf24;\\n    border-radius: 6px;\\n    color: #92400e;\\n    font-size: 0.9rem;\\n  }\\n  \\n  .statistics {\\n    margin-top: 40px;\\n  }\\n  \\n  .statistics h2 {\\n    color: #1e293b;\\n    margin-bottom: 20px;\\n  }\\n  \\n  .stats-grid {\\n    display: grid;\\n    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\\n    gap: 20px;\\n  }\\n  \\n  .stat-card {\\n    background: white;\\n    border: 1px solid #e2e8f0;\\n    border-radius: 12px;\\n    padding: 20px;\\n    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\\n  }\\n  \\n  .stat-card h3 {\\n    margin: 0 0 15px 0;\\n    color: #1e293b;\\n    font-size: 1.1rem;\\n  }\\n  \\n  .stat-item {\\n    display: flex;\\n    justify-content: space-between;\\n    align-items: center;\\n    padding: 8px 0;\\n    border-bottom: 1px solid #f1f5f9;\\n  }\\n  \\n  .stat-item:last-child {\\n    border-bottom: none;\\n  }\\n  \\n  .stat-item .label {\\n    color: #64748b;\\n    font-weight: 500;\\n  }\\n  \\n  .stat-item .value {\\n    font-weight: 600;\\n    color: #1e293b;\\n  }\\n  \\n  @media (max-width: 768px) {\\n    .container {\\n      padding: 10px;\\n    }\\n    \\n    .header {\\n      padding: 15px;\\n    }\\n    \\n    .header h1 {\\n      font-size: 2rem;\\n    }\\n    \\n    .score-display {\\n      grid-template-columns: 1fr;\\n    }\\n    \\n    .stats-grid {\\n      grid-template-columns: 1fr;\\n    }\\n  }\\n</style>"],"names":[],"mappings":"AAiZE,wCAAW,CACT,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,aAAa,CAAC,CAAC,kBAAkB,CAAC,CAAC,UAAU,CAAC,CAAC,MAAM,CAAC,CAAC,UACtE,CAEA,qCAAQ,CACN,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,gBAAgB,MAAM,CAAC,CAAC,OAAO,CAAC,EAAE,CAAC,CAAC,OAAO,CAAC,IAAI,CAAC,CAC7D,KAAK,CAAE,KAAK,CACZ,aAAa,CAAE,IACjB,CAEA,sBAAO,CAAC,iBAAG,CACT,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,SAAS,CAAE,MACb,CAEA,sBAAO,CAAC,gBAAE,CACR,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,OAAO,CAAE,GACX,CAEA,qCAAQ,CACN,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,GAAG,CAAE,GACP,CAEA,+CAAkB,CAChB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,UAAU,CAAC,IACzB,CAEA,iBAAiB,oCAAO,CACtB,UAAU,CAAE,OACd,CAEA,uCAAU,CACR,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,IACjB,CAEA,kCAAK,CACH,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,GAAG,CAAC,IAAI,CACpB,MAAM,CAAE,CAAC,CAAC,GACZ,CAEA,kCAAI,SAAU,CACZ,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,WACV,CAEA,0CAAa,CACX,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KACT,CAEA,0CAAY,MAAM,KAAK,SAAS,CAAE,CAChC,UAAU,CAAE,OAAO,CACnB,SAAS,CAAE,WAAW,IAAI,CAC5B,CAEA,4CAAe,CACb,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KACT,CAEA,4CAAc,MAAM,KAAK,SAAS,CAAE,CAClC,UAAU,CAAE,OAAO,CACnB,SAAS,CAAE,WAAW,IAAI,CAC5B,CAEA,2CAAc,CACZ,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,MACd,CAEA,4BAAa,CAAC,iBAAG,CACf,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,KAAK,CAAE,OACT,CAEA,uCAAU,CACR,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,GAAG,CACX,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE,GAAG,CAClB,QAAQ,CAAE,MAAM,CAChB,aAAa,CAAE,IACjB,CAEA,2CAAc,CACZ,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,gBAAgB,KAAK,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,CACpD,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,IACzB,CAEA,uBAAQ,CAAC,iBAAG,CACV,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IACjB,CAEA,0CAAa,CACX,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACzC,CAEA,4CAAe,CACb,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,IAAI,CACnB,cAAc,CAAE,IAAI,CACpB,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,OAC3B,CAEA,6BAAc,CAAC,iBAAG,CAChB,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,OACT,CAEA,wCAAW,CACT,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MACb,CAEA,oCAAO,CACL,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE,GACjB,CAEA,6CAAgB,CACd,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IACP,CAEA,4CAAe,CACb,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,IAAI,CAAC,GAAG,CAC/B,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,KACf,CAEA,0CAAa,CACX,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE,GACjB,CAEA,0CAAa,CACX,OAAO,CAAE,KAAK,CACd,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,WAAW,CAAE,CACf,CAEA,oCAAO,CACL,OAAO,CAAE,KAAK,CACd,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,GACd,CAEA,+CAAkB,CAChB,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,GACP,CAEA,wCAAW,CACT,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE,GACjB,CAEA,yBAAU,CAAC,qBAAO,CAChB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,GACf,CAEA,yBAAU,CAAC,qBAAO,CAChB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,OACT,CAEA,uCAAU,CACR,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IACX,CAEA,wBAAS,CAAC,iBAAG,CACX,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,KAAK,CAAE,OACT,CAEA,+CAAkB,CAChB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IACjB,CAEA,gDAAmB,CACjB,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,GACP,CAEA,4CAAe,CACb,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,OACT,CAEA,0CAAa,CACX,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,CACnB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,GAAG,CAClB,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MACb,CAEA,yCAAY,CACV,UAAU,CAAE,IACd,CAEA,0BAAW,CAAC,iBAAG,CACb,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IACjB,CAEA,yCAAY,CACV,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,CAC3D,GAAG,CAAE,IACP,CAEA,wCAAW,CACT,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACzC,CAEA,yBAAU,CAAC,iBAAG,CACZ,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAClB,KAAK,CAAE,OAAO,CACd,SAAS,CAAE,MACb,CAEA,wCAAW,CACT,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,GAAG,CAAC,CAAC,CACd,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,OAC3B,CAEA,wCAAU,WAAY,CACpB,aAAa,CAAE,IACjB,CAEA,yBAAU,CAAC,qBAAO,CAChB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,GACf,CAEA,yBAAU,CAAC,qBAAO,CAChB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,OACT,CAEA,MAAO,YAAY,KAAK,CAAE,CACxB,wCAAW,CACT,OAAO,CAAE,IACX,CAEA,qCAAQ,CACN,OAAO,CAAE,IACX,CAEA,sBAAO,CAAC,iBAAG,CACT,SAAS,CAAE,IACb,CAEA,4CAAe,CACb,qBAAqB,CAAE,GACzB,CAEA,yCAAY,CACV,qBAAqB,CAAE,GACzB,CACF"}`
};
function getScoreColor(score) {
  if (score >= 90) return "#10b981";
  if (score >= 80) return "#3b82f6";
  if (score >= 70) return "#f59e0b";
  if (score >= 60) return "#f97316";
  return "#ef4444";
}
function getGradeColor(grade) {
  if (["S", "A+", "A"].includes(grade)) return "#10b981";
  if (["B+", "B"].includes(grade)) return "#3b82f6";
  if (["C+", "C"].includes(grade)) return "#f59e0b";
  if (["D+", "D"].includes(grade)) return "#f97316";
  return "#ef4444";
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let testResults = [];
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-pwq006_START -->${$$result.title = `<title>Enhanced Scoring Engine - Test Page</title>`, ""}<!-- HEAD_svelte-pwq006_END -->`, ""}  <div class="container svelte-19llkxn"><header class="header svelte-19llkxn"><h1 class="svelte-19llkxn" data-svelte-h="svelte-f90z2e">🎯 Enhanced Scoring Engine</h1> <p class="svelte-19llkxn" data-svelte-h="svelte-10mru30">統合採点エンジンのテストページ</p> <div class="status svelte-19llkxn"><span class="${[
    "status-indicator svelte-19llkxn",
    " error"
  ].join(" ").trim()}"></span> <span>${escape("初期化中...")}</span></div></header>  <section class="controls svelte-19llkxn"><button class="btn btn-primary svelte-19llkxn" ${"disabled"}>${`🧪 全テスト実行`}</button> <button class="btn btn-secondary svelte-19llkxn" ${"disabled"}>🔄 リセット</button></section>  ${``}  ${testResults.length > 0 ? `<section class="results svelte-19llkxn"><h2 class="svelte-19llkxn" data-svelte-h="svelte-s3709x">📋 テスト結果</h2> ${each(testResults, (testResult, index) => {
    return `<div class="result-card svelte-19llkxn"><div class="result-header svelte-19llkxn"><h3 class="svelte-19llkxn">${escape(testResult.scenario)}</h3> <span class="timestamp svelte-19llkxn">${escape(testResult.timestamp)}</span></div> ${testResult.error ? `<div class="error svelte-19llkxn">❌ エラー: ${escape(testResult.error)} </div>` : `<div class="result-content svelte-19llkxn"> <div class="score-display svelte-19llkxn"><div class="total-score svelte-19llkxn"><span class="score-value svelte-19llkxn" style="${"color: " + escape(getScoreColor(testResult.result.score.total), true)}">${escape(testResult.result.score.total)}</span> <span class="grade svelte-19llkxn" style="${"color: " + escape(getGradeColor(testResult.result.score.grade), true)}">${escape(testResult.result.score.grade)} </span></div>  <div class="component-scores svelte-19llkxn"><div class="component svelte-19llkxn"><span class="label svelte-19llkxn" data-svelte-h="svelte-146tyqf">音程精度:</span> <span class="value svelte-19llkxn">${escape(testResult.result.score.components.pitchAccuracy)}%</span></div> <div class="component svelte-19llkxn"><span class="label svelte-19llkxn" data-svelte-h="svelte-sqw889">認識速度:</span> <span class="value svelte-19llkxn">${escape(testResult.result.score.components.recognitionSpeed)}%</span></div> <div class="component svelte-19llkxn"><span class="label svelte-19llkxn" data-svelte-h="svelte-1uo5o5u">音程習得度:</span> <span class="value svelte-19llkxn">${escape(testResult.result.score.components.intervalMastery)}%</span></div> <div class="component svelte-19llkxn"><span class="label svelte-19llkxn" data-svelte-h="svelte-vuo93o">方向性精度:</span> <span class="value svelte-19llkxn">${escape(testResult.result.score.components.directionAccuracy)}%</span></div> <div class="component svelte-19llkxn"><span class="label svelte-19llkxn" data-svelte-h="svelte-z9t95r">一貫性:</span> <span class="value svelte-19llkxn">${escape(testResult.result.score.components.consistency)}%</span></div> </div></div>  <div class="feedback svelte-19llkxn"><h4 class="svelte-19llkxn" data-svelte-h="svelte-1svoycg">💬 フィードバック</h4> <p class="primary-feedback svelte-19llkxn">${escape(testResult.result.feedback.primary)}</p> ${testResult.result.feedback.detailed ? `<div class="detailed-feedback svelte-19llkxn"><div class="feedback-item svelte-19llkxn"><strong data-svelte-h="svelte-677z0q">音程:</strong> ${escape(testResult.result.feedback.detailed.interval)}</div> <div class="feedback-item svelte-19llkxn"><strong data-svelte-h="svelte-8yvkz3">方向性:</strong> ${escape(testResult.result.feedback.detailed.direction)}</div> <div class="feedback-item svelte-19llkxn"><strong data-svelte-h="svelte-x7tjto">一貫性:</strong> ${escape(testResult.result.feedback.detailed.consistency)}</div> <div class="feedback-item svelte-19llkxn"><strong data-svelte-h="svelte-xkjonl">速度:</strong> ${escape(testResult.result.feedback.detailed.speed)}</div> </div>` : ``}</div>  <div class="expectation svelte-19llkxn"><strong data-svelte-h="svelte-1ri8yc2">期待値:</strong> ${escape(testResult.expected)}</div> </div>`} </div>`;
  })}</section>` : ``}  ${``} </div>`;
});
export {
  Page as default
};

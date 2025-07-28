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

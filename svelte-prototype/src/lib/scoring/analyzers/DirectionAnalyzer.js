/**
 * DirectionAnalyzer - 方向性分析システム
 * 
 * 目的: 音程の上行・下行認識能力の分析
 * - 基音からの方向性の正確な判定
 * - 上行・下行別の習得度管理
 * - 方向性エラーの詳細分析
 * - オーバーシュート・アンダーシュートの検出
 */

export class DirectionAnalyzer {
  constructor() {
    // 方向性定義
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
    
    // 方向性習得度データ
    this.directionMastery = new Map();
    
    // 分析履歴
    this.analysisHistory = [];
    this.maxHistoryLength = 50;
    
    // デバッグモード
    this.debugMode = import.meta.env.DEV;
    
    // 閾値設定
    this.thresholds = {
      unison: 0.5,        // ±0.5セミトーン以内を同音と判定
      overshoot: 1.5,     // 目標から1.5セミトーン以上のずれをオーバーシュート
      significant: 3.0    // 3セミトーン以上の差を有意な方向性エラー
    };
    
    // 初期化
    this.initializeDirectionMastery();
    
    this.log('🧭 DirectionAnalyzer初期化完了', {
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
      // 1. 目標方向の特定
      const targetDirection = this.determineDirection(baseFreq, targetFreq);
      const targetSemitones = this.calculateSemitones(baseFreq, targetFreq);
      
      // 2. 検出方向の特定
      const detectedDirection = this.determineDirection(baseFreq, detectedFreq);
      const detectedSemitones = this.calculateSemitones(baseFreq, detectedFreq);
      
      // 3. 方向性の正確性評価
      const directionCorrect = targetDirection.key === detectedDirection.key;
      
      // 4. オーバーシュート・アンダーシュート分析
      const overshootAnalysis = this.analyzeOvershoot(targetSemitones, detectedSemitones);
      
      // 5. 方向性精度の計算
      const accuracy = this.calculateDirectionAccuracy(
        targetDirection.key, 
        detectedDirection.key, 
        targetSemitones, 
        detectedSemitones
      );
      
      // 6. 習得度の更新
      this.updateDirectionMastery(targetDirection.key, accuracy, directionCorrect);
      const mastery = this.getDirectionMastery(targetDirection.key);
      
      // 7. 分析結果の構築
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
      
      // 8. 履歴記録
      this.recordAnalysis(analysis);
      
      // 9. デバッグログ
      if (this.debugMode) {
        this.logAnalysisDetails(analysis);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('❌ [DirectionAnalyzer] 分析エラー:', error);
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
      return { key: 'unison', ...this.directions.unison };
    }
    
    if (semitones > 0) {
      return { key: 'ascending', ...this.directions.ascending };
    } else {
      return { key: 'descending', ...this.directions.descending };
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
    
    // オーバーシュートの種類判定
    let type = 'accurate';
    let severity = 'none';
    
    if (absDifference >= this.thresholds.overshoot) {
      if (difference > 0) {
        type = 'overshoot';  // 目標を超えた
      } else {
        type = 'undershoot'; // 目標に届かない
      }
      
      // 深刻度の判定
      if (absDifference >= this.thresholds.significant) {
        severity = 'severe';
      } else {
        severity = 'moderate';
      }
    }
    
    return {
      type,
      severity,
      difference,
      absDifference,
      percentage: (absDifference / Math.abs(targetSemitones)) * 100
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
    // 方向性が間違っている場合は大幅減点
    if (targetDir !== detectedDir) {
      return Math.max(0, 30 - Math.abs(detectedSemitones - targetSemitones) * 5);
    }
    
    // 方向性は正しい場合、距離の精度で評価
    const semitoneError = Math.abs(detectedSemitones - targetSemitones);
    
    // 距離エラーに基づく精度計算
    // 0.5セミトーン以内: 100点
    // 1.0セミトーン以内: 85点
    // 2.0セミトーン以内: 70点
    // 3.0セミトーン以内: 50点
    const accuracy = Math.max(0, 100 - (semitoneError * 25));
    
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
        trend: 'stable'
      });
    }
    
    const mastery = this.directionMastery.get(direction);
    
    // 統計更新
    mastery.attempts++;
    if (correct) mastery.correctAttempts++;
    mastery.totalAccuracy += accuracy;
    mastery.averageAccuracy = mastery.totalAccuracy / mastery.attempts;
    mastery.bestAccuracy = Math.max(mastery.bestAccuracy, accuracy);
    mastery.successRate = (mastery.correctAttempts / mastery.attempts) * 100;
    mastery.lastAttempt = Date.now();
    
    // 直近の試行履歴（最大10回）
    mastery.recentAttempts.push(accuracy);
    mastery.recentCorrects.push(correct);
    
    if (mastery.recentAttempts.length > 10) {
      mastery.recentAttempts.shift();
      mastery.recentCorrects.shift();
    }
    
    // トレンド分析
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
        level: 'beginner',
        progress: 0
      };
    }
    
    // 習得レベルの判定
    const level = this.determineDirectionLevel(mastery.successRate, mastery.attempts);
    
    // 進捗率の計算
    const progress = Math.min(100, (mastery.successRate * mastery.attempts) / 500);
    
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
    if (attempts < 3) return 'beginner';
    if (successRate >= 95 && attempts >= 10) return 'master';
    if (successRate >= 85 && attempts >= 7) return 'advanced';
    if (successRate >= 75 && attempts >= 5) return 'intermediate';
    if (successRate >= 60) return 'novice';
    return 'beginner';
  }
  
  /**
   * 方向性トレンド分析
   * @param {Array} recentCorrects - 直近の正解状況
   * @returns {string} - トレンド
   */
  calculateDirectionTrend(recentCorrects) {
    if (recentCorrects.length < 5) return 'stable';
    
    const recent = recentCorrects.slice(-3);
    const earlier = recentCorrects.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';
    
    const recentSuccessRate = recent.filter(Boolean).length / recent.length;
    const earlierSuccessRate = earlier.filter(Boolean).length / earlier.length;
    
    const improvement = recentSuccessRate - earlierSuccessRate;
    
    if (improvement > 0.2) return 'improving';
    if (improvement < -0.2) return 'declining';
    return 'stable';
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
    
    // 方向性が正しい場合
    if (isCorrect && accuracy >= 90) {
      return `🎯 ${targetDirection.name}の方向性が完璧です！`;
    }
    
    if (isCorrect && accuracy >= 70) {
      return `✅ ${targetDirection.name}の方向は正しいです。距離の調整をしてみましょう。`;
    }
    
    if (isCorrect) {
      // オーバーシュート・アンダーシュートの指摘
      if (overshoot.type === 'overshoot') {
        return `👍 ${targetDirection.name}の方向は正しいですが、少し歌いすぎです。`;
      } else if (overshoot.type === 'undershoot') {
        return `👍 ${targetDirection.name}の方向は正しいですが、もう少し大きく歌ってみてください。`;
      }
      
      return `👍 ${targetDirection.name}の方向は認識できています。`;
    }
    
    // 方向性が間違っている場合
    if (targetDirection.key === 'ascending' && detectedDirection.key === 'descending') {
      return `❌ 上行のつもりが下行になっています。基音より高く歌ってください。`;
    }
    
    if (targetDirection.key === 'descending' && detectedDirection.key === 'ascending') {
      return `❌ 下行のつもりが上行になっています。基音より低く歌ってください。`;
    }
    
    if (targetDirection.key !== 'unison' && detectedDirection.key === 'unison') {
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
    const ascending = this.getDirectionMastery('ascending');
    const descending = this.getDirectionMastery('descending');
    
    return {
      ascending,
      descending,
      comparison: {
        betterDirection: ascending.successRate > descending.successRate ? 'ascending' : 'descending',
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
      return '上行・下行ともにバランス良く習得できています。';
    }
    
    if (diff > 10) {
      return '下行の練習を重点的に行うことをお勧めします。下向きの音程により意識を向けてみてください。';
    } else {
      return '上行の練習を重点的に行うことをお勧めします。上向きの音程により意識を向けてみてください。';
    }
  }
  
  /**
   * 方向性習得度データの初期化
   */
  initializeDirectionMastery() {
    // 将来的にLocalStorageから読み込み予定
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
          trend: 'stable'
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
      targetDirection: { name: '不明', key: 'unknown' },
      detectedDirection: { name: '不明', key: 'unknown' },
      directionCorrect: false,
      accuracy: 0,
      mastery: { level: 'beginner', progress: 0 },
      overshoot: { type: 'unknown', severity: 'none' },
      feedback: '方向性分析でエラーが発生しました。',
      error: true
    };
  }
  
  /**
   * 詳細分析ログ出力
   * @param {Object} analysis - 分析結果
   */
  logAnalysisDetails(analysis) {
    console.group(`🧭 [DirectionAnalyzer] ${analysis.targetDirection.name}分析結果`);
    
    console.log('🎯 方向性分析:', {
      目標: `${analysis.targetDirection.name} (${analysis.targetSemitones.toFixed(1)}セミトーン)`,
      検出: `${analysis.detectedDirection.name} (${analysis.detectedSemitones.toFixed(1)}セミトーン)`,
      正解: analysis.directionCorrect ? '✅' : '❌',
      精度: `${analysis.accuracy.toFixed(1)}%`
    });
    
    console.log('📊 オーバーシュート分析:', {
      タイプ: analysis.overshoot.type,
      深刻度: analysis.overshoot.severity,
      差分: `${analysis.overshoot.difference.toFixed(1)}セミトーン`,
      誤差率: `${analysis.overshoot.percentage.toFixed(1)}%`
    });
    
    console.log('📈 習得状況:', {
      レベル: analysis.mastery.level,
      成功率: `${analysis.mastery.successRate?.toFixed(1) || 0}%`,
      試行回数: analysis.mastery.attempts,
      トレンド: analysis.mastery.trend
    });
    
    console.log('💬 フィードバック:', analysis.feedback);
    
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
    
    this.log('🔄 DirectionAnalyzer リセット完了');
  }
}

// デバッグ用グローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.DirectionAnalyzer = DirectionAnalyzer;
}
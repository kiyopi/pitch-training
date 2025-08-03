/**
 * ConsistencyTracker - 一貫性・安定性追跡システム
 * 
 * 目的: 音程認識の一貫性・安定性の分析
 * - 同一音程での精度のばらつき測定
 * - 時系列での安定性改善追跡
 * - 疲労度・集中力の低下検出
 * - 学習進歩の安定性評価
 */

export class ConsistencyTracker {
  constructor(config = {}) {
    // 設定パラメータ
    this.config = {
      windowSize: config.windowSize || 5,           // 一貫性評価のウィンドウサイズ
      maxHistory: config.maxHistory || 100,        // 最大履歴保持数
      stabilityThreshold: config.stabilityThreshold || 25, // 安定性閾値（セント）
      trendWindowSize: config.trendWindowSize || 10, // トレンド分析ウィンドウ
      fatigueDetectionWindow: config.fatigueDetectionWindow || 15 // 疲労検出ウィンドウ
    };
    
    // 一貫性データ管理
    this.consistencyData = new Map(); // intervalType -> ConsistencyData
    
    // 全体的な安定性履歴
    this.stabilityHistory = [];
    
    // セッション分析データ
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallConsistency: 0,
      stabilityTrend: 'stable',
      fatigueLevel: 'fresh',
      concentrationLevel: 'high'
    };
    
    // デバッグモード
    this.debugMode = import.meta.env.DEV;
    
    this.log('📊 ConsistencyTracker初期化完了', {
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
      // 1. データの記録
      this.addAttemptData(intervalType, centsDiff, accuracy, responseTime);
      
      // 2. 音程別一貫性の計算
      const intervalConsistency = this.calculateIntervalConsistency(intervalType);
      
      // 3. 全体的一貫性の更新
      this.updateOverallConsistency();
      
      // 4. 安定性トレンドの分析
      const stabilityTrend = this.analyzeStabilityTrend();
      
      // 5. 疲労度・集中力の評価
      const fatigueAnalysis = this.analyzeFatigue();
      
      // 6. 結果の構築
      const analysis = {
        intervalType,
        intervalConsistency,
        overallConsistency: this.sessionData.overallConsistency,
        stabilityTrend,
        fatigueAnalysis,
        recommendations: this.generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis),
        timestamp: Date.now()
      };
      
      // 7. セッションデータの更新
      this.updateSessionData(analysis);
      
      // 8. デバッグログ
      if (this.debugMode) {
        this.logConsistencyDetails(analysis);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('❌ [ConsistencyTracker] 記録エラー:', error);
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
    // 音程別データの初期化
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
        trend: 'stable',
        lastUpdated: Date.now()
      });
    }
    
    const data = this.consistencyData.get(intervalType);
    
    // 新しい試行データを追加
    const attemptData = {
      centsDiff,
      accuracy,
      responseTime,
      timestamp: Date.now()
    };
    
    data.attempts.push(attemptData);
    
    // 履歴サイズの制限
    if (data.attempts.length > this.config.maxHistory) {
      data.attempts.shift();
    }
    
    // 統計の更新
    this.updateStatistics(intervalType);
    
    // 全体履歴の更新
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
    
    const centsDiffs = attempts.map(a => Math.abs(a.centsDiff));
    const count = centsDiffs.length;
    
    // 基本統計の計算
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / count;
    const variance = centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    const range = Math.max(...centsDiffs) - Math.min(...centsDiffs);
    
    // 一貫性スコアの計算（標準偏差が小さいほど高スコア）
    // 0セント標準偏差: 100点
    // 25セント標準偏差: 50点
    // 50セント以上: 0点
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 2));
    
    // 統計データの更新
    data.statistics = {
      count,
      mean: Math.round(mean * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      range: Math.round(range * 10) / 10,
      consistencyScore: Math.round(consistencyScore * 10) / 10
    };
    
    // トレンド分析
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
        level: 'insufficient_data',
        score: 0,
        description: 'データ不足',
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
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'very_poor';
  }
  
  /**
   * 一貫性レベルの説明
   * @param {string} level - 一貫性レベル
   * @returns {string} - 説明文
   */
  getConsistencyDescription(level) {
    const descriptions = {
      excellent: '非常に安定した精度で認識できています',
      good: '安定した認識ができています',
      fair: 'やや不安定ですが、改善の余地があります',
      poor: '不安定な認識です。練習を重ねましょう',
      very_poor: '非常に不安定です。基礎練習から始めましょう',
      insufficient_data: 'データが不足しています'
    };
    
    return descriptions[level] || '評価不能';
  }
  
  /**
   * 全体的一貫性の更新
   */
  updateOverallConsistency() {
    if (this.stabilityHistory.length < 5) {
      this.sessionData.overallConsistency = 0;
      return;
    }
    
    // 直近の試行から全体的一貫性を計算
    const recentAttempts = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const centsDiffs = recentAttempts.map(a => a.centsDiff);
    
    const mean = centsDiffs.reduce((sum, val) => sum + val, 0) / centsDiffs.length;
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / centsDiffs.length
    );
    
    // 全体一貫性スコア
    this.sessionData.overallConsistency = Math.max(0, 100 - (standardDeviation * 2));
  }
  
  /**
   * 安定性トレンドの分析
   * @returns {Object} - トレンド分析結果
   */
  analyzeStabilityTrend() {
    if (this.stabilityHistory.length < this.config.trendWindowSize) {
      return {
        trend: 'insufficient_data',
        direction: 'stable',
        confidence: 0,
        description: 'データ不足'
      };
    }
    
    const recentData = this.stabilityHistory.slice(-this.config.trendWindowSize);
    const half = Math.floor(this.config.trendWindowSize / 2);
    
    const earlierHalf = recentData.slice(0, half);
    const laterHalf = recentData.slice(-half);
    
    const earlierAvg = earlierHalf.reduce((sum, a) => sum + a.centsDiff, 0) / earlierHalf.length;
    const laterAvg = laterHalf.reduce((sum, a) => sum + a.centsDiff, 0) / laterHalf.length;
    
    const improvement = earlierAvg - laterAvg; // 正の値で改善
    const improvementPercent = (improvement / earlierAvg) * 100;
    
    let trend, direction, confidence;
    
    if (Math.abs(improvementPercent) < 10) {
      trend = 'stable';
      direction = 'stable';
      confidence = 0.7;
    } else if (improvement > 0) {
      trend = 'improving';
      direction = 'better';
      confidence = Math.min(0.9, Math.abs(improvementPercent) / 20);
    } else {
      trend = 'declining';
      direction = 'worse';
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
        fatigueLevel: 'unknown',
        concentrationLevel: 'unknown',
        recommendation: 'データ不足のため判定できません'
      };
    }
    
    const recentData = this.stabilityHistory.slice(-this.config.fatigueDetectionWindow);
    const sessionDuration = Date.now() - this.sessionData.startTime;
    const sessionMinutes = sessionDuration / (1000 * 60);
    
    // 時間経過による疲労度評価
    let timeFatigue = 'fresh';
    if (sessionMinutes > 30) timeFatigue = 'moderate';
    if (sessionMinutes > 60) timeFatigue = 'tired';
    if (sessionMinutes > 90) timeFatigue = 'exhausted';
    
    // 精度低下による疲労度評価
    const accuracies = recentData.map(a => a.accuracy);
    const recentAvgAccuracy = accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;
    
    // 全セッションの平均精度と比較
    const allAccuracies = this.stabilityHistory.map(a => a.accuracy);
    const overallAvgAccuracy = allAccuracies.reduce((sum, val) => sum + val, 0) / allAccuracies.length;
    
    const accuracyDrop = overallAvgAccuracy - recentAvgAccuracy;
    
    let performanceFatigue = 'fresh';
    if (accuracyDrop > 5) performanceFatigue = 'moderate';
    if (accuracyDrop > 10) performanceFatigue = 'tired';
    if (accuracyDrop > 20) performanceFatigue = 'exhausted';
    
    // 総合疲労度の判定
    const fatigueLevel = this.combineFatigueFactors(timeFatigue, performanceFatigue);
    
    // 集中力レベルの評価
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
    const fatigueOrder = ['fresh', 'moderate', 'tired', 'exhausted'];
    const timeIndex = fatigueOrder.indexOf(timeFatigue);
    const performanceIndex = fatigueOrder.indexOf(performanceFatigue);
    
    // より高い疲労度を採用
    const maxIndex = Math.max(timeIndex, performanceIndex);
    return fatigueOrder[maxIndex];
  }
  
  /**
   * 集中力の評価
   * @param {Array} recentData - 直近データ
   * @returns {string} - 集中力レベル
   */
  evaluateConcentration(recentData) {
    // 一貫性の変動で集中力を評価
    const centsDiffs = recentData.map(a => a.centsDiff);
    const standardDeviation = Math.sqrt(
      centsDiffs.reduce((sum, val) => sum + Math.pow(val - centsDiffs.reduce((s, v) => s + v, 0) / centsDiffs.length, 2), 0) / centsDiffs.length
    );
    
    if (standardDeviation <= 15) return 'high';
    if (standardDeviation <= 25) return 'medium';
    if (standardDeviation <= 40) return 'low';
    return 'very_low';
  }
  
  /**
   * 一貫性改善提案の生成
   * @param {Object} intervalConsistency - 音程一貫性
   * @param {Object} fatigueAnalysis - 疲労分析
   * @returns {Array} - 改善提案リスト
   */
  generateConsistencyRecommendations(intervalConsistency, fatigueAnalysis) {
    const recommendations = [];
    
    // 疲労度に基づく提案
    if (fatigueAnalysis.fatigueLevel === 'tired' || fatigueAnalysis.fatigueLevel === 'exhausted') {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        message: '疲労が見られます。10-15分の休憩をお勧めします。',
        icon: '😴'
      });
    }
    
    // 集中力に基づく提案
    if (fatigueAnalysis.concentrationLevel === 'low' || fatigueAnalysis.concentrationLevel === 'very_low') {
      recommendations.push({
        type: 'focus',
        priority: 'medium',
        message: '集中力が低下しています。深呼吸をして、ゆっくりと練習してみてください。',
        icon: '🧘'
      });
    }
    
    // 一貫性に基づく提案
    if (intervalConsistency.level === 'poor' || intervalConsistency.level === 'very_poor') {
      recommendations.push({
        type: 'practice',
        priority: 'medium',
        message: `${intervalConsistency.intervalType}の練習を重点的に行いましょう。ゆっくりと正確に歌うことを意識してください。`,
        icon: '🎯'
      });
    }
    
    // トレンドに基づく提案
    if (intervalConsistency.trend === 'improving') {
      recommendations.push({
        type: 'encouragement',
        priority: 'low',
        message: '改善が見られます！この調子で練習を続けてください。',
        icon: '📈'
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
      return '安定した認識ができています。この精度を維持しましょう。';
    }
    
    if (trend === 'improving') {
      return '改善傾向にあります。継続して練習してください。';
    }
    
    if (statistics.standardDeviation > 30) {
      return 'ばらつきが大きいです。ゆっくりと正確に歌うことを意識してください。';
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
      stable: '安定した精度を維持しています',
      improving: '精度が向上しています',
      declining: '精度が低下しています'
    };
    
    return descriptions[trend] || '傾向を分析中';
  }
  
  /**
   * 疲労度推奨事項の生成
   * @param {string} fatigueLevel - 疲労度
   * @param {string} concentrationLevel - 集中力
   * @returns {string} - 推奨事項
   */
  getFatigueRecommendation(fatigueLevel, concentrationLevel) {
    if (fatigueLevel === 'exhausted') {
      return '今日はここまでにして、十分な休息を取ることをお勧めします。';
    }
    
    if (fatigueLevel === 'tired') {
      return '15-20分の休憩を取ってから練習を再開しましょう。';
    }
    
    if (concentrationLevel === 'very_low') {
      return '集中力が低下しています。環境を整えて、短時間の集中練習を心がけましょう。';
    }
    
    if (concentrationLevel === 'low') {
      return '深呼吸をして、一つ一つの音程に集中して練習してみてください。';
    }
    
    return '良い状態です。この調子で練習を続けてください。';
  }
  
  /**
   * 音程別トレンドの計算
   * @param {Array} attempts - 試行データ
   * @returns {string} - トレンド
   */
  calculateIntervalTrend(attempts) {
    if (attempts.length < 6) return 'stable';
    
    const recent = attempts.slice(-3);
    const earlier = attempts.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, a) => sum + Math.abs(a.centsDiff), 0) / earlier.length;
    
    const improvement = earlierAvg - recentAvg;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
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
      intervalConsistency: { level: 'error', score: 0 },
      overallConsistency: 0,
      stabilityTrend: { trend: 'error' },
      fatigueAnalysis: { fatigueLevel: 'unknown' },
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
    
    console.log('🎯 音程一貫性:', {
      レベル: analysis.intervalConsistency.level,
      スコア: `${analysis.intervalConsistency.score}%`,
      標準偏差: `${analysis.intervalConsistency.statistics?.standardDeviation || 0}セント`,
      試行回数: analysis.intervalConsistency.attempts
    });
    
    console.log('📈 トレンド分析:', {
      全体傾向: analysis.stabilityTrend.trend,
      方向: analysis.stabilityTrend.direction,
      信頼度: `${(analysis.stabilityTrend.confidence * 100).toFixed(0)}%`,
      改善度: `${analysis.stabilityTrend.improvement}セント`
    });
    
    console.log('😴 疲労分析:', {
      疲労度: analysis.fatigueAnalysis.fatigueLevel,
      集中力: analysis.fatigueAnalysis.concentrationLevel,
      セッション時間: `${analysis.fatigueAnalysis.sessionMinutes}分`,
      精度低下: `${analysis.fatigueAnalysis.accuracyDrop}%`
    });
    
    if (analysis.recommendations.length > 0) {
      console.log('💡 推奨事項:', analysis.recommendations.map(r => r.message));
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
      stabilityTrend: 'stable',
      fatigueLevel: 'fresh',
      concentrationLevel: 'high'
    };
    
    this.log('🔄 ConsistencyTracker リセット完了');
  }
}

// デバッグ用グローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.ConsistencyTracker = ConsistencyTracker;
}
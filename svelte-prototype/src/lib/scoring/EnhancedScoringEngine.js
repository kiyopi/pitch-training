/**
 * EnhancedScoringEngine - 統合採点エンジン
 * 
 * 目的: 相対音感向上のための包括的採点システム
 * - 3つの専門分析器を統合
 * - HarmonicCorrectionとの連携
 * - リアルタイム総合評価
 * - 適応的フィードバック生成
 */

import { IntervalAnalyzer } from './analyzers/IntervalAnalyzer.js';
import { DirectionAnalyzer } from './analyzers/DirectionAnalyzer.js';
import { ConsistencyTracker } from './analyzers/ConsistencyTracker.js';

export class EnhancedScoringEngine {
  constructor(config = {}) {
    // 設定パラメータ
    this.config = {
      // 採点重み設定
      weights: {
        pitchAccuracy: config.weights?.pitchAccuracy || 0.40,    // 音程精度
        recognitionSpeed: config.weights?.recognitionSpeed || 0.20, // 認識速度
        intervalMastery: config.weights?.intervalMastery || 0.20,   // 音程習得度
        directionAccuracy: config.weights?.directionAccuracy || 0.10, // 方向性精度
        consistency: config.weights?.consistency || 0.10        // 一貫性
      },
      
      // 速度評価設定
      speedThresholds: {
        excellent: config.speedThresholds?.excellent || 1000,   // 1秒以内
        good: config.speedThresholds?.good || 2000,             // 2秒以内
        fair: config.speedThresholds?.fair || 3000,             // 3秒以内
        poor: config.speedThresholds?.poor || 5000              // 5秒以内
      },
      
      // HarmonicCorrection連携設定
      harmonicCorrection: {
        enabled: config.harmonicCorrection?.enabled ?? true,
        tolerance: config.harmonicCorrection?.tolerance || 50   // セント
      },
      
      // データ保持設定
      sessionTracking: config.sessionTracking ?? true,
      maxHistorySize: config.maxHistorySize || 100
    };
    
    // 専門分析器の初期化
    this.intervalAnalyzer = new IntervalAnalyzer();
    this.directionAnalyzer = new DirectionAnalyzer();
    this.consistencyTracker = new ConsistencyTracker();
    
    // セッション管理
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: 'beginner',
      achievements: new Set(),
      lastAnalysis: null
    };
    
    // パフォーマンス追跡
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: 'stable',
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    
    // デバッグモード
    this.debugMode = import.meta.env.DEV;
    
    this.log('🎯 EnhancedScoringEngine初期化完了', {
      weights: this.config.weights,
      analyzers: ['IntervalAnalyzer', 'DirectionAnalyzer', 'ConsistencyTracker']
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
      
      // 1. 入力値検証
      const validation = this.validateInputs(params);
      if (!validation.valid) {
        return this.createErrorResult(validation.error);
      }
      
      // 2. HarmonicCorrection適用
      const correctedFreq = this.applyHarmonicCorrection(detectedFreq, harmonicCorrection);
      
      // 3. 各分析器による専門分析
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
      
      // 4. 認識速度の評価
      const speedAnalysis = this.analyzeRecognitionSpeed(responseTime);
      
      // 5. 統合スコアの計算
      const integratedScore = this.calculateIntegratedScore({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        volume
      });
      
      // 6. パフォーマンス評価
      const performanceEvaluation = this.evaluateOverallPerformance(integratedScore);
      
      // 7. 適応的フィードバック生成
      const adaptiveFeedback = this.generateAdaptiveFeedback({
        intervalAnalysis,
        directionAnalysis,
        consistencyAnalysis,
        speedAnalysis,
        performanceEvaluation
      });
      
      // 8. セッション更新
      const sessionUpdate = this.updateSessionData(integratedScore, performanceEvaluation);
      
      // 9. 最終結果の構築
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
      
      // 10. 結果記録
      this.recordAnalysisResult(result);
      
      // 11. デバッグログ
      if (this.debugMode) {
        this.logScoringDetails(result);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [EnhancedScoringEngine] 採点エラー:', error);
      return this.createErrorResult('採点処理中にエラーが発生しました');
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
      return { valid: false, error: '必要な周波数データが不足しています' };
    }
    
    if (baseFreq <= 0 || targetFreq <= 0 || detectedFreq <= 0) {
      return { valid: false, error: '周波数は正の値である必要があります' };
    }
    
    if (responseTime < 0 || responseTime > 30000) {
      return { valid: false, error: '反応時間が範囲外です' };
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
    
    // HarmonicCorrectionの結果を使用
    if (harmonicCorrection.correctedFrequency && 
        Math.abs(harmonicCorrection.correctedFrequency - detectedFreq) <= this.config.harmonicCorrection.tolerance) {
      
      this.log('🔧 HarmonicCorrection適用', {
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
      level = 'excellent';
      score = 100;
      feedback = '⚡ 素早い認識です！';
    } else if (responseTime <= speedThresholds.good) {
      level = 'good';
      score = 85;
      feedback = '👍 良い反応速度です。';
    } else if (responseTime <= speedThresholds.fair) {
      level = 'fair';
      score = 70;
      feedback = '📈 もう少し早く認識できると良いでしょう。';
    } else if (responseTime <= speedThresholds.poor) {
      level = 'poor';
      score = 50;
      feedback = '🐌 ゆっくりと確実に認識しましょう。';
    } else {
      level = 'very_poor';
      score = 25;
      feedback = '⏰ 時間をかけすぎています。練習を重ねましょう。';
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
    
    // 各要素のスコア取得
    const pitchAccuracy = intervalAnalysis.accuracy || 0;
    const recognitionSpeed = speedAnalysis.score || 0;
    const intervalMastery = this.calculateMasteryScore(intervalAnalysis.mastery);
    const directionAccuracy = directionAnalysis.accuracy || 0;
    const consistency = consistencyAnalysis.overallConsistency || 0;
    
    // 重み付き総合スコア
    const totalScore = 
      (pitchAccuracy * weights.pitchAccuracy) +
      (recognitionSpeed * weights.recognitionSpeed) +
      (intervalMastery * weights.intervalMastery) +
      (directionAccuracy * weights.directionAccuracy) +
      (consistency * weights.consistency);
    
    // 音量による調整（任意）
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
      weights: weights,
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
    const attemptBonus = Math.min(20, mastery.attempts * 2); // 試行回数ボーナス
    const trendBonus = mastery.trend === 'improving' ? 10 : 0;
    
    return Math.min(100, baseScore + attemptBonus + trendBonus);
  }
  
  /**
   * 音量調整係数の計算
   * @param {number} volume - 音量 (0-100)
   * @returns {number} - 調整係数
   */
  calculateVolumeAdjustment(volume) {
    if (volume < 20) return 0.8;  // 音量が小さすぎる
    if (volume > 80) return 0.95; // 音量が大きすぎる
    return 1.0; // 適切な音量
  }
  
  /**
   * 成績の判定
   * @param {number} score - スコア
   * @returns {string} - 成績
   */
  determineGrade(score) {
    if (score >= 95) return 'S';
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D+';
    if (score >= 55) return 'D';
    return 'F';
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
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'average';
    if (score >= 60) return 'below_average';
    return 'needs_improvement';
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
          level: 'excellent'
        });
      } else if (value >= 75) {
        strengths.push({
          area: key,
          score: value,
          level: 'good'
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
          severity: value < 40 ? 'high' : 'medium'
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
        trend: 'insufficient_data',
        change: 0,
        description: 'データ不足'
      };
    }
    
    const recent = history.slice(-3);
    const earlier = history.slice(-6, -3);
    
    if (earlier.length === 0) {
      return {
        trend: 'stable',
        change: 0,
        description: '安定'
      };
    }
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    const change = recentAvg - earlierAvg;
    
    let trend, description;
    
    if (change > 5) {
      trend = 'improving';
      description = '向上中';
    } else if (change < -5) {
      trend = 'declining';
      description = '低下中';
    } else {
      trend = 'stable';
      description = '安定';
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
        interval: intervalAnalysis.feedback || '音程分析結果なし',
        direction: directionAnalysis.feedback || '方向性分析結果なし',
        consistency: this.getConsistencyFeedback(consistencyAnalysis),
        speed: speedAnalysis.feedback || '速度分析結果なし'
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
    
    if (score >= 80) return '🎯 一貫した精度を保っています。';
    if (score >= 60) return '📊 まずまずの安定性です。';
    return '📈 一貫性の改善が必要です。';
  }
  
  /**
   * 推奨事項の生成
   * @param {Object} analyses - 分析結果
   * @returns {Array} - 推奨事項リスト
   */
  generateRecommendations(analyses) {
    const recommendations = [];
    
    // 一貫性からの推奨事項
    if (analyses.consistencyAnalysis.recommendations) {
      recommendations.push(...analyses.consistencyAnalysis.recommendations);
    }
    
    // スコアベースの推奨事項
    const { performanceEvaluation } = analyses;
    
    if (performanceEvaluation.weaknesses.length > 0) {
      const mainWeakness = performanceEvaluation.weaknesses[0];
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        message: this.getImprovementSuggestion(mainWeakness.area),
        icon: '🎯'
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
      pitchAccuracy: '音程の精度向上のため、ゆっくりと正確に歌う練習をしましょう。',
      recognitionSpeed: '反応速度向上のため、聞いた瞬間に歌う練習をしましょう。',
      intervalMastery: '苦手な音程を重点的に練習しましょう。',
      directionAccuracy: '上行・下行の方向性を意識して練習しましょう。',
      consistency: '一定の精度を保つため、集中力を高めて練習しましょう。'
    };
    
    return suggestions[area] || '継続的な練習で改善していきましょう。';
  }
  
  /**
   * 励ましメッセージの生成
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 励ましメッセージ
   */
  generateEncouragement(performance) {
    if (performance.improvement.trend === 'improving') {
      return '📈 確実に上達しています！この調子で続けましょう。';
    }
    
    if (performance.strengths.length > 0) {
      const strength = performance.strengths[0];
      return `⭐ ${this.getAreaName(strength.area)}が得意ですね！`;
    }
    
    return '🌟 練習を続けることで必ず上達します。頑張りましょう！';
  }
  
  /**
   * 次のステップの提案
   * @param {Object} performance - パフォーマンス
   * @returns {string} - 次のステップ
   */
  suggestNextSteps(performance) {
    if (performance.level === 'excellent') {
      return '🎓 上級レベルに到達しています。より複雑な音程に挑戦してみましょう。';
    }
    
    if (performance.weaknesses.length > 0) {
      const weakness = performance.weaknesses[0];
      return `🎯 ${this.getAreaName(weakness.area)}の練習に重点を置きましょう。`;
    }
    
    return '📚 基礎練習を継続し、全体的なレベルアップを目指しましょう。';
  }
  
  /**
   * エリア名の取得
   * @param {string} area - エリアキー
   * @returns {string} - エリア名
   */
  getAreaName(area) {
    const names = {
      pitchAccuracy: '音程精度',
      recognitionSpeed: '認識速度',
      intervalMastery: '音程習得度',
      directionAccuracy: '方向性認識',
      consistency: '一貫性'
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
    
    // 履歴サイズ制限
    if (this.sessionData.performanceHistory.length > this.config.maxHistorySize) {
      this.sessionData.performanceHistory.shift();
    }
    
    // パフォーマンスメトリクス更新
    this.updatePerformanceMetrics(score, performance);
    
    // 達成確認
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
    // 平均速度の更新
    if (score.components.recognitionSpeed > 0) {
      this.performanceMetrics.averageSpeed = 
        (this.performanceMetrics.averageSpeed + score.components.recognitionSpeed) / 2;
    }
    
    // 精度トレンドの更新
    this.performanceMetrics.accuracyTrend = performance.improvement.trend;
    
    // 強み・改善エリアの更新
    this.performanceMetrics.strengthAreas = performance.strengths.map(s => s.area);
    this.performanceMetrics.improvementAreas = performance.weaknesses.map(w => w.area);
    
    // セッション進捗の計算
    this.performanceMetrics.sessionProgress = Math.min(100, 
      (this.sessionData.totalAttempts / 20) * 100
    );
  }
  
  /**
   * 達成確認
   * @param {Object} score - スコア
   * @param {Object} performance - パフォーマンス
   */
  checkAchievements(score, performance) {
    // 初回採点
    if (this.sessionData.totalAttempts === 1) {
      this.sessionData.achievements.add('first_attempt');
    }
    
    // 高得点達成
    if (score.total >= 90 && !this.sessionData.achievements.has('high_score')) {
      this.sessionData.achievements.add('high_score');
    }
    
    // 完璧達成
    if (score.total >= 98 && !this.sessionData.achievements.has('perfect_score')) {
      this.sessionData.achievements.add('perfect_score');
    }
    
    // 継続練習
    if (this.sessionData.totalAttempts >= 10 && !this.sessionData.achievements.has('persistent')) {
      this.sessionData.achievements.add('persistent');
    }
    
    // 改善達成
    if (performance.improvement.trend === 'improving' && 
        !this.sessionData.achievements.has('improving')) {
      this.sessionData.achievements.add('improving');
    }
  }
  
  /**
   * 平均速度との比較
   * @param {number} responseTime - 反応時間
   * @returns {Object} - 比較結果
   */
  compareToAverageSpeed(responseTime) {
    const sessionAvg = this.performanceMetrics.averageSpeed || 2000;
    const difference = responseTime - sessionAvg;
    
    return {
      sessionAverage: sessionAvg,
      difference,
      comparison: difference < -500 ? 'much_faster' :
                 difference < -200 ? 'faster' :
                 difference < 200 ? 'similar' :
                 difference < 500 ? 'slower' : 'much_slower'
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
    const normalizedSemitones = ((semitones % 12) + 12) % 12;
    
    const intervalMap = {
      0: 'unison',
      1: 'minorSecond',
      2: 'majorSecond',
      3: 'minorThird',
      4: 'majorThird',
      5: 'perfectFourth',
      6: 'tritone',
      7: 'perfectFifth',
      8: 'minorSixth',
      9: 'majorSixth',
      10: 'minorSeventh',
      11: 'majorSeventh'
    };
    
    return intervalMap[normalizedSemitones] || 'unknown';
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
    
    // セント差に基づく精度計算
    // 0セント: 100点
    // 50セント: 50点
    // 100セント以上: 0点
    return Math.max(0, 100 - centsDiff);
  }
  
  /**
   * 分析結果の記録
   * @param {Object} result - 結果
   */
  recordAnalysisResult(result) {
    // 将来的にLocalStorageやサーバーに保存予定
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
        grade: 'F'
      },
      performance: {
        level: 'needs_improvement',
        strengths: [],
        weaknesses: [],
        improvement: { trend: 'unknown', change: 0 }
      },
      feedback: {
        primary: 'エラーが発生しました。もう一度お試しください。',
        detailed: {},
        recommendations: [],
        encouragement: '',
        nextSteps: ''
      }
    };
  }
  
  /**
   * 詳細採点ログ出力
   * @param {Object} result - 採点結果
   */
  logScoringDetails(result) {
    console.group(`🎯 [EnhancedScoringEngine] 統合採点結果 #${result.sessionAttempt}`);
    
    console.log('📊 統合スコア:', {
      総合: `${result.score.total}点 (${result.score.grade})`,
      音程精度: `${result.score.components.pitchAccuracy}%`,
      認識速度: `${result.score.components.recognitionSpeed}%`,
      音程習得度: `${result.score.components.intervalMastery}%`,
      方向性精度: `${result.score.components.directionAccuracy}%`,
      一貫性: `${result.score.components.consistency}%`
    });
    
    console.log('📈 パフォーマンス:', {
      レベル: result.performance.level,
      改善傾向: result.performance.improvement.trend,
      強み: result.performance.strengths.map(s => s.area),
      弱点: result.performance.weaknesses.map(w => w.area)
    });
    
    console.log('💬 フィードバック:', {
      メイン: result.feedback.primary,
      推奨事項: result.feedback.recommendations.length
    });
    
    console.log('📚 セッション:', {
      試行回数: result.session.attempt,
      平均点: result.session.sessionAverage.toFixed(1),
      継続時間: `${Math.round(result.session.sessionDuration / 60000)}分`
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
   * 試行結果を処理（analyzePerformanceのエイリアス）
   * @param {Object} params - 採点パラメータ
   * @returns {Object} - 統合採点結果
   */
  async processAttempt(params) {
    return await this.analyzePerformance(params);
  }
  
  /**
   * 詳細レポートを生成
   * @returns {Object} - 詳細レポート
   */
  generateDetailedReport() {
    const statistics = this.getStatistics();
    const sessionData = this.sessionData;
    
    // 成績総括
    const overallPerformance = {
      totalScore: sessionData.overallScore,
      totalAttempts: sessionData.totalAttempts,
      averageScore: sessionData.totalAttempts > 0 ? 
        sessionData.overallScore / sessionData.totalAttempts : 0,
      sessionDuration: Date.now() - sessionData.startTime,
      level: sessionData.currentLevel
    };
    
    // 個別分析器からの詳細
    const detailedAnalysis = {
      intervals: statistics.analyzers.interval,
      directions: statistics.analyzers.direction,
      consistency: statistics.analyzers.consistency
    };
    
    // 改善提案
    const improvements = this.generateImprovementSuggestions();
    
    // セッション統計
    const sessionStats = {
      startTime: sessionData.startTime,
      duration: Date.now() - sessionData.startTime,
      attempts: sessionData.totalAttempts,
      achievements: Array.from(sessionData.achievements),
      performanceHistory: sessionData.performanceHistory.slice(-10) // 直近10回
    };
    
    return {
      timestamp: Date.now(),
      overall: overallPerformance,
      detailed: detailedAnalysis,
      improvements: improvements,
      session: sessionStats,
      metadata: {
        version: '2.0.0-SCORING',
        engine: 'EnhancedScoringEngine'
      }
    };
  }
  
  /**
   * 改善提案を生成
   * @returns {Array} - 改善提案リスト
   */
  generateImprovementSuggestions() {
    const suggestions = [];
    const stats = this.getStatistics();
    
    // 音程習得度の分析
    if (stats.analyzers.interval.averageAccuracy < 70) {
      suggestions.push({
        category: 'interval',
        priority: 'high',
        message: '音程の正確性向上が必要です。基本的な音程（完全5度、オクターブ）から練習を始めましょう。',
        actions: ['基本音程の集中練習', '楽器での確認', '歌唱練習']
      });
    }
    
    // 方向性の分析
    if (stats.analyzers.direction.accuracy < 80) {
      suggestions.push({
        category: 'direction',
        priority: 'medium',
        message: '音程の上行・下行の判断精度を向上させましょう。',
        actions: ['音階練習', '聴音練習', 'インターバル識別']
      });
    }
    
    // 一貫性の分析
    if (stats.analyzers.consistency.score < 75) {
      suggestions.push({
        category: 'consistency',
        priority: 'medium',
        message: '安定した精度を保つため、継続的な練習が効果的です。',
        actions: ['定期的な練習', '集中力向上', '疲労管理']
      });
    }
    
    // セッション分析
    if (this.sessionData.totalAttempts < 5) {
      suggestions.push({
        category: 'session',
        priority: 'low',
        message: 'より多くの練習で正確な評価が可能になります。',
        actions: ['練習量の増加', '多様な音程での練習']
      });
    }
    
    return suggestions;
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
    this.log('⚙️ 設定更新完了', this.config);
  }
  
  /**
   * データのリセット
   */
  reset() {
    // 分析器のリセット
    this.intervalAnalyzer.reset();
    this.directionAnalyzer.reset();
    this.consistencyTracker.reset();
    
    // セッションデータのリセット
    this.sessionData = {
      startTime: Date.now(),
      totalAttempts: 0,
      overallScore: 0,
      performanceHistory: [],
      currentLevel: 'beginner',
      achievements: new Set(),
      lastAnalysis: null
    };
    
    // パフォーマンスメトリクスのリセット
    this.performanceMetrics = {
      averageSpeed: 0,
      accuracyTrend: 'stable',
      strengthAreas: [],
      improvementAreas: [],
      sessionProgress: 0
    };
    
    this.log('🔄 EnhancedScoringEngine リセット完了');
  }
}

// デバッグ用グローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.EnhancedScoringEngine = EnhancedScoringEngine;
}
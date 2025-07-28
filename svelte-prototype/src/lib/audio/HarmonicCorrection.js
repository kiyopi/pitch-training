/**
 * HarmonicCorrection - 全モード統一倍音補正システム
 * 
 * 目的: Random/Continuous/Chromaticモードで完全に同一の倍音補正を保証
 * - 基音候補の評価・選択
 * - 周波数安定化処理
 * - 音楽的妥当性評価
 */

class HarmonicCorrection {
  constructor(config = {}) {
    // 統一パラメータ（全モード共通）
    this.vocalRangeMin = config.vocalRangeMin || 130.81;  // C3 (Hz)
    this.vocalRangeMax = config.vocalRangeMax || 1046.50; // C6 (Hz)
    this.stabilityThreshold = config.stabilityThreshold || 0.1; // 10%変化制限
    
    // 評価ウェイト（全モード統一）
    this.evaluationWeights = {
      vocalRange: config.vocalRangeWeight || 0.4,    // 人間音域適合性
      continuity: config.continuityWeight || 0.4,     // 前回検出との連続性
      musical: config.musicalWeight || 0.2            // 音楽的妥当性
    };
    
    // 基音候補生成設定
    this.fundamentalCandidates = config.fundamentalCandidates || [
      1.0,    // そのまま（基音の可能性）
      0.5,    // 1オクターブ下（2倍音 → 基音）
      0.333,  // 3倍音 → 基音 (1/3)
      0.25,   // 4倍音 → 基音 (1/4)
      2.0,    // 1オクターブ上（低く歌った場合）
    ];
    
    // 履歴管理（安定化用）
    this.harmonicHistory = [];
    this.previousFrequency = 0;
    this.maxHistoryLength = 5; // 最大5フレーム保持
    
    // デバッグモード
    this.debugMode = false;
    
    console.log('🔧 [HarmonicCorrection] 統一倍音補正システム初期化完了');
  }

  /**
   * メイン倍音補正処理
   * @param {number} detectedFreq - 検出された周波数
   * @param {boolean} enableDebugLog - デバッグログ有効化
   * @returns {number} - 補正後の基音周波数
   */
  correctHarmonic(detectedFreq, enableDebugLog = false) {
    if (!detectedFreq || detectedFreq <= 0) {
      return 0;
    }

    // 基音候補を生成
    const candidates = this.fundamentalCandidates.map(ratio => ({
      frequency: detectedFreq * ratio,
      ratio: ratio
    }));

    // 各候補を評価
    const evaluatedCandidates = candidates.map(candidate => {
      const evaluation = this.evaluateFundamental(candidate.frequency);
      return {
        ...candidate,
        ...evaluation
      };
    });

    // 最高スコア候補を基音として採用
    const bestCandidate = evaluatedCandidates.reduce((best, current) => 
      current.totalScore > best.totalScore ? current : best
    );

    // 安定化処理適用
    const stabilizedFreq = this.stabilizeFrequency(bestCandidate.frequency);

    // デバッグログ出力（明示的指定またはデバッグモード時）
    if (enableDebugLog || this.debugMode) {
      this.logHarmonicCorrection(detectedFreq, evaluatedCandidates, bestCandidate, stabilizedFreq);
    }

    // 次回比較用に保存
    this.previousFrequency = stabilizedFreq;

    return stabilizedFreq;
  }

  /**
   * 倍音補正デバッグログ出力
   * @param {number} originalFreq - 元の検出周波数
   * @param {Array} candidates - 全候補とスコア
   * @param {Object} bestCandidate - 選択された最適候補
   * @param {number} finalFreq - 最終補正周波数
   */
  logHarmonicCorrection(originalFreq, candidates, bestCandidate, finalFreq) {
    console.group(`🔧 [HarmonicCorrection] ${originalFreq.toFixed(1)}Hz → ${finalFreq.toFixed(1)}Hz`);
    
    // 検出周波数の音名表示
    const originalNote = this.frequencyToNote(originalFreq);
    const finalNote = this.frequencyToNote(finalFreq);
    console.log(`📝 音程変換: ${originalNote} → ${finalNote}`);
    
    // 補正の種類を判定
    const correctionType = this.getCorrectionType(bestCandidate.ratio);
    console.log(`🎯 補正タイプ: ${correctionType}`);
    
    // 候補スコア一覧
    console.table(candidates.map(c => ({
      '倍率': `${c.ratio.toFixed(3)}x`,
      '周波数': `${c.frequency.toFixed(1)}Hz`,
      '音名': this.frequencyToNote(c.frequency),
      '音域': c.vocalRangeScore.toFixed(2),
      '連続性': c.continuityScore.toFixed(2),
      '音楽性': c.musicalScore.toFixed(2),
      '総合': c.totalScore.toFixed(3),
      '選択': c === bestCandidate ? '✅' : ''
    })));
    
    // 安定化情報
    const stabilizationDiff = Math.abs(finalFreq - bestCandidate.frequency);
    if (stabilizationDiff > 0.5) {
      console.log(`🔄 安定化: ${bestCandidate.frequency.toFixed(1)}Hz → ${finalFreq.toFixed(1)}Hz (${stabilizationDiff.toFixed(1)}Hz調整)`);
    }
    
    console.groupEnd();
  }

  /**
   * 補正タイプの判定
   * @param {number} ratio - 適用された倍率
   * @returns {string} - 補正タイプの説明
   */
  getCorrectionType(ratio) {
    if (Math.abs(ratio - 1.0) < 0.01) return '補正なし（基音）';
    if (Math.abs(ratio - 0.5) < 0.01) return '2倍音補正（1オクターブ下）';
    if (Math.abs(ratio - 0.333) < 0.01) return '3倍音補正（1オクターブ+5度下）';
    if (Math.abs(ratio - 0.25) < 0.01) return '4倍音補正（2オクターブ下）';
    if (Math.abs(ratio - 2.0) < 0.01) return 'オクターブ上補正';
    return `カスタム補正（${ratio.toFixed(3)}x）`;
  }

  /**
   * 周波数から音名変換（デバッグ用）
   * @param {number} frequency - 周波数
   * @returns {string} - 音名
   */
  frequencyToNote(frequency) {
    if (!frequency || frequency <= 0) return '---';
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    const noteIndex = (semitonesFromA4 + 9 + 120) % 12;
    const octave = Math.floor((semitonesFromA4 + 9) / 12) + 4;
    
    return noteNames[noteIndex] + octave;
  }

  /**
   * 基音候補の妥当性評価
   * @param {number} frequency - 評価対象周波数
   * @returns {Object} - 評価結果
   */
  evaluateFundamental(frequency) {
    // 1. 人間音域範囲内チェック（40%重み）
    const inVocalRange = frequency >= this.vocalRangeMin && frequency <= this.vocalRangeMax;
    const vocalRangeScore = inVocalRange ? 1.0 : 0.0;

    // 2. 前回検出との連続性評価（40%重み）
    const continuityScore = this.previousFrequency > 0
      ? 1.0 - Math.min(Math.abs(frequency - this.previousFrequency) / this.previousFrequency, 1.0)
      : 0.5; // 初回は中性値

    // 3. 音楽的妥当性評価（20%重み）
    const musicalScore = this.calculateMusicalScore(frequency);

    // 総合スコア計算
    const totalScore = 
      (vocalRangeScore * this.evaluationWeights.vocalRange) +
      (continuityScore * this.evaluationWeights.continuity) +
      (musicalScore * this.evaluationWeights.musical);

    return {
      vocalRangeScore,
      continuityScore,
      musicalScore,
      totalScore
    };
  }

  /**
   * 音楽的妥当性評価
   * 半音階に近いほど高評価
   * @param {number} frequency - 評価対象周波数
   * @returns {number} - 音楽的妥当性スコア (0-1)
   */
  calculateMusicalScore(frequency) {
    const C4 = 261.63; // Middle C

    // 最も近い半音階音名への距離を計算
    const semitonesFromC4 = Math.log2(frequency / C4) * 12;
    const nearestSemitone = Math.round(semitonesFromC4);
    const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);

    // 半音階に近いほど高スコア（±50セント以内で最高点）
    return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
  }

  /**
   * 周波数安定化システム
   * 急激な変化を抑制し、中央値ベースで外れ値を除去
   * @param {number} currentFreq - 現在の周波数
   * @returns {number} - 安定化された周波数
   */
  stabilizeFrequency(currentFreq) {
    if (!currentFreq || currentFreq <= 0) {
      return 0;
    }

    // 履歴バッファに追加
    this.harmonicHistory.push(currentFreq);
    
    // 最大長を超えた場合は古いデータを削除
    if (this.harmonicHistory.length > this.maxHistoryLength) {
      this.harmonicHistory.shift();
    }

    // 履歴が少ない場合はそのまま返す
    if (this.harmonicHistory.length < 2) {
      return currentFreq;
    }

    // 中央値ベースの安定化（外れ値除去）
    const sorted = [...this.harmonicHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // 急激な変化を抑制（段階的変化）
    const maxChange = median * this.stabilityThreshold;
    const stabilized = Math.abs(currentFreq - median) > maxChange 
      ? median + Math.sign(currentFreq - median) * maxChange
      : currentFreq;

    return stabilized;
  }

  /**
   * 履歴リセット
   * 新しいセッション開始時に呼び出し
   */
  resetHistory() {
    this.harmonicHistory = [];
    this.previousFrequency = 0;
    // 履歴リセットのログを無効化（頻繁すぎるため）
    // console.log('🔄 [HarmonicCorrection] 履歴リセット完了');
  }

  /**
   * 設定更新
   * 動的パラメータ調整用
   * @param {Object} newConfig - 新しい設定
   */
  updateConfig(newConfig) {
    Object.assign(this, newConfig);
    console.log('⚙️ [HarmonicCorrection] 設定更新:', newConfig);
  }

  /**
   * デバッグモード有効化
   * ブラウザコンソールから呼び出し可能
   */
  enableDebugLogging() {
    this.debugMode = true;
    console.log('🔍 [HarmonicCorrection] デバッグログ有効化 - 次回の補正から詳細ログを出力します');
    console.log('無効化するには: harmonicCorrection.disableDebugLogging()');
  }

  /**
   * デバッグモード無効化
   */
  disableDebugLogging() {
    this.debugMode = false;
    console.log('🔍 [HarmonicCorrection] デバッグログ無効化');
  }

  /**
   * 現在の状態取得（デバッグ用）
   * @returns {Object} - 現在の状態
   */
  getStatus() {
    return {
      vocalRangeMin: this.vocalRangeMin,
      vocalRangeMax: this.vocalRangeMax,
      stabilityThreshold: this.stabilityThreshold,
      evaluationWeights: this.evaluationWeights,
      historyLength: this.harmonicHistory.length,
      previousFrequency: this.previousFrequency,
      recentHistory: this.harmonicHistory.slice(-3) // 直近3件
    };
  }
}

// シングルトンインスタンス - 全モードで同一インスタンスを共有
export const harmonicCorrection = new HarmonicCorrection();

// デバッグ用のグローバル露出（開発時のみ）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.harmonicCorrection = harmonicCorrection;
}
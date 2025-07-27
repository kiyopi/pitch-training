/**
 * 統一エラー管理システム
 * 相対音感トレーニングアプリのエラー分類・処理・復旧を統一管理
 */

export class ErrorManager {
  static ERROR_LEVELS = {
    CRITICAL: 'Critical',
    WARNING: 'Warning', 
    INFO: 'Info'
  };

  static ERROR_CODES = {
    // Critical Level (重大エラー)
    MEDIASTREAM_DISCONNECTED: 'C1',
    AUDIOCONTEXT_CLOSED: 'C2',
    BROWSER_INCOMPATIBLE: 'C3',
    
    // Warning Level (警告レベル)
    AUDIOCONTEXT_SUSPENDED: 'W1',
    VOLUME_ABNORMAL: 'W2',
    PITCH_CLARITY_LOW: 'W3',
    
    // Info Level (情報レベル)
    NETWORK_DELAY: 'I1',
    PERFORMANCE_DEGRADED: 'I2'
  };

  /**
   * エラー分類とユーザーメッセージ生成
   * @param {Error} error - 発生したエラー
   * @param {string} context - エラー発生コンテキスト
   * @returns {Object} 分類されたエラー情報
   */
  static classifyError(error, context = '') {
    const classification = {
      level: this.determineLevel(error),
      code: this.generateCode(error, context),
      message: this.getUserMessage(error),
      recovery: this.getRecoveryStrategy(error),
      timestamp: new Date().toISOString(),
      context,
      originalError: error.message
    };

    // エラーログ記録
    this.logError(classification);
    
    return classification;
  }

  /**
   * エラーレベル判定
   * @param {Error} error - エラーオブジェクト
   * @returns {string} エラーレベル
   */
  static determineLevel(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';

    // MediaStream関連は常にCritical
    if (errorMessage.includes('mediastream') || 
        errorName === 'notallowederror' ||
        errorMessage.includes('track') && errorMessage.includes('ended')) {
      return this.ERROR_LEVELS.CRITICAL;
    }
    
    // AudioContext問題
    if (errorMessage.includes('audiocontext')) {
      if (errorMessage.includes('closed')) {
        return this.ERROR_LEVELS.CRITICAL;
      }
      if (errorMessage.includes('suspended')) {
        return this.ERROR_LEVELS.WARNING;
      }
    }

    // ブラウザ互換性問題
    if (errorMessage.includes('not supported') || 
        errorMessage.includes('undefined') && errorMessage.includes('audio')) {
      return this.ERROR_LEVELS.CRITICAL;
    }

    // 音量・音程関連
    if (errorMessage.includes('volume') || errorMessage.includes('pitch')) {
      return this.ERROR_LEVELS.WARNING;
    }
    
    // その他は Info
    return this.ERROR_LEVELS.INFO;
  }

  /**
   * エラーコード生成
   * @param {Error} error - エラーオブジェクト
   * @param {string} context - コンテキスト
   * @returns {string} エラーコード
   */
  static generateCode(error, context) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';

    // MediaStream関連
    if (errorMessage.includes('mediastream inactive') || 
        errorMessage.includes('track') && errorMessage.includes('ended')) {
      return this.ERROR_CODES.MEDIASTREAM_DISCONNECTED;
    }

    // AudioContext関連
    if (errorMessage.includes('audiocontext')) {
      if (errorMessage.includes('closed')) {
        return this.ERROR_CODES.AUDIOCONTEXT_CLOSED;
      }
      if (errorMessage.includes('suspended')) {
        return this.ERROR_CODES.AUDIOCONTEXT_SUSPENDED;
      }
    }

    // ブラウザ互換性
    if (errorName === 'notallowederror' || 
        errorMessage.includes('not supported') ||
        errorMessage.includes('getusermedia') && errorMessage.includes('undefined')) {
      return this.ERROR_CODES.BROWSER_INCOMPATIBLE;
    }

    // 音量異常
    if (errorMessage.includes('volume')) {
      return this.ERROR_CODES.VOLUME_ABNORMAL;
    }

    // 音程精度
    if (errorMessage.includes('pitch') || errorMessage.includes('clarity')) {
      return this.ERROR_CODES.PITCH_CLARITY_LOW;
    }

    // ネットワーク遅延
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return this.ERROR_CODES.NETWORK_DELAY;
    }

    // パフォーマンス問題
    if (errorMessage.includes('performance') || errorMessage.includes('fps')) {
      return this.ERROR_CODES.PERFORMANCE_DEGRADED;
    }
    
    return 'UNKNOWN';
  }

  /**
   * ユーザー向けメッセージ生成
   * @param {Error} error - エラーオブジェクト
   * @returns {Object} ユーザーメッセージ
   */
  static getUserMessage(error) {
    const code = this.generateCode(error);
    
    const messages = {
      [this.ERROR_CODES.MEDIASTREAM_DISCONNECTED]: {
        title: 'マイク接続エラー',
        description: 'マイクへの接続が失われました。',
        actions: [
          'マイク接続を確認',
          'ブラウザ許可を確認', 
          'マイクテストページで再設定'
        ]
      },
      [this.ERROR_CODES.AUDIOCONTEXT_CLOSED]: {
        title: '音声システムエラー',
        description: '音声システムが停止しました。',
        actions: [
          'ページを更新',
          'ブラウザを再起動',
          'マイクテストページで再設定'
        ]
      },
      [this.ERROR_CODES.AUDIOCONTEXT_SUSPENDED]: {
        title: '音声システム一時停止',
        description: '音声システムが一時停止しています。',
        actions: [
          '画面をタップして再開',
          'ページを更新'
        ]
      },
      [this.ERROR_CODES.BROWSER_INCOMPATIBLE]: {
        title: 'ブラウザ非対応',
        description: 'このブラウザは音声機能に対応していません。',
        actions: [
          'Chrome/Firefox/Safari最新版を使用',
          'ブラウザを更新',
          '推奨ブラウザに切り替え'
        ]
      },
      [this.ERROR_CODES.VOLUME_ABNORMAL]: {
        title: '音量レベル異常',
        description: 'マイクの音量レベルに問題があります。',
        actions: [
          'マイクの位置を調整',
          'マイク設定を確認',
          '環境音を減らす'
        ]
      },
      [this.ERROR_CODES.PITCH_CLARITY_LOW]: {
        title: '音程検出精度低下',
        description: '音程の検出精度が低下しています。',
        actions: [
          'はっきりと発声する',
          '雑音の少ない環境で実施',
          'マイクテストで確認'
        ]
      },
      [this.ERROR_CODES.NETWORK_DELAY]: {
        title: 'ネットワーク遅延',
        description: '音声ファイルの読み込みが遅延しています。',
        actions: [
          'インターネット接続を確認',
          'しばらく待って再試行'
        ]
      },
      [this.ERROR_CODES.PERFORMANCE_DEGRADED]: {
        title: 'パフォーマンス低下',
        description: 'システムのパフォーマンスが低下しています。',
        actions: [
          '他のアプリを終了',
          'ブラウザのタブを減らす',
          'ページを更新'
        ]
      }
    };

    return messages[code] || {
      title: '予期しないエラー',
      description: error.message || '不明なエラーが発生しました。',
      actions: [
        'ページを更新',
        'マイクテストページで再設定',
        'ブラウザを再起動'
      ]
    };
  }

  /**
   * 復旧戦略判定
   * @param {Error} error - エラーオブジェクト
   * @returns {string} 復旧戦略 ('auto' | 'manual' | 'monitor')
   */
  static getRecoveryStrategy(error) {
    const level = this.determineLevel(error);
    const code = this.generateCode(error);
    
    // Critical levelは基本的に手動復旧
    if (level === this.ERROR_LEVELS.CRITICAL) {
      return 'manual';
    }
    
    // Warning levelで自動復旧可能なもの
    if (code === this.ERROR_CODES.AUDIOCONTEXT_SUSPENDED) {
      return 'auto';
    }
    
    // Warning levelのその他は手動復旧
    if (level === this.ERROR_LEVELS.WARNING) {
      return 'manual';
    }
    
    // Info levelは監視のみ
    return 'monitor';
  }

  /**
   * エラーログ記録
   * @param {Object} classification - 分類されたエラー情報
   */
  static logError(classification) {
    try {
      // ローカルストレージに保存
      const errorHistory = JSON.parse(localStorage.getItem('errorHistory') || '[]');
      errorHistory.push(classification);
      
      // 最新100件のみ保持
      if (errorHistory.length > 100) {
        errorHistory.splice(0, errorHistory.length - 100);
      }
      
      localStorage.setItem('errorHistory', JSON.stringify(errorHistory));
      
      // デバッグコンソール出力
      console.group(`🚨 Error Classified: ${classification.level} - ${classification.code}`);
      console.error('Classification:', classification);
      console.error('Original Error:', classification.originalError);
      console.groupEnd();
      
    } catch (storageError) {
      // localStorage失敗時はコンソールのみ
      console.error('🚨 Error Classification:', classification);
      console.error('Storage Error:', storageError);
    }
  }

  /**
   * エラー履歴取得
   * @returns {Array} エラー履歴
   */
  static getErrorHistory() {
    try {
      return JSON.parse(localStorage.getItem('errorHistory') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * エラー統計取得
   * @returns {Object} エラー統計情報
   */
  static getErrorStatistics() {
    const history = this.getErrorHistory();
    
    const stats = {
      total: history.length,
      levels: {},
      codes: {},
      recent: history.slice(-10), // 最新10件
      last24Hours: this.getErrorsInTimeframe(history, 24 * 60 * 60 * 1000)
    };

    // レベル別集計
    Object.values(this.ERROR_LEVELS).forEach(level => {
      stats.levels[level] = history.filter(error => error.level === level).length;
    });

    // コード別集計
    Object.values(this.ERROR_CODES).forEach(code => {
      stats.codes[code] = history.filter(error => error.code === code).length;
    });

    return stats;
  }

  /**
   * 指定時間内のエラー取得
   * @param {Array} history - エラー履歴
   * @param {number} timeframe - 時間範囲（ミリ秒）
   * @returns {Array} 該当期間のエラー
   */
  static getErrorsInTimeframe(history, timeframe) {
    const now = Date.now();
    const cutoff = now - timeframe;
    
    return history.filter(error => {
      const errorTime = new Date(error.timestamp).getTime();
      return errorTime >= cutoff;
    });
  }

  /**
   * エラー履歴クリア
   */
  static clearErrorHistory() {
    try {
      localStorage.removeItem('errorHistory');
      console.log('✅ Error history cleared');
    } catch (error) {
      console.error('❌ Failed to clear error history:', error);
    }
  }

  /**
   * 特定エラーの発生頻度チェック
   * @param {string} errorCode - エラーコード
   * @param {number} timeframe - 時間範囲（ミリ秒、デフォルト1時間）
   * @returns {Object} 発生頻度情報
   */
  static checkErrorFrequency(errorCode, timeframe = 60 * 60 * 1000) {
    const history = this.getErrorHistory();
    const recentErrors = this.getErrorsInTimeframe(history, timeframe);
    const matchingErrors = recentErrors.filter(error => error.code === errorCode);
    
    return {
      count: matchingErrors.count,
      timeframe: timeframe,
      isFrequent: matchingErrors.length > 3, // 1時間に3回以上で頻発判定
      lastOccurrence: matchingErrors.length > 0 ? matchingErrors[matchingErrors.length - 1] : null
    };
  }
}

export default ErrorManager;
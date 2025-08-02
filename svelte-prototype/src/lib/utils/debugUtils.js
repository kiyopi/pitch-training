/**
 * デバッグログ制御ユーティリティ
 * 開発環境では詳細ログ、本番環境では最小限のログのみ出力
 */

// デバッグレベル設定（環境変数で制御可能）
const DEBUG_LEVEL = (() => {
  // 本番環境では 'error' のみ
  if (typeof import.meta !== 'undefined' && !import.meta.env.DEV) {
    return 'error';
  }
  
  // 開発環境ではURLパラメータまたは環境変数で制御
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    if (debugParam) return debugParam;
  }
  
  // デフォルトは開発環境では 'info'
  return 'info';
})();

// ログレベルの優先度
const LOG_LEVELS = {
  'error': 0,
  'warn': 1, 
  'info': 2,
  'debug': 3
};

// 現在のレベル優先度
const CURRENT_LEVEL = LOG_LEVELS[DEBUG_LEVEL] ?? LOG_LEVELS.info;

/**
 * デバッグログ出力関数
 */
export const logger = {
  /**
   * エラーレベル（常に表示）
   */
  error: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) {
      console.error(`❌ ${message}`, ...args);
    }
  },

  /**
   * 警告レベル（開発環境では表示）
   */
  warn: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  /**
   * 情報レベル（開発環境では表示）
   */
  info: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  /**
   * デバッグレベル（?debug=debug時のみ表示）
   */
  debug: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) {
      console.log(`🔍 ${message}`, ...args);
    }
  },

  /**
   * リアルタイム系ログ（頻繁に出力されるもの）
   * デバッグモード時のみ表示、かつ間引き機能付き
   */
  realtime: (() => {
    let lastLogTime = 0;
    const LOG_INTERVAL = 1000; // 1秒間隔

    return (message, ...args) => {
      if (CURRENT_LEVEL >= LOG_LEVELS.debug) {
        const now = Date.now();
        if (now - lastLogTime >= LOG_INTERVAL) {
          console.log(`📊 ${message}`, ...args);
          lastLogTime = now;
        }
      }
    };
  })(),

  /**
   * 採点系ログ（結果のみ重要）
   */
  scoring: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`🎯 ${message}`, ...args);
    }
  },

  /**
   * オーディオ系ログ（初期化・エラー時のみ重要）
   */
  audio: (message, ...args) => {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) {
      console.log(`🎤 ${message}`, ...args);
    }
  }
};

/**
 * 現在のデバッグレベルを取得
 */
export const getDebugLevel = () => DEBUG_LEVEL;

/**
 * デバッグモードかどうかを判定
 */
export const isDebugMode = () => DEBUG_LEVEL === 'debug';

/**
 * ログレベル変更（開発時のみ）
 */
export const setDebugLevel = (level) => {
  if (typeof import.meta !== 'undefined' && import.meta.env.DEV) {
    // 開発環境でのみURLパラメータを更新
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('debug', level);
      window.history.replaceState({}, '', url);
      window.location.reload();
    }
  }
};

/**
 * デバッグ情報表示
 */
export const showDebugInfo = () => {
  console.group('🔧 Debug Information');
  console.log('Current Debug Level:', DEBUG_LEVEL);
  console.log('Available Levels:', Object.keys(LOG_LEVELS));
  console.log('To change level, add ?debug=level to URL');
  console.log('Examples: ?debug=error, ?debug=warn, ?debug=info, ?debug=debug');
  console.groupEnd();
};

// 初期化時に現在のデバッグレベルを表示（開発環境のみ）
if (typeof import.meta !== 'undefined' && import.meta.env.DEV) {
  logger.info(`Debug Level: ${DEBUG_LEVEL} (Change with ?debug=level)`);
}
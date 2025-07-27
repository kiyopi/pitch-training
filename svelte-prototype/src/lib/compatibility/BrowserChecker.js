/**
 * ブラウザ互換性チェックシステム
 * 相対音感トレーニングアプリに必要な機能の包括的チェック
 */

export class BrowserChecker {
  /**
   * 包括的ブラウザ互換性チェック
   * @returns {Object} 互換性チェック結果
   */
  static check() {
    const results = {
      browser: this.detectBrowser(),
      features: this.checkFeatures(),
      compatibility: {
        level: 'unknown',
        supported: false,
        warnings: [],
        errors: []
      }
    };
    
    // 互換性レベル判定
    results.compatibility = this.evaluateCompatibility(results.features, results.browser);
    
    return results;
  }
  
  /**
   * ブラウザ検出
   * @returns {Object} ブラウザ情報
   */
  static detectBrowser() {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor || '';
    
    // Chrome (Chromium系)
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      return {
        name: 'Chrome',
        version: this.extractVersion(userAgent, 'Chrome/'),
        engine: 'Blink',
        mobile: /Android|Mobile/i.test(userAgent)
      };
    }
    
    // Edge (新Chromium版)
    if (userAgent.includes('Edg/')) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, 'Edg/'),
        engine: 'Blink',
        mobile: /Android|Mobile/i.test(userAgent)
      };
    }
    
    // Firefox
    if (userAgent.includes('Firefox/')) {
      return {
        name: 'Firefox',
        version: this.extractVersion(userAgent, 'Firefox/'),
        engine: 'Gecko',
        mobile: /Mobile|Tablet/i.test(userAgent)
      };
    }
    
    // Safari (WebKit)
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome') && vendor.includes('Apple')) {
      return {
        name: 'Safari',
        version: this.extractVersion(userAgent, 'Version/'),
        engine: 'WebKit',
        mobile: /iPhone|iPad|iPod/i.test(userAgent),
        ios: /iPhone|iPad|iPod/i.test(userAgent)
      };
    }
    
    // Edge Legacy
    if (userAgent.includes('Edge/')) {
      return {
        name: 'Edge Legacy',
        version: this.extractVersion(userAgent, 'Edge/'),
        engine: 'EdgeHTML',
        mobile: false
      };
    }
    
    // Internet Explorer
    if (userAgent.includes('Trident/') || userAgent.includes('MSIE')) {
      return {
        name: 'Internet Explorer',
        version: this.extractVersion(userAgent, /MSIE\s?(\d+)/),
        engine: 'Trident',
        mobile: false
      };
    }
    
    // Samsung Internet
    if (userAgent.includes('SamsungBrowser/')) {
      return {
        name: 'Samsung Internet',
        version: this.extractVersion(userAgent, 'SamsungBrowser/'),
        engine: 'Blink',
        mobile: true
      };
    }
    
    return { 
      name: 'Unknown', 
      version: 'Unknown', 
      engine: 'Unknown',
      mobile: /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)
    };
  }
  
  /**
   * 機能チェック
   * @returns {Object} 機能サポート状況
   */
  static checkFeatures() {
    return {
      mediaDevices: {
        available: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
      },
      audioContext: {
        available: !!(window.AudioContext || window.webkitAudioContext),
        contextTypes: {
          standard: !!window.AudioContext,
          webkit: !!window.webkitAudioContext
        }
      },
      webAudio: {
        analyserNode: this.testAnalyserNode(),
        biquadFilter: this.testBiquadFilter(),
        mediaStreamSource: this.testMediaStreamSource(),
        floatTimeDomain: this.testFloatTimeDomainData()
      },
      permissions: {
        api: !!navigator.permissions,
        query: !!(navigator.permissions && navigator.permissions.query)
      },
      modernJS: {
        asyncAwait: this.testAsyncAwait(),
        destructuring: this.testDestructuring(),
        arrowFunctions: this.testArrowFunctions(),
        classes: this.testClasses(),
        modules: this.testModules()
      },
      storage: {
        localStorage: this.testLocalStorage(),
        sessionStorage: this.testSessionStorage()
      },
      network: {
        fetch: !!window.fetch,
        websockets: !!window.WebSocket
      }
    };
  }
  
  /**
   * AnalyserNodeテスト
   * @returns {boolean} サポート状況
   */
  static testAnalyserNode() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      const hasRequiredMethods = 
        typeof analyser.getFloatTimeDomainData === 'function' &&
        typeof analyser.getByteFrequencyData === 'function';
      
      ctx.close();
      return hasRequiredMethods;
    } catch {
      return false;
    }
  }
  
  /**
   * BiquadFilterテスト
   * @returns {boolean} サポート状況
   */
  static testBiquadFilter() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const filter = ctx.createBiquadFilter();
      const hasRequiredProperties = 
        filter.type !== undefined &&
        filter.frequency !== undefined &&
        filter.Q !== undefined;
      
      ctx.close();
      return hasRequiredProperties;
    } catch {
      return false;
    }
  }
  
  /**
   * MediaStreamSourceテスト
   * @returns {boolean} サポート状況
   */
  static testMediaStreamSource() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const hasMethod = typeof ctx.createMediaStreamSource === 'function';
      ctx.close();
      return hasMethod;
    } catch {
      return false;
    }
  }
  
  /**
   * FloatTimeDomainDataテスト
   * @returns {boolean} サポート状況
   */
  static testFloatTimeDomainData() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      const buffer = new Float32Array(analyser.fftSize);
      
      // メソッドが存在し、実行できるかテスト
      analyser.getFloatTimeDomainData(buffer);
      ctx.close();
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 互換性評価
   * @param {Object} features - 機能チェック結果
   * @param {Object} browser - ブラウザ情報
   * @returns {Object} 互換性評価結果
   */
  static evaluateCompatibility(features, browser) {
    const compatibility = {
      level: 'full',
      supported: true,
      warnings: [],
      errors: []
    };
    
    // 必須機能チェック
    if (!features.mediaDevices.getUserMedia) {
      compatibility.errors.push('getUserMedia API非対応');
      compatibility.supported = false;
    }
    
    if (!features.audioContext.available) {
      compatibility.errors.push('Web Audio API非対応');
      compatibility.supported = false;
    }
    
    if (!features.webAudio.analyserNode) {
      compatibility.errors.push('AnalyserNode非対応');
      compatibility.supported = false;
    }
    
    if (!features.webAudio.biquadFilter) {
      compatibility.errors.push('BiquadFilter非対応');
      compatibility.supported = false;
    }
    
    if (!features.webAudio.mediaStreamSource) {
      compatibility.errors.push('MediaStreamSource非対応');
      compatibility.supported = false;
    }
    
    // ブラウザ固有の問題チェック
    this.checkBrowserSpecificIssues(browser, compatibility);
    
    // バージョン固有の問題チェック
    this.checkVersionSpecificIssues(browser, compatibility);
    
    // JavaScriptサポートチェック
    this.checkJavaScriptSupport(features.modernJS, compatibility);
    
    // 致命的エラーがある場合
    if (compatibility.errors.length > 0) {
      compatibility.level = 'incompatible';
    } else if (compatibility.warnings.length > 0) {
      compatibility.level = 'limited';
    }
    
    return compatibility;
  }
  
  /**
   * ブラウザ固有問題チェック
   * @param {Object} browser - ブラウザ情報
   * @param {Object} compatibility - 互換性オブジェクト（更新される）
   */
  static checkBrowserSpecificIssues(browser, compatibility) {
    switch (browser.name) {
      case 'Safari':
        compatibility.warnings.push('Safari: AudioContext自動suspend注意');
        compatibility.warnings.push('Safari: ユーザー操作後にAudioContext開始必須');
        if (browser.ios) {
          compatibility.warnings.push('iOS Safari: バックグラウンド制限あり');
          compatibility.warnings.push('iOS Safari: 音声再生制限あり');
        }
        break;
        
      case 'Firefox':
        compatibility.warnings.push('Firefox: 一部WebKit固有機能で代替実装が必要');
        break;
        
      case 'Edge Legacy':
        compatibility.errors.push('Edge Legacy: Web Audio API機能制限');
        compatibility.supported = false;
        break;
        
      case 'Internet Explorer':
        compatibility.errors.push('Internet Explorer: Web Audio API非対応');
        compatibility.errors.push('Internet Explorer: getUserMedia非対応');
        compatibility.supported = false;
        break;
        
      case 'Samsung Internet':
        compatibility.warnings.push('Samsung Internet: 一部機能で互換性問題の可能性');
        break;
    }
  }
  
  /**
   * バージョン固有問題チェック
   * @param {Object} browser - ブラウザ情報
   * @param {Object} compatibility - 互換性オブジェクト（更新される）
   */
  static checkVersionSpecificIssues(browser, compatibility) {
    const version = parseInt(browser.version);
    
    switch (browser.name) {
      case 'Chrome':
        if (version < 66) {
          compatibility.warnings.push('Chrome 66以降推奨（現在の機能に最適化）');
          compatibility.level = 'limited';
        }
        if (version < 60) {
          compatibility.errors.push('Chrome 60未満: 必須機能非対応');
          compatibility.supported = false;
        }
        break;
        
      case 'Firefox':
        if (version < 60) {
          compatibility.warnings.push('Firefox 60以降推奨');
          compatibility.level = 'limited';
        }
        if (version < 55) {
          compatibility.errors.push('Firefox 55未満: Web Audio API機能制限');
          compatibility.supported = false;
        }
        break;
        
      case 'Safari':
        if (version < 12) {
          compatibility.warnings.push('Safari 12以降推奨');
          compatibility.level = 'limited';
        }
        if (version < 11) {
          compatibility.errors.push('Safari 11未満: 必須機能非対応');
          compatibility.supported = false;
        }
        break;
        
      case 'Edge':
        if (version < 79) {
          compatibility.warnings.push('Edge 79以降推奨（Chromiumベース）');
          compatibility.level = 'limited';
        }
        break;
    }
  }
  
  /**
   * JavaScript機能サポートチェック
   * @param {Object} jsFeatures - JavaScript機能チェック結果
   * @param {Object} compatibility - 互換性オブジェクト（更新される）
   */
  static checkJavaScriptSupport(jsFeatures, compatibility) {
    if (!jsFeatures.asyncAwait) {
      compatibility.warnings.push('async/await未対応: 一部機能で制限');
    }
    
    if (!jsFeatures.classes) {
      compatibility.errors.push('ES6 Classes未対応');
      compatibility.supported = false;
    }
    
    if (!jsFeatures.arrowFunctions) {
      compatibility.warnings.push('Arrow Functions未対応');
    }
    
    if (!jsFeatures.destructuring) {
      compatibility.warnings.push('Destructuring未対応');
    }
  }
  
  /**
   * バージョン文字列抽出
   * @param {string} userAgent - User Agent文字列
   * @param {string|RegExp} prefix - バージョン前の文字列またはRegExp
   * @returns {string} バージョン番号
   */
  static extractVersion(userAgent, prefix) {
    try {
      if (prefix instanceof RegExp) {
        const match = userAgent.match(prefix);
        return match ? match[1] : 'Unknown';
      }
      
      const index = userAgent.indexOf(prefix);
      if (index === -1) return 'Unknown';
      
      const versionStart = index + prefix.length;
      const versionEnd = userAgent.indexOf(' ', versionStart);
      const version = userAgent.substring(versionStart, versionEnd === -1 ? undefined : versionEnd);
      
      return version.split('.')[0]; // メジャーバージョンのみ
    } catch {
      return 'Unknown';
    }
  }
  
  // JavaScript機能テストメソッド群
  static testAsyncAwait() {
    try {
      new Function('async () => { await Promise.resolve(); }');
      return true;
    } catch {
      return false;
    }
  }
  
  static testDestructuring() {
    try {
      new Function('const {a} = {a: 1}; const [b] = [1];');
      return true;
    } catch {
      return false;
    }
  }
  
  static testArrowFunctions() {
    try {
      new Function('() => {}');
      return true;
    } catch {
      return false;
    }
  }
  
  static testClasses() {
    try {
      new Function('class Test {}');
      return true;
    } catch {
      return false;
    }
  }
  
  static testModules() {
    try {
      return typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    } catch {
      return false;
    }
  }
  
  static testLocalStorage() {
    try {
      const test = 'browsercheck-test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  static testSessionStorage() {
    try {
      const test = 'browsercheck-test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 推奨ブラウザ情報取得
   * @returns {Array} 推奨ブラウザリスト
   */
  static getRecommendedBrowsers() {
    return [
      {
        name: 'Chrome',
        minVersion: 66,
        downloadUrl: 'https://www.google.com/chrome/',
        description: '最も安定した動作'
      },
      {
        name: 'Firefox',
        minVersion: 60,
        downloadUrl: 'https://www.mozilla.org/firefox/',
        description: 'プライバシー重視'
      },
      {
        name: 'Safari',
        minVersion: 12,
        downloadUrl: 'https://www.apple.com/safari/',
        description: 'Mac/iOS推奨'
      },
      {
        name: 'Edge',
        minVersion: 79,
        downloadUrl: 'https://www.microsoft.com/edge',
        description: 'Windows推奨'
      }
    ];
  }
  
  /**
   * 詳細互換性レポート生成
   * @returns {Object} 詳細レポート
   */
  static generateDetailedReport() {
    const results = this.check();
    
    return {
      ...results,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      recommended: this.getRecommendedBrowsers(),
      summary: {
        compatible: results.compatibility.supported,
        level: results.compatibility.level,
        errorCount: results.compatibility.errors.length,
        warningCount: results.compatibility.warnings.length
      }
    };
  }
}

export default BrowserChecker;
# 高優先度実装修正提案書

**作成日**: 2025-07-27  
**バージョン**: v1.0.0  
**対象**: SvelteKit相対音感トレーニングアプリ  
**修正対象**: Critical & High Warning Level 実装漏れ

## 📋 概要

この文書は、IMPLEMENTATION_GAPS_ANALYSIS.mdで特定された最高優先度の実装漏れに対する具体的な修正提案を提供します。即座に実装すべき3つの重要な改善項目に焦点を当てています。

## 🚨 修正対象項目

### **Priority 1: エラー分類システム実装 (CG1)**
### **Priority 2: ブラウザ互換性チェック実装 (CG2)**  
### **Priority 3: 段階的復旧ガイド実装 (WG3)**

---

## 🎯 Priority 1: エラー分類システム実装

### **問題の詳細**
現在、エラーハンドリングが各コンポーネントに散在し、統一された分類・対応システムがありません。これにより：
- ユーザーが混乱する不明確なエラーメッセージ
- 開発者が把握できない一貫性のない処理
- 復旧手順の不統一

### **解決策: 統一エラー管理システム**

#### **Step 1: エラー分類ライブラリ作成**

```typescript
// 新規ファイル: /svelte-prototype/src/lib/error/ErrorManager.js

export class ErrorManager {
  static ERROR_LEVELS = {
    CRITICAL: 'Critical',
    WARNING: 'Warning', 
    INFO: 'Info'
  };

  static ERROR_CODES = {
    // Critical Level
    MEDIASTREAM_DISCONNECTED: 'C1',
    AUDIOCONTEXT_CLOSED: 'C2',
    BROWSER_INCOMPATIBLE: 'C3',
    
    // Warning Level
    AUDIOCONTEXT_SUSPENDED: 'W1',
    VOLUME_ABNORMAL: 'W2',
    PITCH_CLARITY_LOW: 'W3',
    
    // Info Level
    NETWORK_DELAY: 'I1',
    PERFORMANCE_DEGRADED: 'I2'
  };

  static classifyError(error, context = '') {
    const classification = {
      level: this.determineLevel(error),
      code: this.generateCode(error, context),
      message: this.getUserMessage(error),
      recovery: this.getRecoveryStrategy(error),
      timestamp: new Date().toISOString(),
      context
    };

    // エラーログ記録
    this.logError(classification);
    
    return classification;
  }

  static determineLevel(error) {
    // MediaStream関連は常にCritical
    if (error.message?.includes('MediaStream') || error.name === 'NotAllowedError') {
      return this.ERROR_LEVELS.CRITICAL;
    }
    
    // AudioContext suspend は Warning
    if (error.message?.includes('suspended')) {
      return this.ERROR_LEVELS.WARNING;
    }
    
    // その他は Info
    return this.ERROR_LEVELS.INFO;
  }

  static generateCode(error, context) {
    if (error.message?.includes('MediaStream inactive')) return this.ERROR_CODES.MEDIASTREAM_DISCONNECTED;
    if (error.message?.includes('AudioContext') && error.message?.includes('closed')) return this.ERROR_CODES.AUDIOCONTEXT_CLOSED;
    if (error.message?.includes('suspended')) return this.ERROR_CODES.AUDIOCONTEXT_SUSPENDED;
    
    return 'UNKNOWN';
  }

  static getUserMessage(error) {
    const messages = {
      [this.ERROR_CODES.MEDIASTREAM_DISCONNECTED]: {
        title: 'マイク接続エラー',
        description: 'マイクへの接続が失われました。',
        actions: ['マイク接続を確認', 'ブラウザ許可を確認', 'マイクテストページで再設定']
      },
      [this.ERROR_CODES.AUDIOCONTEXT_SUSPENDED]: {
        title: '音声システム一時停止',
        description: '音声システムが一時停止しています。',
        actions: ['画面をタップして再開', 'ページを更新']
      },
      [this.ERROR_CODES.BROWSER_INCOMPATIBLE]: {
        title: 'ブラウザ非対応',
        description: 'このブラウザは音声機能に対応していません。',
        actions: ['Chrome/Firefox/Safari最新版を使用', 'ブラウザを更新']
      }
    };

    return messages[this.generateCode(error)] || {
      title: '予期しないエラー',
      description: error.message,
      actions: ['ページを更新', 'マイクテストページで再設定']
    };
  }

  static getRecoveryStrategy(error) {
    const level = this.determineLevel(error);
    
    if (level === this.ERROR_LEVELS.CRITICAL) return 'manual';
    if (level === this.ERROR_LEVELS.WARNING) return 'auto';
    return 'monitor';
  }

  static logError(classification) {
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
    console.error('Original Error:', classification);
    console.groupEnd();
  }
}
```

#### **Step 2: エラー表示コンポーネント作成**

```svelte
<!-- 新規ファイル: /svelte-prototype/src/lib/components/ErrorDisplay.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let errorClassification = null;
  export let showDetail = false;
  
  const dispatch = createEventDispatcher();
  
  $: isVisible = errorClassification !== null;
  $: errorLevel = errorClassification?.level;
  $: userMessage = errorClassification?.message;
  
  function handleDismiss() {
    dispatch('dismiss');
  }
  
  function handleAction(action) {
    dispatch('action', { action, errorCode: errorClassification.code });
  }
</script>

{#if isVisible}
  <div class="error-overlay" class:critical={errorLevel === 'Critical'} class:warning={errorLevel === 'Warning'} class:info={errorLevel === 'Info'}>
    <div class="error-content">
      <div class="error-header">
        <span class="error-icon">
          {#if errorLevel === 'Critical'}🚨
          {:else if errorLevel === 'Warning'}⚠️
          {:else}ℹ️
          {/if}
        </span>
        <h3>{userMessage?.title}</h3>
        <button class="close-button" on:click={handleDismiss}>×</button>
      </div>
      
      <div class="error-body">
        <p>{userMessage?.description}</p>
        
        {#if userMessage?.actions && userMessage.actions.length > 0}
          <div class="error-actions">
            <h4>対処方法:</h4>
            <ul>
              {#each userMessage.actions as action}
                <li>
                  <button class="action-button" on:click={() => handleAction(action)}>
                    {action}
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        {#if showDetail}
          <details class="error-details">
            <summary>技術的詳細</summary>
            <pre>{JSON.stringify(errorClassification, null, 2)}</pre>
          </details>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .error-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .error-content {
    background: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .error-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .error-icon {
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }
  
  .error-header h3 {
    flex: 1;
    margin: 0;
    color: #1f2937;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
  }
  
  .error-body {
    padding: 1rem;
  }
  
  .error-actions {
    margin-top: 1rem;
  }
  
  .error-actions h4 {
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  .error-actions ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .error-actions li {
    margin-bottom: 0.5rem;
  }
  
  .action-button {
    background-color: #2563eb;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    text-align: left;
  }
  
  .action-button:hover {
    background-color: #1d4ed8;
  }
  
  .error-overlay.critical .error-content {
    border-left: 4px solid #dc2626;
  }
  
  .error-overlay.warning .error-content {
    border-left: 4px solid #f59e0b;
  }
  
  .error-overlay.info .error-content {
    border-left: 4px solid #2563eb;
  }
  
  .error-details {
    margin-top: 1rem;
    font-size: 0.875rem;
  }
  
  .error-details pre {
    background-color: #f3f4f6;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
```

#### **Step 3: PitchDetectorコンポーネント修正**

```svelte
<!-- 修正対象: /svelte-prototype/src/lib/components/PitchDetector.svelte -->
<script>
  import { ErrorManager } from '../error/ErrorManager.js';
  import ErrorDisplay from './ErrorDisplay.svelte';
  
  // 既存のimport文の下に追加
  let currentError = null;
  let showErrorDetail = false;
  
  // 既存のcheckMicrophoneStatus関数を修正
  function checkMicrophoneStatus() {
    if (!debugMode) return;
    
    // ... 既存のコード ...
    
    // エラー検知時の処理を修正
    if (mediaStream && !mediaStream.active) {
      const error = new Error('MediaStream inactive');
      currentError = ErrorManager.classifyError(error, 'PitchDetector');
      
      // 親コンポーネントに通知（既存のまま）
      dispatch('microphoneHealthChange', {
        healthy: false,
        errors: ['MediaStream inactive'],
        details: status,
        errorClassification: currentError // 新規追加
      });
    }
    
    // AudioContext suspend時も同様に修正
    if (audioContext && audioContext.state === 'suspended') {
      const error = new Error('AudioContext suspended');
      currentError = ErrorManager.classifyError(error, 'PitchDetector');
      
      // 自動復旧試行
      if (currentError.recovery === 'auto') {
        audioContext.resume().then(() => {
          console.log('✅ AudioContext自動復旧成功');
          currentError = null; // エラー解決
        }).catch(() => {
          currentError.recovery = 'manual'; // 手動復旧に切り替え
        });
      }
    }
  }
  
  // エラーハンドリング関数追加
  function handleErrorAction(event) {
    const { action, errorCode } = event.detail;
    
    switch (action) {
      case 'マイク接続を確認':
        // マイク再接続試行
        console.log('マイク再接続を試行中...');
        break;
      case 'ページを更新':
        window.location.reload();
        break;
      case 'マイクテストページで再設定':
        dispatch('requestMicrophoneTest');
        break;
    }
  }
  
  function handleErrorDismiss() {
    currentError = null;
  }
</script>

<!-- 既存のHTML部分の最後に追加 -->
<ErrorDisplay 
  errorClassification={currentError} 
  showDetail={showErrorDetail}
  on:action={handleErrorAction}
  on:dismiss={handleErrorDismiss}
/>
```

---

## 🔍 Priority 2: ブラウザ互換性チェック実装

### **問題の詳細**
現在、ブラウザサポート確認が部分的で、非対応ブラウザでの適切なエラーハンドリングができていません。

### **解決策: 包括的互換性チェックシステム**

#### **Step 1: ブラウザ互換性チェッカー作成**

```typescript
// 新規ファイル: /svelte-prototype/src/lib/compatibility/BrowserChecker.js

export class BrowserChecker {
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
  
  static detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome/')) {
      return {
        name: 'Chrome',
        version: this.extractVersion(userAgent, 'Chrome/'),
        engine: 'Blink'
      };
    } else if (userAgent.includes('Firefox/')) {
      return {
        name: 'Firefox',
        version: this.extractVersion(userAgent, 'Firefox/'),
        engine: 'Gecko'
      };
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      return {
        name: 'Safari',
        version: this.extractVersion(userAgent, 'Version/'),
        engine: 'WebKit'
      };
    } else if (userAgent.includes('Edg/')) {
      return {
        name: 'Edge',
        version: this.extractVersion(userAgent, 'Edg/'),
        engine: 'Blink'
      };
    }
    
    return { name: 'Unknown', version: 'Unknown', engine: 'Unknown' };
  }
  
  static checkFeatures() {
    return {
      mediaDevices: {
        available: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
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
        mediaStreamSource: this.testMediaStreamSource()
      },
      pitchy: {
        available: typeof PitchDetector !== 'undefined'
      },
      modernJS: {
        asyncAwait: this.testAsyncAwait(),
        destructuring: this.testDestructuring(),
        arrowFunctions: this.testArrowFunctions()
      }
    };
  }
  
  static testAnalyserNode() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      ctx.close();
      return !!analyser;
    } catch {
      return false;
    }
  }
  
  static testBiquadFilter() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const ctx = new AudioContextClass();
      const filter = ctx.createBiquadFilter();
      ctx.close();
      return !!filter;
    } catch {
      return false;
    }
  }
  
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
    
    // Safari特殊対応警告
    if (browser.name === 'Safari') {
      compatibility.warnings.push('Safari: AudioContext自動suspend注意');
      compatibility.warnings.push('Safari: ユーザー操作後にAudioContext開始');
    }
    
    // 古いブラウザ警告
    if (browser.name === 'Chrome' && parseInt(browser.version) < 66) {
      compatibility.warnings.push('Chrome 66以降推奨');
      compatibility.level = 'limited';
    }
    
    if (browser.name === 'Firefox' && parseInt(browser.version) < 60) {
      compatibility.warnings.push('Firefox 60以降推奨');
      compatibility.level = 'limited';
    }
    
    // 致命的エラーがある場合
    if (compatibility.errors.length > 0) {
      compatibility.level = 'incompatible';
    }
    
    return compatibility;
  }
  
  static extractVersion(userAgent, prefix) {
    const index = userAgent.indexOf(prefix);
    if (index === -1) return 'Unknown';
    
    const versionStart = index + prefix.length;
    const versionEnd = userAgent.indexOf(' ', versionStart);
    const version = userAgent.substring(versionStart, versionEnd === -1 ? undefined : versionEnd);
    
    return version.split('.')[0]; // メジャーバージョンのみ
  }
  
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
}
```

#### **Step 2: 互換性警告コンポーネント作成**

```svelte
<!-- 新規ファイル: /svelte-prototype/src/lib/components/BrowserCompatibilityWarning.svelte -->
<script>
  import { onMount } from 'svelte';
  import { BrowserChecker } from '../compatibility/BrowserChecker.js';
  
  export let autoCheck = true;
  export let showDetails = false;
  
  let compatibilityResult = null;
  let showWarning = false;
  let showDetailModal = false;
  
  onMount(() => {
    if (autoCheck) {
      checkCompatibility();
    }
  });
  
  function checkCompatibility() {
    compatibilityResult = BrowserChecker.check();
    
    // 非対応または警告がある場合は表示
    if (!compatibilityResult.compatibility.supported || 
        compatibilityResult.compatibility.warnings.length > 0) {
      showWarning = true;
    }
  }
  
  function dismissWarning() {
    showWarning = false;
  }
  
  function openDetailModal() {
    showDetailModal = true;
  }
  
  function closeDetailModal() {
    showDetailModal = false;
  }
</script>

{#if showWarning && compatibilityResult}
  <div class="compatibility-banner" 
       class:error={!compatibilityResult.compatibility.supported}
       class:warning={compatibilityResult.compatibility.supported && compatibilityResult.compatibility.warnings.length > 0}>
    
    <div class="banner-content">
      <span class="banner-icon">
        {#if !compatibilityResult.compatibility.supported}🚫
        {:else}⚠️
        {/if}
      </span>
      
      <div class="banner-text">
        {#if !compatibilityResult.compatibility.supported}
          <strong>ブラウザ非対応</strong>
          <p>このブラウザは音声機能に完全対応していません。</p>
        {:else}
          <strong>互換性警告</strong>
          <p>このブラウザでは一部制限があります。</p>
        {/if}
      </div>
      
      <div class="banner-actions">
        <button class="detail-button" on:click={openDetailModal}>詳細</button>
        <button class="dismiss-button" on:click={dismissWarning}>×</button>
      </div>
    </div>
  </div>
{/if}

{#if showDetailModal && compatibilityResult}
  <div class="modal-overlay" on:click={closeDetailModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>ブラウザ互換性詳細</h3>
        <button class="close-button" on:click={closeDetailModal}>×</button>
      </div>
      
      <div class="modal-body">
        <div class="browser-info">
          <h4>検出されたブラウザ</h4>
          <p><strong>{compatibilityResult.browser.name}</strong> バージョン {compatibilityResult.browser.version}</p>
          <p>エンジン: {compatibilityResult.browser.engine}</p>
        </div>
        
        {#if compatibilityResult.compatibility.errors.length > 0}
          <div class="error-section">
            <h4>エラー (使用不可)</h4>
            <ul>
              {#each compatibilityResult.compatibility.errors as error}
                <li class="error-item">{error}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        {#if compatibilityResult.compatibility.warnings.length > 0}
          <div class="warning-section">
            <h4>警告 (制限あり)</h4>
            <ul>
              {#each compatibilityResult.compatibility.warnings as warning}
                <li class="warning-item">{warning}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <div class="recommendation-section">
          <h4>推奨ブラウザ</h4>
          <ul>
            <li>Chrome 66以降</li>
            <li>Firefox 60以降</li>
            <li>Safari 12以降</li>
            <li>Edge 79以降</li>
          </ul>
        </div>
        
        {#if showDetails}
          <details class="technical-details">
            <summary>技術的詳細</summary>
            <pre>{JSON.stringify(compatibilityResult, null, 2)}</pre>
          </details>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .compatibility-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    padding: 0.75rem;
    color: white;
    font-size: 0.875rem;
  }
  
  .compatibility-banner.error {
    background-color: #dc2626;
  }
  
  .compatibility-banner.warning {
    background-color: #f59e0b;
  }
  
  .banner-content {
    display: flex;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .banner-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }
  
  .banner-text {
    flex: 1;
  }
  
  .banner-text p {
    margin: 0.25rem 0 0 0;
    opacity: 0.9;
  }
  
  .banner-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .detail-button, .dismiss-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .detail-button:hover, .dismiss-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h3 {
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .browser-info, .error-section, .warning-section, .recommendation-section {
    margin-bottom: 1.5rem;
  }
  
  .browser-info h4, .error-section h4, .warning-section h4, .recommendation-section h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }
  
  .error-item {
    color: #dc2626;
  }
  
  .warning-item {
    color: #f59e0b;
  }
  
  .technical-details {
    margin-top: 1rem;
    font-size: 0.75rem;
  }
  
  .technical-details pre {
    background-color: #f3f4f6;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
```

#### **Step 3: アプリ全体に互換性チェック統合**

```svelte
<!-- 修正対象: /svelte-prototype/src/routes/+layout.svelte -->
<script>
  import BrowserCompatibilityWarning from '$lib/components/BrowserCompatibilityWarning.svelte';
</script>

<!-- 最上部に追加 -->
<BrowserCompatibilityWarning autoCheck={true} showDetails={true} />

<!-- 既存のコンテンツ -->
<slot />
```

---

## 🔧 Priority 3: 段階的復旧ガイド実装

### **問題の詳細**
エラー発生時に、ユーザーが具体的に何をすべきかが不明で、復旧手順が体系化されていません。

### **解決策: インタラクティブ復旧ガイドシステム**

#### **Step 1: 復旧手順管理システム作成**

```typescript
// 新規ファイル: /svelte-prototype/src/lib/recovery/RecoveryManager.js

export class RecoveryManager {
  static RECOVERY_PROCEDURES = {
    'C1': { // MediaStream切断
      title: 'マイク接続復旧',
      steps: [
        {
          id: 'check-connection',
          title: 'マイク接続確認',
          description: 'マイクが正しく接続されているか確認してください',
          action: 'checkMicrophoneConnection',
          automated: false,
          estimatedTime: 30
        },
        {
          id: 'check-permissions',
          title: 'ブラウザ許可確認',
          description: 'ブラウザでマイクの使用許可を確認してください',
          action: 'checkBrowserPermissions',
          automated: false,
          estimatedTime: 60
        },
        {
          id: 'test-microphone',
          title: 'マイクテスト実行',
          description: 'マイクテストページで動作を確認してください',
          action: 'goToMicrophoneTest',
          automated: true,
          estimatedTime: 120
        }
      ]
    },
    'W1': { // AudioContext suspended
      title: '音声システム復旧',
      steps: [
        {
          id: 'auto-resume',
          title: '自動復旧試行',
          description: '音声システムの自動復旧を試行します',
          action: 'autoResumeAudioContext',
          automated: true,
          estimatedTime: 5
        },
        {
          id: 'user-interaction',
          title: 'ユーザー操作',
          description: '画面をタップまたはクリックして音声システムを再開してください',
          action: 'requestUserInteraction',
          automated: false,
          estimatedTime: 10
        },
        {
          id: 'page-refresh',
          title: 'ページ更新',
          description: '問題が解決しない場合はページを更新してください',
          action: 'refreshPage',
          automated: true,
          estimatedTime: 15
        }
      ]
    },
    'C3': { // ブラウザ非対応
      title: 'ブラウザ対応確認',
      steps: [
        {
          id: 'browser-check',
          title: 'ブラウザ確認',
          description: '現在使用中のブラウザとバージョンを確認します',
          action: 'checkBrowserInfo',
          automated: true,
          estimatedTime: 5
        },
        {
          id: 'browser-update',
          title: 'ブラウザ更新',
          description: 'ブラウザを最新バージョンに更新してください',
          action: 'guideBrowserUpdate',
          automated: false,
          estimatedTime: 300
        },
        {
          id: 'browser-switch',
          title: '推奨ブラウザ使用',
          description: 'Chrome、Firefox、Safari、Edgeの最新版をご使用ください',
          action: 'guideBrowserSwitch',
          automated: false,
          estimatedTime: 180
        }
      ]
    }
  };
  
  static getRecoveryProcedure(errorCode) {
    return this.RECOVERY_PROCEDURES[errorCode] || null;
  }
  
  static async executeStep(stepId, errorCode, context = {}) {
    const procedure = this.getRecoveryProcedure(errorCode);
    if (!procedure) return { success: false, error: 'Unknown error code' };
    
    const step = procedure.steps.find(s => s.id === stepId);
    if (!step) return { success: false, error: 'Unknown step' };
    
    try {
      const result = await this.executeAction(step.action, context);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async executeAction(actionName, context) {
    switch (actionName) {
      case 'checkMicrophoneConnection':
        return await this.checkMicrophoneConnection();
      
      case 'checkBrowserPermissions':
        return await this.checkBrowserPermissions();
      
      case 'goToMicrophoneTest':
        return this.goToMicrophoneTest(context);
      
      case 'autoResumeAudioContext':
        return await this.autoResumeAudioContext(context);
      
      case 'requestUserInteraction':
        return this.requestUserInteraction();
      
      case 'refreshPage':
        return this.refreshPage();
      
      case 'checkBrowserInfo':
        return this.checkBrowserInfo();
      
      case 'guideBrowserUpdate':
        return this.guideBrowserUpdate();
      
      case 'guideBrowserSwitch':
        return this.guideBrowserSwitch();
      
      default:
        throw new Error(`Unknown action: ${actionName}`);
    }
  }
  
  static async checkMicrophoneConnection() {
    // マイク接続状態確認
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      return {
        connected: audioInputs.length > 0,
        deviceCount: audioInputs.length,
        devices: audioInputs.map(d => ({ label: d.label, deviceId: d.deviceId }))
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
  
  static async checkBrowserPermissions() {
    // ブラウザ許可状態確認
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        return { state: permission.state };
      } else {
        // Safari等での代替確認
        return { state: 'unknown', note: 'Permission API not supported' };
      }
    } catch (error) {
      return { state: 'error', error: error.message };
    }
  }
  
  static goToMicrophoneTest(context) {
    if (context.goto) {
      context.goto('/microphone-test');
      return { success: true };
    } else {
      window.location.href = '/microphone-test';
      return { success: true };
    }
  }
  
  static async autoResumeAudioContext(context) {
    if (context.audioContext && context.audioContext.state === 'suspended') {
      try {
        await context.audioContext.resume();
        return { resumed: true, state: context.audioContext.state };
      } catch (error) {
        return { resumed: false, error: error.message };
      }
    }
    return { resumed: false, reason: 'AudioContext not suspended or not available' };
  }
  
  static requestUserInteraction() {
    return {
      message: '画面をタップまたはクリックしてください',
      waitingForInteraction: true
    };
  }
  
  static refreshPage() {
    window.location.reload();
    return { success: true };
  }
  
  static checkBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      language: navigator.language
    };
  }
  
  static guideBrowserUpdate() {
    const userAgent = navigator.userAgent;
    let updateUrl = 'https://browsehappy.com/';
    
    if (userAgent.includes('Chrome')) {
      updateUrl = 'chrome://settings/help';
    } else if (userAgent.includes('Firefox')) {
      updateUrl = 'https://support.mozilla.org/kb/update-firefox-latest-release';
    } else if (userAgent.includes('Safari')) {
      updateUrl = 'https://support.apple.com/102665';
    }
    
    return {
      message: 'ブラウザを最新バージョンに更新してください',
      updateUrl
    };
  }
  
  static guideBrowserSwitch() {
    return {
      message: '推奨ブラウザをお使いください',
      browsers: [
        { name: 'Chrome', url: 'https://www.google.com/chrome/' },
        { name: 'Firefox', url: 'https://www.mozilla.org/firefox/' },
        { name: 'Safari', url: 'https://www.apple.com/safari/' },
        { name: 'Edge', url: 'https://www.microsoft.com/edge' }
      ]
    };
  }
}
```

#### **Step 2: インタラクティブ復旧ガイドコンポーネント作成**

```svelte
<!-- 新規ファイル: /svelte-prototype/src/lib/components/RecoveryGuide.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { RecoveryManager } from '../recovery/RecoveryManager.js';
  
  export let errorCode = '';
  export let context = {};
  
  const dispatch = createEventDispatcher();
  
  let procedure = null;
  let currentStepIndex = 0;
  let stepResults = {};
  let isExecuting = false;
  let showSuccessMessage = false;
  
  $: if (errorCode) {
    loadProcedure();
  }
  
  $: currentStep = procedure?.steps[currentStepIndex] || null;
  $: canProceedToNext = currentStepIndex < (procedure?.steps.length || 0) - 1;
  $: isComplete = currentStepIndex >= (procedure?.steps.length || 0);
  
  function loadProcedure() {
    procedure = RecoveryManager.getRecoveryProcedure(errorCode);
    currentStepIndex = 0;
    stepResults = {};
    showSuccessMessage = false;
  }
  
  async function executeCurrentStep() {
    if (!currentStep || isExecuting) return;
    
    isExecuting = true;
    
    try {
      const result = await RecoveryManager.executeStep(
        currentStep.id, 
        errorCode, 
        context
      );
      
      stepResults[currentStep.id] = result;
      
      if (result.success) {
        // 自動実行ステップは自動で次に進む
        if (currentStep.automated && canProceedToNext) {
          setTimeout(() => {
            moveToNextStep();
          }, 1000);
        }
      }
      
    } catch (error) {
      stepResults[currentStep.id] = {
        success: false,
        error: error.message
      };
    } finally {
      isExecuting = false;
    }
  }
  
  function moveToNextStep() {
    if (canProceedToNext) {
      currentStepIndex++;
    } else {
      // 復旧完了
      showSuccessMessage = true;
      dispatch('recoveryComplete', {
        errorCode,
        stepsCompleted: Object.keys(stepResults).length,
        results: stepResults
      });
    }
  }
  
  function moveToPreviousStep() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
    }
  }
  
  function restartProcedure() {
    currentStepIndex = 0;
    stepResults = {};
    showSuccessMessage = false;
  }
  
  function closeProcedure() {
    dispatch('close');
  }
  
  function formatTime(seconds) {
    if (seconds < 60) return `約${seconds}秒`;
    return `約${Math.ceil(seconds / 60)}分`;
  }
</script>

{#if procedure}
  <div class="recovery-guide">
    <div class="guide-header">
      <h3>🔧 {procedure.title}</h3>
      <button class="close-button" on:click={closeProcedure}>×</button>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" style="width: {((currentStepIndex + 1) / procedure.steps.length) * 100}%"></div>
    </div>
    
    <div class="step-counter">
      ステップ {currentStepIndex + 1} / {procedure.steps.length}
    </div>
    
    {#if !isComplete && !showSuccessMessage}
      <div class="current-step">
        <div class="step-header">
          <h4>{currentStep.title}</h4>
          <span class="time-estimate">{formatTime(currentStep.estimatedTime)}</span>
        </div>
        
        <p class="step-description">{currentStep.description}</p>
        
        {#if stepResults[currentStep.id]}
          <div class="step-result" class:success={stepResults[currentStep.id].success} class:error={!stepResults[currentStep.id].success}>
            {#if stepResults[currentStep.id].success}
              <span class="result-icon">✅</span>
              <span>完了</span>
            {:else}
              <span class="result-icon">❌</span>
              <span>失敗: {stepResults[currentStep.id].error}</span>
            {/if}
          </div>
        {/if}
        
        <div class="step-actions">
          {#if currentStepIndex > 0}
            <button class="secondary-button" on:click={moveToPreviousStep}>
              前のステップ
            </button>
          {/if}
          
          {#if !stepResults[currentStep.id]}
            <button 
              class="primary-button" 
              on:click={executeCurrentStep}
              disabled={isExecuting}
            >
              {#if isExecuting}
                実行中...
              {:else if currentStep.automated}
                自動実行
              {:else}
                実行
              {/if}
            </button>
          {:else if stepResults[currentStep.id].success}
            <button class="primary-button" on:click={moveToNextStep}>
              {#if canProceedToNext}
                次のステップ
              {:else}
                完了
              {/if}
            </button>
          {:else}
            <button class="primary-button" on:click={executeCurrentStep}>
              再試行
            </button>
          {/if}
        </div>
      </div>
    {:else if showSuccessMessage}
      <div class="success-message">
        <span class="success-icon">🎉</span>
        <h4>復旧完了</h4>
        <p>問題が解決されました。トレーニングを再開できます。</p>
        
        <div class="success-actions">
          <button class="primary-button" on:click={closeProcedure}>
            トレーニングに戻る
          </button>
          <button class="secondary-button" on:click={restartProcedure}>
            手順を再実行
          </button>
        </div>
      </div>
    {/if}
    
    <div class="step-overview">
      <h5>復旧手順一覧</h5>
      <ol>
        {#each procedure.steps as step, index}
          <li class="step-item" 
              class:current={index === currentStepIndex}
              class:completed={stepResults[step.id]?.success}
              class:failed={stepResults[step.id] && !stepResults[step.id].success}>
            <span class="step-status">
              {#if stepResults[step.id]?.success}✅
              {:else if stepResults[step.id] && !stepResults[step.id].success}❌
              {:else if index === currentStepIndex}🔄
              {:else}⏳
              {/if}
            </span>
            {step.title}
          </li>
        {/each}
      </ol>
    </div>
  </div>
{/if}

<style>
  .recovery-guide {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .guide-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .guide-header h3 {
    margin: 0;
    color: #1f2937;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
  }
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #2563eb;
    transition: width 0.3s ease;
  }
  
  .step-counter {
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
  
  .current-step {
    margin-bottom: 1.5rem;
  }
  
  .step-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .step-header h4 {
    margin: 0;
    color: #1f2937;
  }
  
  .time-estimate {
    font-size: 0.75rem;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .step-description {
    color: #4b5563;
    margin-bottom: 1rem;
  }
  
  .step-result {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .step-result.success {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  .step-result.error {
    background-color: #fee2e2;
    color: #991b1b;
  }
  
  .step-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .primary-button {
    background-color: #2563eb;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .primary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .primary-button:hover:not(:disabled) {
    background-color: #1d4ed8;
  }
  
  .secondary-button {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  .secondary-button:hover {
    background-color: #e5e7eb;
  }
  
  .success-message {
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .success-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }
  
  .success-message h4 {
    margin: 0 0 0.5rem 0;
    color: #059669;
  }
  
  .success-message p {
    color: #4b5563;
    margin-bottom: 1.5rem;
  }
  
  .success-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .step-overview {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
    margin-top: 1rem;
  }
  
  .step-overview h5 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .step-overview ol {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.875rem;
  }
  
  .step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    color: #6b7280;
  }
  
  .step-item.current {
    color: #2563eb;
    font-weight: 600;
  }
  
  .step-item.completed {
    color: #059669;
  }
  
  .step-item.failed {
    color: #dc2626;
  }
  
  .step-status {
    font-size: 0.75rem;
  }
</style>
```

#### **Step 3: トレーニングページに統合**

```svelte
<!-- 修正対象: /svelte-prototype/src/routes/training/random/+page.svelte -->
<script>
  import RecoveryGuide from '$lib/components/RecoveryGuide.svelte';
  import { ErrorManager } from '$lib/error/ErrorManager.js';
  
  // 既存のimport文の下に追加
  
  let showRecoveryGuide = false;
  let currentErrorCode = '';
  
  // 既存のhandleMicrophoneHealthChange関数を修正
  function handleMicrophoneHealthChange(event) {
    const { healthy, errors, details, errorClassification } = event.detail;
    
    microphoneHealthy = healthy;
    microphoneError = errors.length > 0 ? errors : null;
    
    // エラー分類がある場合は復旧ガイドを表示
    if (errorClassification && !healthy) {
      currentErrorCode = errorClassification.code;
      showRecoveryGuide = true;
      
      // Critical errorの場合はトレーニング停止
      if (errorClassification.level === 'Critical') {
        if (trainingPhase === 'listening' || trainingPhase === 'waiting' || trainingPhase === 'guiding') {
          console.warn('🚨 [Page] Critical error detected, stopping training', details);
          trainingPhase = 'setup';
        }
      }
    }
  }
  
  function handleRecoveryComplete(event) {
    const { errorCode, stepsCompleted, results } = event.detail;
    console.log(`✅ Recovery completed for ${errorCode}:`, results);
    
    showRecoveryGuide = false;
    currentErrorCode = '';
    
    // 復旧後はマイク状態を再確認
    if (pitchDetectorComponent) {
      // デバッグモードで健康状態チェック
      pitchDetectorComponent.debugMode = true;
    }
  }
  
  function handleRecoveryClose() {
    showRecoveryGuide = false;
    currentErrorCode = '';
  }
</script>

<!-- 既存のHTML部分の最後に追加 -->
{#if showRecoveryGuide}
  <div class="recovery-overlay">
    <RecoveryGuide 
      errorCode={currentErrorCode}
      context={{ 
        goto,
        audioContext: pitchDetectorComponent?.audioContext,
        mediaStream: pitchDetectorComponent?.mediaStream 
      }}
      on:recoveryComplete={handleRecoveryComplete}
      on:close={handleRecoveryClose}
    />
  </div>
{/if}

<style>
  .recovery-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  /* 既存のスタイル */
</style>
```

---

## 📋 実装スケジュール

### **Week 1: エラー分類システム (Priority 1)**
- Day 1-2: ErrorManager.js実装
- Day 3-4: ErrorDisplay.svelte実装  
- Day 5: PitchDetector.svelte統合
- Day 6-7: テスト・デバッグ

### **Week 2: ブラウザ互換性チェック (Priority 2)**
- Day 1-3: BrowserChecker.js実装
- Day 4-5: BrowserCompatibilityWarning.svelte実装
- Day 6: +layout.svelte統合
- Day 7: テスト・デバッグ

### **Week 3: 段階的復旧ガイド (Priority 3)**
- Day 1-3: RecoveryManager.js実装
- Day 4-5: RecoveryGuide.svelte実装
- Day 6: トレーニングページ統合
- Day 7: 統合テスト・完成

## 🧪 テスト計画

### **単体テスト**
```bash
# ErrorManager.js テスト
npm test -- src/lib/error/ErrorManager.test.js

# BrowserChecker.js テスト  
npm test -- src/lib/compatibility/BrowserChecker.test.js

# RecoveryManager.js テスト
npm test -- src/lib/recovery/RecoveryManager.test.js
```

### **統合テスト**
```bash
# エラーハンドリング統合テスト
npm test -- tests/integration/error-handling.test.js

# 復旧手順統合テスト
npm test -- tests/integration/recovery-procedures.test.js
```

### **E2Eテスト** 
```bash
# 完全エラー復旧フローテスト
npx playwright test tests/e2e/error-recovery-flow.spec.js
```

---

**この修正提案により、最高優先度の実装漏れを解決し、ユーザーが安心してアプリを利用できる堅牢なエラーハンドリングシステムを構築できます。**
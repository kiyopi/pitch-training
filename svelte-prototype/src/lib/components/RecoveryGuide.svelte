<script>
  import { createEventDispatcher } from 'svelte';
  import { ErrorManager } from '../error/ErrorManager.js';
  import { BrowserChecker } from '../compatibility/BrowserChecker.js';
  
  export let errorClassification = null;
  export let visible = false;
  
  const dispatch = createEventDispatcher();
  
  let currentStep = 0;
  let testResults = {};
  let isExecutingStep = false;
  let recoveryPlan = [];
  
  $: if (errorClassification && visible) {
    generateRecoveryPlan();
  }
  
  /**
   * 復旧プラン生成
   */
  function generateRecoveryPlan() {
    const code = errorClassification?.code;
    
    const plans = {
      'C1': [ // MEDIASTREAM_DISCONNECTED
        {
          title: 'マイク接続確認',
          type: 'check',
          description: 'マイクが正しく接続されているか確認します',
          test: checkMicrophoneConnection,
          autoExecute: false
        },
        {
          title: 'ブラウザ許可確認',
          type: 'permission',
          description: 'ブラウザでマイクの使用が許可されているか確認します',
          test: checkMicrophonePermission,
          autoExecute: true
        },
        {
          title: 'デバイス再選択',
          type: 'action',
          description: 'マイクデバイスを再選択します',
          action: reSelectMicrophone,
          autoExecute: false
        }
      ],
      'C2': [ // AUDIOCONTEXT_CLOSED
        {
          title: 'AudioContext状態確認',
          type: 'check',
          description: 'AudioContextの状態を確認します',
          test: checkAudioContextState,
          autoExecute: true
        },
        {
          title: 'AudioContext再初期化',
          type: 'action',
          description: 'AudioContextを再初期化します',
          action: reinitializeAudioContext,
          autoExecute: false
        },
        {
          title: 'ページ更新',
          type: 'reload',
          description: 'ページを更新してリセットします',
          action: reloadPage,
          autoExecute: false
        }
      ],
      'W1': [ // AUDIOCONTEXT_SUSPENDED
        {
          title: 'ユーザー操作実行',
          type: 'user-action',
          description: '画面をタップしてAudioContextを再開します',
          action: resumeAudioContext,
          autoExecute: true
        }
      ],
      'C3': [ // BROWSER_INCOMPATIBLE
        {
          title: 'ブラウザ互換性チェック',
          type: 'check',
          description: 'ブラウザの互換性を詳細チェックします',
          test: performBrowserCompatibilityCheck,
          autoExecute: true
        },
        {
          title: '推奨ブラウザ案内',
          type: 'info',
          description: '対応ブラウザをご案内します',
          action: showRecommendedBrowsers,
          autoExecute: false
        }
      ],
      'W2': [ // VOLUME_ABNORMAL
        {
          title: '音量レベルテスト',
          type: 'test',
          description: '現在の音量レベルをテストします',
          test: testVolumeLevel,
          autoExecute: true
        },
        {
          title: 'マイク設定調整ガイド',
          type: 'guide',
          description: 'マイクの設定方法をご案内します',
          action: showMicrophoneSettings,
          autoExecute: false
        }
      ]
    };
    
    recoveryPlan = plans[code] || [
      {
        title: '基本診断',
        type: 'check',
        description: 'システムの基本状態を確認します',
        test: performBasicDiagnostic,
        autoExecute: true
      }
    ];
    
    currentStep = 0;
    if (recoveryPlan[0]?.autoExecute) {
      executeCurrentStep();
    }
  }
  
  /**
   * 現在のステップ実行
   */
  async function executeCurrentStep() {
    if (isExecutingStep || currentStep >= recoveryPlan.length) return;
    
    isExecutingStep = true;
    const step = recoveryPlan[currentStep];
    
    try {
      if (step.test) {
        testResults[currentStep] = await step.test();
      } else if (step.action) {
        await step.action();
        testResults[currentStep] = { success: true, message: 'アクション実行完了' };
      }
    } catch (error) {
      testResults[currentStep] = { 
        success: false, 
        message: error.message,
        error: error
      };
    }
    
    isExecutingStep = false;
    
    // 成功した場合は自動で次のステップへ
    if (testResults[currentStep]?.success && currentStep < recoveryPlan.length - 1) {
      setTimeout(() => {
        nextStep();
      }, 1000);
    }
  }
  
  /**
   * 次のステップへ進む
   */
  function nextStep() {
    if (currentStep < recoveryPlan.length - 1) {
      currentStep++;
      if (recoveryPlan[currentStep]?.autoExecute) {
        executeCurrentStep();
      }
    }
  }
  
  /**
   * 前のステップに戻る
   */
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
  
  /**
   * ガイドを閉じる
   */
  function closeGuide() {
    visible = false;
    dispatch('close');
  }
  
  /**
   * 復旧完了
   */
  function completeRecovery() {
    dispatch('recovered');
    closeGuide();
  }
  
  // 復旧テスト関数群
  async function checkMicrophoneConnection() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      return {
        success: microphones.length > 0,
        message: `${microphones.length}個のマイクが検出されました`,
        details: microphones.map(mic => mic.label || 'マイクデバイス')
      };
    } catch (error) {
      return {
        success: false,
        message: 'マイクデバイスの検出に失敗しました',
        error: error.message
      };
    }
  }
  
  async function checkMicrophonePermission() {
    try {
      if (!navigator.permissions) {
        return {
          success: false,
          message: 'ブラウザが許可API非対応です',
          details: 'マイク許可を手動で確認してください'
        };
      }
      
      const permission = await navigator.permissions.query({ name: 'microphone' });
      
      return {
        success: permission.state === 'granted',
        message: `マイク許可状態: ${permission.state}`,
        details: permission.state === 'granted' ? '許可済み' : '許可が必要です'
      };
    } catch (error) {
      return {
        success: false,
        message: '許可状態の確認に失敗しました',
        error: error.message
      };
    }
  }
  
  async function reSelectMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // 既存のストリームを停止して新しいものに切り替え
      dispatch('microphoneReselected', { stream });
      
      return {
        success: true,
        message: 'マイクの再選択が完了しました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'マイクの再選択に失敗しました',
        error: error.message
      };
    }
  }
  
  async function checkAudioContextState() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return {
          success: false,
          message: 'AudioContextが利用できません'
        };
      }
      
      // 新しいAudioContextで状態確認
      const ctx = new AudioContextClass();
      const state = ctx.state;
      await ctx.close();
      
      return {
        success: state !== 'closed',
        message: `AudioContext状態: ${state}`,
        details: state
      };
    } catch (error) {
      return {
        success: false,
        message: 'AudioContext状態確認に失敗しました',
        error: error.message
      };
    }
  }
  
  async function reinitializeAudioContext() {
    try {
      dispatch('reinitializeAudio');
      
      return {
        success: true,
        message: 'AudioContextの再初期化が完了しました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'AudioContextの再初期化に失敗しました',
        error: error.message
      };
    }
  }
  
  async function reloadPage() {
    window.location.reload();
    return { success: true, message: 'ページを更新中...' };
  }
  
  async function resumeAudioContext() {
    try {
      dispatch('resumeAudioContext');
      
      return {
        success: true,
        message: 'AudioContextの再開が完了しました'
      };
    } catch (error) {
      return {
        success: false,
        message: 'AudioContextの再開に失敗しました',
        error: error.message
      };
    }
  }
  
  async function performBrowserCompatibilityCheck() {
    try {
      const results = BrowserChecker.check();
      
      return {
        success: results.compatibility.supported,
        message: `互換性レベル: ${results.compatibility.level}`,
        details: {
          browser: results.browser,
          errors: results.compatibility.errors,
          warnings: results.compatibility.warnings
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'ブラウザ互換性チェックに失敗しました',
        error: error.message
      };
    }
  }
  
  async function showRecommendedBrowsers() {
    const browsers = BrowserChecker.getRecommendedBrowsers();
    
    return {
      success: true,
      message: '推奨ブラウザ情報を表示しました',
      details: browsers
    };
  }
  
  async function testVolumeLevel() {
    try {
      // 実際の音量テストは親コンポーネントに委任
      dispatch('testVolume');
      
      return {
        success: true,
        message: '音量レベルテストを開始しました'
      };
    } catch (error) {
      return {
        success: false,
        message: '音量レベルテストに失敗しました',
        error: error.message
      };
    }
  }
  
  async function showMicrophoneSettings() {
    return {
      success: true,
      message: 'マイク設定ガイドを表示しました',
      details: [
        'マイクをコンピューターの近くに配置',
        'システム設定でマイク音量を確認',
        '他のアプリがマイクを使用していないか確認',
        '雑音の少ない環境で実施'
      ]
    };
  }
  
  async function performBasicDiagnostic() {
    try {
      const checks = await Promise.all([
        checkMicrophoneConnection(),
        checkAudioContextState(),
        performBrowserCompatibilityCheck()
      ]);
      
      const allSuccess = checks.every(check => check.success);
      
      return {
        success: allSuccess,
        message: allSuccess ? '基本診断で問題は検出されませんでした' : '基本診断で問題が検出されました',
        details: checks
      };
    } catch (error) {
      return {
        success: false,
        message: '基本診断に失敗しました',
        error: error.message
      };
    }
  }
</script>

{#if visible && recoveryPlan.length > 0}
  <div class="recovery-overlay">
    <div class="recovery-guide">
      <div class="recovery-header">
        <h3>🔧 復旧ガイド</h3>
        <button class="close-button" on:click={closeGuide} aria-label="復旧ガイドを閉じる">×</button>
      </div>
      
      <div class="recovery-content">
        <!-- プログレス表示 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: {((currentStep + 1) / recoveryPlan.length) * 100}%"></div>
          </div>
          <span class="progress-text">ステップ {currentStep + 1} / {recoveryPlan.length}</span>
        </div>
        
        <!-- 現在のステップ -->
        {#if recoveryPlan[currentStep]}
          <div class="current-step">
            <div class="step-header">
              <span class="step-icon">
                {#if recoveryPlan[currentStep].type === 'check'}🔍
                {:else if recoveryPlan[currentStep].type === 'test'}🧪
                {:else if recoveryPlan[currentStep].type === 'action'}⚙️
                {:else if recoveryPlan[currentStep].type === 'permission'}🔒
                {:else if recoveryPlan[currentStep].type === 'user-action'}👆
                {:else if recoveryPlan[currentStep].type === 'reload'}🔄
                {:else if recoveryPlan[currentStep].type === 'info'}ℹ️
                {:else if recoveryPlan[currentStep].type === 'guide'}📖
                {:else}⚡
                {/if}
              </span>
              <h4>{recoveryPlan[currentStep].title}</h4>
            </div>
            
            <p class="step-description">{recoveryPlan[currentStep].description}</p>
            
            <!-- ステップ実行ボタン -->
            {#if !recoveryPlan[currentStep].autoExecute && !testResults[currentStep]}
              <button 
                class="execute-button" 
                on:click={executeCurrentStep}
                disabled={isExecutingStep}
              >
                {isExecutingStep ? '実行中...' : 'このステップを実行'}
              </button>
            {/if}
            
            <!-- 実行中表示 -->
            {#if isExecutingStep}
              <div class="executing">
                <div class="spinner"></div>
                <span>実行中...</span>
              </div>
            {/if}
            
            <!-- 結果表示 -->
            {#if testResults[currentStep]}
              <div class="step-result" class:success={testResults[currentStep].success} class:failure={!testResults[currentStep].success}>
                <div class="result-icon">
                  {testResults[currentStep].success ? '✅' : '❌'}
                </div>
                <div class="result-content">
                  <div class="result-message">{testResults[currentStep].message}</div>
                  
                  {#if testResults[currentStep].details}
                    <details class="result-details">
                      <summary>詳細を表示</summary>
                      <div class="details-content">
                        {#if Array.isArray(testResults[currentStep].details)}
                          <ul>
                            {#each testResults[currentStep].details as detail}
                              <li>{detail}</li>
                            {/each}
                          </ul>
                        {:else if typeof testResults[currentStep].details === 'object'}
                          <pre>{JSON.stringify(testResults[currentStep].details, null, 2)}</pre>
                        {:else}
                          <p>{testResults[currentStep].details}</p>
                        {/if}
                      </div>
                    </details>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- ナビゲーション -->
        <div class="navigation">
          <button 
            class="nav-button secondary" 
            on:click={prevStep}
            disabled={currentStep === 0}
          >
            ← 前のステップ
          </button>
          
          {#if currentStep < recoveryPlan.length - 1}
            <button 
              class="nav-button primary" 
              on:click={nextStep}
              disabled={!testResults[currentStep]?.success}
            >
              次のステップ →
            </button>
          {:else}
            <button 
              class="nav-button success" 
              on:click={completeRecovery}
              disabled={!testResults[currentStep]?.success}
            >
              復旧完了
            </button>
          {/if}
        </div>
        
        <!-- 緊急脱出 -->
        <div class="emergency-section">
          <details>
            <summary>うまくいかない場合</summary>
            <div class="emergency-actions">
              <button class="emergency-button" on:click={() => dispatch('emergencyReload')}>
                ページを更新して最初からやり直し
              </button>
              <button class="emergency-button" on:click={() => dispatch('emergencyReset')}>
                マイクテストページに戻る
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .recovery-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .recovery-guide {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { 
      transform: translateY(-30px) scale(0.95);
      opacity: 0;
    }
    to { 
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  .recovery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px 12px 0 0;
  }
  
  .recovery-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .close-button:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .recovery-content {
    padding: 1.5rem;
  }
  
  .progress-section {
    margin-bottom: 2rem;
  }
  
  .progress-bar {
    background-color: #e5e7eb;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .progress-text {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  .current-step {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .step-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .step-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
  
  .step-header h4 {
    margin: 0;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .step-description {
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .execute-button {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    width: 100%;
  }
  
  .execute-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  .execute-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .executing {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: #3b82f6;
    font-weight: 500;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .step-result {
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;
  }
  
  .step-result.success {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
  }
  
  .step-result.failure {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }
  
  .result-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
  
  .result-content {
    flex: 1;
  }
  
  .result-message {
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .step-result.success .result-message {
    color: #059669;
  }
  
  .step-result.failure .result-message {
    color: #dc2626;
  }
  
  .result-details {
    font-size: 0.875rem;
  }
  
  .result-details summary {
    cursor: pointer;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }
  
  .details-content {
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
  }
  
  .details-content ul {
    margin: 0;
    padding-left: 1.25rem;
  }
  
  .details-content pre {
    font-size: 0.75rem;
    overflow-x: auto;
    margin: 0;
  }
  
  .navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .nav-button {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .nav-button.secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .nav-button.secondary:hover:not(:disabled) {
    background: #e5e7eb;
  }
  
  .nav-button.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }
  
  .nav-button.primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    transform: translateY(-1px);
  }
  
  .nav-button.success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  
  .nav-button.success:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
  }
  
  .nav-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .emergency-section {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }
  
  .emergency-section summary {
    cursor: pointer;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 0.5rem 0;
  }
  
  .emergency-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .emergency-button {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  
  .emergency-button:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .recovery-guide {
      width: 95%;
      max-height: 90vh;
    }
    
    .recovery-header {
      padding: 1rem;
    }
    
    .recovery-content {
      padding: 1rem;
    }
    
    .navigation {
      flex-direction: column;
    }
    
    .step-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .step-icon {
      margin-bottom: 0.5rem;
    }
  }
  
  /* アクセシビリティ */
  .execute-button:focus,
  .nav-button:focus,
  .emergency-button:focus,
  .close-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* アニメーション縮小 */
  @media (prefers-reduced-motion: reduce) {
    .recovery-overlay,
    .recovery-guide,
    .progress-fill,
    .execute-button,
    .nav-button {
      animation: none;
      transition: none;
    }
    
    .spinner {
      animation: none;
    }
  }
</style>
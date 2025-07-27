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
  
  function toggleDetail() {
    showDetail = !showDetail;
  }
</script>

{#if isVisible}
  <div class="error-overlay" 
       class:critical={errorLevel === 'Critical'} 
       class:warning={errorLevel === 'Warning'} 
       class:info={errorLevel === 'Info'}>
    <div class="error-content">
      <div class="error-header">
        <span class="error-icon">
          {#if errorLevel === 'Critical'}🚨
          {:else if errorLevel === 'Warning'}⚠️
          {:else}ℹ️
          {/if}
        </span>
        <h3 class="error-title">{userMessage?.title}</h3>
        <button class="close-button" on:click={handleDismiss} aria-label="エラーを閉じる">×</button>
      </div>
      
      <div class="error-body">
        <p class="error-description">{userMessage?.description}</p>
        
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
        
        <div class="error-footer">
          <button class="detail-toggle" on:click={toggleDetail}>
            {showDetail ? '詳細を隠す' : '詳細を表示'}
          </button>
        </div>
        
        {#if showDetail && errorClassification}
          <details class="error-details" open>
            <summary>技術的詳細</summary>
            <div class="detail-content">
              <div class="detail-item">
                <strong>エラーコード:</strong> {errorClassification.code}
              </div>
              <div class="detail-item">
                <strong>レベル:</strong> {errorClassification.level}
              </div>
              <div class="detail-item">
                <strong>復旧戦略:</strong> {errorClassification.recovery}
              </div>
              <div class="detail-item">
                <strong>発生時刻:</strong> {new Date(errorClassification.timestamp).toLocaleString('ja-JP')}
              </div>
              <div class="detail-item">
                <strong>コンテキスト:</strong> {errorClassification.context || 'N/A'}
              </div>
              <div class="detail-item">
                <strong>元のエラー:</strong>
                <pre class="original-error">{errorClassification.originalError}</pre>
              </div>
            </div>
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
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .error-content {
    background: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { 
      transform: translateY(-20px);
      opacity: 0;
    }
    to { 
      transform: translateY(0);
      opacity: 1;
    }
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
    flex-shrink: 0;
  }
  
  .error-title {
    flex: 1;
    margin: 0;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
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
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .close-button:hover {
    background-color: #f3f4f6;
  }
  
  .error-body {
    padding: 1rem;
  }
  
  .error-description {
    margin: 0 0 1rem 0;
    color: #374151;
    line-height: 1.5;
  }
  
  .error-actions {
    margin-bottom: 1rem;
  }
  
  .error-actions h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .error-actions ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .error-actions li {
    margin: 0;
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
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
  }
  
  .action-button:hover {
    background-color: #1d4ed8;
  }
  
  .action-button:active {
    background-color: #1e40af;
  }
  
  .error-footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
    display: flex;
    justify-content: center;
  }
  
  .detail-toggle {
    background: none;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  
  .detail-toggle:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }
  
  /* エラーレベル別のボーダー色 */
  .error-overlay.critical .error-content {
    border-left: 4px solid #dc2626;
  }
  
  .error-overlay.warning .error-content {
    border-left: 4px solid #f59e0b;
  }
  
  .error-overlay.info .error-content {
    border-left: 4px solid #2563eb;
  }
  
  /* 詳細表示 */
  .error-details {
    margin-top: 1rem;
    font-size: 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
  
  .error-details summary {
    padding: 0.75rem;
    background-color: #f9fafb;
    cursor: pointer;
    font-weight: 500;
    border-radius: 4px 4px 0 0;
  }
  
  .error-details summary:hover {
    background-color: #f3f4f6;
  }
  
  .detail-content {
    padding: 0.75rem;
  }
  
  .detail-item {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .detail-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .detail-item strong {
    color: #374151;
    display: inline-block;
    min-width: 80px;
  }
  
  .original-error {
    background-color: #f3f4f6;
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    margin: 0.25rem 0 0 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .error-content {
      width: 95%;
      margin: 1rem;
    }
    
    .error-header {
      padding: 0.75rem;
    }
    
    .error-body {
      padding: 0.75rem;
    }
    
    .error-title {
      font-size: 1rem;
    }
    
    .action-button {
      padding: 0.75rem;
    }
  }
  
  /* フォーカス管理 */
  .close-button:focus,
  .action-button:focus,
  .detail-toggle:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  
  /* アクセシビリティ */
  @media (prefers-reduced-motion: reduce) {
    .error-overlay,
    .error-content {
      animation: none;
    }
  }
</style>
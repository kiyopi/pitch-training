<script>
  export let showBackButton = false;
  export let maxWidth = '1200px';
</script>

<div class="page-layout">
  <header class="page-header">
    <div class="page-header-content">
      <div class="header-left">
        {#if showBackButton}
          <button class="back-button" on:click={() => history.back()}>
            ← 戻る
          </button>
        {/if}
        <div class="logo-area">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <h1 class="page-title">相対音感トレーニング</h1>
        </div>
      </div>
      <div class="header-right">
        <span class="version-info">バージョン 3.0 - 更新: {new Date().toLocaleString('ja-JP')}</span>
      </div>
    </div>
  </header>
  
  <main class="page-main" style="max-width: {maxWidth};">
    <slot />
  </main>
  
  <footer class="page-footer">
    <div class="footer-content">
      <div class="copyright">
        © 2024 相対音感トレーニング. All rights reserved.
      </div>
      <div class="footer-info">
        <span>バージョン 3.0</span>
        <span>•</span>
        <span>Svelte で開発</span>
      </div>
    </div>
  </footer>
</div>

<style>
  .page-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
  }
  
  .page-header {
    border-bottom: 1px solid var(--color-gray-200);
    background: var(--color-bg-primary);
  }
  
  .page-header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  
  .logo-area {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .logo-area svg {
    color: var(--color-gray-900);
  }
  
  .back-button {
    background: none;
    border: none;
    color: var(--color-gray-900);
    cursor: pointer;
    font-size: var(--text-base);
  }
  
  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0;
  }
  
  .header-right {
    display: flex;
    align-items: center;
  }
  
  .version-info {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
  }
  
  .page-main {
    flex: 1;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
    width: 100%;
  }
  
  .page-footer {
    border-top: 1px solid var(--color-gray-200);
    margin-top: var(--space-12);
  }
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-gray-600);
  }
  
  .footer-info {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
</style>
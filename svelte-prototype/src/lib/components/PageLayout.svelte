<script lang="ts">
  export let title;
  export let showBackButton = false;
  export let maxWidth = '1200px';
</script>

<div class="page-layout">
  <header class="page-header">
    <div class="page-header-content">
      {#if showBackButton}
        <button class="back-button" on:click={() => history.back()}>
          ← 戻る
        </button>
      {/if}
      <h1 class="page-title">{title}</h1>
    </div>
  </header>
  
  <main class="page-main" style="max-width: {maxWidth};">
    <slot />
  </main>
  
  <footer class="page-footer">
    <div class="footer-content">
      <p>Pitch Training App v3.0.0 - Svelte移行プロトタイプ</p>
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
    gap: var(--space-4);
  }
  
  .back-button {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: var(--text-base);
  }
  
  .page-title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0;
  }
  
  .page-main {
    flex: 1;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
    width: 100%;
  }
  
  .page-footer {
    border-top: 1px solid var(--color-gray-200);
    background: var(--color-bg-secondary);
    padding: var(--space-4);
    text-align: center;
  }
  
  .footer-content {
    color: var(--color-gray-600);
    font-size: var(--text-sm);
  }
</style>
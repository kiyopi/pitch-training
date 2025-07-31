<script>
  import { createEventDispatcher } from 'svelte';
  import { RefreshCw, Play } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let isCompleted = false; // 8セッション完了判定
  export let position = 'bottom'; // 'top' または 'bottom'
  export let className = '';
  
  // ボタン設定
  $: buttonConfig = isCompleted 
    ? [{ type: 'restart', label: '初めから挑戦', icon: RefreshCw }]
    : [
        { type: 'same', label: '同じ基音で再挑戦', icon: RefreshCw },
        { type: 'different', label: '違う基音で開始', icon: Play }
      ];
  
  // イベント処理
  function handleButtonClick(type) {
    dispatch('action', { type });
  }
</script>

<div class="action-buttons-container {position} {className}">
  <div class="action-buttons">
    {#each buttonConfig as button}
      <button
        class="action-btn {button.type}"
        on:click={() => handleButtonClick(button.type)}
      >
        <svelte:component this={button.icon} size="16" />
        <span>{button.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .action-buttons-container {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0.5rem 1rem;
  }
  
  /* 位置別マージン調整 */
  .action-buttons-container.top {
    margin: 0.25rem 0 0.5rem 0; /* 上0.25rem 下0.5rem */
  }
  
  .action-buttons-container.bottom {
    margin: 0.5rem 0; /* 上下とも0.5rem */
  }
  
  .action-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 400px;
    width: 100%;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid hsl(214.3 31.8% 91.4%);
    border-radius: 8px;
    background: hsl(0 0% 100%);
    color: hsl(222.2 84% 4.9%);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 140px;
    justify-content: center;
  }
  
  .action-btn:hover {
    background: hsl(210 40% 98%);
    border-color: hsl(214.3 31.8% 81.4%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .action-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* ボタンタイプ別スタイル */
  .action-btn.same {
    border-color: hsl(142.1 76.2% 36.3%);
    color: hsl(142.1 84.2% 31.2%);
  }
  
  .action-btn.same:hover {
    background: hsl(142.1 76.2% 36.3% / 0.1);
    border-color: hsl(142.1 76.2% 36.3%);
  }
  
  .action-btn.different {
    border-color: hsl(221.2 83.2% 53.3%);
    color: hsl(221.2 83.2% 53.3%);
  }
  
  .action-btn.different:hover {
    background: hsl(221.2 83.2% 53.3% / 0.1);
    border-color: hsl(221.2 83.2% 53.3%);
  }
  
  .action-btn.restart {
    border-color: hsl(262.1 83.3% 57.8%);
    color: hsl(262.1 83.3% 57.8%);
  }
  
  .action-btn.restart:hover {
    background: hsl(262.1 83.3% 57.8% / 0.1);
    border-color: hsl(262.1 83.3% 57.8%);
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .action-buttons {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    
    .action-btn {
      min-width: 200px;
      width: 100%;
      max-width: 280px;
    }
    
    .action-buttons-container {
      padding: 0.5rem;
    }
    
    .action-buttons-container.top {
      margin: 0.125rem 0 0.25rem 0; /* さらに狭く */
    }
  }
</style>
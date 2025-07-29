<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  
  export let sessionHistory = [];
  export let currentIndex = 0;
  export let className = '';
  
  // アニメーション用
  const slidePosition = tweened(0, { duration: 300, easing: cubicOut });
  
  // 現在のセッションデータ
  $: currentSession = sessionHistory[currentIndex] || null;
  $: hasNext = currentIndex < sessionHistory.length - 1;
  $: hasPrev = currentIndex > 0;
  
  // ナビゲーション関数
  function goToSession(index) {
    if (index >= 0 && index < sessionHistory.length) {
      currentIndex = index;
      slidePosition.set(-index * 100);
    }
  }
  
  function nextSession() {
    if (hasNext) {
      goToSession(currentIndex + 1);
    }
  }
  
  function prevSession() {
    if (hasPrev) {
      goToSession(currentIndex - 1);
    }
  }
  
  // キーボードナビゲーション
  function handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      prevSession();
    } else if (event.key === 'ArrowRight') {
      nextSession();
    }
  }
</script>

<div class="session-carousel {className}" on:keydown={handleKeydown} role="region" aria-label="セッション詳細カルーセル">
  <!-- カルーセルコンテナ -->
  <div class="carousel-container">
    <!-- 左ボタン -->
    <button 
      class="carousel-nav carousel-nav-prev" 
      on:click={prevSession}
      disabled={!hasPrev}
      aria-label="前のセッション"
    >
      <ChevronLeft size="24" />
    </button>
    
    <!-- カルーセル本体 -->
    <div class="carousel-viewport">
      <div class="carousel-track" style="transform: translateX({$slidePosition}%)">
        {#each sessionHistory as session, index}
          <div class="carousel-slide" data-index={index}>
            <slot {session} {index} />
          </div>
        {/each}
      </div>
    </div>
    
    <!-- 右ボタン -->
    <button 
      class="carousel-nav carousel-nav-next" 
      on:click={nextSession}
      disabled={!hasNext}
      aria-label="次のセッション"
    >
      <ChevronRight size="24" />
    </button>
  </div>
  
  <!-- インジケーター（ドット） -->
  <div class="carousel-indicators">
    {#each sessionHistory as _, index}
      <button
        class="carousel-indicator"
        class:active={index === currentIndex}
        on:click={() => goToSession(index)}
        aria-label="セッション{index + 1}へ移動"
      />
    {/each}
  </div>
</div>

<style>
  .session-carousel {
    width: 100%;
    position: relative;
  }
  
  .carousel-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .carousel-viewport {
    flex: 1;
    overflow: hidden;
    border-radius: 12px;
    background: #f9fafb;
  }
  
  .carousel-track {
    display: flex;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .carousel-slide {
    width: 100%;
    flex-shrink: 0;
    padding: 1.5rem;
  }
  
  /* ナビゲーションボタン（shadcn/ui風） */
  .carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }
  
  .carousel-nav:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .carousel-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .carousel-nav-prev {
    left: -20px;
  }
  
  .carousel-nav-next {
    right: -20px;
  }
  
  /* インジケーター */
  .carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .carousel-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
  }
  
  .carousel-indicator:hover {
    background: #9ca3af;
  }
  
  .carousel-indicator.active {
    background: #3b82f6;
    width: 24px;
    border-radius: 4px;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 640px) {
    .carousel-nav {
      width: 36px;
      height: 36px;
    }
    
    .carousel-nav-prev {
      left: -18px;
    }
    
    .carousel-nav-next {
      right: -18px;
    }
    
    .carousel-slide {
      padding: 1rem;
    }
  }
</style>
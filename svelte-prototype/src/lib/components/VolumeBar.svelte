<script>
  import { onMount } from 'svelte';
  
  export let volume = 0; // 0-100の音量値
  export let threshold = 30; // しきい値
  export let height = '12px';
  export let className = '';
  
  let barElement;
  
  // 音量レベルに応じた色の計算（青透過グラデーション）
  function getVolumeColor(volume) {
    if (volume < threshold) {
      // 低音量時: 透過率高い青
      const alpha = Math.max(0.2, volume / threshold * 0.8);
      return `rgba(37, 99, 235, ${alpha})`;
    }
    // 高音量時: 透過率0（完全な青）
    return '#2563eb';
  }
  
  // 音量バーの更新（DOM直接操作）
  function updateVolumeBar(newVolume) {
    if (barElement) {
      const clampedVolume = Math.max(0, Math.min(100, newVolume));
      const color = getVolumeColor(clampedVolume);
      
      // ログ削除
      
      barElement.style.width = `${clampedVolume}%`;
      barElement.style.backgroundColor = color;
    }
  }
  
  // volumeプロパティの変更を監視
  $: updateVolumeBar(volume);
  
  onMount(() => {
    // 初期スタイル設定（iPhone WebKit対応）
    if (barElement) {
      barElement.style.width = '0%';
      barElement.style.backgroundColor = '#2563eb';
      barElement.style.height = height;
      barElement.style.borderRadius = '9999px';
      barElement.style.transition = 'width 0.2s ease-out, background-color 0.2s ease-out'; // より滑らかなトランジション
    }
  });
</script>

<div class="volume-bar-container {className}">
  <div class="volume-bar-bg" style="height: {height}; border-radius: 9999px; background-color: #e2e8f0; position: relative; overflow: hidden;">
    <div 
      bind:this={barElement}
      class="volume-bar-fill"
      style="position: absolute; top: 0; left: 0; height: 100%;"
    ></div>
  </div>
  
  <!-- しきい値インジケーター -->
  <div 
    class="threshold-indicator" 
    style="position: absolute; top: 0; left: {threshold}%; width: 2px; height: {height}; background-color: #64748b; border-radius: 1px;"
  ></div>
</div>

<style>
  .volume-bar-container {
    position: relative;
    width: 100%;
  }
  
  .threshold-indicator {
    opacity: 0.6;
    pointer-events: none;
  }
</style>
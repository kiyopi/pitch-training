<script>
  import { AlertCircle, TrendingUp, Zap, Crown, Star, BookOpen, Music } from 'lucide-svelte';
  
  export let intervalData = [];
  export let className = '';
  export let showTechnicalErrorCorrection = false; // 技術誤差補正表示フラグ
  
  // 音程の表示名と色の定義
  const intervalInfo = {
    'unison': { name: 'ユニゾン', color: 'from-gray-400 to-gray-600' },
    'minor_second': { name: '短2度', color: 'from-purple-400 to-purple-600' },
    'major_second': { name: '長2度', color: 'from-indigo-400 to-indigo-600' },
    'minor_third': { name: '短3度', color: 'from-blue-400 to-blue-600' },
    'major_third': { name: '長3度', color: 'from-cyan-400 to-cyan-600' },
    'perfect_fourth': { name: '完全4度', color: 'from-teal-400 to-teal-600' },
    'tritone': { name: 'トライトーン', color: 'from-green-400 to-green-600' },
    'perfect_fifth': { name: '完全5度', color: 'from-lime-400 to-lime-600' },
    'minor_sixth': { name: '短6度', color: 'from-yellow-400 to-yellow-600' },
    'major_sixth': { name: '長6度', color: 'from-amber-400 to-amber-600' },
    'minor_seventh': { name: '短7度', color: 'from-orange-400 to-orange-600' },
    'major_seventh': { name: '長7度', color: 'from-red-400 to-red-600' },
    'octave': { name: 'オクターブ', color: 'from-pink-400 to-pink-600' }
  };
  
  // 平均誤差に応じたメッセージ
  const getMasteryMessage = (averageError) => {
    if (averageError === null) return '未測定';
    if (averageError <= 15) return '得意';
    if (averageError <= 25) return '良好';
    if (averageError <= 40) return '普通';
    if (averageError <= 60) return '苦手';
    return '要練習';
  };
  
  // 平均誤差に応じたアイコンコンポーネント
  const getMasteryIcon = (averageError) => {
    if (averageError === null) return Music;
    if (averageError <= 15) return Crown;
    if (averageError <= 25) return Star;
    if (averageError <= 40) return TrendingUp;
    if (averageError <= 60) return AlertCircle;
    return BookOpen;
  };

  // 平均誤差に応じた色
  const getMasteryColor = (averageError) => {
    if (averageError === null) return 'text-gray-500';    // 未測定 - グレー
    if (averageError <= 15) return 'text-yellow-500';     // 得意 - ゴールド
    if (averageError <= 25) return 'text-blue-500';       // 良好 - ブルー
    if (averageError <= 40) return 'text-green-500';      // 普通 - グリーン
    if (averageError <= 60) return 'text-orange-500';     // 苦手 - オレンジ
    return 'text-red-500';                                 // 要練習 - レッド
  };
</script>

<div class="interval-progress-tracker {className}">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each intervalData as interval}
      <div class="interval-card">
        <div class="flex items-center gap-3">
          <svelte:component 
            this={getMasteryIcon(interval.averageError)} 
            size="24" 
            class={getMasteryColor(interval.averageError)}
          />
          <div class="flex-1">
            <div class="font-medium text-gray-800">
              {interval.scale || intervalInfo[interval.type]?.name || interval.type}
              {#if interval.intervalName}
                <span class="text-sm text-gray-600">（{interval.intervalName}）</span>
              {/if}
            </div>
            <div class="text-sm text-gray-600 mt-1">
              {interval.attempts}回
              {#if interval.averageError !== null}
                　平均誤差 ±{interval.averageError}¢
              {:else}
                　未測定
              {/if}
            </div>
          </div>
        </div>
        
        <!-- 技術誤差補正データ表示 -->
        {#if showTechnicalErrorCorrection && interval.technicalErrorRate !== undefined}
          <div class="mt-2 space-y-1">
            <div class="flex items-center gap-1 text-xs text-gray-600">
              <Zap size="12" class="text-blue-500" />
              <span>技術誤差: ±{interval.technicalErrorRate.toFixed(1)}¢</span>
            </div>
            {#if interval.trueAccuracy !== undefined}
              <div class="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp size="12" />
                <span>補正後精度: {interval.trueAccuracy.toFixed(1)}%</span>
              </div>
            {/if}
            {#if interval.recommendation}
              <div class="flex items-start gap-1 text-xs text-blue-600">
                <AlertCircle size="12" class="mt-0.5 flex-shrink-0" />
                <span>{interval.recommendation}</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  {#if intervalData.length === 0}
    <div class="empty-state">
      <Music size="48" class="empty-icon" />
      <div class="empty-text">まだ音程データがありません</div>
    </div>
  {/if}
</div>

<style>
  .interval-progress-tracker {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-gray-200);
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    padding: var(--space-6);
  }

  .tracker-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-800);
    margin-bottom: var(--space-4);
  }

  .interval-card {
    background: var(--color-gray-50);
    border: 1px solid var(--color-gray-200);
    border-radius: 8px;
    padding: var(--space-4);
    transition: all 0.2s ease-in-out;
  }
  
  .interval-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: var(--color-gray-300);
    transform: translateY(-1px);
  }


  .empty-state {
    text-align: center;
    padding: var(--space-8) 0;
    color: var(--color-gray-500);
  }

  .empty-icon {
    margin: 0 auto var(--space-2);
    color: var(--color-gray-400);
  }

  .empty-text {
    font-size: var(--text-sm);
  }
</style>
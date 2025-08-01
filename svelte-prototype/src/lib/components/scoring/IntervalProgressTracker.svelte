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
  
  // 習得レベルに応じたメッセージ
  const getMasteryMessage = (mastery) => {
    if (mastery >= 90) return '得意';
    if (mastery >= 70) return '良好';
    if (mastery >= 50) return '普通';
    if (mastery >= 30) return '苦手';
    return '要練習';
  };
  
  // 習得レベルに応じたアイコンコンポーネント
  const getMasteryIcon = (mastery) => {
    if (mastery >= 90) return Crown;
    if (mastery >= 70) return Star;
    if (mastery >= 50) return TrendingUp;
    if (mastery >= 30) return AlertCircle;
    return BookOpen;
  };

  // 習得レベルに応じた色
  const getMasteryColor = (mastery) => {
    if (mastery >= 90) return 'text-yellow-500';   // 得意 - ゴールド
    if (mastery >= 70) return 'text-blue-500';     // 良好 - ブルー
    if (mastery >= 50) return 'text-green-500';    // 普通 - グリーン
    if (mastery >= 30) return 'text-orange-500';   // 苦手 - オレンジ
    return 'text-red-500';                         // 要練習 - レッド
  };
</script>

<div class="interval-progress-tracker {className}">
  <h3 class="tracker-title">音程別習得状況</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each intervalData as interval}
      <div class="interval-card">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svelte:component 
              this={getMasteryIcon(interval.mastery)} 
              size="20" 
              class={getMasteryColor(interval.mastery)}
            />
            <div>
              <div class="font-medium text-gray-800">
                {intervalInfo[interval.type]?.name || interval.type}
              </div>
              <div class="text-xs text-gray-500">
                {getMasteryMessage(interval.mastery)}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg text-gray-800">
              {interval.mastery}%
            </div>
            <div class="text-xs text-gray-500">
              {interval.attempts}回挑戦
            </div>
          </div>
        </div>
        
        <div class="progress-bar-bg">
          <div 
            class="progress-bar-fill bg-gradient-to-r {intervalInfo[interval.type]?.color || 'from-gray-400 to-gray-600'}"
            style="width: {interval.mastery}%"
          />
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
        {:else if interval.accuracy !== undefined}
          <div class="mt-2 text-xs text-gray-600">
            平均精度: {interval.accuracy.toFixed(1)}%
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

  .progress-bar-bg {
    width: 100%;
    background-color: var(--color-gray-200);
    border-radius: 9999px;
    height: 12px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    transition: all 0.5s ease-in-out;
    border-radius: 9999px;
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
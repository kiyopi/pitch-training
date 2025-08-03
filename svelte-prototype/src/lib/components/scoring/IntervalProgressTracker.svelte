<script>
  import { AlertCircle, TrendingUp, Zap, Crown, Star, BookOpen, Music, CheckCircle } from 'lucide-svelte';
  
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
  <!-- テーブル形式で表示 -->
  <div class="interval-table-container">
    <table class="interval-table">
      <thead>
        <tr>
          <th>ステータス</th>
          <th>音程</th>
          <th>挑戦回数</th>
          <th>平均誤差</th>
          <th>評価</th>
          {#if showTechnicalErrorCorrection}
            <th>技術誤差補正</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each intervalData as interval}
          <tr class="interval-row {getMasteryMessage(interval.averageError).toLowerCase()}">
            <td class="status-cell">
              <svelte:component 
                this={getMasteryIcon(interval.averageError)} 
                size="18" 
                class={getMasteryColor(interval.averageError)}
              />
            </td>
            <td class="interval-name-cell">
              {interval.scale || intervalInfo[interval.type]?.name || interval.type}
              {#if interval.intervalName}
                <span style="font-size: 0.875rem; color: #6b7280;">（{interval.intervalName}）</span>
              {/if}
            </td>
            <td class="attempts-cell">{interval.attempts}回</td>
            <td class="error-cell">
              {#if interval.averageError !== null}
                ±{interval.averageError}¢
              {:else}
                未測定
              {/if}
            </td>
            <td class="mastery-cell">
              <span class="mastery-badge {getMasteryMessage(interval.averageError).toLowerCase()}">
                {getMasteryMessage(interval.averageError)}
              </span>
            </td>
            {#if showTechnicalErrorCorrection}
              <td class="correction-cell">
                {#if interval.technicalErrorRate !== undefined}
                  <div style="font-size: 0.75rem;">
                    <div>誤差: ±{interval.technicalErrorRate.toFixed(1)}¢</div>
                    {#if interval.trueAccuracy !== undefined}
                      <div style="color: #10b981;">精度: {interval.trueAccuracy.toFixed(1)}%</div>
                    {/if}
                  </div>
                {:else}
                  -
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
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
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    padding: 1.5rem;
  }

  .tracker-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
  }

  .interval-table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .interval-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .interval-table th {
    background: #f8fafc;
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e2e8f0;
  }

  .interval-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .interval-table tr:hover {
    background: #fafbfc;
  }

  /* 行スタイル（日本語クラス名対応） */
  .interval-row.得意 {
    border-left: 3px solid #fbbf24;
  }

  .interval-row.良好 {
    border-left: 3px solid #3b82f6;
  }

  .interval-row.普通 {
    border-left: 3px solid #10b981;
  }

  .interval-row.苦手 {
    border-left: 3px solid #f97316;
  }

  .interval-row.要練習,
  .interval-row.未測定 {
    border-left: 3px solid #ef4444;
  }

  .status-cell {
    text-align: center;
    width: 60px;
  }

  .interval-name-cell {
    font-weight: 600;
  }

  .attempts-cell,
  .error-cell {
    text-align: center;
  }

  .mastery-cell {
    text-align: center;
  }

  .mastery-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .mastery-badge.得意 {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
  }

  .mastery-badge.良好 {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .mastery-badge.普通 {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .mastery-badge.苦手 {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
  }

  .mastery-badge.要練習,
  .mastery-badge.未測定 {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .correction-cell {
    text-align: center;
  }


  .empty-state {
    text-align: center;
    padding: 2rem 0;
    color: #6b7280;
  }

  .empty-icon {
    margin: 0 auto 0.5rem;
    color: #9ca3af;
  }

  .empty-text {
    font-size: 0.875rem;
  }
</style>
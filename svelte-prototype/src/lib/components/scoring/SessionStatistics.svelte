<script>
  export let statistics = {};
  export let className = '';
  
  // デフォルト値の設定
  const stats = {
    totalAttempts: statistics.totalAttempts || 0,
    successRate: statistics.successRate || 0,
    averageScore: statistics.averageScore || 0,
    bestScore: statistics.bestScore || 0,
    sessionDuration: statistics.sessionDuration || 0,
    streakCount: statistics.streakCount || 0,
    fatigueLevel: statistics.fatigueLevel || 'fresh',
    mostDifficultInterval: statistics.mostDifficultInterval || '-',
    mostSuccessfulInterval: statistics.mostSuccessfulInterval || '-',
    averageResponseTime: statistics.averageResponseTime || 0
  };
  
  // セッション時間をフォーマット
  function formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.floor(minutes)}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}時間${mins}分`;
  }
  
  // 疲労レベルの表示
  const fatigueInfo = {
    'fresh': { label: 'フレッシュ', color: 'text-green-600', icon: '😊' },
    'normal': { label: '通常', color: 'text-blue-600', icon: '🙂' },
    'tired': { label: '疲れ気味', color: 'text-amber-600', icon: '😴' },
    'exhausted': { label: '疲労', color: 'text-red-600', icon: '😩' }
  };
  
  $: fatigue = (stats && stats.fatigueLevel && fatigueInfo[stats.fatigueLevel]) || fatigueInfo.normal;
  
  // 統計カテゴリ（安全なアクセス）
  $: statCategories = [
    {
      title: 'パフォーマンス',
      icon: '📊',
      stats: [
        { label: '総挑戦回数', value: `${(stats?.totalAttempts || 0)}回`, highlight: (stats?.totalAttempts || 0) > 20 },
        { label: '成功率', value: `${((stats?.successRate || 0).toFixed(1))}%`, highlight: (stats?.successRate || 0) > 70 },
        { label: '平均スコア', value: `${((stats?.averageScore || 0).toFixed(1))}点`, highlight: (stats?.averageScore || 0) > 75 },
        { label: '最高スコア', value: `${(stats?.bestScore || 0)}点`, highlight: (stats?.bestScore || 0) > 90 }
      ]
    },
    {
      title: 'セッション情報',
      icon: '⏱️',
      stats: [
        { label: '練習時間', value: formatDuration(stats?.sessionDuration || 0) },
        { label: '連続正解', value: `${(stats?.streakCount || 0)}回`, highlight: (stats?.streakCount || 0) > 5 },
        { label: '平均応答時間', value: `${((stats?.averageResponseTime || 0).toFixed(1))}秒` },
        { 
          label: '疲労度', 
          value: fatigue.label, 
          customClass: fatigue.color,
          icon: fatigue.icon
        }
      ]
    },
    {
      title: '音程分析',
      icon: '🎵',
      stats: [
        { 
          label: '最も難しい音程', 
          value: stats?.mostDifficultInterval || '未分析',
          customClass: 'text-red-600'
        },
        { 
          label: '最も得意な音程', 
          value: stats?.mostSuccessfulInterval || '未分析',
          customClass: 'text-green-600'
        }
      ]
    }
  ];
</script>

<div class="session-statistics {className} bg-white rounded-xl shadow-lg p-6">
  <h3 class="text-xl font-semibold text-gray-800 mb-6">📊 セッション統計</h3>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each statCategories as category}
      <div class="stat-category bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">{category.icon}</span>
          <h4 class="font-medium text-gray-700">{category.title}</h4>
        </div>
        
        <div class="space-y-2">
          {#each category.stats as stat}
            <div class="stat-item flex justify-between items-center">
              <span class="text-sm text-gray-600">{stat.label}</span>
              <span class="font-semibold {stat.customClass || (stat.highlight ? 'text-blue-600' : 'text-gray-800')}">
                {#if stat.icon}
                  <span class="mr-1">{stat.icon}</span>
                {/if}
                {stat.value}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- 進捗サマリー -->
  {#if stats.totalAttempts > 0}
    <div class="mt-6 pt-6 border-t border-gray-200">
      <div class="progress-summary bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 class="font-medium text-gray-700 mb-1">セッションサマリー</h4>
            <p class="text-sm text-gray-600">
              {#if stats.averageScore >= 80}
                素晴らしいパフォーマンスです！相対音感が向上しています。
              {:else if stats.averageScore >= 60}
                良い進歩が見られます。継続することでさらなる向上が期待できます。
              {:else}
                練習を続けることが大切です。少しずつ確実に上達しています。
              {/if}
            </p>
          </div>
          
          {#if stats.streakCount > 0}
            <div class="streak-display bg-white rounded-full px-4 py-2 shadow-sm">
              <span class="text-2xl mr-2">🔥</span>
              <span class="font-bold text-orange-600">{stats.streakCount}</span>
              <span class="text-sm text-gray-600 ml-1">連続正解中</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .stat-category {
    transition: all 0.2s ease;
  }
  
  .stat-category:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .stat-item {
    padding: 4px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .progress-summary {
    position: relative;
    overflow: hidden;
  }
  
  .progress-summary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 3s infinite;
  }
  
  @keyframes shimmer {
    to {
      left: 100%;
    }
  }
</style>
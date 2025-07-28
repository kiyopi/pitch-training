<script>
  import { onMount } from 'svelte';
  import { 
    ScoreResultPanel,
    IntervalProgressTracker,
    ConsistencyGraph,
    FeedbackDisplay,
    SessionStatistics
  } from '$lib/components/scoring';

  // サンプルデータ
  let sampleData = {
    // ScoreResultPanel用
    totalScore: 82,
    grade: 'A',
    componentScores: {
      pitchAccuracy: 85,
      recognitionSpeed: 78,
      intervalMastery: 83,
      directionAccuracy: 90,
      consistency: 75
    },
    
    // IntervalProgressTracker用
    intervalData: [
      { type: 'unison', mastery: 95, attempts: 20, accuracy: 98 },
      { type: 'major_second', mastery: 82, attempts: 35, accuracy: 85 },
      { type: 'major_third', mastery: 78, attempts: 28, accuracy: 80 },
      { type: 'perfect_fourth', mastery: 65, attempts: 22, accuracy: 68 },
      { type: 'perfect_fifth', mastery: 88, attempts: 30, accuracy: 90 },
      { type: 'octave', mastery: 92, attempts: 25, accuracy: 94 }
    ],
    
    // ConsistencyGraph用
    consistencyData: [
      { score: 65, timestamp: Date.now() - 600000 },
      { score: 72, timestamp: Date.now() - 540000 },
      { score: 68, timestamp: Date.now() - 480000 },
      { score: 75, timestamp: Date.now() - 420000 },
      { score: 78, timestamp: Date.now() - 360000 },
      { score: 82, timestamp: Date.now() - 300000 },
      { score: 80, timestamp: Date.now() - 240000 },
      { score: 85, timestamp: Date.now() - 180000 },
      { score: 83, timestamp: Date.now() - 120000 },
      { score: 88, timestamp: Date.now() - 60000 }
    ],
    
    // FeedbackDisplay用
    feedback: {
      type: 'good',
      primary: '素晴らしい進歩です！',
      summary: '音程の認識精度が向上しています。特に完全5度の習得度が高く、基本的な和音感覚が身についてきています。',
      details: [
        { category: 'strengths', text: '方向性の判断が非常に正確です（90%）' },
        { category: 'strengths', text: 'ユニゾンとオクターブの認識がほぼ完璧です' },
        { category: 'improvements', text: '完全4度の練習をもう少し増やしましょう' },
        { category: 'tips', text: '4度は「ソーファー」の音程です。日常的な音楽でよく聞かれます' },
        { category: 'practice', text: '完全4度を含む簡単な曲を歌ってみましょう' }
      ],
      nextSteps: [
        '完全4度の集中練習モードを試してみましょう',
        '連続チャレンジモードで実践的な練習を',
        '1日15分の継続的な練習を心がけましょう'
      ],
      motivation: '継続は力なり！あなたの相対音感は確実に向上しています！'
    },
    
    // SessionStatistics用
    statistics: {
      totalAttempts: 45,
      successRate: 73.3,
      averageScore: 82,
      bestScore: 95,
      sessionDuration: 32,
      streakCount: 8,
      fatigueLevel: 'normal',
      mostDifficultInterval: '完全4度',
      mostSuccessfulInterval: 'ユニゾン',
      averageResponseTime: 2.3
    }
  };

  let showGrid = true;
</script>

<div class="container mx-auto p-6 max-w-7xl">
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">
      🎵 採点システムコンポーネント展示
    </h1>
    <p class="text-gray-600">
      強化採点エンジンの表示コンポーネント
    </p>
  </div>

  <div class="mb-6 text-center">
    <button 
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      on:click={() => showGrid = !showGrid}
    >
      {showGrid ? 'スタック表示' : 'グリッド表示'}に切り替え
    </button>
  </div>

  <div class={showGrid ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
    <!-- ScoreResultPanel -->
    <div class="component-section">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">ScoreResultPanel</h2>
      <ScoreResultPanel 
        totalScore={sampleData.totalScore}
        grade={sampleData.grade}
        componentScores={sampleData.componentScores}
      />
    </div>

    <!-- IntervalProgressTracker -->
    <div class="component-section">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">IntervalProgressTracker</h2>
      <IntervalProgressTracker 
        intervalData={sampleData.intervalData}
      />
    </div>

    <!-- ConsistencyGraph -->
    <div class="component-section">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">ConsistencyGraph</h2>
      <ConsistencyGraph 
        consistencyData={sampleData.consistencyData}
      />
    </div>

    <!-- FeedbackDisplay -->
    <div class="component-section">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">FeedbackDisplay</h2>
      <FeedbackDisplay 
        feedback={sampleData.feedback}
      />
    </div>

    <!-- SessionStatistics -->
    <div class="component-section lg:col-span-2">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">SessionStatistics</h2>
      <SessionStatistics 
        statistics={sampleData.statistics}
      />
    </div>
  </div>

  <!-- 統合レイアウトサンプル -->
  <div class="mt-12">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
      📱 統合レイアウトサンプル（モバイル対応）
    </h2>
    
    <div class="bg-gray-100 p-4 rounded-xl">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- メインスコア -->
        <ScoreResultPanel 
          totalScore={sampleData.totalScore}
          grade={sampleData.grade}
          componentScores={sampleData.componentScores}
        />
        
        <!-- フィードバック -->
        <FeedbackDisplay 
          feedback={sampleData.feedback}
        />
        
        <!-- 詳細統計（タブ形式の想定） -->
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="flex gap-2 mb-4 overflow-x-auto">
            <button class="px-4 py-2 bg-blue-500 text-white rounded-lg flex-shrink-0">
              音程別進捗
            </button>
            <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0">
              一貫性グラフ
            </button>
            <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg flex-shrink-0">
              セッション統計
            </button>
          </div>
          
          <IntervalProgressTracker 
            intervalData={sampleData.intervalData}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .component-section {
    transition: all 0.3s ease;
  }
  
  .component-section:hover {
    transform: translateY(-2px);
  }

  :global(body) {
    background-color: #f9fafb;
  }
</style>
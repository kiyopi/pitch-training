# TrainingCore実装設計書

## 📋 概要

### 目的
3つのトレーニングモード（ランダム・連続・12音階）の共通機能を統合し、コード重複を削減しながら一貫したユーザー体験を提供する。

### TrainingCoreの役割
- 音声システム（AudioManager、PitchDetector）の統合管理
- 基音再生（Tone.js + Salamander Grand Piano）の共通制御
- ガイドアニメーション（8音階/12音階対応）の統一実装
- 評価システム（EvaluationEngine）の一元化
- セッション管理（自動/手動制御）の柔軟な対応

---

## 🏗️ アーキテクチャ設計

### コンポーネント構成

```
TrainingCore.svelte（共通機能）
├── 音声システム（AudioManager, PitchDetector）
├── 基音再生（Tone.js + Salamander Piano）
├── ガイドアニメーション（8音階/12音階対応）
├── 評価システム（EvaluationEngine）
└── セッション管理（自動/手動制御）

各モードページ（差分のみ）
├── /training/random: モード設定のみ
├── /training/continuous: 開始画面 + モード設定
└── /training/chromatic: 基音選択UI + 方向選択
```

### 責務分離

| コンポーネント | 責務 |
|----------------|------|
| **TrainingCore** | 音感トレーニングの核心機能 |
| **RandomPage** | ランダムモード固有のUI（ほぼなし） |
| **ContinuousPage** | 開始画面・説明・設定UI |
| **ChromaticPage** | 基音選択・方向選択UI |

---

## 📊 モード別仕様

### ランダムモード（初級向け）
- **対象**: 初心者
- **基音**: 10種類の基本的な音程（C4, D4, E4等）
- **音階**: 8音階（ドレミファソラシド）
- **セッション**: 8回
- **再生**: 手動（ユーザーがボタンクリック）
- **特徴**: 基礎的な相対音感の習得

### 連続チャレンジモード（中級向け）
- **対象**: 中級者
- **基音**: 半音を含む難しい基音（Bb3, F#4, C#5等）
- **音階**: 8音階（ドレミファソラシド）
- **セッション**: 8回固定
- **再生**: 自動（2秒間隔で連続実行）
- **特徴**: 持続力と安定性の向上

### 12音階モード（上級向け）
- **対象**: 上級者
- **基音**: 12種類から選択可能
- **音階**: 12音階（半音階）
- **セッション**: 1回
- **再生**: 手動
- **特徴**: 完全な半音階の習得
- **特別フロー**: マイクテスト（音域確認）→ 基音選択 → 方向選択

---

## 🗄️ ローカルストレージ制御

### 管理システム
- **メインストア**: `/lib/stores/sessionStorage.ts` - Svelteリアクティブストア
- **管理クラス**: `SessionStorageManager` - localStorage操作の実体
- **統合方式**: Svelteストア + localStorage の2層構造

### 保存データ構造
```javascript
// メインデータ
localStorage.setItem('random-training-progress', {
  sessionHistory: [...],      // セッション履歴配列
  currentSessionId: 1-8,      // 現在のセッション番号
  isCompleted: false,         // 8セッション完了判定
  overallGrade: 'C',          // S-E級総合評価
  overallAccuracy: 85,        // 全体精度平均
  usedBaseNotes: [...],       // 使用済み基音リスト
  nextBaseNote: 'C4',         // 次の基音
  totalPlayTime: 1200         // 総プレイ時間（秒）
});

// バックアップデータ
localStorage.setItem('random-training-progress-backup', {...});

// マイクテスト完了フラグ
localStorage.setItem('mic-test-completed', 'true');
```

### 主要ストア（リアクティブ）
```javascript
// メインストア
export const trainingProgress = writable<TrainingProgress | null>(null);
export const currentSessionId = writable<number>(1);
export const nextBaseNote = writable<BaseNote>('C4');
export const nextBaseName = writable<string>('ド（低）');

// 派生ストア
export const isCompleted = derived(trainingProgress, $progress => $progress?.isCompleted || false);
export const sessionHistory = derived(trainingProgress, $progress => $progress?.sessionHistory || []);
export const overallGrade = derived(trainingProgress, $progress => $progress?.overallGrade || null);
```

### 特殊制御機能
1. **リロード検出**: セッション途中リロード時にlocalStorage完全削除
2. **ダイレクトアクセス対応**: マイクテスト未完了時の誘導
3. **8セッション統合評価**: localStorage履歴を統合した総合採点
4. **セッション中断回復**: 異常終了時のデータ復旧

---

## 🎤 マイク制御

### AudioManager統合システム
- **共有リソース管理**: `audioManager.initialize()` で一元管理
- **外部AudioContext**: PitchDetectorに外部AudioContextを提供
- **リソース再利用**: ページ間でmediaStream/audioContextを保持
- **デバイス最適化**: iOS/PC自動判定による音量・設定調整

### マイク状態管理
```javascript
let microphoneState = 'checking' | 'granted' | 'denied' | 'error';
let mediaStream = null;      // AudioManagerから取得
let audioContext = null;     // AudioManagerから取得
let sourceNode = null;       // AudioManagerから取得
let microphoneHealthy = true; // マイク健康状態
let microphoneErrors = [];    // エラー詳細
```

### 許可確認フロー
```javascript
// 1. マイクテストページ遷移（自動許可）
if (urlParams.get('from') === 'microphone-test') {
  microphoneState = 'granted';
}

// 2. ダイレクトアクセス（許可確認）
async function checkExistingMicrophonePermission() {
  const permissionStatus = await navigator.permissions.query({name: 'microphone'});
  if (permissionStatus.state === 'granted') {
    await checkMicrophonePermission();
  } else {
    microphoneState = 'denied';
  }
}

// 3. AudioManager初期化
async function checkMicrophonePermission() {
  const resources = await audioManager.initialize();
  audioContext = resources.audioContext;
  mediaStream = resources.mediaStream;
  sourceNode = resources.sourceNode;
  microphoneState = 'granted';
}
```

### デバイス対応機能
```javascript
// iPad対応: AudioManager健康チェック&再初期化
const status = audioManager.getStatus();
if (!status.isInitialized || !status.mediaStreamActive) {
  await audioManager.initialize();
}

// 音量調整: デバイス自動判定
function getVolumeForDevice() {
  const isIOS = /iPhone|iPad/.test(navigator.userAgent) || 
                (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  return isIOS ? 35 : -6; // iOS: 35dB, PC: -6dB
}
```

---

## 🔧 技術仕様

### プロパティ設計

```typescript
// TrainingCore.svelte
export let mode: 'random' | 'continuous' | 'chromatic' = 'random';
export let autoPlay = false;                // 自動再生（連続モード用）
export let sessionCount = 8;                // セッション数
export let baseNote: string | null = null;  // 12音階モード用
export let direction: 'asc' | 'desc' = 'asc'; // 12音階モード用
export let onSessionComplete: () => void;    // セッション完了コールバック
export let onAllComplete: () => void;        // 全完了コールバック
```

### 基音設定の統合

#### 初級向け基音（ランダムモード）
```javascript
const easyBaseNotes = [
  { note: 'C4', name: 'ド（中）', frequency: 261.63 },
  { note: 'Db4', name: 'ド#（中）', frequency: 277.18 },
  { note: 'D4', name: 'レ（中）', frequency: 293.66 },
  { note: 'Eb4', name: 'レ#（中）', frequency: 311.13 },
  { note: 'E4', name: 'ミ（中）', frequency: 329.63 },
  { note: 'F4', name: 'ファ（中）', frequency: 349.23 },
  { note: 'Gb4', name: 'ファ#（中）', frequency: 369.99 },
  { note: 'Ab4', name: 'ラb（中）', frequency: 415.30 },
  { note: 'Bb3', name: 'シb（低）', frequency: 233.08 },
  { note: 'B3', name: 'シ（低）', frequency: 246.94 }
];
```

#### 中級向け基音（連続モード）
```javascript
const hardBaseNotes = [
  { note: 'Bb3', name: 'シb（低）', frequency: 233.08 },
  { note: 'B3', name: 'シ（低）', frequency: 246.94 },
  { note: 'Db4', name: 'ド#（中）', frequency: 277.18 },
  { note: 'Eb4', name: 'レ#（中）', frequency: 311.13 },
  { note: 'F#4', name: 'ファ#（中）', frequency: 369.99 },
  { note: 'G#4', name: 'ソ#（中）', frequency: 415.30 },
  { note: 'Bb4', name: 'シb（高）', frequency: 466.16 },
  { note: 'C#5', name: 'ド#（高）', frequency: 554.37 },
  { note: 'Eb5', name: 'レ#（高）', frequency: 622.25 },
  { note: 'F#5', name: 'ファ#（高）', frequency: 739.99 }
];
```

#### 基音選択ロジック
```javascript
function selectBaseNoteForMode() {
  switch (mode) {
    case 'random':
      return easyBaseNotes[Math.floor(Math.random() * easyBaseNotes.length)];
    case 'continuous':
      return hardBaseNotes[Math.floor(Math.random() * hardBaseNotes.length)];
    case 'chromatic':
      return baseNote; // プロパティで指定された基音
  }
}
```

### 音階システムの統合

```javascript
// 8音階（ランダム・連続モード）
const diatonicScale = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'];

// 12音階（クロマチックモード）
const chromaticScaleAsc = [
  'ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 
  'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'
];

const chromaticScaleDesc = [
  'シ', 'ラ#', 'ラ', 'ソ#', 'ソ', 'ファ#', 
  'ファ', 'ミ', 'レ#', 'レ', 'ド#', 'ド'
];

// 現在の音階を取得
$: currentScale = mode === 'chromatic' 
  ? (direction === 'asc' ? chromaticScaleAsc : chromaticScaleDesc)
  : diatonicScale;
```

### 自動再生制御

```javascript
// セッション完了時の処理
function handleSessionComplete() {
  if (mode === 'continuous' && currentSession < sessionCount) {
    // 2秒待機後、自動的に次のセッションを開始
    setTimeout(() => {
      currentSession++;
      startNewSession();
    }, 2000);
  } else {
    // 手動モードまたは全セッション完了
    onSessionComplete?.();
  }
}
```

### 共通UI要素

```svelte
<!-- TrainingCore内で共通使用 -->
<PitchDetector bind:this={pitchDetectorComponent} />

<Card class="main-card half-width">
  <div class="card-header">
    <h3 class="section-title">🎹 基音再生</h3>
  </div>
  <div class="card-content">
    <Button 
      variant="primary"
      disabled={isPlaying || (autoPlay && trainingPhase === 'guiding')}
      on:click={playBaseNote}
    >
      {#if isPlaying}
        🎵 再生中...
      {:else if autoPlay}
        🔄 自動再生モード
      {:else}
        🎹 基音再生
      {/if}
    </Button>
    
    <!-- ドレミガイドスタートバー（常時表示） -->
    <div class="guide-start-bar-container">
      <div class="guide-start-label">ガイド開始まで</div>
      <div class="guide-start-bar">
        <div class="guide-progress-fill" style="width: {guideStartProgress}%"></div>
        <div class="guide-music-icon {musicIconGlowing ? 'glowing' : ''}">
          <Music size="20" />
        </div>
      </div>
    </div>
  </div>
</Card>

<!-- ガイド表示（8音階/12音階自動切替） -->
<Card class="main-card">
  <div class="card-header">
    <h3 class="section-title">🎵 音階ガイド</h3>
  </div>
  <div class="card-content">
    <div class="scale-guide">
      {#each currentScale as step, index}
        <div class="scale-item {scaleSteps[index]?.state || 'inactive'}">
          {step}
        </div>
      {/each}
    </div>
  </div>
</Card>
```

---

## 🔄 TrainingCoreでの統合方針

### ローカルストレージ統合

#### **モード別対応**
| モード | localStorage使用 | セッション管理 | 履歴保存 |
|--------|------------------|---------------|----------|
| **ランダム** | ✅ 完全対応 | 8セッション管理 | 統合評価 |
| **連続** | ✅ 適応対応 | 8回固定管理 | 一括評価 |
| **12音階** | ❌ 使用しない | 1回完結 | 一時保存 |

#### **実装戦略**
```javascript
// TrainingCore.svelte
export let useLocalStorage = true;  // 12音階モードでfalse
export let sessionKey = 'random-training-progress'; // モード別キー

// localStorage使用判定
$: if (useLocalStorage) {
  // ランダム・連続モード: 既存システム活用
  await loadProgress();
  $: currentData = $trainingProgress;
} else {
  // 12音階モード: インメモリ管理
  let tempSessionData = null;
}
```

### マイク制御統合

#### **共通初期化フロー**
```javascript
// TrainingCore共通初期化
async function initializeTrainingCore() {
  // 1. マイクテスト完了確認
  const micTestCompleted = localStorage.getItem('mic-test-completed');
  
  // 2. マイク状態判定
  if (urlParams.get('from') === 'microphone-test') {
    microphoneState = 'granted';
  } else if (!micTestCompleted) {
    await checkExistingMicrophonePermission();
  }
  
  // 3. AudioManager初期化
  if (microphoneState === 'granted') {
    const resources = await audioManager.initialize();
    audioContext = resources.audioContext;
    mediaStream = resources.mediaStream;
  }
  
  // 4. モード別初期化
  await initializeModeSpecific();
}
```

#### **デバイス最適化継承**
```javascript
// 全モード共通のデバイス対応
function getAudioSettings() {
  const deviceSpecs = audioManager.getPlatformSpecs();
  return {
    volume: deviceSpecs.volumeDb,           // -6dB (PC) / 35dB (iOS)
    bufferSize: deviceSpecs.bufferSize,     // 2048 (PC) / 1024 (iOS)
    sampleRate: deviceSpecs.sampleRate      // 44100Hz 共通
  };
}
```

### プロパティ拡張設計

```typescript
// TrainingCore.svelte（拡張版）
export let mode: 'random' | 'continuous' | 'chromatic' = 'random';
export let autoPlay = false;
export let sessionCount = 8;
export let baseNote: string | null = null;
export let direction: 'asc' | 'desc' = 'asc';

// システム制御
export let useLocalStorage = true;              // localStorage使用フラグ
export let sessionKey = 'training-progress';    // localStorage キー
export let microphoneRequired = true;           // マイク必須フラグ
export let audioManagerShared = true;          // AudioManager共有フラグ

// コールバック
export let onSessionComplete: () => void;
export let onAllComplete: () => void;
export let onMicrophoneError: (error: string) => void;
export let onStorageError: (error: string) => void;
```

---

## 🚀 実装ガイド

### Step 1: TrainingCore.svelte作成
1. 既存のランダムモード（`/training/random/+page.svelte`）から共通部分を抽出
2. `$lib/components/TrainingCore.svelte`として新規作成
3. プロパティベースの動作制御を実装

### Step 2: ランダムモードの改修
```svelte
<!-- /training/random/+page.svelte -->
<script>
  import TrainingCore from '$lib/components/TrainingCore.svelte';
</script>

<TrainingCore 
  mode="random"
  autoPlay={false}
  sessionCount={8}
  useLocalStorage={true}
  sessionKey="random-training-progress"
  microphoneRequired={true}
  audioManagerShared={true}
/>
```

### Step 3: 連続モードの実装
```svelte
<!-- /training/continuous/+page.svelte -->
<script>
  import TrainingCore from '$lib/components/TrainingCore.svelte';
  let started = false;
</script>

<PageLayout>
  {#if !started}
    <div class="continuous-setup">
      <Card>
        <h1>🎯 連続チャレンジモード（中級）</h1>
        <p>8回連続で自動実行・難易度の高い基音でトレーニング</p>
        
        <div class="challenge-features">
          <h3>中級者向けチャレンジ</h3>
          <ul>
            <li>♭や♯を含む難しい基音</li>
            <li>8回連続で自動進行</li>
            <li>休憩なしの集中トレーニング</li>
            <li>統計データで安定性評価</li>
          </ul>
        </div>
        
        <Button variant="warning" size="lg" on:click={() => started = true}>
          チャレンジ開始
        </Button>
      </Card>
    </div>
  {:else}
    <TrainingCore 
      mode="continuous"
      autoPlay={true}
      sessionCount={8}
      useLocalStorage={true}
      sessionKey="continuous-training-progress"
      microphoneRequired={true}
      audioManagerShared={true}
      on:allComplete={() => started = false}
    />
  {/if}
</PageLayout>
```

### Step 4: 12音階モードの実装

#### 4-1: 基音選択ページ
```svelte
<!-- /training/chromatic-setup/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  
  let selectedBaseNote = null;
  let selectedDirection = 'asc';
  
  const chromaticBaseNotes = [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
    'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'
  ];
  
  function startTraining() {
    goto(`/training/chromatic?base=${selectedBaseNote}&dir=${selectedDirection}`);
  }
</script>

<PageLayout>
  <div class="chromatic-setup">
    <h1>🎹 12音階モード - 設定</h1>
    
    <!-- 基音選択 -->
    <Card>
      <h2>基音選択</h2>
      <div class="base-note-grid">
        {#each chromaticBaseNotes as note}
          <Button
            variant={selectedBaseNote === note ? 'primary' : 'secondary'}
            on:click={() => selectedBaseNote = note}
          >
            {note}
          </Button>
        {/each}
      </div>
    </Card>
    
    <!-- 方向選択 -->
    <Card>
      <h2>演奏方向</h2>
      <div class="direction-selector">
        <Button
          variant={selectedDirection === 'asc' ? 'primary' : 'secondary'}
          on:click={() => selectedDirection = 'asc'}
        >
          上行（ド→シ）
        </Button>
        <Button
          variant={selectedDirection === 'desc' ? 'primary' : 'secondary'}
          on:click={() => selectedDirection = 'desc'}
        >
          下行（シ→ド）
        </Button>
      </div>
    </Card>
    
    <Button
      variant="primary"
      size="lg"
      disabled={!selectedBaseNote}
      on:click={startTraining}
    >
      トレーニング開始
    </Button>
  </div>
</PageLayout>
```

#### 4-2: 12音階トレーニングページ
```svelte
<!-- /training/chromatic/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import TrainingCore from '$lib/components/TrainingCore.svelte';
  
  $: baseNote = $page.url.searchParams.get('base') || 'C4';
  $: direction = $page.url.searchParams.get('dir') || 'asc';
</script>

<TrainingCore 
  mode="chromatic"
  autoPlay={false}
  sessionCount={1}
  {baseNote}
  {direction}
  useLocalStorage={false}
  microphoneRequired={true}
  audioManagerShared={true}
/>
```

### Step 5: テスト項目

#### 機能テスト
- [ ] ランダムモード：既存機能の維持
- [ ] 連続モード：8回自動実行
- [ ] 12音階モード：基音選択・方向切替
- [ ] ドレミガイドスタートバー：全モード動作
- [ ] 評価システム：8/12音階対応

#### デバイステスト
- [ ] PC Chrome：全モード動作確認
- [ ] iPhone Safari：音量調整・UI表示
- [ ] iPad：画面レイアウト・操作性

#### パフォーマンステスト
- [ ] 連続モード：メモリリーク確認
- [ ] 基音切替：音声読み込み遅延
- [ ] セッション遷移：状態管理正常性

---

## 📈 期待効果

### 開発効率
- **コード削減**: 約70%の重複コード除去
- **保守性向上**: バグ修正が全モードに反映
- **拡張性確保**: 新モード追加が容易

### ユーザー体験
- **一貫性維持**: UI/UXの統一感
- **段階的学習**: 初級→中級→上級の明確な進路
- **機能統合**: 全モードで同等の高機能体験

### 技術基盤
- **設計統一**: 将来の機能追加基盤
- **テスト効率**: 共通部分のテスト一元化
- **ドキュメント**: 設計思想の明文化

---

## 🔄 今後の拡張計画

### 追加モード候補
- **カスタムモード**: ユーザー定義の音階・基音
- **コードモード**: 和音の相対音感トレーニング
- **インターバルモード**: 音程間隔の特化練習

### 機能強化
- **AI分析**: 個人の苦手音程の自動検出
- **プログレッシブ**: 実力に応じた自動難易度調整
- **マルチプレイヤー**: 複数人での競争モード

---

*このドキュメントは実装前の設計書であり、実際の実装で詳細が変更される可能性があります。*
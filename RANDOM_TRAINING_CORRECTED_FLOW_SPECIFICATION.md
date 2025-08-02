# ランダム基音トレーニング機能 修正フロー仕様書

**作成日**: 2025-07-26  
**対象**: `/svelte-prototype/src/routes/training/random/+page.svelte`  
**目的**: 3回目以降のセッション失敗問題の根本解決  
**技術**: SvelteKit + Tone.js + PitchDetector

---

## 🚨 根本問題の分析

### **発生している問題**

#### 1. **PitchDetector未初期化エラー**
```
必要なコンポーネント: {
  analyser: false, 
  pitchDetector: false, 
  audioContext: false, 
  mediaStream: false
}
```

#### 2. **エラー発生パターン**
- **1-2回目**: 正常動作
- **3回目以降**: 初期化失敗により音程検出停止
- **再挑戦時**: PitchDetectorが破棄されたまま

#### 3. **根本原因**
1. **ライフサイクル管理不良**: `restartSession()`でstopDetection()後の再初期化なし
2. **状態同期問題**: Svelteリアクティブシステムとの連携不備
3. **メモリリーク**: AudioContextやMediaStreamの不適切な管理
4. **責任境界不明**: コンポーネント間の状態管理責任が曖昧

---

## 🎯 改訂版フロー設計

### **Phase 1: 初期化フロー（安全・確実）**

```typescript
// 1. マイク許可取得
async function requestMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneState = 'granted';
    mediaStream = stream;
    return stream;
  } catch (error) {
    microphoneState = 'denied';
    throw error;
  }
}

// 2. 音源初期化
async function initializeAudioEngine() {
  try {
    await initializeSampler();
    audioEngineState = 'ready';
  } catch (error) {
    audioEngineState = 'error';
    throw error;
  }
}

// 3. PitchDetector初期化（重要：順序保証）
async function initializePitchDetector() {
  if (!mediaStream) {
    throw new Error('MediaStream not available');
  }
  
  // コンポーネントの準備確認
  if (!pitchDetectorComponent) {
    await waitForComponent();
  }
  
  await pitchDetectorComponent.initialize(mediaStream);
  pitchDetectorState = 'ready';
}
```

### **Phase 2: セッション実行フロー（堅牢）**

```typescript
// 1. セッション開始
async function startTrainingSession() {
  // 前提条件チェック
  if (!canStartSession()) {
    throw new Error('Prerequisites not met');
  }
  
  trainingPhase = 'listening';
  await playBaseNote();
}

// 2. ガイドアニメーション開始
function startGuideAnimation() {
  trainingPhase = 'guiding';
  
  // 音程検出開始（重要：状態確認）
  if (pitchDetectorState === 'ready') {
    pitchDetectorComponent.startDetection();
  } else {
    throw new Error('PitchDetector not ready');
  }
  
  runGuideAnimation();
}

// 3. セッション完了
function completeSession() {
  // 検出停止
  if (pitchDetectorComponent) {
    pitchDetectorComponent.stopDetection();
  }
  
  trainingPhase = 'results';
  calculateFinalResults();
}
```

### **Phase 3: 再挑戦フロー（新設計）**

```typescript
// 重要：再挑戦時の適切なリセット
async function restartSession() {
  try {
    // 1. 現在のセッションを安全に停止
    if (pitchDetectorComponent) {
      pitchDetectorComponent.stopDetection();
    }
    
    // 2. 状態をリセット（データは保持）
    resetSessionState();
    
    // 3. コンポーネント状態確認・修復
    await ensureComponentsReady();
    
    // 4. 新セッション開始準備完了
    trainingPhase = 'setup';
    
    console.log('✅ 再挑戦準備完了');
  } catch (error) {
    console.error('再挑戦準備エラー:', error);
    await fullReinitialize();
  }
}

// コンポーネント状態確認・修復
async function ensureComponentsReady() {
  // マイク状態確認
  if (!mediaStream || mediaStream.getTracks().some(track => track.readyState !== 'live')) {
    mediaStream = await requestMicrophoneAccess();
  }
  
  // PitchDetector状態確認
  if (pitchDetectorState !== 'ready' || !pitchDetectorComponent.isInitialized()) {
    await initializePitchDetector();
  }
  
  // 音源状態確認
  if (!sampler || isLoading) {
    await initializeAudioEngine();
  }
}

// 完全再初期化（最終手段）
async function fullReinitialize() {
  // 全コンポーネントクリーンアップ
  cleanup();
  
  // 初期状態に戻す
  resetAllStates();
  
  // 再初期化実行
  await initializeAll();
}
```

### **Phase 4: エラー回復フロー（新設計）**

```typescript
// エラー種別と回復戦略
const errorRecoveryStrategies = {
  'microphone-lost': async () => {
    mediaStream = await requestMicrophoneAccess();
    await initializePitchDetector();
  },
  
  'pitchdetector-failed': async () => {
    await pitchDetectorComponent.cleanup();
    await initializePitchDetector();
  },
  
  'audio-context-suspended': async () => {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  },
  
  'sampler-error': async () => {
    sampler?.dispose();
    await initializeSampler();
  }
};

// 自動エラー回復
async function handleError(error, context) {
  console.error(`${context}エラー:`, error);
  
  const strategy = errorRecoveryStrategies[error.type];
  if (strategy) {
    try {
      await strategy();
      console.log('✅ エラー回復成功');
    } catch (recoveryError) {
      console.error('❌ エラー回復失敗:', recoveryError);
      await fullReinitialize();
    }
  }
}
```

---

## 🧩 コンポーネント責任分離

### **メインページ (`+page.svelte`)**

#### **責任範囲**
- セッション管理（開始/停止/再開始）
- 状態管理（training, microphone, audio engine）
- ライフサイクル制御（初期化/破棄/再初期化）
- エラーハンドリング（回復戦略実行）

#### **管理する状態**
```typescript
// セッション状態
let trainingPhase: 'setup' | 'listening' | 'waiting' | 'guiding' | 'results';
let sessionResults: SessionResults;
let scaleEvaluations: Evaluation[];
let previousEvaluations: Evaluation[]; // 再挑戦時表示用

// コンポーネント状態
let microphoneState: 'checking' | 'granted' | 'denied' | 'error';
let audioEngineState: 'initializing' | 'ready' | 'error';
let pitchDetectorState: 'initializing' | 'ready' | 'detecting' | 'error';

// リソース管理
let mediaStream: MediaStream | null;
let sampler: Tone.Sampler | null;
let pitchDetectorComponent: PitchDetector | null;
```

### **PitchDetectorコンポーネント (`PitchDetector.svelte`)**

#### **責任範囲**
- 音程検出のみ（単一責任）
- 内部状態管理（analyser, filters, detector）
- ライフサイクル管理（initialize/start/stop/cleanup）
- 検出データ配信（event dispatch）

#### **改訂版インターフェース**
```typescript
export interface PitchDetectorAPI {
  // 初期化
  initialize(stream: MediaStream): Promise<void>;
  
  // 検出制御
  startDetection(): void;
  stopDetection(): void;
  
  // 状態確認
  isInitialized(): boolean;
  getState(): PitchDetectorState;
  
  // クリーンアップ
  cleanup(): void;
  
  // エラー回復
  reinitialize(stream: MediaStream): Promise<void>;
}

// 状態通知
export interface PitchDetectorEvents {
  pitchUpdate: { frequency: number; note: string; volume: number; clarity: number };
  stateChange: { state: PitchDetectorState };
  error: { error: Error; context: string };
}
```

---

## 🔄 状態管理の再設計

### **状態同期戦略**

#### **Svelteリアクティブシステム活用**
```typescript
// 状態依存関係の明確化
$: canStartTraining = microphoneState === 'granted' && 
                     audioEngineState === 'ready' && 
                     pitchDetectorState === 'ready';

$: canRestartSession = trainingPhase === 'results' && 
                      !isRestarting;

// 状態変化の自動処理
$: if (trainingPhase === 'guiding' && pitchDetectorState === 'ready') {
  pitchDetectorComponent?.startDetection();
}

$: if (trainingPhase !== 'guiding') {
  pitchDetectorComponent?.stopDetection();
}
```

#### **状態変更の追跡**
```typescript
// 状態変更ログ
function logStateChange(component: string, oldState: string, newState: string) {
  console.log(`🔄 ${component}: ${oldState} → ${newState}`);
  
  // 問題のある状態遷移を検出
  if (isInvalidTransition(component, oldState, newState)) {
    console.warn(`⚠️ 不正な状態遷移: ${component} ${oldState} → ${newState}`);
  }
}

// 状態一貫性チェック
function validateSystemState() {
  const issues = [];
  
  if (trainingPhase === 'guiding' && pitchDetectorState !== 'detecting') {
    issues.push('Training in guiding phase but PitchDetector not detecting');
  }
  
  if (microphoneState === 'granted' && !mediaStream) {
    issues.push('Microphone granted but no MediaStream');
  }
  
  return issues;
}
```

### **エラー状態管理**

#### **エラー分類**
```typescript
type ErrorType = 
  | 'microphone-permission-denied'
  | 'microphone-stream-lost' 
  | 'pitchdetector-initialization-failed'
  | 'pitchdetector-detection-failed'
  | 'audio-context-suspended'
  | 'sampler-loading-failed'
  | 'unknown';

interface SystemError {
  type: ErrorType;
  message: string;
  context: string;
  timestamp: number;
  recoverable: boolean;
  recovered: boolean;
}
```

#### **エラー回復機能**
```typescript
let systemErrors: SystemError[] = [];
let isRecovering = false;

async function recordAndRecover(error: Error, context: string) {
  const systemError: SystemError = {
    type: classifyError(error),
    message: error.message,
    context,
    timestamp: Date.now(),
    recoverable: true,
    recovered: false
  };
  
  systemErrors.push(systemError);
  
  if (!isRecovering) {
    isRecovering = true;
    try {
      await handleError(systemError, context);
      systemError.recovered = true;
    } catch (recoveryError) {
      systemError.recoverable = false;
      console.error('回復不能エラー:', recoveryError);
    } finally {
      isRecovering = false;
    }
  }
}
```

---

## 📋 実装ガイドライン

### **1. 初期化順序の厳守**
```typescript
// 正しい初期化順序
async function initializeSystem() {
  // 1. マイク許可（最初に実行）
  const stream = await requestMicrophoneAccess();
  
  // 2. 音源初期化（並行実行可能）
  await initializeAudioEngine();
  
  // 3. PitchDetector初期化（MediaStream依存）
  await initializePitchDetector();
  
  console.log('✅ システム初期化完了');
}
```

### **2. ライフサイクルフックの適切な使用**
```typescript
onMount(async () => {
  try {
    await initializeSystem();
  } catch (error) {
    await recordAndRecover(error, 'system-initialization');
  }
});

onDestroy(() => {
  cleanup();
});

// 重要：beforeUpdateでの状態確認
beforeUpdate(() => {
  const issues = validateSystemState();
  if (issues.length > 0) {
    console.warn('状態一貫性問題:', issues);
  }
});
```

### **3. テスト可能な設計**
```typescript
// 依存注入による拡張性
interface AudioEngineProvider {
  createSampler(): Promise<Tone.Sampler>;
  createAudioContext(): AudioContext;
}

interface PitchDetectionProvider {
  createDetector(fftSize: number): PitchDetector;
  createAnalyser(context: AudioContext): AnalyserNode;
}

// モック可能なインターフェース
export function createTrainingSession(
  audioProvider: AudioEngineProvider,
  pitchProvider: PitchDetectionProvider
) {
  // テスト可能な実装
}
```

---

## ✅ 品質保証要件

### **必須テストケース**

#### **1. 連続セッションテスト**
```typescript
// 3回以上の連続実行
for (let i = 1; i <= 5; i++) {
  console.log(`セッション ${i} 開始`);
  await runTrainingSession();
  await restartSession();
  console.log(`セッション ${i} 完了`);
}
```

#### **2. エラー回復テスト**
```typescript
// マイク権限取り消しテスト
async function testMicrophoneRecovery() {
  await startSession();
  // マイク権限を手動で取り消し
  // → システムが自動回復することを確認
}

// PitchDetector破棄テスト
async function testPitchDetectorRecovery() {
  await startSession();
  pitchDetectorComponent.cleanup(); // 強制破棄
  await restartSession(); // 回復確認
}
```

#### **3. 状態一貫性テスト**
```typescript
// 各状態遷移での一貫性確認
function testStateConsistency() {
  const validTransitions = new Map([
    ['setup', ['listening']],
    ['listening', ['waiting']],
    ['waiting', ['guiding']],
    ['guiding', ['results']],
    ['results', ['setup']]
  ]);
  
  // 不正な状態遷移の検出テスト
}
```

### **パフォーマンス要件**
- **初期化時間**: 3秒以内
- **再挑戦準備時間**: 1秒以内  
- **エラー回復時間**: 5秒以内
- **メモリ使用量**: セッション間で増加なし

### **互換性要件**
- **iPhone Safari**: 完全対応
- **Chrome/Edge**: 完全対応
- **Firefox**: 完全対応
- **マイク再許可**: 自動対応

---

## 🔧 実装優先順位

### **Phase 1: 基盤修正（最優先）**
1. PitchDetectorコンポーネントの状態管理改善
2. メインページの再初期化フロー実装
3. エラーハンドリング機能追加

### **Phase 2: 安定化（高優先）**
1. 状態一貫性チェック機能
2. 自動エラー回復機能
3. 連続セッションテスト実装

### **Phase 3: 最適化（中優先）**
1. パフォーマンス最適化
2. ユーザビリティ向上
3. エラーメッセージ改善

---

## 📊 成功基準

### **修正完了の判定**
- [ ] 10回連続セッション実行でエラーなし
- [ ] 各種エラー状況での自動回復確認
- [ ] iPhone実機での安定動作確認
- [ ] メモリリークなし（5回セッション後）

### **品質基準**
- [ ] TypeScript型エラーなし
- [ ] ESLintエラーなし
- [ ] コンソールエラーなし
- [ ] 状態一貫性チェック通過

---

**この仕様書に基づき、根本的な問題を解決し、安定したランダム基音トレーニング機能を実現します。**
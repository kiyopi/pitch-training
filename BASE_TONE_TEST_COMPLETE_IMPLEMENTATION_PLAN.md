# 基音テスト統合システム完全実装計画書

**作成日**: 2025-08-04  
**バージョン**: v1.0.0-complete  
**対象**: VSCodeクラッシュ復旧後の完全実装  
**ステータス**: 実装準備完了  

---

## 🎯 実装概要

iPad/iPhone実機テストで発見された基音音量リセット問題を根本解決するため、マイクテスト + 基音テストの統合システムを段階的に実装。

### **解決する問題**
- マイクテスト→セッション移動時の基音音量リセット
- 設定永続化の欠如
- iOS特有の音量問題
- ユーザー体験の断絶

---

## 📋 フェーズ別実装計画

## **Phase 1: 基盤システム実装（高優先）**

### **Step 1-1: AudioManager拡張実装**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/lib/audio/AudioManager.js`

#### **追加機能**
```javascript
// AudioManager クラス拡張
class AudioManager {
  // 基音音量設定保存
  setBaseToneVolume(volume) {
    this.baseToneVolume = volume;
    const settings = this.getAudioSettings();
    settings.baseToneVolume = volume;
    settings.lastUpdated = Date.now();
    localStorage.setItem('pitch-training-audio-settings', JSON.stringify(settings));
    console.log(`✅ [AudioManager] 基音音量保存: ${volume}dB`);
  }
  
  // 基音音量設定取得
  getBaseToneVolume() {
    const settings = this.getAudioSettings();
    const defaultVolume = this.platformSpecs.isIOS ? 0 : -6;
    return settings.baseToneVolume !== undefined ? settings.baseToneVolume : defaultVolume;
  }
  
  // 音響設定全体取得
  getAudioSettings() {
    try {
      const stored = localStorage.getItem('pitch-training-audio-settings');
      return stored ? JSON.parse(stored) : this.createDefaultSettings();
    } catch (error) {
      console.warn('[AudioManager] 設定読み込みエラー:', error);
      return this.createDefaultSettings();
    }
  }
  
  // デフォルト設定作成
  createDefaultSettings() {
    return {
      baseToneVolume: this.platformSpecs.isIOS ? 0 : -6,
      micSensitivity: this.platformSpecs.gainCompensation,
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
  }
}
```

#### **期待効果**
- 基音音量設定の永続化
- デバイス別デフォルト値の自動適用
- 設定バージョン管理

#### **テスト項目**
- [ ] 設定保存機能のテスト
- [ ] 設定読み込み機能のテスト
- [ ] localStorage容量エラー対応テスト
- [ ] デフォルト値生成テスト

---

### **Step 1-2: localStorage永続化システム実装**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/lib/audio/AudioManager.js`（継続）

#### **詳細機能**
```javascript
// 設定検証・マイグレーション
validateSettings(settings) {
  const required = ['baseToneVolume', 'micSensitivity', 'lastUpdated'];
  return required.every(key => settings.hasOwnProperty(key));
}

// 設定マイグレーション
migrateSettings(oldSettings) {
  const migrated = { ...this.createDefaultSettings(), ...oldSettings };
  migrated.version = '1.0.0';
  return migrated;
}

// 設定バックアップ作成
createSettingsBackup() {
  const settings = this.getAudioSettings();
  const backup = {
    timestamp: new Date().toISOString(),
    settings: settings,
    userAgent: navigator.userAgent
  };
  localStorage.setItem('pitch-training-settings-backup', JSON.stringify(backup));
}

// エラー復旧機能
recoverFromError() {
  try {
    const backup = localStorage.getItem('pitch-training-settings-backup');
    if (backup) {
      const backupData = JSON.parse(backup);
      return backupData.settings;
    }
  } catch (error) {
    console.warn('[AudioManager] バックアップ復旧失敗:', error);
  }
  return this.createDefaultSettings();
}
```

#### **期待効果**
- 設定の安全な永続化
- データ破損時の自動復旧
- バージョン管理による将来の拡張性

#### **テスト項目**
- [ ] 設定バックアップ・復旧テスト
- [ ] データ破損時の動作テスト
- [ ] ストレージ容量上限時の動作テスト

---

## **Phase 2: UI統合実装（中優先）**

### **Step 2-1: マイクテストページ統合**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/routes/microphone-test/+page.svelte`

#### **基音テスト機能追加**
```javascript
// 基音テスト状態管理
let baseToneTestState = {
  completed: false,
  playing: false,
  userResponse: null,
  attempts: 0,
  maxAttempts: 3
};

// 基音テスト実行
async function runBaseToneTest() {
  baseToneTestState.playing = true;
  
  // C3基音再生（3秒）
  if (sampler) {
    sampler.volume.value = baseToneVolume;
    sampler.triggerAttackRelease('C3', '3n');
  }
  
  // 3秒後にユーザー発声促進
  setTimeout(() => {
    baseToneTestState.playing = false;
    promptUserResponse();
  }, 3000);
}

// ユーザー発声確認
function promptUserResponse() {
  // PitchDetectorでユーザー発声を監視
  const targetFreq = 130.81; // C3周波数
  const tolerance = 10; // ±10Hz
  
  const detectionInterval = setInterval(() => {
    if (currentFrequency && 
        Math.abs(currentFrequency - targetFreq) <= tolerance) {
      // 成功: 5回連続検出で完了
      consecutiveDetections++;
      if (consecutiveDetections >= 5) {
        baseToneTestState.completed = true;
        clearInterval(detectionInterval);
        checkAllTestsCompleted();
      }
    } else {
      consecutiveDetections = 0;
    }
  }, 100);
  
  // 10秒タイムアウト
  setTimeout(() => {
    clearInterval(detectionInterval);
    if (!baseToneTestState.completed) {
      baseToneTestState.attempts++;
      if (baseToneTestState.attempts < baseToneTestState.maxAttempts) {
        // 再試行
        runBaseToneTest();
      } else {
        // 環境要件表示
        showEnvironmentRequirements();
      }
    }
  }, 10000);
}
```

#### **期待効果**
- 基音聞き取り能力の事前確認
- 音量設定の妥当性検証
- 問題の早期発見・対処

#### **テスト項目**
- [ ] C3基音再生テスト
- [ ] ユーザー発声検出テスト
- [ ] タイムアウト処理テスト
- [ ] 再試行機能テスト

---

### **Step 2-2: テスト進捗UI実装**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/routes/microphone-test/+page.svelte`（継続）

#### **UI統合設計**
```svelte
<!-- テスト進捗表示 -->
<div class="test-progress">
  <div class="test-item" class:completed={micTestCompleted}>
    <Icon name="microphone" />
    <span>マイクテスト</span>
    {#if micTestCompleted}
      <Icon name="check-circle" class="success" />
    {/if}
  </div>
  
  <div class="test-item" class:completed={baseToneTestState.completed}>
    <Icon name="volume-2" />
    <span>基音テスト</span>
    {#if baseToneTestState.completed}
      <Icon name="check-circle" class="success" />
    {:else if baseToneTestState.playing}
      <Icon name="play-circle" class="playing" />
    {/if}
  </div>
</div>

<!-- 統合完了判定 -->
{#if micTestCompleted && baseToneTestState.completed}
  <button 
    class="start-training-btn active"
    on:click={startTraining}
  >
    🎵 トレーニング開始
  </button>
{:else}
  <button class="start-training-btn disabled" disabled>
    テスト完了後に開始できます
  </button>
{/if}

<!-- 基音テスト専用UI -->
{#if micTestCompleted && !baseToneTestState.completed}
  <div class="base-tone-test-section">
    <h3>🎹 基音テスト</h3>
    <p>基音が聞こえることを確認します</p>
    
    {#if !baseToneTestState.playing}
      <button on:click={runBaseToneTest}>
        基音を再生してテスト開始
      </button>
    {:else}
      <div class="listening-instruction">
        <p>🎵 基音（C3）が再生されています</p>
        <p>聞こえたら「ド」を発声してください</p>
        <div class="progress-ring">
          <!-- 3秒プログレス表示 -->
        </div>
      </div>
    {/if}
    
    {#if baseToneTestState.attempts > 0 && !baseToneTestState.completed}
      <div class="retry-section">
        <p>再試行 {baseToneTestState.attempts}/{baseToneTestState.maxAttempts}</p>
        {#if baseToneTestState.attempts >= baseToneTestState.maxAttempts}
          <button on:click={showEnvironmentRequirements}>
            環境設定を確認
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
```

#### **期待効果**
- 統合テストフローの可視化
- ユーザーの迷いを排除
- テスト完了状態の明確化

#### **テスト項目**
- [ ] プログレス表示の正確性テスト
- [ ] UI状態遷移テスト
- [ ] レスポンシブ対応テスト

---

## **Phase 3: セッション統合実装（中優先）**

### **Step 3-1: セッションページ統合**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/routes/training/random/+page.svelte`

#### **固定値削除・設定読み込み**
```javascript
// 固定値削除
// OLD: sampler.volume.value = -6; // 標準: -6dB

// NEW: AudioManager設定読み込み
onMount(async () => {
  // AudioManager初期化
  audioManager = new AudioManager();
  
  // 保存された基音音量を読み込み
  const savedVolume = audioManager.getBaseToneVolume();
  
  // Tone.js Sampler初期化
  sampler = new Tone.Sampler({
    urls: { "C4": "C4.mp3" },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    release: 1.5
  }).toDestination();
  
  // 保存された音量を適用
  sampler.volume.value = savedVolume;
  
  console.log(`✅ [RandomTraining] 基音音量復元: ${savedVolume}dB`);
  console.log(`📊 [RandomTraining] AudioManager設定:`, audioManager.getAudioSettings());
});
```

#### **期待効果**
- 設定の完全引き継ぎ
- ユーザー体験の継続性確保
- 固定値問題の根本解決

#### **テスト項目**
- [ ] 設定読み込み機能テスト
- [ ] 音量引き継ぎテスト
- [ ] デフォルト値フォールバックテスト

---

### **Step 3-2: エラー時マイクテスト誘導システム**

#### **実装箇所**
- ファイル: `/svelte-prototype/src/routes/training/random/+page.svelte`（継続）

#### **エラー検出・誘導システム**
```javascript
// 音響エラー検出
function detectAudioErrors() {
  const errors = [];
  
  // MediaStream異常検出
  if (!audioManager?.mediaStream || 
      audioManager.mediaStream.getAudioTracks().length === 0) {
    errors.push('microphone');
  }
  
  // 基音音量問題検出
  if (sampler && sampler.volume.value < -10) {
    errors.push('base_tone_volume');
  }
  
  // 音程検出異常
  if (consecutiveDetectionFailures > 10) {
    errors.push('pitch_detection');
  }
  
  if (errors.length > 0) {
    handleAudioErrors(errors);
  }
}

// エラー対応処理
function handleAudioErrors(errors) {
  // セッション一時停止
  pauseCurrentSession();
  
  // エラーダイアログ表示
  showErrorDialog({
    title: '音声に問題が発生しました',
    message: 'マイクテストページで設定を調整してください',
    details: generateErrorDetails(errors),
    actions: [
      { 
        label: '設定を調整', 
        action: () => {
          // 現在の進行状況を一時保存
          saveTemporaryProgress();
          // マイクテストページに誘導
          goto('/microphone-test?return=training');
        }
      },
      {
        label: 'このまま続行',
        action: () => resumeCurrentSession(),
        warning: true
      }
    ]
  });
}

// エラー詳細生成
function generateErrorDetails(errors) {
  const messages = {
    microphone: 'マイクロフォンに問題があります',
    base_tone_volume: '基音が聞こえにくい可能性があります',
    pitch_detection: '音程検出が不安定です'
  };
  
  return errors.map(error => messages[error]).join('\n');
}
```

#### **期待効果**
- 問題の早期発見・自動対処
- ユーザーの混乱を最小化
- 設定調整への自然な誘導

#### **テスト項目**
- [ ] エラー検出精度テスト
- [ ] 一時保存・復帰機能テスト
- [ ] ユーザー誘導フローテスト

---

## **Phase 4: 最適化・検証（低優先）**

### **Step 4-1: iOS特別対応実装**

#### **実装箇所**
- 各ページの初期化処理

#### **iOS最適化機能**
```javascript
// iOS特別対応
const iOSOptimizations = {
  // デフォルト値最適化
  getDefaultBaseToneVolume: () => {
    const platformSpecs = audioManager.getPlatformSpecs();
    return platformSpecs.isIOS ? 0 : -6; // iOS: 0dB, PC: -6dB
  },
  
  // 環境要件チェック
  checkEnvironmentRequirements: () => {
    if (!platformSpecs.isIOS) return { passed: true };
    
    const requirements = {
      silentMode: checkSilentModeStatus(),
      deviceVolume: getDeviceVolumeLevel(),
      wiredHeadphones: detectWiredHeadphones()
    };
    
    return {
      passed: requirements.silentMode && 
              requirements.deviceVolume >= 0.5 && 
              requirements.wiredHeadphones,
      details: requirements
    };
  },
  
  // 環境要件ガイダンス表示
  showEnvironmentGuidance: (requirements) => {
    const messages = [];
    
    if (!requirements.silentMode) {
      messages.push('📱 サイレントモードを解除してください');
    }
    if (requirements.deviceVolume < 0.5) {
      messages.push('🔊 デバイス音量を50%以上にしてください');
    }
    if (!requirements.wiredHeadphones) {
      messages.push('🎧 有線イヤホンの使用を推奨します');
    }
    
    showEnvironmentDialog({
      title: 'iOS環境の最適化',
      messages: messages,
      canSkip: true
    });
  }
};
```

#### **期待効果**
- iOS特有問題の事前回避
- 最適な使用環境の案内
- デバイス別ユーザビリティ向上

---

### **Step 4-2: 実機テスト・検証**

#### **テスト環境**
- **iPhone**: Safari、複数バージョン
- **iPad**: Safari、iPadOS 13以降
- **PC**: Chrome、Firefox、Safari、Edge

#### **検証項目**
```javascript
// テストケース定義
const validationTests = {
  // 設定永続化テスト
  persistenceTest: {
    steps: [
      'マイクテストページで音量調整',
      'トレーニングページに移動',
      '音量設定が引き継がれているか確認',
      'ページリロード後も設定維持確認'
    ],
    expected: '全ステップで設定が維持される'
  },
  
  // 基音テストフローテスト
  baseToneFlowTest: {
    steps: [
      'マイクテスト完了',
      '基音テスト開始',
      'C3基音再生確認',
      'ユーザー発声検出',
      'テスト完了判定'
    ],
    expected: '全ステップが正常に動作する'
  },
  
  // エラー復旧テスト
  errorRecoveryTest: {
    steps: [
      'トレーニング中に音響エラー発生',
      'エラーダイアログ表示確認',
      'マイクテストページ誘導',
      '設定調整後の復帰',
      'セッション継続確認'
    ],
    expected: 'エラーから正常復旧できる'
  }
};
```

#### **合格基準**
- [ ] 全デバイスで設定永続化が正常動作
- [ ] 基音テストフローが完全動作
- [ ] エラー時の復旧フローが正常動作
- [ ] ユーザビリティテストで90%以上の成功率

---

## 📊 実装スケジュール

### **Week 1: Phase 1実装**
- **Day 1-2**: AudioManager拡張実装
- **Day 3-4**: localStorage永続化システム実装
- **Day 5**: Phase 1テスト・デバッグ

### **Week 2: Phase 2実装**
- **Day 1-3**: マイクテストページ統合
- **Day 4-5**: テスト進捗UI実装

### **Week 3: Phase 3実装**
- **Day 1-2**: セッションページ統合
- **Day 3-4**: エラー時誘導システム実装
- **Day 5**: Phase 2-3 統合テスト

### **Week 4: Phase 4最適化**
- **Day 1-2**: iOS特別対応実装
- **Day 3-5**: 実機テスト・検証・調整

---

## 🎯 成功指標

### **技術指標**
- [ ] 基音音量設定の100%引き継ぎ成功
- [ ] localStorage永続化の確実動作
- [ ] 全テストケースの合格

### **ユーザー体験指標**
- [ ] マイクテスト→トレーニング移行時の音量問題ゼロ
- [ ] 設定調整に関するユーザー問い合わせの90%削減
- [ ] トレーニング開始までの迷いの排除

### **システム安定性指標**
- [ ] エラー発生時の自動復旧成功率95%以上
- [ ] 設定データの破損・消失ゼロ
- [ ] 全プラットフォームでの動作安定性確保

---

## 🚨 リスク管理

### **技術リスク**
- **localStorage容量制限**: 軽量化・バックアップ機能で対応
- **iOS制約**: 段階的フォールバック機能で対応
- **Tone.js互換性**: バージョン固定・テスト強化で対応

### **ユーザビリティリスク**
- **テストフロー複雑化**: シンプルUI・スキップ機能で対応
- **設定迷い**: デフォルト値最適化・ガイダンス強化で対応

### **スケジュールリスク**
- **実装遅延**: MVP機能優先・段階リリースで対応
- **テスト工数**: 自動テスト・早期実機検証で対応

---

**この実装計画により、VSCodeクラッシュで失われた詳細仕様書の内容を完全実装し、基音音量問題を根本解決できます。**

---

**作成者**: Claude Development Team  
**承認**: 実装準備完了  
**次回作業**: Phase 1 Step 1-1 AudioManager拡張実装から開始
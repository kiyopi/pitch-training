# TrainingCore.svelte 実装仕様書

## 📋 概要

### 目的
3つのトレーニングモード（ランダム・連続・12音階）の共通機能を統合し、ランダムモードの成功実装パターンを他モードでも再利用可能にする。

### 設計原則
- **成功パターン保護**: ランダムモードの動作を一切変更しない
- **デリケート実装の統合**: マイク・基音再生など失敗を重ねて完成した実装を安全に統合
- **SSR対応**: サーバーサイドレンダリング無効化処理の徹底

---

## 🏗️ アーキテクチャ設計

### 責務分離
| コンポーネント | 責務 |
|----------------|------|
| **TrainingCore** | 音感トレーニングの核心機能（音声・基音・評価・UI） |
| **RandomPage** | TrainingCore使用（将来移行予定） |
| **ContinuousPage** | TrainingCore使用 + 開始画面UI |
| **ChromaticPage** | TrainingCore使用 + 基音選択・方向選択UI |

### コンポーネント構成
```
TrainingCore.svelte（共通機能）
├── SSR無効化処理（onMount, typeof window/localStorage/navigator）
├── 音声システム（AudioManager, PitchDetector）
├── 基音再生（Tone.js + Salamander Grand Piano）
├── ガイドアニメーション（8音階/12音階対応）
├── 評価システム（EvaluationEngine）
└── セッション管理（localStorage + Svelte Store）
```

---

## 🎯 プロパティ仕様

### 必須プロパティ
```javascript
export let mode = 'random';                    // 'random' | 'continuous' | 'chromatic'
export let useLocalStorage = true;             // localStorage使用フラグ
```

### モード別プロパティ
```javascript
// 連続チャレンジモード用
export let autoPlay = false;                   // 自動再生モード
export let sessionCount = 8;                   // セッション数

// 12音階モード用  
export let baseNote = null;                    // 指定基音
export let direction = 'asc';                  // 'asc' | 'desc'
```

### コールバック関数
```javascript
export let onSessionComplete = null;           // セッション完了時
export let onAllComplete = null;               // 全完了時
export let onMicrophoneError = null;           // マイクエラー時
export let onStorageError = null;              // ストレージエラー時
```

---

## 🔧 成功実装パターン（ランダムモードから移植）

### 1. SSR無効化処理
```javascript
onMount(async () => {
  // localStorage安全アクセス
  const micTestCompleted = typeof localStorage !== 'undefined' ? 
    localStorage.getItem('mic-test-completed') : null;
  
  if (!micTestCompleted) {
    if (onMicrophoneError) onMicrophoneError('マイクテスト未完了');
    return;
  }
  
  // 順次初期化
  await initializeAudioSystem();
  await initializeBaseNotePlaying();
  initializeGuideSystem();
});
```

### 2. AudioManager統合（外部AudioContext方式）
```javascript
async function initializeAudioSystem() {
  try {
    // AudioManager からリソース取得
    const resources = await audioManager.initialize();
    audioContext = resources.audioContext;
    mediaStream = resources.mediaStream;
    sourceNode = resources.sourceNode;
    
    microphoneState = 'granted';
    
    // デバイス別感度調整
    const isIPad = /iPad/.test(navigator.userAgent);
    const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    
    if (isIPad || isIPadOS) {
      audioManager.setSensitivity(7.0);
    }
    
    // PitchDetector初期化（遅延実行）
    setTimeout(async () => {
      if (pitchDetectorComponent) {
        await audioManager.initialize(); // 再初期化
        await pitchDetectorComponent.initializeWithExternalAudioContext(
          audioContext, mediaStream, sourceNode
        );
      }
    }, 300);
    
  } catch (error) {
    if (onMicrophoneError) onMicrophoneError(error.message);
  }
}
```

### 3. 基音再生システム（Salamander Grand Piano）
```javascript
async function initializeBaseNotePlaying() {
  try {
    // window オブジェクト安全アクセス
    if (typeof window === 'undefined') return;
    
    isSamplerLoading = true;
    
    sampler = new Tone.Sampler({
      urls: { "C4": "C4.mp3" },
      baseUrl: `${base}/audio/piano/`,          // ローカル音源
      release: 1.5,
      volume: getVolumeForDevice(),             // デバイス別音量
      onload: () => {
        isSamplerLoading = false;
      },
      onerror: (error) => {
        console.error('❌ [TrainingCore] 音源読み込みエラー:', error);
        isSamplerLoading = false;
      }
    }).toDestination();
    
    await Tone.loaded();
    
  } catch (error) {
    console.error('❌ [TrainingCore] 基音再生初期化エラー:', error);
    isSamplerLoading = false;
  }
}

function getVolumeForDevice() {
  if (typeof navigator === 'undefined') return -6;
  
  const isIPhone = /iPhone/.test(navigator.userAgent);
  const isIPad = /iPad/.test(navigator.userAgent);
  const isIPadOS = /Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  const isIOS = isIPhone || isIPad || isIPadOS;
  
  return isIOS ? 35 : -6; // iOS: 高音量, PC: 標準音量
}
```

### 4. 基音選択ロジック（モード別）
```javascript
async function playBaseNote() {
  if (isPlaying || !sampler || isSamplerLoading) return;
  
  try {
    // Tone.js AudioContext安全開始
    if (typeof window !== 'undefined' && window.Tone) {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
    }
    
    isPlaying = true;
    
    // モード別基音選択
    let currentBaseNote;
    if (mode === 'chromatic' && baseNote) {
      currentBaseNote = baseNote; // 12音階モード：指定基音
    } else {
      // ランダム・連続モード：baseNotePollからランダム選択
      const randomIndex = Math.floor(Math.random() * baseNotePool.length);
      currentBaseNote = baseNotePool[randomIndex];
    }
    
    const volume = getVolumeForDevice();
    sampler.volume.value = volume;
    
    sampler.triggerAttackRelease(currentBaseNote, '2n');
    
    // ガイドアニメーション開始
    startGuideAnimation();
    
    setTimeout(() => {
      isPlaying = false;
    }, 3000);
    
  } catch (error) {
    console.error('❌ [TrainingCore] 基音再生エラー:', error);
    isPlaying = false;
  }
}
```

---

## 📊 モード別設定

### 基音プール設定
```javascript
$: baseNotePool = mode === 'continuous'
  ? ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] // 連続：聞きやすい音域
  : ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'Ab4', 'Bb3', 'B3']; // ランダム：標準
```

### 音階設定
```javascript
$: currentScale = mode === 'chromatic' 
  ? (direction === 'asc' 
      ? ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ']
      : ['シ', 'ラ#', 'ラ', 'ソ#', 'ソ', 'ファ#', 'ファ', 'ミ', 'レ#', 'レ', 'ド#', 'ド'])
  : ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）']; // 8音階
```

---

## 🚨 重要な制約・注意事項

### 1. 初期化順序の厳守
1. SSR無効化チェック（onMount内）
2. マイクテスト完了確認
3. localStorage初期化（useLocalStorage=true時）
4. AudioManager初期化
5. 基音再生システム初期化
6. ガイドシステム初期化

### 2. 必須SSR無効化ガード
- `typeof window !== 'undefined'` - Tone.js、DOM操作前
- `typeof localStorage !== 'undefined'` - localStorage操作前  
- `typeof navigator !== 'undefined'` - UserAgent判定前

### 3. デバイス別対応
- **iPad/iPadOS**: マイク感度7.0x、音量35dB
- **iPhone**: 音量35dB
- **PC**: 標準感度、音量-6dB

### 4. エラーハンドリング
- AudioManager初期化失敗 → onMicrophoneError
- 音源読み込み失敗 → console.error + 継続
- localStorage操作失敗 → onStorageError

---

## 🔄 移植作業計画

### Phase 1: 基盤統合
- [ ] SSR無効化処理の完全移植
- [ ] AudioManager統合（外部AudioContext方式）
- [ ] 基音再生システム統合（ローカル音源）

### Phase 2: デバイス対応
- [ ] デバイス別感度調整の移植
- [ ] デバイス別音量設定の移植  
- [ ] PitchDetector遅延初期化の移植

### Phase 3: 評価・UI統合
- [ ] ガイドアニメーションシステム統合
- [ ] 評価システム統合
- [ ] localStorage + Svelte Store統合

### Phase 4: テスト・検証
- [ ] 連続チャレンジモードでの動作確認
- [ ] 12音階モードでの動作確認
- [ ] ランダムモードとの互換性確認

---

## ✅ 成功基準

1. **連続チャレンジモードで正常なピアノ音再生**
2. **12音階モードで基音選択・方向選択が動作**
3. **全モードでスタイルシートが正常適用**
4. **ランダムモードの動作に影響なし**
5. **iPad/iPhone/PCでの動作確認**

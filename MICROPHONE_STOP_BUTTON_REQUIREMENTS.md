# マイクロフォン停止ボタン要件分析 v1.0

## 📋 現在の実装状況分析

### 既存モードの停止ボタン実装状況

#### **ランダム基音モード**
- **停止ボタン**: ❌ **未実装**
- **停止方法**: 自動停止のみ（1.7秒後）
- **問題**: ユーザーが意図的に停止できない

#### **連続チャレンジモード**
- **停止ボタン**: ✅ **実装済み**
- **停止方法**: 手動停止ボタンあり
- **機能**: 連続再生を任意のタイミングで停止可能

#### **12音階モード**
- **停止ボタン**: ✅ **実装済み**
- **停止方法**: 手動停止ボタンあり
- **機能**: 13音連続再生を任意のタイミングで停止可能

---

## 🚨 マイクロフォン実装での停止ボタン要件

### 1. 音声再生停止 vs マイクロフォン停止の違い

#### **音声再生停止**（現在の実装）
```typescript
// 現在の実装: 音声再生のみ停止
const handleStop = () => {
  setIsPlaying(false);
  isPlayingRef.current = false;
  // 音声再生チェーンの停止のみ
};
```

#### **マイクロフォン停止**（新規実装必要）
```typescript
// 新規実装: マイクロフォン録音停止
const handleMicrophoneStop = () => {
  // MediaStream停止
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  
  // AudioContext停止
  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }
  
  // 音程検出停止
  if (pitchDetectionRef.current) {
    cancelAnimationFrame(pitchDetectionRef.current);
    pitchDetectionRef.current = null;
  }
  
  setMicrophoneState(prev => ({
    ...prev,
    isRecording: false,
    isInitialized: false,
    audioLevel: 0,
  }));
};
```

### 2. 各モードでの停止ボタン統合要件

#### **ランダム基音モード**
```typescript
// 統合後の停止ボタン
const handleStop = () => {
  // 音声再生停止
  stopAudioPlayback();
  
  // マイクロフォン停止
  stopMicrophoneRecording();
  
  // 音程検出停止
  stopPitchDetection();
  
  // 状態リセット
  resetTrainingState();
};
```

#### **連続チャレンジモード**
```typescript
// 既存の停止ボタン拡張
const handleStop = () => {
  // 既存: 連続音声再生停止
  setIsPlaying(false);
  isPlayingRef.current = false;
  
  // 新規: マイクロフォン停止
  stopMicrophoneRecording();
  
  // 新規: 音程検出停止
  stopPitchDetection();
};
```

#### **12音階モード**
```typescript
// 既存の停止ボタン拡張
const handleStop = () => {
  // 既存: シーケンス再生停止
  setIsPlaying(false);
  isPlayingRef.current = false;
  
  // 新規: マイクロフォン停止
  stopMicrophoneRecording();
  
  // 新規: 音程検出停止
  stopPitchDetection();
};
```

---

## 🛠️ 段階的実装での停止ボタン考慮

### Step 1: 基本マイクロフォン許可・音声取得
```typescript
// 基本的な停止機能
interface BasicMicrophoneManager {
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;      // ← 停止ボタンで呼び出し
  microphoneState: MicrophoneState;
}
```

### Step 2: AudioContext・音声処理基盤
```typescript
// AudioContext停止機能追加
const stopRecording = () => {
  // MediaStream停止
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
  }
  
  // AudioContext停止
  if (audioContextRef.current) {
    audioContextRef.current.close();
  }
  
  // 状態リセット
  setMicrophoneState(prev => ({ ...prev, isRecording: false }));
};
```

### Step 3: 1段階ノイズフィルタリング
```typescript
// フィルター停止機能追加
const stopRecording = () => {
  // 既存の停止処理
  
  // フィルターノード停止
  if (filterRef.current) {
    filterRef.current.disconnect();
    filterRef.current = null;
  }
};
```

### Step 4: Pitchy音程検出統合
```typescript
// 音程検出停止機能追加
const stopRecording = () => {
  // 既存の停止処理
  
  // 音程検出停止
  if (pitchDetectionRef.current) {
    cancelAnimationFrame(pitchDetectionRef.current);
    pitchDetectionRef.current = null;
  }
  
  // 検出結果クリア
  setPitchData(null);
};
```

### Step 5: 完全統合・テスト
```typescript
// 各モードでの統合停止機能
const useIntegratedStop = () => {
  const { stopRecording } = useMicrophoneManager();
  const { stopAudioPlayback } = useAudioPlayback();
  
  const handleCompleteStop = () => {
    stopRecording();        // マイクロフォン停止
    stopAudioPlayback();    // 音声再生停止
    resetTrainingState();   // 状態リセット
  };
  
  return { handleCompleteStop };
};
```

---

## 🎯 各段階での停止ボタンテスト項目

### Step 1 テスト
- [ ] マイクロフォン許可取得後の停止
- [ ] MediaStream の確実な停止
- [ ] リソースリークの確認

### Step 2 テスト
- [ ] AudioContext の確実な停止
- [ ] 音声処理パイプラインの停止
- [ ] 停止後の再開機能

### Step 3 テスト
- [ ] フィルターノードの停止
- [ ] 音声処理チェーンの完全停止
- [ ] ノイズフィルタリング状態のリセット

### Step 4 テスト
- [ ] 音程検出の確実な停止
- [ ] requestAnimationFrame の停止
- [ ] 検出結果の適切なクリア

### Step 5 テスト
- [ ] 全モードでの統合停止機能
- [ ] 停止ボタンの即座応答性
- [ ] 停止後の状態一貫性

---

## 🚨 停止ボタン実装の重要な注意点

### 1. iPhone Safari での注意点
```typescript
// iPhone Safari でのリソース解放
const stopRecording = () => {
  try {
    // iOS では明示的な停止処理が重要
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;  // iOS で確実に停止
      });
    }
    
    if (audioContextRef.current) {
      // iOS では close() の完了を待つ
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
  } catch (error) {
    console.error('Stop recording failed:', error);
  }
};
```

### 2. 非同期処理での停止
```typescript
// 音程検出中の安全な停止
const stopPitchDetection = () => {
  if (pitchDetectionRef.current) {
    cancelAnimationFrame(pitchDetectionRef.current);
    pitchDetectionRef.current = null;
  }
  
  // 進行中の非同期処理の停止フラグ
  isStoppingRef.current = true;
  
  // 停止完了後にフラグリセット
  setTimeout(() => {
    isStoppingRef.current = false;
  }, 100);
};
```

### 3. エラー状態での停止
```typescript
// エラー発生時の緊急停止
const emergencyStop = () => {
  try {
    // 全リソースの強制停止
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (pitchDetectionRef.current) {
      cancelAnimationFrame(pitchDetectionRef.current);
    }
  } catch (error) {
    console.error('Emergency stop failed:', error);
  } finally {
    // 状態を強制的にリセット
    setMicrophoneState({
      isRecording: false,
      isInitialized: false,
      error: null,
      audioLevel: 0,
    });
  }
};
```

---

## 📋 実装チェックリスト

### 各段階での停止ボタン実装確認
- [ ] Step 1: 基本停止機能の実装
- [ ] Step 2: AudioContext停止機能の追加
- [ ] Step 3: フィルター停止機能の追加
- [ ] Step 4: 音程検出停止機能の追加
- [ ] Step 5: 各モードでの統合停止機能

### 停止ボタンUI実装
- [ ] 視覚的な停止ボタン追加
- [ ] 停止中の状態表示
- [ ] 停止完了の確認表示
- [ ] エラー時の停止機能

### テスト項目
- [ ] 各段階での停止機能テスト
- [ ] iPhone Safari での停止動作確認
- [ ] リソースリークの確認
- [ ] 停止後の再開機能確認

---

## 🎯 結論

### 現在の実装ギャップ
1. **ランダム基音モード**: 停止ボタン未実装
2. **全モード**: マイクロフォン停止機能未実装
3. **統合停止**: 音声再生とマイクロフォン録音の統合停止未実装

### 段階的実装での考慮事項
- ✅ 各Step で停止機能を段階的に実装
- ✅ 停止ボタンのテスト項目を各段階で確認
- ✅ iPhone Safari での停止動作を重点確認
- ✅ 最終的に各モードで統合停止機能を実装

**重要**: 停止ボタンは各段階で確実に実装し、特にiPhone Safariでのリソース解放を重点的にテストする必要があります。

---

**作成日**: 2025-07-18  
**作成者**: Claude Code Assistant  
**対象**: マイクロフォン実装での停止ボタン要件分析
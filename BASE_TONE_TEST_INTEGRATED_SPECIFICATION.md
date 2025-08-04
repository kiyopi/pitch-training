# 基音テスト統合システム仕様書（簡素化版）

## 1. 背景と問題

### iPad/iPhone実機テスト結果
- **重大問題**: マイクテスト→セッション移動時に基音レベルがリセット（わずかに聞こえるレベル）
- マイク設定は維持、基音音量のみリセット
- iPhone: 基音が初期から小さすぎ、音量スライダー効果なし

### 根本原因
```javascript
// マイクテストページ（設定保存されない）
let baseToneVolume = 0; // ローカル変数

// セッションページ（固定値使用）
sampler.volume.value = -6; // 設定引き継がれない
```

## 2. 解決策（簡素化実装）

### 2.1 基音テスト機能追加
**目的**: 音量設定の妥当性を事前確認、不完全な状態でのトレーニング開始を防止

**フロー**:
1. C3基音再生（3秒）
2. ユーザーがドを1回発声
3. 130.81Hz ±10Hzを5回連続検出で成功
4. 両テスト完了でトレーニング開始可能

**失敗時**: 環境要件表示（スキップ機能なし）

### 2.2 音声設定永続化
**AudioManager拡張**:
```javascript
class AudioManager {
  setBaseToneVolume(volume) {
    this.baseToneVolume = volume;
    localStorage.setItem('audio-settings', JSON.stringify({
      baseToneVolume: volume,
      micSensitivity: this.currentSensitivity,
      lastUpdated: Date.now()
    }));
  }
  
  getBaseToneVolume() {
    return this.baseToneVolume;
  }
}
```

### 2.3 セッション中問題対応（最小限）
**複雑な調整UIは実装せず**、問題発生時は：

1. **エラー検出**: MediaStream異常、音量問題等
2. **セッション一時停止**: 現在進行状況を保存
3. **マイクテストページ誘導**: 「設定を調整」ボタンで誘導
4. **復帰**: 調整後にセッション再開

```javascript
// セッション中のエラーハンドリング
function handleAudioError() {
  pauseSession();
  showErrorDialog({
    title: '音声に問題が発生しました',
    message: 'マイクテストページで設定を調整してください',
    actions: [
      { label: '設定を調整', action: () => goto('/microphone-test') }
    ]
  });
}
```

## 3. 実装対象

### Phase 1: AudioManager拡張
- `setBaseToneVolume()` / `getBaseToneVolume()` 追加
- localStorage永続化機能

### Phase 2: マイクテストページ
- 基音テスト機能追加
- テスト進捗UI
- 環境要件表示

### Phase 3: セッションページ
- 音量設定読み込み（固定値削除）
- エラー時のマイクテスト誘導

## 4. iOS特別対応

### デフォルト値調整
```javascript
const defaultVolume = platformSpecs.isIOS ? 0 : -6; // iOS: 0dB
```

### 環境要件（iOS特化）
- サイレントモード解除
- デバイス音量50%以上
- 有線イヤホン推奨

## 5. 期待効果

- ✅ 基音音量設定引き継ぎ問題解決
- ✅ iOS音量問題の根本改善
- ✅ 事前テストによる問題発生防止
- ✅ シンプルな実装による保守性確保

## 6. 実装ファイル

- `/src/lib/audio/AudioManager.js` - 基音音量管理追加
- `/src/routes/microphone-test/+page.svelte` - 基本テスト機能追加
- `/src/routes/training/random/+page.svelte` - 音量設定読み込み、エラー誘導
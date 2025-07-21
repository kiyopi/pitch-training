# 音量レベル問題調査記録

## 📋 調査概要

**調査日**: 2025-07-21  
**調査対象**: iPhone vs PC環境での音量検出レベル差異  
**問題の発端**: PCでノイズのみで「良好」判定、iPhoneで最大50%程度の音量制限

---

## 🔍 現象の詳細

### PC環境
- **問題**: ノイズレベルのみでトレーニングボタンがアクティブになる
- **音量レベル**: 高い（ノイズ > 10%閾値）
- **ノイズ特性**: 常時ノイズが存在、比較的高レベル

### iPhone環境  
- **問題**: 最大音量でも50%前後までしか上がらない
- **音量レベル**: 低い（実用的な発声でも低レベル）
- **ノイズ特性**: PCと同様のノイズを拾うが、全体レベルが低い

---

## 🔧 技術的根本原因

### 1. 音量計算ロジックの問題

**現在の実装** (`useMicrophoneManager.ts`):
```typescript
// 92行目: 基本音量計算
const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);

// 95行目: 固定除数によるスケーリング
const rawVolumePercent = Math.min(Math.max(calculatedVolume / 3.5 * 100, 0), 100);

// 98-99行目: 統一ノイズ閾値
const noiseThreshold = 10;
const volumePercent = rawVolumePercent > noiseThreshold ? rawVolumePercent : 0;
```

**問題点**:
- **固定除数 `/3.5`**: PC環境に最適化、iPhone環境では過度に抑制
- **統一ノイズ閾値 `10%`**: プラットフォーム特性を無視

### 2. プラットフォーム間のハードウェア差異

#### PC環境の特徴
- **マイク感度**: 高感度、環境ノイズを多く拾う
- **AGC処理**: ブラウザレベルでの処理が強い可能性
- **音声入力**: デスクトップマイクやヘッドセット

#### iPhone環境の特徴
- **マイク感度**: 相対的に低感度、ノイズ抑制処理
- **iOS制限**: Safari特有の音声処理制限
- **音声入力**: 内蔵マイク、距離や向きの影響

### 3. 参考実装との比較

**test/pitchy-clean/page.tsx**の実装:
```typescript
// 213行目: より緩い除数設定
const volumePercent = Math.min(Math.max(calculatedVolume / 12 * 100, 0), 100);
```

**除数の違いによる影響**:
- **useMicrophoneManager**: `/3.5` → より小さな音量値
- **pitchy-clean**: `/12` → より大きな音量値
- **結果**: iPhone環境での音量不足が顕著

---

## 💡 解決策の検討

### アプローチ1: プラットフォーム適応型除数
```typescript
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const divisor = isIOS ? 2.0 : 4.0;  // iPhone: 小さい除数、PC: 大きい除数
```

**メリット**: シンプル、効果的  
**デメリット**: User-Agent依存

### アプローチ2: 動的キャリブレーション
```typescript
// 初期数秒間でプラットフォーム特性を学習
const platformMultiplier = calibratePlatform();
```

**メリット**: より正確、汎用性高  
**デメリット**: 複雑、初期化時間必要

### アプローチ3: 相対ノイズ閾値
```typescript
// プラットフォーム別ノイズ閾値
const noiseThreshold = isIOS ? 8 : 15;
```

**メリット**: プラットフォーム特性考慮  
**デメリット**: 微調整が必要

---

## 🎯 推奨解決策

### 統合アプローチ: プラットフォーム適応 + 調整可能設計

```typescript
// プラットフォーム検出
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// 適応的パラメータ設定
const volumeConfig = {
  divisor: isIOS ? 2.0 : 4.0,
  noiseThreshold: isIOS ? 8 : 15,
  smoothingFactor: 0.2
};

// 音量計算
const rawVolumePercent = Math.min(Math.max(calculatedVolume / volumeConfig.divisor * 100, 0), 100);
const volumePercent = rawVolumePercent > volumeConfig.noiseThreshold ? rawVolumePercent : 0;
```

### 期待される効果
- **PC環境**: ノイズによる誤判定を15%閾値で排除
- **iPhone環境**: 除数2.0により実用的な音量レベルを達成
- **保守性**: パラメータ調整が容易

---

## 📊 実装検証ポイント

### テスト項目
1. **PC環境**: 無音時の誤判定排除
2. **iPhone環境**: 実用的音量レベルの達成
3. **両環境**: 実際の発声での適切な反応
4. **エッジケース**: 極端に静かな環境、騒音環境

### 成功指標
- **PC**: ノイズのみでは10%未満、発声時50%以上
- **iPhone**: 発声時60%以上の音量レベル達成
- **両環境**: 誤判定率5%以下

---

## 🔄 今後の改善方向

### 短期改善
- プラットフォーム適応型パラメータの導入
- 実環境でのパラメータ微調整

### 中期改善  
- 動的キャリブレーション機能
- 音量履歴による学習機能

### 長期改善
- より高度なノイズ特性分析
- 機械学習による自動最適化

---

**作成者**: Claude Code Assistant  
**更新日**: 2025-07-21  
**参照**: useMicrophoneManager.ts, test/pitchy-clean/page.tsx

この調査記録は、同様の問題が発生した際の参考資料として活用してください。
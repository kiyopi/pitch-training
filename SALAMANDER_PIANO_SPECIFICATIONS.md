# Salamander Grand Piano 音源仕様書 v1.0

## 🎹 基本仕様

### 楽器・録音環境
- **楽器**: Yamaha C5 Grand Piano
- **録音品質**: 48kHz/24bit
- **マイク**: AKG c414 x2（AB配置、弦上約12cm）
- **作成者**: Alexander Holm
- **ライセンス**: Creative Commons Attribution 3.0 (CC-by)

### サンプリング詳細
- **ベロシティレイヤー**: 16段階
- **サンプリング間隔**: 短3度（88鍵の1/3をサンプリング）
- **開始音**: 最低A音から
- **ハンマーノイズ**: クロマチック1レイヤー
- **弦共鳴**: 短3度間隔3レイヤー

---

## 🔍 C4.mp3 音源分析

### 基本情報
- **音程**: C4（Middle C、261.63Hz）
- **録音方式**: Yamaha C5の自然減衰まで録音
- **ベロシティ**: 中程度（推定レベル8/16）
- **用途**: Tone.js Samplerの基準音源

### 推定録音時間
- **実際の長さ**: 約4-6秒（自然減衰まで）
- **有効音量期間**: 約3-4秒
- **完全減衰**: 約5-8秒

### 音響特性
- **アタック**: 自然なピアノタッチ
- **サステイン**: Yamaha C5特有の豊かな響き
- **ディケイ**: 自然な音量減衰曲線
- **リリース**: 弦共鳴を含む自然減衰

---

## 🎵 Tone.js での使用仕様

### 現在の実装
```typescript
const sampler = new Tone.Sampler({
  urls: { "C4": "C4.mp3" },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  release: 1.5  // リリース時間調整
}).toDestination();
```

### 音源の特徴
- **ピッチシフト対応**: 他の音程への自動変換
- **高品質**: 48kHz/24bitの原音維持
- **ベロシティ**: triggerAttack第3引数で制御
- **持続時間**: 原音の自然減衰特性を保持

---

## 🚨 release パラメータの制限

### 重要な発見
**Salamander Grand Piano C4.mp3は事前録音済み音源のため、release パラメータの効果が限定的**

#### 理由
1. **事前録音**: 既に自然減衰が録音済み
2. **固定波形**: エンベロープ調整の制約
3. **音源特性**: ピアノの物理的減衰曲線

#### 実際の動作
- **release: 1.5**: 原音の減衰曲線に僅かな影響
- **効果**: 音源本来の4-6秒減衰が僅かに短縮
- **限界**: 劇的な変化は期待できない

---

## 💡 減衰時間制御の代替方法

### Method 1: 手動リリース制御（推奨）
```typescript
sampler.triggerAttack("C4", undefined, 0.6);
setTimeout(() => {
  sampler.triggerRelease("C4");
}, 2000); // 2秒で強制リリース
```

### Method 2: 音量フェード
```typescript
sampler.triggerAttack("C4", undefined, 0.6);
setTimeout(() => {
  sampler.volume.rampTo(-60, 0.5); // 0.5秒でフェードアウト
}, 1500);
```

### Method 3: triggerAttackRelease 使用
```typescript
sampler.triggerAttackRelease("C4", 2, undefined, 0.6); // 2秒で停止
```

---

## 📊 音源制約と推奨実装

### 現在の制約
- **固定減衰曲線**: 自然減衰が録音済み
- **release効果限定**: パラメータ調整の効果が薄い
- **ユーザビリティ**: 長すぎる減衰時間

### 推奨解決策
1. **手動リリース**: 2秒後にtriggerRelease
2. **代替音源**: より短い減衰の音源検討
3. **ユーザー設定**: 減衰時間の選択肢提供

---

## 🎯 実装改善提案

### 即座実装可能
```typescript
// Option A: 手動リリース（2秒）
sampler.triggerAttack("C4", undefined, 0.6);
setTimeout(() => sampler.triggerRelease("C4"), 2000);

// Option B: triggerAttackRelease（1.5秒）
sampler.triggerAttackRelease("C4", 1.5, undefined, 0.6);
```

### 将来的改善
- 複数減衰時間オプション（1秒、2秒、3秒、自然）
- 音源切り替え機能
- ユーザー設定保存

---

## ✅ 結論

**Salamander Grand Piano C4.mp3は高品質だが、事前録音済み音源のため減衰時間制御が困難。手動リリース制御での実装が最適解。**

---

**作成日**: 2025-07-18  
**調査者**: Technical Analysis Team  
**対象**: ランダム基音モード最適化
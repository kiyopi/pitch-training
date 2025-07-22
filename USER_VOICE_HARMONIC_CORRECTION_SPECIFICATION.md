# ユーザー音声倍音補正システム 詳細仕様書

**作成日**: 2025-07-21  
**対象**: `/src/app/test/separated-audio/page.tsx` 倍音補正システム実装  
**実装フェーズ**: Step B-2 - ユーザー音声倍音制御  
**技術基盤**: Next.js 15.4.1 + TypeScript + Pitchy + Web Audio API

---

## 🎯 **現状分析**

### **問題箇所**: `/src/app/test/separated-audio/page.tsx:302-306`
```typescript
// ❌ 現在の単純フィルター（問題のあるコード）
if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
  return Math.round(frequency * 10) / 10;  // 基本範囲フィルターのみ
}
```

### **問題点**:
- **オクターブ誤検出**: C3(130Hz) ↔ C4(261Hz) ↔ C5(523Hz) 不安定切り替え
- **倍音優先検出**: 基音より強い2倍音・3倍音を誤って基音として検出
- **安定性不足**: 基音優先ロジックが存在しない

---

## 🛠️ **倍音補正システム詳細仕様**

### **1. HarmonicCorrectionConfig インターフェース**
```typescript
interface HarmonicCorrectionConfig {
  fundamentalSearchRange: number;    // 基音探索範囲（±50Hz）
  harmonicRatios: number[];          // 倍音比率 [0.5, 2.0, 3.0, 4.0]
  confidenceThreshold: number;      // 確信度しきい値（0.8）
  stabilityBuffer: number[];        // 安定化バッファ（過去5フレーム）
  vocalRange: { min: number, max: number }; // 人間音域（130-1047Hz, C3-C6）
}

const DEFAULT_HARMONIC_CONFIG: HarmonicCorrectionConfig = {
  fundamentalSearchRange: 50,
  harmonicRatios: [0.5, 2.0, 3.0, 4.0],  // 1/2倍音, 2倍音, 3倍音, 4倍音
  confidenceThreshold: 0.8,
  stabilityBuffer: [],
  vocalRange: { min: 130.81, max: 1046.50 } // C3-C6
};
```

### **2. 動的オクターブ補正アルゴリズム**
```typescript
const correctHarmonicFrequency = (
  detectedFreq: number,
  previousFreq: number | null,
  config: HarmonicCorrectionConfig
): number => {
  // 🔍 基音候補生成（オクターブ違いを考慮）
  const fundamentalCandidates = [
    detectedFreq,                    // そのまま（基音の可能性）
    detectedFreq / 2.0,             // 1オクターブ下（2倍音 → 基音）
    detectedFreq / 3.0,             // 3倍音 → 基音
    detectedFreq / 4.0,             // 4倍音 → 基音
    detectedFreq * 2.0,             // 1オクターブ上（低く歌った場合）
  ];
  
  // 🎯 各候補の妥当性評価
  const evaluateFundamental = (freq: number) => {
    // 人間音域範囲内チェック（40%重み）
    const inVocalRange = freq >= config.vocalRange.min && freq <= config.vocalRange.max;
    const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
    
    // 前回検出との連続性評価（40%重み）
    const continuityScore = previousFreq 
      ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
      : 0.5;
    
    // 音楽的妥当性評価（20%重み）- ドレミファソラシド近似度
    const musicalScore = calculateMusicalScore(freq);
    
    const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
    return { freq, score: totalScore };
  };
  
  // ✨ 最高スコア候補を基音として採用
  const bestCandidate = fundamentalCandidates
    .map(evaluateFundamental)
    .reduce((best, current) => current.score > best.score ? current : best);
    
  return bestCandidate.freq;
};
```

### **3. 音楽的妥当性評価**
```typescript
const calculateMusicalScore = (frequency: number): number => {
  const C4 = 261.63; // Middle C
  
  // 最も近い半音階音名への距離を計算
  const semitonesFromC4 = Math.log2(frequency / C4) * 12;
  const nearestSemitone = Math.round(semitonesFromC4);
  const distanceFromSemitone = Math.abs(semitonesFromC4 - nearestSemitone);
  
  // 半音階に近いほど高スコア（±50セント以内で最高点）
  return Math.max(0, 1.0 - (distanceFromSemitone / 0.5));
};
```

### **4. 基音安定化システム**
```typescript
const stabilizeFrequency = (
  currentFreq: number,
  historyBuffer: number[],
  stabilityThreshold: number = 0.1
): number => {
  // 📊 履歴バッファに追加（最大5フレーム保持）
  historyBuffer.push(currentFreq);
  if (historyBuffer.length > 5) historyBuffer.shift();
  
  // 🎯 中央値ベースの安定化（外れ値除去）
  const sorted = [...historyBuffer].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 🔄 急激な変化を抑制（段階的変化）
  const maxChange = median * stabilityThreshold;
  const stabilized = Math.abs(currentFreq - median) > maxChange 
    ? median + Math.sign(currentFreq - median) * maxChange
    : currentFreq;
    
  return stabilized;
};
```

---

## 🚀 **実装フロー（7段階）**

### **Phase 1: 基盤準備**

#### **Step 1.1: インターフェース・設定定義**
- HarmonicCorrectionConfig 型定義追加
- DEFAULT_HARMONIC_CONFIG 定数追加
- 履歴バッファ state 追加

#### **Step 1.2: ヘルパー関数実装**
- calculateMusicalScore() 関数実装
- stabilizeFrequency() 関数実装

### **Phase 2: 核心システム実装**

#### **Step 2.1: correctHarmonicFrequency() 関数実装**
- 基音候補生成ロジック
- 評価システム統合
- 最適候補選択システム

#### **Step 2.2: detectFrequency() 関数改修**
- 現在の単純フィルター（302-306行）を完全置換
- correctHarmonicFrequency() 呼び出し統合
- stabilizeFrequency() 呼び出し統合

### **Phase 3: 統合・最適化**

#### **Step 3.1: state 管理統合**
- 履歴バッファ管理 useRef
- previousFreq 管理強化

#### **Step 3.2: iPhone 最適化**
- 処理負荷軽減（候補数制限）
- メモリ効率化（オブジェクト再利用）

### **Phase 4: テスト・検証**

#### **Step 4.1: GitHub Pages デプロイ・動作確認**
- ビルド確認・プッシュ
- iPhone 動作確認

---

## 📊 **期待される効果**

### **定量的改善目標**
- **検出精度向上**: 60-70% → 95%以上
- **オクターブ誤認解消**: ほぼ完全に除去
- **安定性向上**: 5フレーム連続安定検出
- **処理性能**: 100ms以内での補正処理

### **ユーザー体験改善**
- **正確な音程フィードバック**: 学習効果向上
- **システム信頼性**: 安定した基音検出による判定精度向上
- **リアルタイム性**: 低レイテンシーでの音程補正

---

## 🎯 **実装対象ファイル**

### **修正ファイル**: `/src/app/test/separated-audio/page.tsx`
### **修正箇所**: 302-306行の detectFrequency() 関数内
### **修正範囲**: 約100行の追加・置換

---

## 🔧 **技術的制約・注意事項**

### **パフォーマンス要件**
1. **リアルタイム性能**: 各フレーム（20-50ms）での高速処理が必須
2. **メモリ効率**: 候補配列の使い回し、不要なオブジェクト生成回避
3. **iPhone 最適化**: 処理負荷を考慮した軽量化実装

### **エラーハンドリング**
1. **候補0件対応**: 基音候補が見つからない場合のフォールバック処理
2. **デバッグ対応**: 補正前後の周波数ログ出力（開発時）
3. **境界値処理**: 音域外周波数の適切な処理

### **品質基準**
- **検出精度**: ±10セント以内（基音検出時）
- **安定性**: 5フレーム連続安定検出
- **レスポンス性**: 100ms以内での補正処理完了
- **環境対応**: iPhone・PC両環境での同等性能保証

---

**仕様書作成日**: 2025-07-21  
**作成者**: Claude Code Assistant  
**対象プロジェクト**: 相対音感トレーニングアプリ - ユーザー音声倍音補正システム

**重要**: この仕様に基づいて実装することで、ユーザーの歌唱音程検出精度が大幅に向上し、より正確な相対音感トレーニングが実現されます。
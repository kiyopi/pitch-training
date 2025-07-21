# 🔒 ロールバック用重要仕様書バックアップ

**作成日**: 2025-07-21  
**目的**: f22f445 (Step A完了) へのロールバック時の重要仕様書内容保護  
**ロールバック後の再適用対象**: ✅必須項目のみ

---

## 📋 バックアップ対象内容

### 1. COMPREHENSIVE_REQUIREMENTS_SPECIFICATION.md 追加分

#### 倍音補正システム要件詳細 [Step B-2実装対象]
**機能要件**:
- **問題解決**: C3↔C4↔C5オクターブ違い検出の不安定性解消
- **基音優先ロジック**: 倍音より基音を優先する検出アルゴリズム
- **候補生成システム**: オクターブ違い候補（0.5倍, 2倍, 3倍, 4倍音）の自動評価
- **音楽的妥当性評価**: ドレミファソラシド半音階近似度による候補選択
- **履歴バッファ安定化**: 過去5フレーム中央値による異常値除去
- **人間音域フィルタリング**: C3-C6範囲（130.81-1046.50Hz）内での検出

**性能要件**:
- **検出精度**: ±10セント以内（基音検出時）
- **安定性**: 5フレーム連続安定検出
- **レスポンス性**: 100ms以内での補正処理完了
- **環境対応**: iPhone・PC両環境での同等性能保証

**実装優先度**: Step B-2（フェーズ分離システム完了後）
**技術仕様**: STEP4_PITCHY_INTEGRATION_SPECIFICATION.md参照

---

### 2. STEP4_PITCHY_INTEGRATION_SPECIFICATION.md 追加分

#### 2.1 倍音補正システム詳細仕様 [Step B-2実装対象]

**🎵 倍音問題の現状分析**
```typescript
// 現在の問題（Step A段階）
// src/app/test/separated-audio/page.tsx:302-306
if (clarity > 0.15 && frequency > 80 && frequency < 1200) {
  return Math.round(frequency * 10) / 10;  // 基本範囲フィルターのみ
}

// 問題点:
// - オクターブ違い検出: C3(130Hz) ↔ C4(261Hz) ↔ C5(523Hz) 不安定切り替え
// - 倍音優先検出: 基音より強い倍音成分を誤検出
// - 安定性不足: 基音優先ロジック不在
```

**🛠️ 動的オクターブ補正アルゴリズム設計**
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

// 基音候補生成・評価システム
const correctHarmonicFrequency = (
  detectedFreq: number,
  previousFreq: number | null,
  config: HarmonicCorrectionConfig
): number => {
  // 1. 基音候補を生成（オクターブ違いを考慮）
  const fundamentalCandidates = [
    detectedFreq,                    // そのまま
    detectedFreq / 2.0,             // 1オクターブ下（2倍音の場合）
    detectedFreq / 3.0,             // 3倍音の基音
    detectedFreq / 4.0,             // 4倍音の基音
    detectedFreq * 2.0,             // 1オクターブ上（低く歌った場合）
  ];
  
  // 2. 各候補の妥当性を評価
  const evaluateFundamental = (freq: number) => {
    // 人間音域範囲内チェック
    const inVocalRange = freq >= config.vocalRange.min && freq <= config.vocalRange.max;
    const vocalRangeScore = inVocalRange ? 1.0 : 0.0;
    
    // 前回検出との連続性評価
    const continuityScore = previousFreq 
      ? 1.0 - Math.min(Math.abs(freq - previousFreq) / previousFreq, 1.0)
      : 0.5;
    
    // 基音らしさ評価（ドレミファソラシド近似度）
    const musicalScore = calculateMusicalScore(freq);
    
    const totalScore = (vocalRangeScore * 0.4) + (continuityScore * 0.4) + (musicalScore * 0.2);
    return { freq, score: totalScore };
  };
  
  // 3. 最高スコア候補を基音として採用
  const bestCandidate = fundamentalCandidates
    .map(evaluateFundamental)
    .reduce((best, current) => current.score > best.score ? current : best);
    
  return bestCandidate.freq;
};

// 音楽的妥当性評価（ドレミファソラシド近似度）
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

**📊 基音安定化システム**
```typescript
// 履歴バッファによる異常値除去・安定化
const stabilizeFrequency = (
  currentFreq: number,
  historyBuffer: number[],
  stabilityThreshold: number = 0.1
): number => {
  // 1. 履歴バッファに追加
  historyBuffer.push(currentFreq);
  if (historyBuffer.length > 5) historyBuffer.shift(); // 最大5フレーム保持
  
  // 2. 中央値ベースの安定化（外れ値除去）
  const sorted = [...historyBuffer].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 3. 急激な変化を抑制（段階的変化）
  const maxChange = median * stabilityThreshold;
  const stabilized = Math.abs(currentFreq - median) > maxChange 
    ? median + Math.sign(currentFreq - median) * maxChange
    : currentFreq;
    
  return stabilized;
};
```

**🎯 実装タイミング戦略**
- **Step B-1**: iPhone音量問題解決（フェーズ分離システム）
- **Step B-2**: 倍音補正システム統合 ← **本機能実装**
- **理由**: 安定したフェーズ分離基盤上で倍音補正を実装することで、問題の切り分けとデバッグが容易

**📋 品質基準**
- **検出精度**: ±10セント以内（基音検出）
- **安定性**: 5フレーム連続安定検出
- **レスポンス**: 100ms以内での補正処理
- **環境対応**: iPhone・PC両環境での同等性能

---

## ⚠️ 再適用時の注意事項

### ✅ 必須再適用項目
1. **COMPREHENSIVE_REQUIREMENTS_SPECIFICATION.md**: 倍音補正システム要件詳細を追加
2. **STEP4_PITCHY_INTEGRATION_SPECIFICATION.md**: 2.1章 倍音補正システム詳細仕様を追加

### ❌ 再適用不要項目  
1. **MICROPHONE_AVAILABILITY_CHECK_SPECIFICATION.md**: マイク不在機能は実装しないため不要
2. **WORK_LOG.md**: 作業ログは新規セッションで更新
3. **実装ファイル**: ロールバック後に新規実装するため不要

### 🎯 再適用の手順
1. ロールバック実行後、上記の仕様書内容を手動で再適用
2. 倍音補正機能の段階的実装開始
3. このバックアップファイルは作業完了後削除

---

**このファイルにより、ロールバック時の重要仕様書内容損失を防ぎ、安全なロールバックとその後の実装継続が可能になります。**
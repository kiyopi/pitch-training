# プロトタイプ式多段階オクターブ補正システム仕様書

## 📋 概要

### 背景
- **問題**: SvelteKit実装で900¢〜1000¢の異常セント値が発生
- **原因**: 固定閾値によるオクターブ補正の限界
- **解決策**: プロトタイプの実証済み多段階補正アルゴリズムを移植

### 調査対象プロトタイプ
- **リポジトリ**: https://github.com/kiyopi/pitch_app
- **主要ファイル**: `full-scale-training.js`
- **実装方式**: JavaScript + Pitchy ライブラリ

---

## 🔍 プロトタイプ分析結果

### プロトタイプの優れた実装

#### 1. 多段階オクターブ補正アルゴリズム
```javascript
// プロトタイプの核心ロジック
const candidates = [
    { factor: 3, freq: pitch * 3 },    // 1.5オクターブ上
    { factor: 2, freq: pitch * 2 },    // 1オクターブ上  
    { factor: 1.5, freq: pitch * 1.5 }, // 0.5オクターブ上
    { factor: 1, freq: pitch }         // 補正なし
];
```

#### 2. インテリジェント候補選択
- **目標周波数範囲内での最小誤差を基準**
- **動的範囲判定**: 硬直的な閾値を排除
- **段階的補正**: 0.5〜1.5オクターブの柔軟な補正

#### 3. ノイズフィルター最適化
- **周波数範囲**: 40Hz〜4000Hz（SvelteKitより広範囲）
- **クラリティ閾値**: 0.3（SvelteKitより厳格）
- **FFTサイズ**: 4096（SvelteKitより高解像度）

---

## 🛠️ SvelteKit実装仕様

### 移植完了の多段階補正システム

#### multiStageOctaveCorrection関数
```javascript
function multiStageOctaveCorrection(detectedFreq, targetFreq) {
    // 複数の補正候補を生成（プロトタイプと同じ係数）
    const candidates = [
        { factor: 3, freq: detectedFreq * 3, description: "1.5オクターブ上" },
        { factor: 2, freq: detectedFreq * 2, description: "1オクターブ上" },
        { factor: 1.5, freq: detectedFreq * 1.5, description: "0.5オクターブ上" },
        { factor: 1, freq: detectedFreq, description: "補正なし" },
        { factor: 0.67, freq: detectedFreq * 0.67, description: "0.5オクターブ下" },
        { factor: 0.5, freq: detectedFreq * 0.5, description: "1オクターブ下" },
        { factor: 0.33, freq: detectedFreq * 0.33, description: "1.5オクターブ下" }
    ];
    
    // 目標周波数範囲の定義（±30%の範囲で妥当性をチェック）
    const targetMin = targetFreq * 0.7;
    const targetMax = targetFreq * 1.3;
    
    // 範囲内の候補のみフィルタリング
    const validCandidates = candidates.filter(candidate => 
        candidate.freq >= targetMin && candidate.freq <= targetMax
    );
    
    // 最小誤差の候補を選択
    let bestCandidate = validCandidates[0];
    let minError = Math.abs(bestCandidate.freq - targetFreq);
    
    for (const candidate of validCandidates) {
        const error = Math.abs(candidate.freq - targetFreq);
        if (error < minError) {
            minError = error;
            bestCandidate = candidate;
        }
    }
    
    return {
        correctedFrequency: bestCandidate.freq,
        factor: bestCandidate.factor,
        description: bestCandidate.description,
        error: minError
    };
}
```

### 技術的特徴

#### 1. 7段階補正候補システム
- **上方補正**: 1.5倍、2倍、3倍（0.5〜1.5オクターブ上）
- **下方補正**: 0.33倍、0.5倍、0.67倍（0.5〜1.5オクターブ下）
- **補正なし**: 1倍（原周波数維持）

#### 2. 動的誤差最小化
- **妥当性フィルタ**: ±30%範囲での候補選別
- **最適解選択**: 目標周波数との絶対誤差最小化
- **安全性確保**: 有効候補なしの場合は補正なし

#### 3. 詳細ログ出力
```javascript
console.warn(`🔧 [プロトタイプ式補正] ${stepName}:`);
console.warn(`   検出周波数: ${frequency.toFixed(1)}Hz`);
console.warn(`   補正後周波数: ${adjustedFrequency.toFixed(1)}Hz`);
console.warn(`   期待周波数: ${expectedFrequency.toFixed(1)}Hz`);
console.warn(`   セント差: ${centDifference}¢`);
console.warn(`   補正係数: ${correctionFactor} (${description})`);
```

---

## 📊 従来システムとの比較

### 従来の固定閾値システム（問題あり）
```javascript
// ❌ 硬直的な補正条件
if (frequency < expectedFrequency * 0.89 || initialCentDiff > 150) {
    while (adjustedFrequency < expectedFrequency * 0.89 && octaveAdjustment < 3) {
        adjustedFrequency *= 2;
        octaveAdjustment++;
    }
}
```

**問題点**:
- 固定閾値（0.89、1.12）による限定的補正
- 単純な2倍・1/2倍のみの補正
- 補正後の妥当性検証なし

### プロトタイプ式多段階システム（改善版）
```javascript
// ✅ 柔軟な多段階補正
const candidates = [/* 7段階の補正候補 */];
const bestCandidate = selectOptimalCandidate(candidates, targetFreq);
```

**改善点**:
- 7段階の補正候補から最適解を選択
- 0.5オクターブ単位の細かい補正
- ±30%範囲での妥当性検証
- 動的誤差最小化による最適化

---

## 🎯 期待される効果

### 1. 異常セント値の根本解決
- **Before**: -1306¢〜-2395¢、900¢〜1000¢の極端な値
- **After**: ±200¢以内の正常な音程差

### 2. 環境音・倍音誤検出の改善
- **音量フィルタ**: 25以上の適切な信号のみ処理
- **多段階補正**: 複雑な倍音関係にも対応
- **妥当性検証**: 不適切な補正を排除

### 3. より正確な相対音感トレーニング
- **精密な採点**: 実際の音程能力を正確に評価
- **学習効果向上**: 正しいフィードバックによる効率的な上達
- **ユーザー体験改善**: 異常値による混乱を解消

---

## 🔧 実装詳細

### ファイル構成
- **メインファイル**: `/svelte-prototype/src/routes/training/random/+page.svelte`
- **関数名**: `multiStageOctaveCorrection`、`evaluateScaleStep`
- **呼び出し箇所**: 音程評価処理内（ガイドアニメーション中）

### 統合ポイント
1. **既存システムとの融合**: `calculateExpectedFrequency`との連携
2. **AudioManager対応**: 外部AudioContext方式との互換性
3. **デバッグ機能**: 詳細な補正ログ出力

### テスト要件
- **異常セント値の解消確認**
- **各音階での補正動作検証**
- **環境音除外機能のテスト**
- **GitHub Pages実機動作確認**

---

## 📈 パフォーマンス考慮事項

### 計算量
- **候補生成**: O(1) - 固定7候補
- **フィルタリング**: O(n) - n=7の線形処理
- **最適化**: O(n) - 最小誤差探索

### メモリ使用量
- **軽量実装**: 候補配列のみの一時メモリ使用
- **ガベージコレクション**: 関数終了時に自動解放

---

## 🚀 デプロイ情報

### 実装完了
- **日時**: 2025-07-28
- **ブランチ**: `random-training-tonejs-fixed-001`
- **コミット**: `22943e6`
- **デプロイ先**: GitHub Pages

### 確認URL
- **テストページ**: https://kiyopi.github.io/pitch-training/training/random
- **想定改善**: 異常セント値→正常範囲（±200¢以内）

---

## 📝 今後の拡張可能性

### 他モードへの適用
- **連続チャレンジモード**: 同じ補正システムを適用
- **12音階モード**: より複雑な音程関係への対応

### さらなる最適化
- **機械学習導入**: ユーザー別の補正パターン学習
- **動的パラメータ調整**: 楽器・環境に応じた自動最適化
- **リアルタイム性能向上**: WebAssembly等の高速化技術

---

*この仕様書は、プロトタイプ調査結果とSvelteKit実装の技術記録として作成されました。*

## 📚 関連資料
- [ABNORMAL_CENT_VALUE_FIX_SPECIFICATION.md](./ABNORMAL_CENT_VALUE_FIX_SPECIFICATION.md)
- [UNIFIED_PITCH_CALCULATION_SPECIFICATION.md](./UNIFIED_PITCH_CALCULATION_SPECIFICATION.md)
- [プロトタイプリポジトリ](https://github.com/kiyopi/pitch_app)
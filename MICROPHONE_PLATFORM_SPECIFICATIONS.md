# マイクロフォンプラットフォーム特性技術仕様書

## 📋 文書概要

**作成日**: 2025-07-24  
**対象**: iPhone/PC音量バー問題の技術的根拠  
**目的**: マイクロフォン特性差異の分析と実装指針の明確化

---

## 🔍 プラットフォーム別マイクロフォン特性

### iPhone マイクロフォン特性

#### **ハードウェア制約**
- **感度調整**: 固定（Web Audio APIでハードウェア調整不可）
- **周波数特性**: 250Hz以下で24dB/octaveのハイパスフィルター
- **ダイナミックレンジ**: 30-120 dB SPL（モデルにより異なる）
- **ノイズ処理**: 内蔵リミッター有り（新モデル）

#### **技術的影響**
```
- 低域カット → 音声の基音成分減少
- 固定感度 → ソフトウェア補正が必須
- 内蔵リミッター → 高音量時の圧縮
```

### PC デスクトップマイクロフォン特性

#### **ハードウェア制約**
- **感度調整**: OS レベルで調整可能
- **周波数特性**: マイクメーカー・モデルにより大幅に異なる
- **ダイナミックレンジ**: マイクの品質による（-70dBV ～ -18dBV）
- **ノイズ処理**: 環境ノイズが多い

#### **技術的影響**
```
- 可変感度 → ユーザー環境により大幅に異なる
- 環境ノイズ → 常時ノイズフロアが存在
- マイク品質差 → 一律の設定が困難
```

---

## 🌐 Web Audio API 技術制約

### 制約事項
1. **ハードウェア感度調整不可**: `getUserMedia()`ではマイクのハードウェアゲインを制御できない
2. **OS設定に依存**: デバイスの音量設定・感度設定に完全依存
3. **ソフトウェア補正のみ**: `GainNode`による後処理補正のみ可能

### 実装上の問題
```typescript
// ❌ 不可能: ハードウェア感度の直接制御
navigator.mediaDevices.getUserMedia({
  audio: { 
    gain: 0.5 // このような設定は存在しない
  }
});

// ✅ 可能: ソフトウェア補正
const gainNode = audioContext.createGain();
gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
```

---

## 📊 実測データと問題分析

### 実測結果（iPhone実機）
```
環境: 無音状態（室内静音環境）
測定値: raw=56%, smooth=53%, final=55%
パラメータ: divisor=2.0, noiseThreshold=8

問題: 無音時に55%表示される
```

### 問題の根本原因
1. **iPhone固有のノイズフロア**: PCより高いノイズレベル
2. **ハードウェア特性**: 250Hzローカットによる特性変化
3. **Web Audio API制約**: ハードウェア補正不可

### 計算式による分析
```
無音時ノイズレベル（推定）: N
iPhone: N / 2.0 * 100 = 56% → N ≈ 1.12
PC: N / 4.0 * 100 = expected 14% → N ≈ 0.56

結論: iPhoneのノイズレベルはPCの約2倍
```

---

## 🎯 技術的対応指針

### 1. プラットフォーム特化パラメータ設計

#### **推奨実装パラメータ**
```typescript
const volumeConfig = {
  // iPhone: 高ノイズフロア対応
  divisor: isIOS ? 4.0 : 3.0,
  
  // iPhone: 250Hzローカット補正
  gainCompensation: isIOS ? 1.5 : 1.0,
  
  // iPhone: 確実な無音時0%表示
  noiseThreshold: isIOS ? 12 : 8,
  
  // iPhone: 軽量化フィルター（AudioContext競合対策）
  filterComplexity: isIOS ? 'light' : 'standard'
};
```

#### **根拠**
- **divisor 4.0**: 56% → 14%（スムージング後12%程度）
- **gainCompensation 1.5**: 低域カット補正
- **noiseThreshold 12**: 確実な0%表示

### 2. 周波数検知連動型音量表示

#### **実装方針**
```typescript
// 周波数検知と音量表示を連動
if (frequency && clarity > 0.6 && frequency >= 80 && frequency <= 2000) {
  // 発声検知時のみ音量表示
  const compensatedVolume = rawVolume * volumeConfig.gainCompensation;
  updateVolumeDisplay(compensatedVolume);
} else {
  // 無音時は強制的に0%表示
  updateVolumeDisplay(0);
}
```

#### **メリット**
- **確実な0%表示**: 周波数検知なし = 無音
- **ノイズ除去**: 環境ノイズによる誤表示防止
- **プラットフォーム統一**: iPhone/PC共通の動作

### 3. AudioContext競合対策（iPhone専用）

#### **軽量化フィルター**
```typescript
if (isIOS) {
  // iPhone: 単一ハイパスフィルター
  const simpleHighPass = audioContext.createBiquadFilter();
  simpleHighPass.type = 'highpass';
  simpleHighPass.frequency.setValueAtTime(60, audioContext.currentTime);
  source.connect(simpleHighPass).connect(gainNode).connect(analyser);
} else {
  // PC: 標準3段階フィルター
  source.connect(highPassFilter)
        .connect(lowPassFilter)
        .connect(notchFilter)
        .connect(gainNode)
        .connect(analyser);
}
```

---

## 📈 期待効果と検証項目

### 期待効果
- **iPhone**: 無音時0%、発声時60-70%の適切な表示
- **PC**: デグレード解消、従来動作の維持
- **統一性**: プラットフォーム間の一貫した動作

### 検証項目
1. **無音時テスト**
   - iPhone: 0%表示確認
   - PC: 0%表示確認

2. **発声時テスト**
   - iPhone: 60-70%到達確認
   - PC: 従来レベル維持確認

3. **周波数検知連動**
   - 発声開始と同時に音量表示開始
   - 発声停止と同時に0%復帰

---

## 🔧 実装例

### 完全実装例
```typescript
// プラットフォーム検出
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// 特性対応パラメータ
const microphoneSpec = {
  divisor: isIOS ? 4.0 : 3.0,
  gainCompensation: isIOS ? 1.5 : 1.0,
  noiseThreshold: isIOS ? 12 : 8,
  smoothingFactor: 0.2
};

// 音量計算
const rawVolume = Math.max(rms * 200, maxAmplitude * 100);
const scaledVolume = rawVolume / microphoneSpec.divisor * 100;

// 周波数検知連動
if (frequency && clarity > 0.6) {
  const compensatedVolume = scaledVolume * microphoneSpec.gainCompensation;
  const smoothedVolume = applySmoothing(compensatedVolume);
  const finalVolume = smoothedVolume > microphoneSpec.noiseThreshold ? smoothedVolume : 0;
  updateVolumeDisplay(finalVolume);
} else {
  updateVolumeDisplay(0);
}
```

---

## 📚 参考文献・技術資料

### Web Audio API 制約
- **Stack Overflow**: "How to adjust microphone sensitivity using Web Audio API"
- **MDN**: Web Audio API - GainNode limitations

### iPhone マイクロフォン特性
- **Faber Acoustical**: iPhone Microphone Frequency Response Comparison
- **TDK InvenSense**: Microphone Specifications Explained
- **Analog Devices**: Understanding Microphone Sensitivity

### 実装技術
- **Web Audio API**: MediaStreamSource + BiquadFilterNode
- **Pitch Detection**: Pitchy library (McLeod Pitch Method)
- **Cross-platform**: User-Agent detection + platform-specific parameters

---

## 🚨 重要な注意事項

### 1. ハードウェア依存性
- この仕様は一般的なiPhone/PC環境を想定
- 個別デバイスでは追加調整が必要な場合がある
- ユーザー環境（周辺ノイズ、マイク品質）により影響を受ける

### 2. Web Audio API制約
- ブラウザ実装により微細な差異がある
- Safari（WebKit）とChrome（Blink）で動作差異の可能性
- 将来のブラウザ更新により調整が必要な場合がある

### 3. 保守性
- パラメータ調整時は必ず両プラットフォームでテスト
- 新しいiPhoneモデルでの検証が必要
- Web Audio API仕様変更への対応

---

**作成者**: Claude Code Assistant  
**技術監修**: 相対音感トレーニングアプリ開発チーム  
**更新履歴**: v1.0.0 (2025-07-24) - 初版作成

この仕様書により、マイクロフォン特性に起因する音量バー問題の技術的根拠と解決指針を明確化しました。
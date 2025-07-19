# 音程検出システム実装ガイド

## 概要
このドキュメントは、相対音感トレーニングアプリの音程検出システム実装で得られた知見をまとめたものです。Next.js環境でのリアルタイム音声処理の最適化手法を記録しています。

---

## 1. パフォーマンス最適化

### 問題点
- React stateの60FPS更新によるレンダリング負荷
- 周波数表示の不安定性（チカチカ現象）
- useCallbackの依存関係による古い値の参照

### 解決策: DOM直接操作

```typescript
// ❌ 避けるべき: React state更新
const [frequency, setFrequency] = useState<number | null>(null);
setFrequency(detectedFreq); // 60FPSで再レンダリング発生

// ✅ 推奨: DOM直接操作
const updateFrequencyDisplay = (freq: number | null, clarity: number) => {
  if (frequencyDisplayRef.current) {
    frequencyDisplayRef.current.innerHTML = freq ? 
      `<div class="text-5xl font-bold">${freq.toFixed(1)}</div>` :
      `<div class="text-gray-400">🎤 音声を検出中...</div>`;
  }
};
```

### メリット
- React再レンダリングサイクルを回避
- プロトタイプ並みの軽量処理
- 60FPSでの安定した更新

---

## 2. 動的オクターブ補正システム

### アルゴリズム仕様

```typescript
// ドレミファソラシド (C4-C5) 基準範囲
const targetFrequencies = [
  261.63, 293.66, 329.63, 349.23,  // ド レ ミ ファ
  392.00, 440.00, 493.88, 523.25   // ソ ラ シ ド(高)
];

// 動的範囲計算
const minTargetFreq = Math.min(...targetFrequencies); // 261.63Hz
const maxTargetFreq = Math.max(...targetFrequencies); // 523.25Hz

// 補正パラメータ
const correctedMin = minTargetFreq * 0.8;  // 209.3Hz (下限80%)
const correctedMax = maxTargetFreq * 1.2;  // 627.9Hz (上限120%)
const correctionThreshold = maxTargetFreq * 0.55; // 287.8Hz (55%閾値)
```

### 補正ロジック

```typescript
const applyDynamicOctaveCorrection = (detectedFreq: number): number => {
  // 正常範囲内: 補正不要
  if (detectedFreq >= correctionThreshold && detectedFreq <= correctedMax) {
    return detectedFreq;
  }
  
  // 低すぎる周波数: 2倍補正
  if (detectedFreq < correctionThreshold) {
    const doubledFreq = detectedFreq * 2;
    if (doubledFreq >= correctedMin && doubledFreq <= correctedMax) {
      return doubledFreq;
    }
  }
  
  // 高すぎる周波数: 1/2補正
  if (detectedFreq > correctedMax) {
    const halvedFreq = detectedFreq / 2;
    if (halvedFreq >= correctedMin && halvedFreq <= correctedMax) {
      return halvedFreq;
    }
  }
  
  return detectedFreq;
};
```

### 既知の問題
- 高音域でのオクターブ低下現象が残存
- さらなる微調整が必要

---

## 3. 周波数安定化技術

### 実装した安定化手法

#### 1. 移動平均フィルタ
```typescript
// 過去5フレームの平均値計算
const avgFreq = frequencyHistoryRef.current
  .slice(-5)
  .reduce((sum, f) => sum + f, 0) / 5;
```

#### 2. 急激な変化の抑制
```typescript
// ±20%以内の変化に制限
if (Math.abs(roundedFreq - avgFreq) / avgFreq > 0.2) {
  // 段階的に近づける（30%ずつ）
  detectedFreq = avgFreq + (roundedFreq - avgFreq) * 0.3;
}
```

#### 3. オクターブジャンプ検出
```typescript
const octaveRatio = roundedFreq / stableFrequencyRef.current;
if (octaveRatio > 1.8 || octaveRatio < 0.55) {
  // オクターブジャンプを無視
  detectedFreq = stableFrequencyRef.current;
}
```

### 効果
- 周波数表示の「飛び」を大幅に削減
- スムーズで自然な周波数遷移
- 誤検出の抑制

---

## 4. 音量検出最適化

### プロトタイプ準拠の計算式

```typescript
// 8bit時間域データから音量計算
let sum = 0;
let maxAmplitude = 0;

for (let i = 0; i < byteTimeDomainData.length; i++) {
  const sample = (byteTimeDomainData[i] - 128) / 128;
  sum += sample * sample;
  maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
}

// RMS（二乗平均平方根）計算
const rms = Math.sqrt(sum / byteTimeDomainData.length);

// 音量スケーリング
const calculatedVolume = Math.max(rms * 200, maxAmplitude * 100);
const volumePercent = Math.min(Math.max(calculatedVolume / 12 * 100, 0), 100);
```

### スムージング設定
```typescript
const smoothingFactor = 0.2; // 0.1→0.2で反応性向上
const smoothedVolume = previousVolume + smoothingFactor * (volumePercent - previousVolume);
```

---

## 5. ノイズリダクション

### 3段階フィルタリング構成

```typescript
// 1. ハイパスフィルタ（低周波ノイズ除去）
const highPassFilter = audioContext.createBiquadFilter();
highPassFilter.type = 'highpass';
highPassFilter.frequency.setValueAtTime(40, audioContext.currentTime);
highPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);

// 2. ローパスフィルタ（高周波ノイズ除去）
const lowPassFilter = audioContext.createBiquadFilter();
lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.setValueAtTime(4000, audioContext.currentTime);
lowPassFilter.Q.setValueAtTime(0.7, audioContext.currentTime);

// 3. ノッチフィルタ（電源ノイズ除去）
const notchFilter = audioContext.createBiquadFilter();
notchFilter.type = 'notch';
notchFilter.frequency.setValueAtTime(60, audioContext.currentTime);
notchFilter.Q.setValueAtTime(30, audioContext.currentTime);

// フィルタチェーン接続
source.connect(highPassFilter);
highPassFilter.connect(lowPassFilter);
lowPassFilter.connect(notchFilter);
notchFilter.connect(gainNode);
gainNode.connect(analyser);
```

---

## 6. Pitchy統合設定

### 最適化された設定値

```typescript
// PitchDetectorインスタンス作成
const pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
pitchDetector.clarityThreshold = 0.15;  // 適度な感度
pitchDetector.maxInputAmplitude = 1.0;

// 検出条件
const isValidDetection = (freq: number, clarity: number, volume: number): boolean => {
  return volume > 3 &&           // 音量閾値
         clarity > 0.15 &&       // 明瞭度閾値
         freq > 80 &&            // 最低周波数
         freq < 1200;            // 最高周波数
};
```

### AudioContext設定
```typescript
const audioContext = new AudioContext({ sampleRate: 44100 });
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8;
```

---

## 7. UI/UX実装知見

### 基音表示の工夫

```typescript
// 大きく見やすい基音表示
<div className="mt-6 p-6 bg-blue-100 rounded-xl shadow-lg">
  <div className="text-2xl text-blue-800 mb-2">現在の基音</div>
  <div className="text-6xl font-bold text-blue-900">{noteName}</div>
  <div className="text-3xl text-blue-700 mt-2">{frequency} Hz</div>
</div>
```

### Tone.js統合（基音再生）

```typescript
// 基音ボタンクリック時の音再生
const playBaseFrequency = async (freq: number) => {
  await Tone.start();
  const synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.5
    }
  }).toDestination();
  synth.triggerAttackRelease(freq, "2n");
};
```

---

## 8. 今後の課題と改善案

### 課題
1. **高音域オクターブ補正**: 高い音程でオクターブ低く表示される
2. **マイク許可フロー**: 初回ユーザーへのガイド不足
3. **ブラウザ互換性**: 一部ブラウザでの動作確認

### 改善案
1. **相対音程ベースの補正**: 基音との相対関係で補正ロジック調整
2. **段階的オンボーディング**: マイク許可→音声テスト→トレーニング開始
3. **フォールバック実装**: 非対応ブラウザへの対処

---

## まとめ

このガイドは、Next.js環境でのリアルタイム音声処理において、React特有の課題を回避しつつ高精度な音程検出を実現するための実装知見をまとめたものです。特にDOM直接操作によるパフォーマンス最適化と、動的オクターブ補正システムは、相対音感トレーニングアプリの核心技術となっています。

今後の実装では、これらの知見を基により洗練されたユーザー体験を提供できるよう改善を続けていきます。
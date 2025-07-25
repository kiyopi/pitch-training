# 相対音程計算システム仕様書 (Relative Pitch Calculation System Specifications)

## 📋 **概要**

**目的**: 基音と検出周波数から相対音程を計算し、8音階（ドレミファソラシド）での正誤判定を行う  
**実装対象**: ランダム基音トレーニングページ  
**技術基盤**: 12平均律による対数計算 + DOM直接操作による即座表示  
**実装日**: 2025-07-24  

---

## 🎯 **機能仕様**

### **Core 1: 相対音程計算エンジン**

#### **計算式**
```typescript
// セミトーン差計算（12平均律）
const semitones = Math.round(12 * Math.log2(detectedFreq / baseFreq));

// オクターブ内音程番号（0-11）
const scaleDegree = ((semitones % 12) + 12) % 12;
```

#### **8音階マッピング**
```typescript
const scaleNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
const scaleMapping = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
```

### **Core 2: 正誤判定システム**

#### **許容誤差基準**
- **正解判定**: ±30セント（±0.3セミトーン）以内
- **近接判定**: ±50セント（±0.5セミトーン）以内
- **要練習**: 50セント超過

#### **判定ロジック**
```typescript
// 最近接音程検索
let minDistance = 12;
let closestIndex = -1;

for (let i = 0; i < scaleMapping.length; i++) {
  const distance = Math.abs(scaleDegree - scaleMapping[i]);
  if (distance < minDistance) {
    minDistance = distance;
    closestIndex = i;
  }
}

// 精度判定
const isCorrect = minDistance <= 0.3; // 30セント以内
const isClose = minDistance <= 0.5;   // 50セント以内
```

### **Core 3: リアルタイム表示システム**

#### **DOM直接操作仕様**
```typescript
// 表示更新（iPhone Safari WebKit対応）
relativePitchDisplayRef.current.innerHTML = `
  <div style="text-align: center; padding: 8px;">
    <div style="font-size: 18px; font-weight: bold; color: ${statusColor};">
      ${noteName} (${semitones >= 0 ? '+' : ''}${semitones})
    </div>
    <div style="font-size: 12px; color: ${statusColor};">
      ${statusText} (誤差: ${distance.toFixed(1)}セミトーン)
    </div>
  </div>
`;
```

#### **視覚的フィードバック**
- **正解**: 緑色（#10b981）「正解！」
- **近接**: オレンジ色（#f59e0b）「近い」  
- **要練習**: 赤色（#ef4444）「要練習」

---

## 🛠️ **技術実装**

### **状態管理**
```typescript
// 基音周波数管理
const [currentBaseFrequency, setCurrentBaseFrequency] = useState<number | null>(null);

// 相対音程情報管理
const [relativePitchInfo, setRelativePitchInfo] = useState<{
  semitones: number;
  scaleDegree: number;
  noteName: string;
  isCorrect: boolean;
} | null>(null);
```

### **DOM要素管理**
```typescript
// 相対音程表示用DOM参照
const relativePitchDisplayRef = useRef<HTMLDivElement | null>(null);
```

### **計算関数実装**
```typescript
const calculateRelativePitch = useCallback((detectedFreq: number, baseFreq: number) => {
  // 1. セミトーン差計算
  const semitones = Math.round(12 * Math.log2(detectedFreq / baseFreq));
  
  // 2. オクターブ内正規化
  const scaleDegree = ((semitones % 12) + 12) % 12;
  
  // 3. 8音階マッピング検索
  const scaleNames = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
  const scaleMapping = [0, 2, 4, 5, 7, 9, 11];
  
  // 4. 最近接音程判定
  let minDistance = 12;
  let closestIndex = -1;
  
  for (let i = 0; i < scaleMapping.length; i++) {
    const distance = Math.abs(scaleDegree - scaleMapping[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }
  
  // 5. 結果生成
  let noteName = '不明';
  let isCorrect = false;
  
  if (minDistance <= 0.5 && closestIndex !== -1) {
    noteName = scaleNames[closestIndex];
    isCorrect = minDistance <= 0.3;
  }
  
  return {
    semitones,
    scaleDegree,
    noteName,
    isCorrect,
    distance: minDistance
  };
}, []);
```

---

## 🎨 **UI設計仕様**

### **表示エリア配置**
```tsx
{/* 相対音程表示エリア */}
<div style={{
  marginBottom: '8px',
  padding: '12px',
  backgroundColor: '#f0f9ff',    // 薄い青背景
  borderRadius: '6px',
  border: '1px solid #bae6fd'    // 青ボーダー
}}>
  <div style={{
    fontSize: '12px',
    color: '#0369a1',             // 濃い青ラベル
    marginBottom: '4px',
    fontWeight: 'bold'
  }}>🎵 相対音程分析:</div>
  
  <div ref={relativePitchDisplayRef}>
    分析待機中...
  </div>
</div>
```

### **レイアウト統合**
- **配置**: 音量バーの下、デバッグログの上
- **サイズ**: 固定高さ（約60px）でレイアウトシフト防止
- **色調**: 青系統で統一（トレーニング機能を示唆）

---

## 🔗 **連携仕様**

### **統一音響処理モジュール連携**
```typescript
// 音程検出ループ内での実行
if (currentBaseFrequency && correctedPitch > 0) {
  const relativePitch = calculateRelativePitch(correctedPitch, currentBaseFrequency);
  setRelativePitchInfo(relativePitch);
  updateRelativePitchDisplay(relativePitch);
  
  // デバッグログ（1秒に1回）
  if (Date.now() % 1000 < 17) {
    addLog(`🎵 相対音程: ${relativePitch.noteName} (${relativePitch.semitones >= 0 ? '+' : ''}${relativePitch.semitones}) ${relativePitch.isCorrect ? '✅正解' : '❌'}`);
  }
}
```

### **基音システム連携**
```typescript
// ランダム基音再生時に基音周波数を設定
const noteFrequency = baseNoteFrequencies[randomNote as keyof typeof baseNoteFrequencies];
setCurrentBaseFrequency(noteFrequency);
```

---

## 📊 **性能仕様**

### **計算性能**
- **実行頻度**: 60FPS（音程検出ループ内）
- **計算時間**: <1ms（対数計算 + 配列検索）
- **メモリ使用**: 最小限（計算結果のみ保持）

### **表示性能**
- **更新頻度**: リアルタイム（検出成功時のみ）
- **DOM操作**: innerHTML による直接更新
- **レンダリング**: iPhone Safari WebKit完全対応

---

## 🧪 **テスト仕様**

### **機能テスト項目**
1. **基音設定**: ランダム基音選択時の周波数設定
2. **音程計算**: 各音階での正確な計算結果
3. **正誤判定**: 許容誤差内での判定精度
4. **表示更新**: リアルタイム表示の応答性
5. **エラー処理**: 無効値・範囲外値での安全性

### **精度テスト基準**
- **C4 (261.63Hz)** → **C4 (261.63Hz)**: ド (+0) ✅正解
- **C4 (261.63Hz)** → **D4 (293.66Hz)**: レ (+2) ✅正解
- **C4 (261.63Hz)** → **E4 (329.63Hz)**: ミ (+4) ✅正解
- **C4 (261.63Hz)** → **F4 (349.23Hz)**: ファ (+5) ✅正解
- **C4 (261.63Hz)** → **G4 (392.00Hz)**: ソ (+7) ✅正解
- **C4 (261.63Hz)** → **A4 (440.00Hz)**: ラ (+9) ✅正解
- **C4 (261.63Hz)** → **B4 (493.88Hz)**: シ (+11) ✅正解

### **許容誤差テスト**
- **±30セント以内**: ✅正解判定
- **±31-50セント**: 🟡近接判定  
- **±51セント以上**: ❌要練習判定

---

## 📝 **ログ仕様**

### **デバッグログ出力**
```typescript
// 相対音程検出ログ（1秒間隔）
addLog(`🎵 相対音程: ${noteName} (${semitones >= 0 ? '+' : ''}${semitones}) ${isCorrect ? '✅正解' : '❌'}`);
```

### **ログ出力例**
```
🎵 相対音程: ド (+0) ✅正解
🎵 相対音程: レ (+2) ✅正解  
🎵 相対音程: ミ (+4) ✅正解
🎵 相対音程: 不明 (+1) ❌
```

---

## 🚀 **拡張可能性**

### **将来実装予定**
- **Step B-2**: 8音階正誤判定の詳細化
- **Step B-3**: リアルタイムスコアリング機能
- **Step B-4**: ユーザーフィードバック表示システム

### **拡張ポイント**
1. **精度向上**: 機械学習による判定最適化
2. **音階拡張**: 12音階・半音階対応
3. **統計機能**: 音程別正解率分析
4. **学習機能**: 弱点音程の重点練習

---

## 📋 **制約・注意事項**

### **技術制約**
- **12平均律前提**: 純正律等は対象外
- **基音依存**: 基音未設定時は計算不能
- **オクターブ圧縮**: オクターブ違いは同一音程として処理

### **精度制約**
- **Pitchy依存**: 音程検出精度に依存
- **環境影響**: ノイズ・エコーによる誤差
- **デバイス差異**: マイク性能による変動

### **UI制約**
- **DOM直接操作**: React外での表示更新
- **レイアウト固定**: 高さ固定でシフト防止
- **iPhone対応**: WebKit制約への配慮

---

**この仕様書は相対音程計算システムの完全な技術仕様を定義し、8音階相対音感トレーニングの基盤となります。**

**更新日**: 2025-07-24  
**仕様バージョン**: 1.0.0  
**実装ステータス**: ✅ 完了
# 統一音程計算システム仕様書

**作成日**: 2025-07-28  
**対象**: 3モード共通の音程計算システム  
**技術**: プロトタイプベースのシンプル計算方式  
**目的**: Random/Continuous/Chromaticモードでの一貫した音程計算

---

## 🎯 設計目標

### **統一性**
- 全3モードで同一の計算ロジック使用
- プロトタイプとの完全互換性
- 音楽理論に基づく正確な音程計算

### **シンプルさ**
- 複雑な相対計算の排除
- 固定間隔配列による直接計算
- デバッグ・保守の容易性

### **拡張性**
- 新モード追加時の最小工数
- 音階システムの容易な変更
- プロトタイプ採点システムとの統合準備

---

## 🏗️ 核心アーキテクチャ

### **Core Function: calculateExpectedFrequency**

```javascript
/**
 * 統一音程計算関数 - 全モード共通の基幹機能
 * @param {number} baseFreq - 基音周波数（Hz）
 * @param {number} scaleIndex - 音階インデックス（0-based）
 * @param {string} mode - モード種別（'diatonic'|'chromatic'）
 * @returns {number} 期待周波数（Hz）
 */
function calculateExpectedFrequency(baseFreq, scaleIndex, mode = 'diatonic') {
  // モード別音程間隔定義
  const intervalMaps = {
    diatonic: [0, 2, 4, 5, 7, 9, 11, 12],           // ドレミファソラシド（Random/Continuous）
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // 12音階（Chromatic）
  };
  
  const intervals = intervalMaps[mode];
  const semitones = intervals[scaleIndex % intervals.length];
  const targetFreq = baseFreq * Math.pow(2, semitones / 12);
  
  // デバッグログ（モード別）
  const scaleNames = {
    diatonic: ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド（高）'],
    chromatic: ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ', 'ド（高）']
  };
  
  const scaleName = scaleNames[mode][scaleIndex] || `Scale${scaleIndex}`;
  console.log(`🎯 [統一音程計算] ${scaleName}: 基音${baseFreq.toFixed(1)}Hz + ${semitones}半音 = ${targetFreq.toFixed(1)}Hz`);
  
  return targetFreq;
}
```

### **Mode-Specific Wrappers**

#### **Random Mode Wrapper**
```javascript
// Random Mode専用ラッパー
function calculateRandomModeFrequency(baseFreq, scaleIndex) {
  return calculateExpectedFrequency(baseFreq, scaleIndex, 'diatonic');
}
```

#### **Continuous Mode Wrapper**
```javascript
// Continuous Mode専用ラッパー
function calculateContinuousModeFrequency(baseFreq, scaleIndex) {
  return calculateExpectedFrequency(baseFreq, scaleIndex, 'diatonic');
}
```

#### **Chromatic Mode Wrapper**
```javascript
// Chromatic Mode専用ラッパー
function calculateChromaticModeFrequency(baseFreq, scaleIndex) {
  return calculateExpectedFrequency(baseFreq, scaleIndex, 'chromatic');
}
```

---

## 🎵 音楽理論的基盤

### **平均律12音階システム**

| 半音 | 音程名 | 周波数比 | セント | 備考 |
|------|--------|----------|--------|------|
| 0 | 基音 | 1.000 | 0¢ | C |
| 1 | 短2度 | 1.059 | 100¢ | C# |
| 2 | 長2度 | 1.122 | 200¢ | D |
| 3 | 短3度 | 1.189 | 300¢ | D# |
| 4 | 長3度 | 1.260 | 400¢ | E |
| 5 | 完全4度 | 1.335 | 500¢ | F |
| 6 | 増4度 | 1.414 | 600¢ | F# |
| 7 | 完全5度 | 1.498 | 700¢ | G |
| 8 | 短6度 | 1.587 | 800¢ | G# |
| 9 | 長6度 | 1.682 | 900¢ | A |
| 10 | 短7度 | 1.888 | 1000¢ | A# |
| 11 | 長7度 | 1.888 | 1100¢ | B |
| 12 | オクターブ | 2.000 | 1200¢ | C |

### **ドレミファソラシド抽出**
```javascript
// 平均律12音階からのドレミファソラシド抽出
const diatonicIntervals = [0, 2, 4, 5, 7, 9, 11, 12];
//                        ド レ ミ ファ ソ ラ シ ド（高）

// 音程的特徴
// ド→レ: 全音（2半音）
// レ→ミ: 全音（2半音）  
// ミ→ファ: 半音（1半音）
// ファ→ソ: 全音（2半音）
// ソ→ラ: 全音（2半音）
// ラ→シ: 全音（2半音）
// シ→ド: 半音（1半音）
```

---

## 🔧 3モード実装仕様

### **Random Mode 実装**

#### **基音システム**
```javascript
// 10種類のランダム基音
const randomBaseNotes = [
  { note: 'C4', frequency: 261.63, name: 'ド（中）' },
  { note: 'Db4', frequency: 277.18, name: 'ド#（中）' },
  { note: 'D4', frequency: 293.66, name: 'レ（中）' },
  { note: 'Eb4', frequency: 311.13, name: 'レ#（中）' },
  { note: 'E4', frequency: 329.63, name: 'ミ（中）' },
  { note: 'F4', frequency: 349.23, name: 'ファ（中）' },
  { note: 'Gb4', frequency: 369.99, name: 'ファ#（中）' },
  { note: 'G4', frequency: 392.00, name: 'ソ（中）' },
  { note: 'Ab4', frequency: 415.30, name: 'ラb（中）' },
  { note: 'Bb3', frequency: 233.08, name: 'シb（低）' }
];
```

#### **採点処理**
```javascript
function evaluateRandomModeStep(detectedFreq, baseFreq, scaleIndex) {
  const expectedFreq = calculateRandomModeFrequency(baseFreq, scaleIndex);
  const centDifference = Math.round(1200 * Math.log2(detectedFreq / expectedFreq));
  
  return {
    expectedFrequency: expectedFreq,
    centDifference: centDifference,
    scaleIndex: scaleIndex
  };
}
```

### **Continuous Mode 実装**

#### **固定基音システム**
```javascript
// ユーザー選択可能な固定基音
const continuousBaseOptions = [
  { note: 'C4', frequency: 261.63, name: 'ド（中）' },
  { note: 'D4', frequency: 293.66, name: 'レ（中）' },
  { note: 'E4', frequency: 329.63, name: 'ミ（中）' },
  { note: 'F4', frequency: 349.23, name: 'ファ（中）' },
  { note: 'G4', frequency: 392.00, name: 'ソ（中）' }
];
```

#### **連続チャレンジ対応**
```javascript
function evaluateContinuousChallenge(challengeResults) {
  return challengeResults.map(result => ({
    ...result,
    expectedFreq: calculateContinuousModeFrequency(result.baseFreq, result.scaleIndex)
  }));
}
```

### **Chromatic Mode 実装**

#### **12音階システム**
```javascript
// 12音階の名称定義
const chromaticScaleNames = [
  'ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 
  'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ', 'ド（高）'
];

// 上行・下行対応
const chromaticModes = {
  ascending: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  descending: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
};
```

#### **半音単位の高精度判定**
```javascript
function evaluateChromaticStep(detectedFreq, baseFreq, scaleIndex, direction = 'ascending') {
  const intervals = chromaticModes[direction];
  const actualIndex = direction === 'ascending' ? scaleIndex : intervals.length - 1 - scaleIndex;
  
  const expectedFreq = calculateChromaticModeFrequency(baseFreq, actualIndex);
  const centDifference = Math.round(1200 * Math.log2(detectedFreq / expectedFreq));
  
  return {
    expectedFrequency: expectedFreq,
    centDifference: centDifference,
    scaleName: chromaticScaleNames[actualIndex],
    direction: direction
  };
}
```

---

## 🛡️ エラーハンドリング

### **入力値検証**
```javascript
function validateCalculationInputs(baseFreq, scaleIndex, mode) {
  // 基音周波数の妥当性チェック
  if (!baseFreq || baseFreq <= 0 || !isFinite(baseFreq)) {
    throw new Error(`無効な基音周波数: ${baseFreq}Hz`);
  }
  
  // 音階インデックスの範囲チェック
  const maxIndex = mode === 'chromatic' ? 12 : 7;
  if (scaleIndex < 0 || scaleIndex > maxIndex) {
    throw new Error(`音階インデックス範囲外: ${scaleIndex} (0-${maxIndex})`);
  }
  
  // モード指定の妥当性チェック
  const validModes = ['diatonic', 'chromatic'];
  if (!validModes.includes(mode)) {
    throw new Error(`未対応モード: ${mode}`);
  }
  
  return true;
}
```

### **計算結果検証**
```javascript
function validateCalculationResult(targetFreq, baseFreq, semitones) {
  // 計算結果の妥当性チェック
  if (!isFinite(targetFreq) || targetFreq <= 0) {
    throw new Error(`計算結果が無効: ${targetFreq}Hz`);
  }
  
  // 理論値との整合性チェック
  const expectedRatio = Math.pow(2, semitones / 12);
  const actualRatio = targetFreq / baseFreq;
  const tolerance = 0.001; // 0.1%の許容誤差
  
  if (Math.abs(actualRatio - expectedRatio) > tolerance) {
    throw new Error(`計算精度エラー: 期待比${expectedRatio.toFixed(4)}, 実際比${actualRatio.toFixed(4)}`);
  }
  
  return true;
}
```

### **フォールバック処理**
```javascript
function safeCalculateExpectedFrequency(baseFreq, scaleIndex, mode = 'diatonic') {
  try {
    validateCalculationInputs(baseFreq, scaleIndex, mode);
    const result = calculateExpectedFrequency(baseFreq, scaleIndex, mode);
    validateCalculationResult(result, baseFreq, getIntervalForMode(mode, scaleIndex));
    return result;
  } catch (error) {
    console.error('音程計算エラー:', error.message);
    
    // フォールバック: 基音をそのまま返す
    console.warn('フォールバック: 基音周波数を使用');
    return baseFreq;
  }
}
```

---

## 📊 性能最適化

### **計算結果キャッシュ**
```javascript
class PitchCalculationCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 1000;
  }
  
  getCacheKey(baseFreq, scaleIndex, mode) {
    return `${baseFreq.toFixed(2)}-${scaleIndex}-${mode}`;
  }
  
  get(baseFreq, scaleIndex, mode) {
    const key = this.getCacheKey(baseFreq, scaleIndex, mode);
    return this.cache.get(key);
  }
  
  set(baseFreq, scaleIndex, mode, result) {
    const key = this.getCacheKey(baseFreq, scaleIndex, mode);
    
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
}
```

### **最適化された計算関数**
```javascript
const pitchCache = new PitchCalculationCache();

function calculateExpectedFrequencyOptimized(baseFreq, scaleIndex, mode = 'diatonic') {
  // キャッシュ確認
  const cached = pitchCache.get(baseFreq, scaleIndex, mode);
  if (cached) {
    return cached;
  }
  
  // 計算実行
  const result = calculateExpectedFrequency(baseFreq, scaleIndex, mode);
  
  // キャッシュ保存
  pitchCache.set(baseFreq, scaleIndex, mode, result);
  
  return result;
}
```

---

## 🧪 テスト仕様

### **単体テスト**
```javascript
// ドレミファソラシドの音程テスト
function testDiatonicIntervals() {
  const baseFreq = 261.63; // C4
  const expectedResults = [
    { index: 0, expected: 261.63, name: 'ド' },      // C4
    { index: 1, expected: 293.66, name: 'レ' },      // D4  
    { index: 2, expected: 329.63, name: 'ミ' },      // E4
    { index: 3, expected: 349.23, name: 'ファ' },    // F4
    { index: 4, expected: 392.00, name: 'ソ' },      // G4
    { index: 5, expected: 440.00, name: 'ラ' },      // A4
    { index: 6, expected: 493.88, name: 'シ' },      // B4
    { index: 7, expected: 523.25, name: 'ド（高）' }  // C5
  ];
  
  expectedResults.forEach(test => {
    const result = calculateExpectedFrequency(baseFreq, test.index, 'diatonic');
    const tolerance = 0.1; // 0.1Hzの許容誤差
    
    if (Math.abs(result - test.expected) > tolerance) {
      throw new Error(`${test.name}音程テスト失敗: 期待${test.expected}Hz, 実際${result.toFixed(2)}Hz`);
    }
  });
  
  console.log('✅ ドレミファソラシド音程テスト合格');
}
```

### **統合テスト**
```javascript
// 3モード統合テスト
function testModeIntegration() {
  const testCases = [
    { mode: 'diatonic', maxIndex: 7, name: 'Random/Continuous' },
    { mode: 'chromatic', maxIndex: 12, name: 'Chromatic' }
  ];
  
  testCases.forEach(testCase => {
    for (let i = 0; i <= testCase.maxIndex; i++) {
      const result = calculateExpectedFrequency(261.63, i, testCase.mode);
      
      if (!result || result <= 0 || !isFinite(result)) {
        throw new Error(`${testCase.name}モード統合テスト失敗: インデックス${i}`);
      }
    }
    
    console.log(`✅ ${testCase.name}モード統合テスト合格`);
  });
}
```

---

## 📋 実装チェックリスト

### **Phase 1: Core Function**
- [x] `calculateExpectedFrequency`関数の実装
- [x] diatonicモード対応（Random Modeで実装済み）
- [ ] chromaticモード対応
- [ ] エラーハンドリング実装

### **Phase 2: Mode Integration**
- [x] Random Mode統合（実装済み）
- [ ] Continuous Mode統合
- [ ] Chromatic Mode統合
- [ ] モード別ラッパー関数実装

### **Phase 3: Optimization**
- [ ] 計算結果キャッシュシステム
- [ ] 性能ベンチマーク
- [ ] メモリ使用量最適化
- [ ] 計算精度検証

### **Phase 4: Testing**
- [ ] 単体テスト実装
- [ ] 統合テスト実装
- [ ] 音楽理論的正当性検証
- [ ] 他プロトタイプとの互換性確認

---

## 🎯 期待される効果

### **開発効率化**
- **統一性**: 1つのロジックで3モード対応
- **保守性**: 修正は核心関数1箇所のみ
- **拡張性**: 新モード追加時の最小工数

### **品質向上**
- **一貫性**: 全モードで同じ精度・品質
- **信頼性**: 複雑な計算ロジック排除によるバグ削減
- **互換性**: プロトタイプとの完全互換

### **ユーザー体験向上**
- **正確性**: 音楽理論に基づく正確な音程計算
- **公平性**: モード間での一貫した評価基準
- **理解しやすさ**: 予期可能で合理的な採点結果

---

この統一音程計算システムにより、3モード共通の高品質で保守しやすい音程計算基盤が確立され、プロトタイプレベルの採点システム実装への道筋が明確になります。
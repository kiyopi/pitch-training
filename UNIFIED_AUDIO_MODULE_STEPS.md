# 音響処理統一モジュール実装ステップ

**作成日**: 2025-07-24  
**目的**: 全音響処理の統一・デグレード防止・品質保証  
**対象ページ**: マイクテスト・ランダム基音・連続チャレンジ・12音階

---

## 🎯 開発背景

### **問題点**
- マイクテストページとランダム基音ページで音響処理に差異
- 仕様書があるにも関わらず実装に不一致が発生
- 残り2つのモード実装時に同様の問題が予想される

### **解決策**
- 統一音響処理モジュールで全ページの一貫性確保
- テストページでの検証→モジュール化→既存ページ移行→新規実装

---

## 📋 Phase 1: テストページプロトタイプ ✅**完了**

### **実装内容**
- ✅ `/src/app/test/unified-audio/page.tsx` 作成完了
- ✅ マイクテストページの音響処理を完全再現
- ✅ A/Bテスト環境構築

### **検証項目**
- ✅ `getByteTimeDomainData()` + 手動正規化実装
- ✅ `Math.max(rms * 200, maxAmplitude * 100)` 音量計算
- ✅ 0.2係数の指数移動平均スムージング
- ✅ プラットフォーム別パラメータ（iOS: divisor 4.0, PC: 6.0）
- ✅ 周波数範囲80-2000Hz, clarity > 0.6での表示制御
- ✅ iPhone Safari WebKit完全対応

---

## 🛠️ Phase 2: 共通モジュール作成 ✅**完了**

### **Step 2-1: 音響処理コアモジュール** ✅**完了**
- ✅ `/src/utils/audioProcessing.ts` 実装完了
- ✅ UnifiedAudioProcessor クラス作成
- ✅ マイクテストページ準拠の音量計算実装
- ✅ プラットフォーム別パラメータ対応
- ✅ スムージング処理統合
- ✅ 周波数検出連動機能

**主要機能:**
```typescript
export class UnifiedAudioProcessor {
  // マイクテストページ準拠の音量計算
  calculateVolume(data: Uint8Array): VolumeResult
  
  // プラットフォーム別補正
  applyPlatformCorrection(volume: number): { rawVolumePercent: number; compensatedVolume: number }
  
  // スムージング処理
  applySmoothingFilter(current: number): number
  
  // 周波数検出判定
  shouldDisplayVolume(frequency: number, clarity: number): boolean
}
```

### **Step 2-2: DOM操作ヘルパーモジュール** ✅**完了**
- ✅ `/src/utils/audioDOMHelpers.ts` 実装完了
- ✅ AudioDOMController クラス作成
- ✅ iPhone Safari WebKit対応DOM操作
- ✅ エラーハンドリング機能
- ✅ 安全な更新機能

**主要機能:**
```typescript
export class AudioDOMController {
  // iPhone対応音量バー更新
  static updateVolumeDisplay(element: HTMLElement, volume: number): void
  
  // 周波数表示更新
  static updateFrequencyDisplay(element: HTMLElement, frequency: number | null): void
  
  // 複合音響情報更新
  static updateAudioDisplay(elements, audioInfo): void
}
```

### **Step 2-3: プラットフォーム検出・設定モジュール** ✅**完了**
- ✅ `/src/utils/platformDetection.ts` 実装完了
- ✅ PlatformDetector クラス作成
- ✅ 詳細プラットフォーム検出
- ✅ API対応状況チェック
- ✅ 最適化設定提供

**主要機能:**
```typescript
export function detectPlatformConfig(): PlatformConfig {
  // iOS/PC自動検出 + 設定適用
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return {
    microphoneSpec: {
      divisor: isIOS ? 4.0 : 6.0,
      gainCompensation: isIOS ? 1.5 : 1.0,
      noiseThreshold: isIOS ? 12 : 15
    }
  };
}
```

---

## 🔄 Phase 3: 既存ページ移行 🔄**予定**

### **Step 3-1: マイクテストページ移行**
- `/src/app/microphone-test/page.tsx` リファクタリング
- 統一モジュール使用への変更
- 既存動作との完全一致確認
- デグレードテスト実施

### **Step 3-2: ランダム基音ページ移行**
- `/src/app/training/random/page.tsx` リファクタリング
- マイクテストページと同一動作確認
- Phase B実装準備完了

---

## 🚀 Phase 4: 新規モード実装 🔄**予定**

### **Step 4-1: 連続チャレンジモード**
- `/src/app/training/continuous/page.tsx` 実装
- 統一モジュールを最初から使用
- 連続実行・評価機能追加

### **Step 4-2: 12音階モード**
- `/src/app/training/chromatic/page.tsx` 実装
- 統一モジュールを最初から使用
- クロマチックスケール対応

---

## 🧪 Phase 5: 品質保証・テスト 🔄**予定**

### **Step 5-1: 自動テスト作成**
```typescript
// /src/tests/audioProcessing.test.ts
describe('Unified Audio Processing', () => {
  test('全ページで同一の音量計算結果', () => {
    const testData = generateTestAudioData();
    const processor = new UnifiedAudioProcessor();
    
    const micTestResult = processor.calculateVolume(testData);
    const trainingResult = processor.calculateVolume(testData);
    
    expect(micTestResult).toEqual(trainingResult);
  });
  
  test('プラットフォーム別パラメータ適用', () => {
    const processor = new UnifiedAudioProcessor();
    
    const iOSResult = processor.applyPlatformCorrection(50, true);
    const PCResult = processor.applyPlatformCorrection(50, false);
    
    expect(iOSResult).toBe(75); // 50 * 1.5
    expect(PCResult).toBe(50);  // 50 * 1.0
  });
});
```

### **Step 5-2: 実装チェックリスト作成**
```markdown
# /docs/AUDIO_IMPLEMENTATION_CHECKLIST.md

## 音響処理実装チェックリスト

### 必須実装項目
- [ ] UnifiedAudioProcessor使用
- [ ] detectPlatformConfig()でプラットフォーム検出
- [ ] AudioDOMController使用でDOM更新
- [ ] getByteTimeDomainData() + 手動正規化
- [ ] Math.max(rms * 200, maxAmplitude * 100) 音量計算
- [ ] 0.2係数スムージング実装
- [ ] 80-2000Hz, clarity > 0.6表示制御

### プラットフォーム対応
- [ ] iOS: divisor 4.0, gainCompensation 1.5, threshold 12
- [ ] PC: divisor 6.0, gainCompensation 1.0, threshold 15
- [ ] iOS: 軽量フィルター（ハイパスのみ）
- [ ] PC: 3段階フィルター（ハイパス・ローパス・ノッチ）
```

---

## 📊 期待される成果

### **品質向上**
- ✅ 全4ページで完全に同一の音響処理動作
- ✅ 仕様書準拠の保証された実装
- ✅ デグレードリスクの完全排除

### **開発効率向上**
- ✅ 新規ページ作成時の実装ミス防止
- ✅ 仕様変更時の一括更新可能
- ✅ テストによる自動検証でデグレード防止

### **保守性向上**
- ✅ 音響処理ロジックの一元管理
- ✅ コードの重複排除
- ✅ 統一されたエラーハンドリング

---

## 🔄 進捗管理

### **現在の状況**
- ✅ Phase 1: 完了
- 🔄 Phase 2: 次回実装予定
- 📋 Phase 3-5: 計画策定完了

### **VSCodeクラッシュ対策**
- 各Phaseごとにコミット・プッシュ実行
- ステップ別の詳細実装記録
- 中断時の復帰手順書準備

### **次回継続ポイント**
- Phase 2 Step 2-1から開始
- audioProcessing.ts基本構造実装
- テストページでの動作検証
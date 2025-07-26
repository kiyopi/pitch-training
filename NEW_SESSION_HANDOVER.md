# 新セッション引き継ぎ書

**作成日**: 2025-07-26  
**次回作業**: 正しい `/Users/isao/Documents/pitch-training` ディレクトリで開始  
**復帰ポイント**: コミット `ba1a58c` (マイクテスト最適化完了)

---

## 🎯 新セッション開始手順

### **1. 正しいディレクトリで開始**
```bash
cd /Users/isao/Documents/pitch-training
```

### **2. マイクテスト完了時点まで復帰**
```bash
git checkout ba1a58c
git switch -c random-training-clean-impl-001
```

### **3. 最初に確認すべきファイル**
1. **RANDOM_TRAINING_UNIFIED_SPECIFICATION.md** - 詳細実装仕様
2. **TRAINING_MODES_COMMON_SPECIFICATION.md** - 3モード共通設計
3. **この引き継ぎ書** - 全体方針確認

---

## 📋 決定済み事項

### **✅ 根本問題の解決**
- **環境問題**: `pitch_app` (プロトタイプ) → `pitch-training` (本格開発)
- **設計問題**: 複雑なマイク許可フロー → シンプルな1ページ完結型
- **技術債務**: 未実装コードの放棄 → 動作するコードの移植

### **✅ 新設計方針**
- **1ページ完結**: ページ遷移なしの統合UI
- **shadcn/ui準拠**: デザインシステム統一
- **3モード共通化**: Random/Continuous/Chromatic の基盤統一
- **SNS共有**: 結果表示にソーシャル機能統合

### **✅ 技術スタック確定**
- **音源**: Tone.js + Salamander Grand Piano (ローカル)
- **音程検出**: Pitchy + `/test/separated-audio/` の実装移植
- **UI**: Next.js + shadcn/ui + TypeScript
- **状態管理**: React hooks (zustand等は不使用)

---

## 🚀 実装計画

### **Phase 1: 基盤構築** (最優先)
1. **正しい環境セットアップ**
   - `pitch-training` ディレクトリ確認
   - 依存関係インストール
   - 開発サーバー起動確認

2. **音響エンジン移植**
   - `/test/separated-audio/page.tsx` から技術抽出
   - 動的オクターブ補正システム移植
   - 3段階ノイズリダクション移植

3. **基本レイアウト構築**
   - shadcn/ui コンポーネント統合
   - CommonTrainingLayout 実装
   - レスポンシブデザイン適用

### **Phase 2: Random Mode実装**
1. **基音再生システム**
   - 10種類ランダム選択
   - Tone.js Sampler 統合
   - ローカル音源ファイル配置

2. **ドレミガイド**
   - 8音階表示システム
   - 順次ハイライト機能
   - 状態管理 (inactive/active/correct/incorrect)

3. **音程検出統合**
   - リアルタイム検出表示
   - 相対音程計算
   - 精度判定システム

### **Phase 3: 結果・共有機能**
1. **採点システム**
   - 8音階個別スコア
   - 総合スコア計算
   - 反応時間測定

2. **SNS共有機能**
   - Twitter/Facebook/LINE対応
   - 結果画像生成
   - クリップボードコピー

---

## 📁 必要ファイル

### **実装参照元**
- **動作コード**: `/test/separated-audio/page.tsx`
- **音源ファイル**: 既に配置済み（10個のmp3ファイル）
- **技術資産**: 音響処理、オクターブ補正、ノイズリダクション

### **新規作成対象**
```
/src/app/training/random/
├── page.tsx                    # メインページ
├── components/
│   ├── BasetonPlayer.tsx      # 基音再生
│   ├── ScaleGuide.tsx         # ドレミガイド  
│   ├── PitchDetector.tsx      # 音程検出
│   ├── ResultsDisplay.tsx     # 結果表示
│   └── ShareButton.tsx        # SNS共有
└── utils/
    ├── audioProcessing.ts     # 音響処理 (移植)
    ├── pitchCalculation.ts    # 音程計算 (移植)
    └── scoreCalculation.ts    # 採点計算 (新規)
```

---

## ⚠️ 重要な注意事項

### **環境依存問題の回避**
- **必須**: 正しい `pitch-training` ディレクトリでの作業
- **禁止**: `pitch_app` での作業継続
- **確認**: GitHub Pages デプロイが正常に動作すること

### **設計原則の遵守**
- **1ページ完結**: 複雑なページ遷移は避ける
- **shadcn/ui準拠**: 独自CSSではなくコンポーネント使用
- **TypeScript型安全**: any型は使用禁止
- **エラーハンドリング**: マイク許可・音源読み込みエラー対応

### **パフォーマンス考慮**
- **音源**: ローカルファイル使用（CDN不使用）
- **バンドルサイズ**: 最小限の依存関係
- **メモリ管理**: AudioContext・Stream の適切な解放

---

## 📊 成功指標

### **機能完成度**
- [ ] ランダム基音再生（10種類）
- [ ] ドレミ8音階ガイド
- [ ] リアルタイム音程検出
- [ ] 採点・結果表示
- [ ] SNS共有機能

### **品質基準**
- [ ] iPhone Safari 動作確認
- [ ] TypeScript エラーゼロ
- [ ] ESLint エラーゼロ  
- [ ] GitHub Pages デプロイ成功
- [ ] 3G回線でのパフォーマンス確認

### **UX基準**
- [ ] 直感的な操作性
- [ ] レスポンシブデザイン
- [ ] エラーハンドリング
- [ ] アクセシビリティ対応

---

## 🎵 最終目標

**「動作する、シンプルで美しい相対音感トレーニングアプリ」**

- **動作する**: 音響処理が確実に機能
- **シンプル**: 複雑さを排除した直感的UI
- **美しい**: shadcn/ui による統一されたデザイン
- **拡張可能**: 3モード展開への基盤構築

---

## 🚀 新セッション開始

**次のコマンドで新セッションを開始してください：**

```bash
cd /Users/isao/Documents/pitch-training
git checkout ba1a58c
git switch -c random-training-clean-impl-001
```

**最初に読むべきファイル：**
1. `RANDOM_TRAINING_UNIFIED_SPECIFICATION.md`
2. `TRAINING_MODES_COMMON_SPECIFICATION.md`  
3. この引き継ぎ書

**実装開始：**
- Phase 1: 基盤構築から開始
- 参照: `/test/separated-audio/page.tsx` の動作コード

---

**新しいセッションでの成功を祈ります！**
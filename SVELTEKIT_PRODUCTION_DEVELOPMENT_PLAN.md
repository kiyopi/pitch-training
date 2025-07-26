# SvelteKit本格開発実装計画

**作成日**: 2025-07-26  
**移行決定日**: 2025-07-26  
**開発環境**: `/Users/isao/Documents/pitch-training` (SvelteKitメイン)

---

## 🎉 移行決定の背景

### **移行判断理由**
1. **実装の容易さ**: SvelteKitでの開発がNext.jsよりもはるかに実装しやすい
2. **音響処理最適化**: DOM直接操作がSvelteで自然に実装可能
3. **パフォーマンス優位**: リアルタイム音声処理での性能向上
4. **制約からの解放**: shadcn/ui問題、CSS-in-JS制約の解決

### **技術検証完了項目**
- ✅ Tone.js + Salamander Grand Piano統合成功
- ✅ Web Audio API + Pitchy音程検出動作確認
- ✅ GitHub Pages デプロイ環境構築完了
- ✅ 動的オクターブ補正システム移植成功
- ✅ 3段階ノイズリダクション実装確認

---

## 🚀 SvelteKit本格開発計画

### **Phase 1: 基盤強化（Week 1）**

#### **Task 1.1: 現在の課題解決** (最優先)
- **404エラー解決**: 音源ファイルパス問題の完全解決
- **パス設定最適化**: BASE_URL設定の確実な動作確認
- **GitHub Actions調整**: SvelteKitデプロイフローの最適化

```bash
# 確認URL
https://kiyopi.github.io/pitch-training/training/random
```

#### **Task 1.2: SvelteKitプロジェクト構造最適化**
- **ディレクトリ構造整理**: `/svelte-prototype` → メイン開発環境に昇格
- **設定ファイル最適化**: `svelte.config.js`, `vite.config.ts`
- **型定義整備**: TypeScript設定の強化

#### **Task 1.3: 音響システム安定化**
- **Tone.js統合の最終調整**: 音源読み込みの完全安定化
- **Pitchy統合強化**: 音程検出精度の向上
- **パフォーマンス最適化**: 60fps維持の確実化

### **Phase 2: 機能完成（Week 2-3）**

#### **Task 2.1: ランダム基音トレーニング完成**
- **基音再生システム**: 10種類完全対応
- **ドレミガイド**: アニメーション・状態管理完成
- **リアルタイム検出**: 精度向上・UI改善
- **採点システム**: スコア計算・結果表示完成

#### **Task 2.2: マイクテストページ最終調整**
- **UI/UX改善**: ユーザーフレンドリーな操作性
- **エラーハンドリング**: 各種エラーケース対応
- **デバイス対応**: iPhone Safari完全対応

#### **Task 2.3: SNS共有機能実装**
- **Twitter/X共有**: Web Share API統合
- **結果画像生成**: Canvas API活用
- **クリップボード機能**: 結果テキストコピー

### **Phase 3: 3モード展開（Week 4-5）**

#### **Task 3.1: Continuous Mode実装**
- **連続チャレンジ**: 10回・20回・50回モード
- **固定基音システム**: ユーザー選択可能
- **プログレス管理**: 進捗表示・中断復帰

#### **Task 3.2: Chromatic Mode実装**
- **12音階対応**: 半音階システム
- **上級者向けUI**: 微細な音程差表示
- **難易度調整**: レベル別モード

#### **Task 3.3: 共通コンポーネント統合**
- **コンポーネント抽象化**: 3モード共通部分
- **状態管理統一**: ストア設計最適化
- **ルーティング整備**: SvelteKit Router活用

### **Phase 4: 品質向上・本番準備（Week 6）**

#### **Task 4.1: パフォーマンス最適化**
- **バンドルサイズ最適化**: Tree-shaking活用
- **レイジーローディング**: 音源ファイル最適化
- **メモリ管理**: AudioContext適切な管理

#### **Task 4.2: テスト・品質保証**
- **E2Eテスト**: Playwright導入検討
- **ユニットテスト**: Vitest活用
- **アクセシビリティ**: WCAG 2.1準拠

#### **Task 4.3: ドキュメント整備**
- **API仕様書**: コンポーネント仕様
- **デプロイガイド**: 運用手順書
- **保守マニュアル**: トラブルシューティング

---

## 🏗️ 技術アーキテクチャ

### **SvelteKit技術スタック**
```
Frontend: SvelteKit + TypeScript
Audio: Tone.js + Web Audio API
Detection: Pitchy (McLeod Pitch Method)
Build: Vite + adapter-static
Deploy: GitHub Pages
Style: CSS Variables + Svelte Scoped CSS
```

### **プロジェクト構造**
```
/src/
├── routes/
│   ├── +layout.svelte          # 共通レイアウト
│   ├── +page.svelte           # ホームページ
│   ├── microphone-test/
│   │   └── +page.svelte       # マイクテストページ
│   └── training/
│       ├── random/
│       │   └── +page.svelte   # ランダムトレーニング
│       ├── continuous/
│       │   └── +page.svelte   # 連続チャレンジ
│       └── chromatic/
│           └── +page.svelte   # 12音階モード
├── lib/
│   ├── components/            # 共通コンポーネント
│   ├── stores/               # Svelte Store
│   ├── utils/                # ユーティリティ
│   └── audio/                # 音響処理
└── static/
    └── audio/
        └── piano/            # 音源ファイル
```

### **状態管理設計**
```typescript
// Svelte Store活用
import { writable } from 'svelte/store';

// 音響システム状態
export const audioState = writable({
  isInitialized: false,
  currentBaseTone: null,
  detectedPitch: null
});

// トレーニング状態
export const trainingState = writable({
  mode: 'random',
  currentScale: 0,
  results: []
});
```

---

## 📊 実装優先順位

### **最優先（即座実行）**
1. **404エラー完全解決** - 音源ファイル読み込み
2. **GitHub Pagesデプロイ安定化** - BASE_URL設定
3. **Tone.js + Pitchy統合最終調整** - 音響システム完成

### **優先度高（Week 1-2）**
4. **ランダムトレーニング機能完成** - 基本機能実装
5. **マイクテストページ最終調整** - UX改善
6. **SNS共有機能実装** - ソーシャル機能

### **優先度中（Week 3-4）**
7. **Continuous・Chromatic Mode実装** - 3モード完成
8. **共通コンポーネント統合** - アーキテクチャ改善

### **優先度低（Week 5-6）**
9. **パフォーマンス最適化** - 品質向上
10. **テスト・ドキュメント整備** - 保守性向上

---

## ⚠️ 重要な注意事項

### **開発方針転換**
- **Next.js開発終了**: React関連開発は完全停止
- **SvelteKit専念**: リソースをSvelteKit開発に集中
- **プロトタイプ昇格**: `/svelte-prototype` をメイン開発環境に

### **CLAUDE.md準拠継続**
- **実装前承認13項目**: 引き続き完全遵守
- **使い捨てブランチ運用**: SvelteKit開発でも継続
- **作業ログ更新**: WORK_LOG.mdへの詳細記録

### **品質基準維持**
- **iPhone Safari対応**: 必須動作確認
- **GitHub Pages安定**: デプロイ環境の信頼性
- **60fps性能**: リアルタイム処理のパフォーマンス維持

---

## 🎯 成功指標

### **機能完成度**
- [ ] ランダムトレーニング: 100%完成
- [ ] マイクテストページ: UX最適化完了
- [ ] 3モード統合: Random/Continuous/Chromatic完成
- [ ] SNS共有: Twitter/クリップボード対応

### **技術品質**
- [ ] 音源404エラー: 完全解決
- [ ] iPhone Safari: 全機能動作確認
- [ ] パフォーマンス: 60fps維持
- [ ] TypeScript: エラーゼロ

### **運用品質**
- [ ] GitHub Pages: 安定デプロイ
- [ ] ドキュメント: 保守手順完備
- [ ] テスト: 基本品質保証
- [ ] モニタリング: エラー検知体制

---

## 🚀 実行開始

**SvelteKit本格開発を以下の手順で開始します：**

1. **現在の404エラー解決** - 最優先課題
2. **プロジェクト構造最適化** - 開発環境整備
3. **機能実装加速** - SvelteKit優位性を活用した高速開発

**SvelteKitの実装の容易さを最大限活用し、効率的な相対音感トレーニングアプリを完成させます！**
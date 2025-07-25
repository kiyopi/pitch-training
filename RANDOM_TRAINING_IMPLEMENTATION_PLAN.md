# ランダム基音モード完全実装計画書

## 📋 ユーザーフロー設計（確定版）

### Phase 0: ウェルカム画面
**メインタイトル**: 🎲 ランダム基音モード - 相対音感トレーニング

**アプリの目的説明**:
```
相対音感とは、基準となる音（基音）からの音程の関係を
正確に聞き分ける能力です。

このトレーニングでは：
• 10種類の異なる基音からランダムに選択
• 基音を聞いた後、ドレミファソラシドを正確に歌う
• あなたの歌声をリアルタイムで音程分析
• 目標音程との誤差をセント単位で評価

継続的な練習により、どんな基音からでも正確な
相対音程を歌えるようになります。
```

**トレーニングの流れ**:
```
📋 トレーニングの流れ

1️⃣ マイクテスト
   • マイクロフォンの許可を取得
   • 音量レベルが適切かテスト

2️⃣ 基音再生
   • 10種類（Bb3〜Ab4）からランダム選択
   • ピアノ音で2秒間再生

3️⃣ 8音階歌唱
   • ド→レ→ミ→ファ→ソ→ラ→シ→ド を順番に
   • 各音程をリアルタイム検出・表示

4️⃣ 個別評価
   • 8音すべての誤差をセント単位で評価
   • 合格/不合格を判定

5️⃣ 総合結果
   • 複数サイクルの統計
   • 苦手な音程の分析
```

**目標設定**:
```
📊 難易度: 初級〜中級
⏱️ 1セッション: 約5-10分
🎯 目標: ±20セント以内の精度
```

**ボタン**: 🎤 マイクテストを開始して相対音感を鍛える

**補助説明**:
```
💡 ヒント
• 静かな環境での使用を推奨
• イヤホン使用で基音がより聞き取りやすくなります
• 1日10分の継続練習が効果的です
```

### Phase 1: マイク許可 + 音量テスト
- マイク許可要求
- 音量バーでレベル確認
- 「声を出してテストしてください」ガイド
- 音量が30%以上で「テスト完了」ボタン有効化

### Phase 2: トレーニングループ
**2-1. 基音再生**
- ランダム選択された基音を自動再生（2秒）
- 基音名と周波数を大きく表示
- 「基音をもう一度聞く」ボタン

**2-2. 8音階歌唱録音**
- 「ド→レ→ミ→ファ→ソ→ラ→シ→ド」を順番に歌唱
- リアルタイム周波数表示
- 各音階ごとに録音（1音あたり2-3秒）
- 進行状況バー表示（1/8, 2/8...）

**2-3. 個別評価表示**
- 8音階すべて完了後、評価テーブル表示
- 各音階の目標周波数 vs 実際の周波数
- セント単位の誤差表示
- 合格/不合格判定
- 「次の基音に進む」「トレーニング終了」ボタン

### Phase 3: 総合結果（トレーニング終了時）
- 実施したサイクル数
- 全体正解率
- 音階別成績グラフ
- 平均誤差
- 総合評価（S/A/B/C）
- 改善ポイント提案

### Phase 4: 継続オプション
- 「もう一度トレーニング」
- 「メインメニューに戻る」
- 「結果を保存」（将来機能）

## 📊 評価システム設計（確定版）

### 1. 単体評価（個別サイクル評価）
**タイミング**: 各8音サイクル（ド→レ→ミ→ファ→ソ→ラ→シ→ド）完了後
**表示形式**:
```
基音: C4 (261Hz)での評価結果
ド → あなた: 270Hz (誤差: +34セント) 評価: 合格
レ → あなた: 295Hz (誤差: +5セント)  評価: 優秀
ミ → あなた: 325Hz (誤差: -28セント) 評価: 合格
...
```

### 2. 総合評価（セッション終了時）
**タイミング**: ユーザーが「トレーニング終了」ボタンを押した時
**表示項目**:
- 実施したサイクル数
- 全体の正解率
- 音階別の成績（ドが得意、ミが苦手など）
- 平均誤差
- 総合評価（S/A/B/C等）

## 🚀 段階的実装フロー

### Step 1: 基盤システム実装
**対象**: `/src/app/random-training/page.tsx`
- **1-1**: 基本レイアウトとPhase管理システム
- **1-2**: マイクロフォン管理フック統合
- **1-3**: 音量テスト機能実装
- **1-4**: Phase 0→1遷移実装

### Step 2: 基音システム実装
**対象**: 同一ファイル + 基音管理フック
- **2-1**: 10種類基音データベース作成
- **2-2**: Tone.js基音再生機能
- **2-3**: ランダム基音選択システム
- **2-4**: 基音表示UI実装

### Step 3: 録音・検出システム実装
**対象**: 音程検出フック作成
- **3-1**: Pitchy統合音程検出
- **3-2**: 8音階順次録音システム
- **3-3**: リアルタイム周波数表示
- **3-4**: 進行状況管理

### Step 4: 評価システム実装
**対象**: 評価ロジック + UI
- **4-1**: セント計算ロジック
- **4-2**: 個別評価テーブル作成
- **4-3**: 合格/不合格判定システム
- **4-4**: 評価結果表示UI

### Step 5: 総合結果システム実装
**対象**: 統計計算 + 結果表示
- **5-1**: セッション統計計算
- **5-2**: 音階別成績分析
- **5-3**: 総合評価アルゴリズム
- **5-4**: 結果表示画面

### Step 6: UX最適化
**対象**: 全体的な改善
- **6-1**: アニメーション・トランジション追加
- **6-2**: iPhone Safari最適化
- **6-3**: エラーハンドリング強化
- **6-4**: パフォーマンス最適化

## 📁 実装予定ファイル構成

```
src/app/random-training/
├── page.tsx                    # メインページ
├── components/
│   ├── WelcomePhase.tsx       # Phase 0
│   ├── MicTestPhase.tsx       # Phase 1
│   ├── TrainingPhase.tsx      # Phase 2
│   ├── EvaluationPhase.tsx    # Phase 3
│   └── ResultsPhase.tsx       # Phase 4
└── hooks/
    ├── useRandomTraining.ts   # 全体状態管理
    ├── useBaseFrequency.ts    # 基音管理
    ├── usePitchDetection.ts   # 音程検出
    └── useEvaluation.ts       # 評価計算
```

## 🎯 技術的な重要ポイント

1. **テストページの知見活用**: `/test/pitchy-clean`で確立した技術を流用
2. **DOM直接操作**: React stateを避けた60FPS更新
3. **動的オクターブ補正**: 既存の補正システム適用
4. **段階的テスト**: 各StepごとにiPhone確認
5. **エラー対応**: ERROR_DIALOG_SPECIFICATION.md準拠

## 📋 作業開始時の確認事項

### 必須確認項目
1. **現在ブランチ**: `pitch-training-nextjs-v2-impl-001`
2. **安定版ベース**: `1e44e2e` (v1.2.0 OutlierPenalty-Enhanced)
3. **テストページ**: `/test/pitchy-clean`の技術基盤確認
4. **マイクフック**: `/src/hooks/useMicrophoneManager.ts`の統合準備

### 作業前準備
1. CLAUDE.md実装前承認プロセス実行
2. 対象ファイル確認とユーザー承認取得
3. 作業ログ（WORK_LOG.md）更新
4. 使い捨てブランチ作成検討

## 🔄 基音データベース仕様

### 10種類基音リスト
```javascript
const baseTones = [
  { name: 'Bb3', note: 'シ♭3', frequency: 233.08, tonejs: 'Bb3' },
  { name: 'C4',  note: 'ド4',   frequency: 261.63, tonejs: 'C4' },
  { name: 'Db4', note: 'レ♭4', frequency: 277.18, tonejs: 'Db4' },
  { name: 'D4',  note: 'レ4',   frequency: 293.66, tonejs: 'D4' },
  { name: 'Eb4', note: 'ミ♭4', frequency: 311.13, tonejs: 'Eb4' },
  { name: 'E4',  note: 'ミ4',   frequency: 329.63, tonejs: 'E4' },
  { name: 'F4',  note: 'ファ4', frequency: 349.23, tonejs: 'F4' },
  { name: 'Gb4', note: 'ソ♭4', frequency: 369.99, tonejs: 'Gb4' },
  { name: 'G4',  note: 'ソ4',   frequency: 392.00, tonejs: 'G4' },
  { name: 'Ab4', note: 'ラ♭4', frequency: 415.30, tonejs: 'Ab4' }
];
```

### 相対音程計算式
```javascript
// セント計算
const calculateCents = (detected, target) => {
  return Math.round(1200 * Math.log2(detected / target));
};

// 8音階目標周波数計算
const getTargetFrequencies = (baseFreq) => {
  const semitoneRatio = Math.pow(2, 1/12);
  return [
    baseFreq,                           // ド
    baseFreq * Math.pow(semitoneRatio, 2),  // レ
    baseFreq * Math.pow(semitoneRatio, 4),  // ミ
    baseFreq * Math.pow(semitoneRatio, 5),  // ファ
    baseFreq * Math.pow(semitoneRatio, 7),  // ソ
    baseFreq * Math.pow(semitoneRatio, 9),  // ラ
    baseFreq * Math.pow(semitoneRatio, 11), // シ
    baseFreq * 2                        // ド(高)
  ];
};
```

## 📱 iPhone Safari対応要件

### 必須対応項目
1. **AudioContext**: ユーザーインタラクション後の開始
2. **マイク許可**: タップイベントでの許可要求
3. **Tone.js**: await Tone.start()の適切な実装
4. **メモリ管理**: AudioContextの適切な終了処理
5. **レスポンシブ**: タッチ操作に最適化されたUI

### テスト確認項目
1. マイク許可の取得
2. 基音再生の音声出力
3. 音程検出の精度
4. 画面タッチ操作
5. メモリリーク防止

---

**作成日**: 2025-07-19  
**VSCodeクラッシュ対策**: 完全自立型作業再開資料  
**次回作業**: Step 1から段階的実装開始  
**実装開始準備**: このドキュメント確認後、CLAUDE.md承認プロセス実行
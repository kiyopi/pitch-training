# @tonejs/piano パッケージ導入実装仕様書 v1.0

## 🎯 実装目標

**高品質Salamander Grand Pianoを使用した自然な強弱表現でのピアノ音再生**

---

## 📋 変更内容

### 現在の実装から変更
```typescript
// 変更前: 基本Tone.js Sampler
import * as Tone from "tone";
const sampler = new Tone.Sampler({...});

// 変更後: @tonejs/piano
import { Piano } from '@tonejs/piano';
const piano = new Piano({ velocities: 5 });
```

---

## 🔧 技術実装詳細

### 1. パッケージ追加
```bash
npm install @tonejs/piano
```

### 2. 実装手順

#### **Step 1: インポート変更**
```typescript
// 変更前
import * as Tone from "tone";

// 変更後
import * as Tone from "tone";
import { Piano } from '@tonejs/piano';
```

#### **Step 2: 音源初期化**
```typescript
// ピアノインスタンス作成
const piano = new Piano({
  velocities: 5  // 5段階のベロシティレイヤー使用
});

// 出力先接続
piano.toDestination();

// 音源読み込み
await piano.load();
```

#### **Step 3: 音声再生**
```typescript
// 自然減衰まで再生（推奨）
piano.keyDown({ 
  note: 'C4', 
  velocity: 0.6  // 中程度の強さ
});

// 指定時間後にリリース（オプション）
setTimeout(() => {
  piano.keyUp({ note: 'C4' });
}, 2000);
```

---

## 📝 実装コード例

### handleStart関数の完全書き換え
```typescript
const handleStart = async () => {
  try {
    console.log('🎹 高品質ピアノ音再生開始');
    
    // AudioContext開始
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
      console.log('AudioContext開始完了');
    }
    
    // ピアノインスタンス作成
    const piano = new Piano({
      velocities: 5  // 5段階ベロシティ
    });
    
    // 出力先接続
    piano.toDestination();
    
    // 音源読み込み
    console.log('高品質ピアノ音源読み込み中...');
    await piano.load();
    console.log('ピアノ音源読み込み完了');
    
    // C4を中程度の強さで再生（自然減衰）
    console.log('ピアノ音再生中...');
    piano.keyDown({ 
      note: 'C4', 
      velocity: 0.6,
      time: Tone.now()
    });
    
    console.log('✅ 高品質ピアノ音再生完了');
    
  } catch (error) {
    console.error('❌ ピアノ音再生エラー:', error);
  }
};
```

---

## 🎯 期待される改善効果

### 音質向上
- **16段階ベロシティレイヤー** → **より自然な強弱表現**
- **専用最適化** → **より高品質な音質**
- **自然減衰** → **音の途切れなし**

### 設定オプション
```typescript
// 弱い音
piano.keyDown({ note: 'C4', velocity: 0.3 });

// 中程度（推奨）
piano.keyDown({ note: 'C4', velocity: 0.6 });

// 強い音
piano.keyDown({ note: 'C4', velocity: 0.9 });
```

---

## 📊 技術仕様比較

| 項目 | 現在（Tone.js Sampler） | 変更後（@tonejs/piano） |
|------|------------------------|------------------------|
| **音源品質** | 基本サンプラー | 専用最適化済み |
| **ベロシティレイヤー** | 使用不可 | 5段階選択可能 |
| **自然減衰** | 手動設定必要 | 自動対応 |
| **パッケージサイズ** | 小 | 中（音源込み） |
| **カスタマイズ性** | 高 | ピアノ特化 |

---

## 🚨 注意点・制約

### 1. パッケージサイズ
- **@tonejs/piano**: 音源ファイルを含むため若干大きい
- **初回読み込み**: 数秒かかる可能性

### 2. 互換性
- **Tone.js基本機能**: 引き続き使用可能
- **既存コード**: 最小限の変更で移行

### 3. エラーハンドリング
```typescript
// 読み込み失敗時の対応
try {
  await piano.load();
} catch (error) {
  console.error('ピアノ音源読み込み失敗:', error);
  // フォールバック処理
}
```

---

## 📋 実装後のテスト項目

### 基本動作テスト
- [ ] パッケージインストール成功
- [ ] ピアノ音源読み込み成功
- [ ] C4音程の再生成功
- [ ] 自然減衰まで再生
- [ ] エラーが発生しない

### 音質テスト
- [ ] 音質向上が体感できる
- [ ] 強弱表現が自然
- [ ] 音の途切れがない

### パフォーマンステスト
- [ ] 初回読み込み時間が許容範囲
- [ ] iPhone Safariでも動作
- [ ] メモリ使用量が問題ない

---

## 🔄 実装手順

### Phase 1: パッケージ追加
```bash
npm install @tonejs/piano
```

### Phase 2: コード修正
- インポート文変更
- handleStart関数書き換え
- エラーハンドリング追加

### Phase 3: テスト・検証
- ローカル環境での動作確認
- iPhone Safariでの動作確認
- 音質・パフォーマンス確認

---

## ✅ 実装承認確認

### 実装前確認事項
1. **この仕様で実装を開始してよろしいですか？**
2. **ベロシティ値0.6（中程度）で問題ありませんか？**
3. **自然減衰（keyUpなし）で問題ありませんか？**
4. **パッケージ追加について問題ありませんか？**

### 実装完了条件
- @tonejs/piano パッケージが正常にインストールされる
- スタートボタン押下でC4の高品質ピアノ音が自然減衰まで再生される
- 音質向上が体感できる
- iPhone Safariでも動作する

---

**この仕様書に基づいて実装を進めてよろしいですか？**
# ランダム基音トレーニングページ作業フロー

**作成日**: 2025-07-26  
**対象**: `/training/random` ページ実装  
**作業ディレクトリ**: `/Users/isao/Documents/pitch-training`  
**基準仕様**: `RANDOM_TRAINING_UNIFIED_SPECIFICATION.md`

---

## 🚀 新セッション開始手順

### **Step 0: 環境準備**
```bash
# 1. 正しいディレクトリに移動
cd /Users/isao/Documents/pitch-training

# 2. マイクテスト完了時点に復帰
git checkout ba1a58c

# 3. 新しい作業ブランチ作成
git switch -c random-training-clean-impl-001

# 4. 依存関係確認
npm install
npm run dev  # 開発サーバー起動確認
```

### **Step 1: 現状確認**
```bash
# 現在の/training/random/の状態確認
ls -la /src/app/training/random/

# 既存の動作コード確認
ls -la /src/app/test/separated-audio/
```

---

## 📋 Phase 1: 基盤構築 (Day 1)

### **Task 1.1: プロジェクト構造準備** (30分)

#### **作業内容**
```bash
# ディレクトリ構造作成
mkdir -p /src/app/training/random/components
mkdir -p /src/app/training/random/hooks  
mkdir -p /src/app/training/random/utils
mkdir -p /src/components/common/training
mkdir -p /src/hooks/common
mkdir -p /src/utils/common
```

#### **確認ポイント**
- [ ] ディレクトリ構造が仕様書通りに作成されている
- [ ] 既存ファイルとの競合がない
- [ ] TypeScript設定が正しく適用されている

### **Task 1.2: 音響エンジン移植準備** (45分)

#### **作業内容**
1. **参照元コード分析**
   ```bash
   # /test/separated-audio/page.tsx の分析
   # - Tone.js統合部分を特定
   # - Pitchy音程検出部分を特定  
   # - 動的オクターブ補正部分を特定
   ```

2. **共通音響処理ファイル作成**
   ```typescript
   // /src/utils/common/audioProcessing.ts
   export class UnifiedAudioProcessor {
     // 3段階ノイズリダクション
     // 動的オクターブ補正
     // リアルタイム周波数検出
   }
   
   // /src/utils/common/pitchCalculation.ts  
   export class PitchCalculator {
     // 相対音程計算
     // 音程名変換
     // 精度判定
   }
   ```

#### **確認ポイント**
- [ ] `/test/separated-audio/page.tsx` から音響処理ロジックを正しく抽出
- [ ] TypeScript型定義が適切に設定されている
- [ ] ESLintエラーが発生していない

### **Task 1.3: 基本レイアウト構築** (60分)

#### **作業内容**
1. **メインページファイル作成**
   ```typescript
   // /src/app/training/random/page.tsx
   'use client';
   
   import { useState, useEffect } from 'react';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   
   export default function RandomTrainingPage() {
     return (
       <div className="min-h-screen bg-background">
         {/* Header */}
         <header className="border-b">
           <div className="container mx-auto px-4 py-6">
             <h1 className="text-2xl font-bold">ランダム基音トレーニング</h1>
           </div>
         </header>
         
         {/* Main Content */}
         <main className="container mx-auto px-4 py-8">
           {/* 基音再生セクション */}
           <Card className="mb-6">
             <CardHeader>
               <CardTitle>🎲 基音再生</CardTitle>
             </CardHeader>
             <CardContent>
               <Button className="w-48 h-12">
                 基音を再生
               </Button>
             </CardContent>
           </Card>
         </main>
       </div>
     );
   }
   ```

2. **shadcn/ui コンポーネント確認**
   ```bash
   # 必要なコンポーネントの存在確認
   ls /src/components/ui/button.tsx
   ls /src/components/ui/card.tsx
   ls /src/components/ui/progress.tsx
   ```

#### **確認ポイント**
- [ ] ページが正常にレンダリングされる
- [ ] shadcn/uiコンポーネントが正しく表示される
- [ ] レスポンシブデザインが適用されている
- [ ] 開発サーバーでアクセス確認: `http://localhost:3000/training/random`

### **Task 1.4: 状態管理基盤** (45分)

#### **作業内容**
```typescript
// /src/app/training/random/hooks/useTrainingState.ts
interface TrainingState {
  // セッション状態
  isActive: boolean;
  currentPhase: 'setup' | 'listening' | 'guiding' | 'detecting' | 'results';
  
  // 基音情報
  currentBaseNote: string;
  currentBaseFrequency: number;
  
  // 進行状況
  currentScaleIndex: number;
  completedScales: number;
  
  // 結果
  sessionResults: TrainingResult[];
  sessionScore: number;
}

export const useTrainingState = () => {
  const [state, setState] = useState<TrainingState>({
    isActive: false,
    currentPhase: 'setup',
    currentBaseNote: '',
    currentBaseFrequency: 0,
    currentScaleIndex: 0,
    completedScales: 0,
    sessionResults: [],
    sessionScore: 0
  });
  
  return {
    state,
    startSession: () => { /* 実装 */ },
    endSession: () => { /* 実装 */ },
    advanceScale: () => { /* 実装 */ },
    recordResult: (result: TrainingResult) => { /* 実装 */ }
  };
};
```

#### **確認ポイント**
- [ ] 状態管理が適切に動作する
- [ ] TypeScript型チェックが通る
- [ ] React DevToolsで状態が確認できる

---

## 📋 Phase 2: 音響システム統合 (Day 2)

### **Task 2.1: Tone.js基音再生システム** (90分)

#### **作業内容**
1. **ピアノ音源ファイル確認**
   ```bash
   # 音源ファイルの存在確認
   ls /public/audio/piano/
   # 期待: C4.mp3, D4.mp3, E4.mp3, F4.mp3, G4.mp3, A4.mp3, B4.mp3, C5.mp3, D5.mp3, E5.mp3
   ```

2. **基音再生コンポーネント作成**
   ```typescript
   // /src/app/training/random/components/BaseTonePlayer.tsx
   import { useEffect, useRef, useState } from 'react';
   import { Button } from '@/components/ui/button';
   import * as Tone from 'tone';
   
   export const BaseTonePlayer = () => {
     const [isPlaying, setIsPlaying] = useState(false);
     const [currentNote, setCurrentNote] = useState<string>('');
     const samplerRef = useRef<Tone.Sampler | null>(null);
     
     useEffect(() => {
       // Salamander Grand Piano Sampler初期化
       samplerRef.current = new Tone.Sampler({
         urls: {
           "C4": "C4.mp3", "D4": "D4.mp3", "E4": "E4.mp3", "F4": "F4.mp3", "G4": "G4.mp3",
           "A4": "A4.mp3", "B4": "B4.mp3", "C5": "C5.mp3", "D5": "D5.mp3", "E5": "E5.mp3"
         },
         baseUrl: "/audio/piano/",
         release: 1.5
       }).toDestination();
       
       return () => {
         samplerRef.current?.dispose();
       };
     }, []);
     
     const playRandomBaseTone = async () => {
       // ランダム基音選択・再生ロジック
     };
     
     return (
       <div className="space-y-4">
         <Button 
           onClick={playRandomBaseTone}
           disabled={isPlaying}
           className="w-48 h-12 text-lg font-semibold"
         >
           {isPlaying ? '再生中...' : '🎲 ランダム基音再生'}
         </Button>
         {currentNote && (
           <p className="text-center text-lg">
             現在の基音: <span className="font-bold">{currentNote}</span>
           </p>
         )}
       </div>
     );
   };
   ```

#### **確認ポイント**
- [ ] 10種類の基音がランダムに選択される
- [ ] ピアノ音源が正常に再生される
- [ ] AudioContextが適切に初期化される
- [ ] 再生中は他の操作を無効化する

### **Task 2.2: 音程検出システム移植** (120分)

#### **作業内容**
1. **Pitchy統合とマイク管理**
   ```typescript
   // /src/app/training/random/hooks/usePitchDetection.ts
   import { useEffect, useRef, useState } from 'react';
   import { PitchDetector } from 'pitchy';
   
   export const usePitchDetection = () => {
     const [isDetecting, setIsDetecting] = useState(false);
     const [currentPitch, setCurrentPitch] = useState<number | null>(null);
     const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
     
     const audioContextRef = useRef<AudioContext | null>(null);
     const analyserRef = useRef<AnalyserNode | null>(null);
     const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);
     
     // /test/separated-audio/page.tsx からの音程検出ロジックを移植
     
     return {
       isDetecting,
       currentPitch,
       startDetection: () => { /* 実装 */ },
       stopDetection: () => { /* 実装 */ },
       getCurrentNote: () => { /* 実装 */ }
     };
   };
   ```

2. **動的オクターブ補正の移植**
   ```typescript
   // /src/utils/common/harmonicCorrection.ts
   export const correctHarmonicFrequency = (
     detectedFreq: number,
     expectedFreq: number,
     tolerance: number = 50
   ): { correctedFreq: number; confidence: number } => {
     // /test/separated-audio/ からオクターブ補正ロジックを移植
   };
   ```

#### **確認ポイント**
- [ ] マイクロフォンアクセスが正常に動作する
- [ ] リアルタイム音程検出が機能する
- [ ] 動的オクターブ補正が適用される
- [ ] 3段階ノイズリダクションが動作する

### **Task 2.3: 音響システム統合テスト** (60分)

#### **作業内容**
1. **統合テストページ更新**
   ```typescript
   // /src/app/training/random/page.tsx に統合
   export default function RandomTrainingPage() {
     const trainingState = useTrainingState();
     const pitchDetection = usePitchDetection();
     
     return (
       <div className="min-h-screen bg-background">
         {/* 基音再生セクション */}
         <BaseTonePlayer onPlay={handleBaseTonePlay} />
         
         {/* 音程検出セクション */}
         <PitchDetectionDisplay 
           isActive={pitchDetection.isDetecting}
           currentPitch={pitchDetection.currentPitch}
         />
       </div>
     );
   }
   ```

2. **エラーハンドリング強化**
   ```typescript
   // マイク許可エラー
   // 音源読み込みエラー
   // AudioContext suspend対応
   ```

#### **確認ポイント**
- [ ] 基音再生から音程検出への自動遷移
- [ ] iPhone Safariでの動作確認
- [ ] エラーケースでの適切な表示

---

## 📋 Phase 3: UI完成 (Day 3)

### **Task 3.1: ドレミガイド表示** (90分)

#### **作業内容**
1. **音階ガイドコンポーネント**
   ```typescript
   // /src/app/training/random/components/ScaleGuide.tsx
   type ScaleState = 'inactive' | 'active' | 'correct' | 'incorrect';
   
   export const ScaleGuide = () => {
     const scales = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
     const [scaleStates, setScaleStates] = useState<ScaleState[]>(
       new Array(8).fill('inactive')
     );
     
     return (
       <Card>
         <CardHeader>
           <CardTitle>🎵 ドレミファソラシド ガイド</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-8 gap-2">
             {scales.map((scale, index) => (
               <div
                 key={index}
                 className={cn(
                   "w-12 h-12 flex items-center justify-center rounded-lg font-bold text-sm transition-all",
                   {
                     'bg-muted text-muted-foreground': scaleStates[index] === 'inactive',
                     'bg-primary text-primary-foreground animate-pulse': scaleStates[index] === 'active',
                     'bg-green-500 text-white': scaleStates[index] === 'correct',
                     'bg-red-500 text-white': scaleStates[index] === 'incorrect'
                   }
                 )}
               >
                 {scale}
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
     );
   };
   ```

#### **確認ポイント**
- [ ] 8音階が正しく表示される
- [ ] 状態変化のアニメーションが滑らか
- [ ] モバイル表示でレイアウトが崩れない

### **Task 3.2: リアルタイム検出表示** (75分)

#### **作業内容**
```typescript
// /src/app/training/random/components/PitchDetectionDisplay.tsx
export const PitchDetectionDisplay = ({ 
  isActive, 
  currentPitch, 
  targetFrequency,
  accuracy 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎤 音程検出</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 検出周波数表示 */}
        <div className="text-center">
          <div className="text-3xl font-bold">
            {currentPitch ? `${currentPitch.toFixed(1)} Hz` : '---'}
          </div>
          <div className="text-sm text-muted-foreground">
            検出周波数
          </div>
        </div>
        
        {/* 精度メーター */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>精度</span>
            <span>{accuracy}%</span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>
        
        {/* 音量バー */}
        <div className="space-y-2">
          <div className="text-sm">音量レベル</div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${volumeLevel}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### **確認ポイント**
- [ ] リアルタイム周波数表示が正確
- [ ] 精度メーターが適切に動作
- [ ] 音量バーがiPhone Safariで正常表示

### **Task 3.3: 結果・採点システム** (90分)

#### **作業内容**
1. **採点ロジック実装**
   ```typescript
   // /src/utils/common/scoreCalculation.ts
   export const calculateAccuracy = (
     detectedFreq: number,
     targetFreq: number
   ): number => {
     const freqDiff = Math.abs(detectedFreq - targetFreq);
     const tolerance = targetFreq * 0.02; // 2%許容
     return Math.max(0, 100 - (freqDiff / tolerance) * 100);
   };
   
   export const calculateSessionScore = (
     results: TrainingResult[]
   ): SessionScore => {
     // 総合スコア計算
     // 平均精度計算
     // 平均反応時間計算
   };
   ```

2. **結果表示コンポーネント**
   ```typescript
   // /src/app/training/random/components/ResultsDisplay.tsx
   export const ResultsDisplay = ({ sessionScore, onRestart, onShare }) => {
     return (
       <Card>
         <CardHeader>
           <CardTitle>🎯 トレーニング結果</CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           {/* 総合スコア */}
           <div className="text-center">
             <div className="text-4xl font-bold text-primary">
               {sessionScore.totalScore}/100
             </div>
             <div className="text-sm text-muted-foreground">総合スコア</div>
           </div>
           
           {/* 詳細統計 */}
           <div className="grid grid-cols-2 gap-4">
             <div className="text-center">
               <div className="text-xl font-semibold">{sessionScore.averageAccuracy}%</div>
               <div className="text-sm text-muted-foreground">平均精度</div>
             </div>
             <div className="text-center">
               <div className="text-xl font-semibold">{sessionScore.averageResponseTime}s</div>
               <div className="text-sm text-muted-foreground">平均反応時間</div>
             </div>
           </div>
           
           {/* アクションボタン */}
           <div className="flex gap-2 justify-center">
             <Button onClick={onRestart}>もう一度</Button>
             <Button variant="secondary" onClick={onShare}>結果を共有</Button>
           </div>
         </CardContent>
       </Card>
     );
   };
   ```

#### **確認ポイント**
- [ ] 採点計算が正確に動作する
- [ ] 結果表示が分かりやすい
- [ ] 統計情報が適切に表示される

---

## 📋 Phase 4: SNS共有・最終調整 (Day 4)

### **Task 4.1: SNS共有機能** (120分)

#### **作業内容**
1. **共有データ生成**
   ```typescript
   // /src/utils/common/shareUtils.ts
   export const generateShareText = (sessionScore: SessionScore): string => {
     return `🎵 相対音感トレーニング結果 🎵

モード: ランダム基音
スコア: ${sessionScore.totalScore}/100
精度: ${sessionScore.averageAccuracy}%
平均反応時間: ${sessionScore.averageResponseTime}秒
完了音階: ${sessionScore.completedScales}/8

#相対音感 #音楽訓練 #PitchTraining
https://kiyopi.github.io/pitch-training/training/random`;
   };
   
   export const shareToTwitter = (text: string) => {
     const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
     window.open(url, '_blank');
   };
   
   export const shareToClipboard = async (text: string) => {
     await navigator.clipboard.writeText(text);
   };
   ```

2. **共有ボタンコンポーネント**
   ```typescript
   // /src/app/training/random/components/ShareButton.tsx
   export const ShareButton = ({ sessionScore }) => {
     return (
       <div className="flex gap-2 justify-center">
         <Button 
           variant="outline" 
           size="sm"
           onClick={() => shareToTwitter(generateShareText(sessionScore))}
         >
           <Twitter className="w-4 h-4 mr-2" />
           Twitter
         </Button>
         <Button 
           variant="outline" 
           size="sm"
           onClick={() => shareToClipboard(generateShareText(sessionScore))}
         >
           <Copy className="w-4 h-4 mr-2" />
           コピー
         </Button>
       </div>
     );
   };
   ```

#### **確認ポイント**
- [ ] Twitter共有が正常に動作する
- [ ] クリップボードコピーが動作する
- [ ] 共有テキストが適切にフォーマットされる

### **Task 4.2: エラーハンドリング強化** (60分)

#### **作業内容**
1. **マイク許可チェック**
   ```typescript
   const checkMicrophonePermission = async (): Promise<MicrophoneState> => {
     try {
       if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';
       
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       stream.getTracks().forEach(track => track.stop());
       return 'granted';
     } catch (error) {
       if (error.name === 'NotAllowedError') return 'denied';
       return 'unavailable';
     }
   };
   ```

2. **エラー状態表示**
   ```typescript
   // マイク未許可時の誘導UI
   // 音源読み込み失敗時のリトライUI
   // ブラウザ非対応時の案内UI
   ```

#### **確認ポイント**
- [ ] 各種エラーケースで適切な表示
- [ ] マイクテストページへの誘導が機能
- [ ] ユーザーフレンドリーなエラーメッセージ

### **Task 4.3: 最終テスト・最適化** (90分)

#### **作業内容**
1. **総合動作テスト**
   ```bash
   # 開発サーバーでのテスト
   npm run dev
   
   # ビルドテスト
   npm run build
   
   # ESLint・TypeScriptチェック
   npm run lint
   npx tsc --noEmit
   ```

2. **デバイス別動作確認**
   - [ ] iPhone Safari
   - [ ] Android Chrome
   - [ ] PC Chrome/Firefox/Edge

3. **パフォーマンス最適化**
   - [ ] バンドルサイズ確認
   - [ ] メモリリーク確認
   - [ ] AudioContext適切な解放

#### **確認ポイント**
- [ ] 全機能が期待通りに動作する
- [ ] エラーが発生しない
- [ ] パフォーマンスが許容範囲内

---

## 📋 Phase 5: デプロイ・本番確認 (Day 5)

### **Task 5.1: GitHub Push・Actions確認** (30分)

#### **作業内容**
```bash
# 全変更をコミット
git add .
git commit -m "ランダム基音トレーニングページ完全実装

- 1ページ完結型UI実装
- Tone.js + Salamander Piano音源統合
- Pitchy音程検出システム移植
- shadcn/ui準拠のデザイン実装
- SNS共有機能実装
- iPhone Safari対応完了"

# プッシュ
git push -u origin random-training-clean-impl-001
```

#### **確認ポイント**
- [ ] GitHub Actionsが正常実行される
- [ ] ビルドエラーが発生しない
- [ ] デプロイが完了する

### **Task 5.2: 本番環境確認** (45分)

#### **作業内容**
```
# GitHub Pages URL確認
https://kiyopi.github.io/pitch-training/training/random

# 機能確認チェックリスト
□ ページの正常表示
□ 基音再生システム動作
□ マイクアクセス・音程検出動作
□ ドレミガイド表示・アニメーション
□ リアルタイム検出表示
□ 採点・結果表示
□ SNS共有機能
□ エラーハンドリング
□ レスポンシブデザイン
```

#### **確認ポイント**
- [ ] 全機能がGitHub Pages上で動作する
- [ ] iPhone実機での動作確認
- [ ] 音源ファイルの正常読み込み確認

### **Task 5.3: ドキュメント更新** (30分)

#### **作業内容**
```markdown
# 完成報告書作成
## 実装完了機能
- ランダム基音再生（10種類）
- ドレミ8音階ガイド
- リアルタイム音程検出
- 採点・結果表示システム
- SNS共有機能（Twitter・クリップボード）

## 技術実装詳細
- Tone.js + Salamander Grand Piano音源
- Pitchy McLeod Pitch Method
- 動的オクターブ補正システム
- 3段階ノイズリダクション
- shadcn/ui完全準拠

## 品質保証
- TypeScript型安全性: 100%
- ESLintエラー: 0件
- iPhone Safari: 動作確認済み
- GitHub Pages: デプロイ成功
```

---

## ✅ 各フェーズの完成基準

### **Phase 1完成基準**
- [ ] 基本レイアウトが表示される
- [ ] shadcn/uiコンポーネントが正常動作
- [ ] 開発サーバーでページアクセス可能
- [ ] TypeScript・ESLintエラーなし

### **Phase 2完成基準**
- [ ] ランダム基音再生が動作する
- [ ] マイクアクセス・音程検出が動作する
- [ ] iPhone Safariでの音響システム動作確認
- [ ] 動的オクターブ補正が適用される

### **Phase 3完成基準**
- [ ] ドレミガイドのアニメーション動作
- [ ] リアルタイム検出表示が正確
- [ ] 採点システムが正常計算
- [ ] 結果表示が分かりやすく表示

### **Phase 4完成基準**
- [ ] SNS共有機能が動作する
- [ ] エラーハンドリングが適切
- [ ] 全機能の統合動作確認
- [ ] パフォーマンス最適化完了

### **Phase 5完成基準**
- [ ] GitHub Pages本番デプロイ成功
- [ ] iPhone実機での全機能動作確認
- [ ] ドキュメント・報告書完成
- [ ] 次期開発（3モード展開）準備完了

---

## 🎯 最終目標達成確認

### **機能完成度: 100%**
- [x] ランダム基音再生（10種類）
- [x] ドレミ8音階ガイド
- [x] リアルタイム音程検出
- [x] 採点・結果表示
- [x] SNS共有機能

### **品質基準: 100%**
- [x] iPhone Safari 動作確認
- [x] TypeScript エラーゼロ
- [x] ESLint エラーゼロ
- [x] shadcn/ui完全準拠
- [x] GitHub Pages デプロイ成功

### **UX基準: 100%**
- [x] 1ページ完結型の直感的操作
- [x] レスポンシブデザイン
- [x] 適切なエラーハンドリング
- [x] アクセシビリティ対応

---

**この作業フローに従って、確実に動作するランダム基音トレーニングページを完成させてください！**
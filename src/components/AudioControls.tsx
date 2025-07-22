'use client';

import React from 'react';
import { Play, Square, Volume2, Mic, MicOff, RotateCcw } from 'lucide-react';
import RippleButton from './RippleButton';

// 基音情報インターフェース
export interface BaseToneInfo {
  name: string;
  note: string;
  frequency: number;
}

// AudioControls設定インターフェース
export interface AudioControlsProps {
  // 基音制御
  currentBaseTone?: BaseToneInfo;
  isBaseTonePlaying?: boolean;
  onPlayBaseTone?: () => void;
  onStopBaseTone?: () => void;
  onNewBaseTone?: () => void;
  baseNotes?: string[];
  onPlayNote?: (note: string) => void;
  
  // マイクロフォン制御
  isMicrophoneActive?: boolean;
  onStartMicrophone?: () => void;
  onStopMicrophone?: () => void;
  
  // 全停止
  onStopAll?: () => void;
  
  // UI設定
  layout?: 'horizontal' | 'vertical' | 'grid';
  showBaseToneInfo?: boolean;
  showNoteGrid?: boolean;
  showMicrophoneControls?: boolean;
  showStopAll?: boolean;
  
  // カスタマイズ
  className?: string;
  disabled?: boolean;
  rippleEffect?: boolean;
}

/**
 * AudioControlsコンポーネント
 * 
 * 音声制御UI統合コンポーネント
 * - 基音再生制御
 * - マイクロフォン制御 
 * - 音程テスト機能
 * - 全停止機能
 * 
 * 各トレーニングモードで共通使用される音声制御UIを統合
 */
export default function AudioControls({
  // 基音制御
  currentBaseTone,
  isBaseTonePlaying = false,
  onPlayBaseTone,
  onStopBaseTone,
  onNewBaseTone,
  baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  onPlayNote,
  
  // マイクロフォン制御
  isMicrophoneActive = false,
  onStartMicrophone,
  onStopMicrophone,
  
  // 全停止
  onStopAll,
  
  // UI設定
  layout = 'vertical',
  showBaseToneInfo = true,
  showNoteGrid = false,
  showMicrophoneControls = true,
  showStopAll = true,
  
  // カスタマイズ
  className = '',
  disabled = false,
  rippleEffect = true
}: AudioControlsProps) {

  const containerClass = `
    ${layout === 'horizontal' ? 'flex flex-row gap-6 items-center justify-center flex-wrap' :
      layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
      'flex flex-col gap-6'
    } ${className}
  `;

  return (
    <div className={containerClass}>
      {/* 基音情報表示 */}
      {showBaseToneInfo && currentBaseTone && (
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🎹 現在の基音</h3>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {currentBaseTone.note}
          </div>
          <div className="text-lg text-gray-700 mb-1">
            {currentBaseTone.name}
          </div>
          <div className="text-sm text-gray-600">
            {currentBaseTone.frequency.toFixed(1)} Hz
          </div>
        </div>
      )}

      {/* 基音制御ボタン */}
      {(onPlayBaseTone || onNewBaseTone) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onPlayBaseTone && (
            <RippleButton
              onClick={onPlayBaseTone}
              disabled={disabled || isBaseTonePlaying}
              size="lg"
              colorScheme="green-blue"
              rippleAnimation={rippleEffect && !isBaseTonePlaying}
              className="flex items-center space-x-3"
            >
              <Volume2 className="w-6 h-6" />
              <span>
                {isBaseTonePlaying ? '🎵 再生中...' : '🎹 基音を聞く (2秒)'}
              </span>
            </RippleButton>
          )}

          {onStopBaseTone && isBaseTonePlaying && (
            <button
              onClick={onStopBaseTone}
              disabled={disabled}
              className="group flex items-center space-x-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-5 h-5" />
              <span>⏹️ 停止</span>
            </button>
          )}

          {onNewBaseTone && (
            <button
              onClick={onNewBaseTone}
              disabled={disabled || isBaseTonePlaying}
              className="group flex items-center space-x-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
              <span>🎲 別の基音</span>
            </button>
          )}
        </div>
      )}

      {/* 音程テスト用ノートグリッド */}
      {showNoteGrid && onPlayNote && (
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎵 音程テスト</h3>
          <div className="grid grid-cols-4 gap-3">
            {baseNotes.map((note) => (
              <button
                key={note}
                onClick={() => onPlayNote(note)}
                disabled={disabled || isBaseTonePlaying}
                className={`px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                  disabled || isBaseTonePlaying
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:scale-105 shadow-lg'
                }`}
              >
                <Play className="w-4 h-4 mx-auto mb-1" />
                {note}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* マイクロフォン制御 */}
      {showMicrophoneControls && (onStartMicrophone || onStopMicrophone) && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
          <h3 className="text-lg font-bold text-purple-800 mb-4 text-center">🎤 マイクロフォン制御</h3>
          <div className="flex gap-4 justify-center">
            {onStartMicrophone && !isMicrophoneActive && (
              <RippleButton
                onClick={onStartMicrophone}
                disabled={disabled}
                size="md"
                colorScheme="purple-blue"
                rippleAnimation={rippleEffect}
                className="flex items-center space-x-2"
              >
                <Mic className="w-5 h-5" />
                <span>🎤 音程検出開始</span>
              </RippleButton>
            )}

            {onStopMicrophone && isMicrophoneActive && (
              <button
                onClick={onStopMicrophone}
                disabled={disabled}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MicOff className="w-5 h-5" />
                <span>🔇 音程検出停止</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 全停止ボタン */}
      {showStopAll && onStopAll && (
        <div className="text-center">
          <button
            onClick={onStopAll}
            disabled={disabled}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-5 h-5 inline mr-2" />
            🛑 全停止
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 使用例:
 * 
 * // 基本的な基音制御
 * <AudioControls
 *   currentBaseTone={{name: 'C4', note: 'ド4', frequency: 261.63}}
 *   isBaseTonePlaying={isPlaying}
 *   onPlayBaseTone={handlePlay}
 *   onNewBaseTone={handleNewTone}
 * />
 * 
 * // フル機能版
 * <AudioControls
 *   currentBaseTone={baseTone}
 *   isBaseTonePlaying={isPlaying}
 *   onPlayBaseTone={handlePlay}
 *   onStopBaseTone={handleStop}
 *   onNewBaseTone={handleNewTone}
 *   isMicrophoneActive={isMicActive}
 *   onStartMicrophone={handleStartMic}
 *   onStopMicrophone={handleStopMic}
 *   onStopAll={handleStopAll}
 *   showNoteGrid={true}
 *   baseNotes={['C4', 'D4', 'E4']}
 *   onPlayNote={handlePlayNote}
 *   layout="grid"
 * />
 * 
 * // マイクロフォンのみ
 * <AudioControls
 *   isMicrophoneActive={isMicActive}
 *   onStartMicrophone={handleStartMic}
 *   onStopMicrophone={handleStopMic}
 *   showBaseToneInfo={false}
 *   showStopAll={false}
 * />
 */
'use client';

import React from 'react';

// TrainingCardの設定インターフェース
export interface TrainingCardProps {
  colorScheme: 'green' | 'purple' | 'orange';
  title: string;
  mainText: string | React.ReactNode;
  subText?: string;
  className?: string;
}

// カラースキーム定義
const cardColorSchemes = {
  green: {
    bg: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    titleText: 'text-blue-800',
    subText: 'text-blue-600'
  },
  purple: {
    bg: 'from-purple-50 to-indigo-50',
    border: 'border-purple-200',
    titleText: 'text-purple-800',
    subText: 'text-purple-600'
  },
  orange: {
    bg: 'from-orange-50 to-yellow-50',
    border: 'border-orange-200',
    titleText: 'text-orange-800',
    subText: 'text-orange-600'
  }
};

export default function TrainingCard({
  colorScheme,
  title,
  mainText,
  subText,
  className = ''
}: TrainingCardProps) {
  const colors = cardColorSchemes[colorScheme];
  
  return (
    <div className={`mt-6 p-4 bg-gradient-to-r ${colors.bg} rounded-xl border ${colors.border} ${className}`}>
      <p className={`text-lg font-bold ${colors.titleText}`}>
        {title}: <span className="text-2xl">{mainText}</span>
      </p>
      {subText && (
        <p className={`text-sm ${colors.subText} mt-1`}>
          {subText}
        </p>
      )}
    </div>
  );
}

// 説明カードコンポーネント
export interface InstructionCardProps {
  title: string;
  steps: { number: string; text: string }[];
  colorScheme: 'green' | 'purple' | 'orange';
  className?: string;
}

const instructionColorSchemes = {
  green: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700'
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-700'
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-700'
  }
};

export function InstructionCard({
  title,
  steps,
  colorScheme,
  className = ''
}: InstructionCardProps) {
  const colors = instructionColorSchemes[colorScheme];
  
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12 border border-gray-100 ${className}`}>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="text-left space-y-3 text-gray-600">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className={`w-8 h-8 ${colors.bg} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
              {step.number}
            </span>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
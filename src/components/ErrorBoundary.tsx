'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * 
 * Reactアプリケーション内のエラーを捕捉し、
 * ユーザーフレンドリーなフォールバックUIを表示
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラー状態を更新
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラー情報を記録
    this.setState({
      error,
      errorInfo
    });

    // 開発環境でのデバッグ用ログ出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  private handleRetry = (): void => {
    // エラー状態をリセット
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  private handleGoHome = (): void => {
    // ホームページに戻る
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // カスタムフォールバックUIが提供されている場合は使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトエラーUI
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">エラーが発生しました</CardTitle>
              <CardDescription>
                申し訳ございません。アプリケーションでエラーが発生しました。
                下記の操作をお試しください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* エラー詳細（開発環境または詳細表示が有効な場合） */}
              {this.props.showDetails && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 text-sm mb-2">エラー詳細:</h4>
                  <code className="text-xs text-red-700 block overflow-x-auto">
                    {this.state.error.message}
                  </code>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再試行
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  ホームに戻る
                </Button>
              </div>

              {/* ヘルプメッセージ */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  問題が解決しない場合は、ブラウザを更新するか、
                  <br />
                  しばらく時間をおいて再度お試しください。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // エラーが発生していない場合は子コンポーネントを表示
    return this.props.children;
  }
}

/**
 * Error Boundary Hook-style Wrapper
 * 
 * 関数コンポーネントでError Boundaryを使用するためのラッパー
 */
interface WithErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
}

export const withErrorBoundary = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Error Boundary Provider
 * 
 * アプリケーション全体でError Boundaryを提供
 */
export function ErrorBoundaryProvider({ children, showDetails = false }: WithErrorBoundaryProps) {
  return (
    <ErrorBoundary showDetails={showDetails}>
      {children}
    </ErrorBoundary>
  );
}
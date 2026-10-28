import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Activity, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled React error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f1f4f9] flex flex-col items-center justify-center p-6 text-slate-800">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-2">
              A股资金流终端显示异常
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              页面渲染过程中遭遇临时异常，核心量化数据服务与模拟引擎保持安全。点击下方按钮即可一键重新初始化并恢复看板。
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left overflow-auto max-h-36">
                <p className="text-xs font-mono text-rose-600 font-bold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-tight">
                    {this.state.error.stack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>立即重新加载恢复页面</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Activity className="w-4 h-4 text-slate-500" />
                <span>尝试直接重绘</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400 flex items-center gap-2">
            <span>A股主力资金流向全景量化复盘门户网站</span>
            <span>·</span>
            <span>v2.5.0 稳定模式</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

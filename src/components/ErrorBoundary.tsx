import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleResetBackup = () => {
    try {
      localStorage.removeItem('simple_desdoc_project_backup');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-black text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-lg p-6 space-y-4 shadow-2xl">
            <h1 className="text-base font-bold text-white uppercase tracking-wide">
              Editor Recovery
            </h1>
            <p className="text-xs text-neutral-300 leading-relaxed">
              The editor hit an unexpected error while rendering your last change. Your work is safe—click Recover to continue editing.
            </p>
            <div className="text-[11px] bg-black border border-neutral-800 p-2.5 rounded text-neutral-400 break-words">
              {this.state.errorMessage}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={this.handleRecover}
                className="flex-1 py-2 px-3 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Recover Editor
              </button>
              <button
                onClick={this.handleResetBackup}
                className="py-2 px-3 bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700 text-xs rounded transition-colors cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

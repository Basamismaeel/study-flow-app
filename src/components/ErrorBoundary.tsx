import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-8 max-w-2xl mx-auto space-y-4">
          <h1 className="text-xl font-semibold text-destructive">Something went wrong</h1>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

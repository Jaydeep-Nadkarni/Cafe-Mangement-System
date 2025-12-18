import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Error boundary component to catch chart rendering failures
 * Provides fallback UI with retry mechanism
 */
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send error to logging service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="w-full rounded-lg bg-red-50 border-2 border-red-200 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {this.props.fallbackTitle || 'Chart Rendering Error'}
              </h3>
              
              <p className="text-sm text-red-700 mb-4">
                {this.props.fallbackMessage || 
                  'We encountered an issue displaying this chart. This might be due to invalid data or a temporary glitch.'}
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 text-xs bg-red-100 p-3 rounded">
                  <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                    Error Details
                  </summary>
                  <pre className="text-red-900 whitespace-pre-wrap overflow-x-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Retry button */}
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                         text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
                {this.state.retryCount > 0 && (
                  <span className="text-xs opacity-80">({this.state.retryCount})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;

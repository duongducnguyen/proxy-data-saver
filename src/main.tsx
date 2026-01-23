import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('main.tsx loading...');
console.log('electronAPI available:', typeof window !== 'undefined' && !!window.electronAPI);

// Error boundary for debugging
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ErrorBoundary caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
          <pre style={{ color: '#fbbf24', whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ color: '#9ca3af', fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
console.log('Root element:', root);

if (root) {
  try {
    console.log('Creating React root...');
    const reactRoot = ReactDOM.createRoot(root);
    console.log('Rendering App...');
    reactRoot.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('Render called successfully');
  } catch (err) {
    console.error('Failed to render:', err);
    root.innerHTML = `<div style="color: white; padding: 20px;">
      <h1>Failed to start application</h1>
      <pre>${err}</pre>
    </div>`;
  }
} else {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="color: white; padding: 20px;">Root element not found</div>';
}

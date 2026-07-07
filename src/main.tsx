import {Component, StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type BoundaryProps = {
  children: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
  message: string;
};

class AppErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  declare props: BoundaryProps;

  state: BoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown runtime error',
    };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('App runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{padding: '24px', maxWidth: '820px', margin: '0 auto', color: '#1f2937'}}>
          <h1 style={{fontSize: '20px', marginBottom: '12px'}}>Page Recovery Mode</h1>
          <p style={{lineHeight: 1.6, marginBottom: '8px'}}>
            A runtime error was caught, so a blank page was prevented.
          </p>
          <p style={{lineHeight: 1.6, opacity: 0.8}}>Error: {this.state.message || 'Unavailable'}</p>
          <p style={{marginTop: '16px'}}>
            Try refreshing the page. If the issue persists, clear browser cache and retry.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  console.error('App bootstrap failed:', error);
  rootElement.innerHTML = `
    <main style="padding:24px;max-width:820px;margin:0 auto;color:#1f2937;line-height:1.6;">
      <h1 style="font-size:20px;margin-bottom:12px;">Page Recovery Mode</h1>
      <p style="margin-bottom:8px;">Application bootstrap failed, so a blank page was prevented.</p>
      <p style="opacity:.8;">Please refresh the page and try again.</p>
    </main>
  `;
}

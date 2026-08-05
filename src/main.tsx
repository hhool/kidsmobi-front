import {Component, StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const CHUNK_RECOVERY_STORAGE_KEY = 'kidsmobi:chunk-recovery';
const CHUNK_RECOVERY_WINDOW_MS = 5 * 60 * 1000;
const CHUNK_RECOVERY_MAX_RELOADS = 1;

function isDynamicImportChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Failed to fetch dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
    || /error loading dynamically imported module/i.test(message);
}

function shouldAttemptChunkRecoveryNow(): boolean {
  try {
    const raw = sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { count?: number; timestamp?: number };
    const count = Number(parsed?.count || 0);
    const timestamp = Number(parsed?.timestamp || 0);
    const freshWindow = Date.now() - timestamp < CHUNK_RECOVERY_WINDOW_MS;
    if (!freshWindow) return true;
    return count < CHUNK_RECOVERY_MAX_RELOADS;
  } catch {
    return true;
  }
}

function markChunkRecoveryAttempt(): void {
  try {
    const raw = sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { count?: number; timestamp?: number }) : {};
    const count = Number(parsed?.count || 0) + 1;
    sessionStorage.setItem(
      CHUNK_RECOVERY_STORAGE_KEY,
      JSON.stringify({ count, timestamp: Date.now() }),
    );
  } catch {
    // Ignore session storage failures and continue without persistence.
  }
}

function reloadWithCacheBust(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('__chunk_recovery', String(Date.now()));
  window.location.replace(url.toString());
}

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

    if (isDynamicImportChunkError(error) && shouldAttemptChunkRecoveryNow()) {
      markChunkRecoveryAttempt();
      reloadWithCacheBust();
    }
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

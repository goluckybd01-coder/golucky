import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  timestamp: string | null;
  correlationId: string | null;
}

interface Props {
  children: React.ReactNode;
  title?: string;
}

function generateCorrelationId(): string {
  const time = Date.now().toString(36);
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().split('-')[0]
      : Math.random().toString(36).slice(2, 10);
  return `err_${time}_${rand}`;
}

export class PageErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    timestamp: null,
    correlationId: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    const correlationId = generateCorrelationId();
    if (typeof window !== 'undefined') {
      (window as unknown as { __lastErrorCorrelationId?: string }).__lastErrorCorrelationId =
        correlationId;
    }
    return {
      hasError: true,
      error,
      timestamp: new Date().toISOString(),
      correlationId,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info });
    // eslint-disable-next-line no-console
    console.error(`[PageErrorBoundary][${this.state.correlationId}]`, {
      correlationId: this.state.correlationId,
      title: this.props.title,
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : null,
      at: new Date().toISOString(),
    });
  }

  reset = () =>
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      timestamp: null,
      correlationId: null,
    });

  copyReport = async () => {
    const { error, errorInfo, timestamp, correlationId } = this.state;
    const report =
      `[${this.props.title ?? 'PageErrorBoundary'}] ${timestamp ?? ''}\n` +
      `Correlation ID: ${correlationId ?? '(none)'}\n` +
      `URL: ${typeof window !== 'undefined' ? window.location.href : ''}\n` +
      `Name: ${error?.name}\n` +
      `Message: ${error?.message}\n\n` +
      `--- Stack ---\n${error?.stack ?? '(no stack)'}\n\n` +
      `--- Component Stack ---\n${errorInfo?.componentStack ?? '(no component stack)'}`;
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, timestamp, correlationId } = this.state;
    const msg = error?.message ?? '';
    const fieldMatch =
      msg.match(/reading '([^']+)'/) ||
      msg.match(/property '([^']+)'/) ||
      msg.match(/column "([^"]+)"/) ||
      msg.match(/"([^"]+)" does not exist/);
    const failingField = fieldMatch?.[1];

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-destructive">
              {this.props.title ?? 'Something went wrong'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {timestamp} · {typeof window !== 'undefined' ? window.location.pathname : ''}
            </p>
            {correlationId && (
              <button
                onClick={() => navigator.clipboard?.writeText(correlationId).catch(() => {})}
                title="Click to copy correlation ID"
                className="mt-1 inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/70"
              >
                ID: {correlationId}
              </button>
            )}
          </div>

          <div className="grid grid-cols-[110px,1fr] gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">Name</span>
            <span className="font-mono break-all">{error?.name}</span>
            <span className="font-semibold text-muted-foreground">Message</span>
            <span className="font-mono break-all text-destructive">{error?.message}</span>
            {failingField && (
              <>
                <span className="font-semibold text-muted-foreground">Failing field</span>
                <span className="font-mono break-all text-amber-600">{failingField}</span>
              </>
            )}
          </div>

          <details open className="rounded bg-background/50 p-2">
            <summary className="cursor-pointer text-xs font-semibold">Stack trace</summary>
            <pre className="text-[11px] mt-2 overflow-auto max-h-64 whitespace-pre-wrap">
              {error?.stack ?? '(no stack)'}
            </pre>
          </details>

          <details className="rounded bg-background/50 p-2">
            <summary className="cursor-pointer text-xs font-semibold">Component stack</summary>
            <pre className="text-[11px] mt-2 overflow-auto max-h-64 whitespace-pre-wrap">
              {errorInfo?.componentStack ?? '(no component stack)'}
            </pre>
          </details>

          <div className="flex gap-2 pt-1">
            <button
              onClick={this.reset}
              className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
            >
              Retry
            </button>
            <button
              onClick={this.copyReport}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted"
            >
              Copy report
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;

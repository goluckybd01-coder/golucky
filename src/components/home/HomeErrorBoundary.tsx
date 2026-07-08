import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

class HomeErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error("[HomeErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null, info: null });
  handleReload = () => window.location.reload();

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen w-full flex items-center justify-center p-6 text-white"
        style={{ background: "#050505" }}
      >
        <div
          className="w-full max-w-lg rounded-[20px] border border-white/10 bg-white/[0.035] backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
          style={{ borderColor: "#F5C86A55" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl grid place-items-center" style={{ background: "#EF444422", border: "1px solid #EF444455" }}>
              <AlertTriangle className="h-5 w-5" style={{ color: "#FCA5A5" }} />
            </div>
            <div>
              <h1 className="font-display font-bold text-[17px] leading-none">Homepage hit a snag</h1>
              <p className="mt-1 text-[12px] text-white/60">
                Something crashed while rendering. Your account is safe.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Error</div>
            <div className="mt-1 text-[12px] font-mono text-red-300 break-words">
              {error.name}: {error.message}
            </div>
          </div>

          {info?.componentStack && (
            <details className="rounded-xl border border-white/10 bg-black/40 p-3 text-[11px]">
              <summary className="cursor-pointer text-white/70 select-none">Component stack</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-white/60">
                {info.componentStack.trim()}
              </pre>
            </details>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={this.handleReset}
              className="flex-1 h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #FDE68A, #B8862F)", color: "#000" }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 h-10 rounded-xl text-[12px] font-semibold border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] transition"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default HomeErrorBoundary;

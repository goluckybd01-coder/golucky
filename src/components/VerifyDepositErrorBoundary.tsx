import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null; retryKey: number }

export class VerifyDepositErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): State {
    return { error, retryKey: 0 };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[VerifyDeposit] crash:", error, info);
  }

  reset = () => {
    this.setState((prev) => ({ error: null, retryKey: prev.retryKey + 1 }));
  };

  render() {
    if (!this.state.error) {
      return (
        <div key={this.state.retryKey}>
          {this.props.children}
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold">Verification unavailable</h1>
          <p className="text-sm text-white/70">
            Something went wrong while loading this deposit receipt.
          </p>
          <p className="text-xs text-white/40 break-all">{this.state.error.message}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={this.reset}
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400"
            >
              Retry
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="px-4 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default VerifyDepositErrorBoundary;

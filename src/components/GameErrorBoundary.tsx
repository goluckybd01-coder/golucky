import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { logGameError } from "@/lib/gameErrorLogger";

type Props = { game: string; children: React.ReactNode };
type State = { error: Error | null };

export class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logGameError({ game: this.props.game }, "render", error);
     
    console.error(`[GameErrorBoundary:${this.props.game}]`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center border border-orange-200">
          <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <AlertTriangle className="text-orange-600" />
          </div>
          <h2 className="text-lg font-bold mb-1">{this.props.game} hit a snag</h2>
          <p className="text-sm text-slate-600 mb-4 break-words">
            {this.state.error.message || "Unexpected error while rendering this game."}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => history.back()}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={this.reset}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold"
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default GameErrorBoundary;

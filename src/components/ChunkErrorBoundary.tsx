import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  message: string;
}

/**
 * Catches errors from lazy-loaded routes — especially "Failed to fetch
 * dynamically imported module" which happens when the deployed chunk hash
 * changes while a user has a stale tab open. Shows a friendly reload UI.
 */
export default class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || String(error);
    const isChunkError =
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Loading chunk [\d]+ failed/i.test(msg) ||
      /Importing a module script failed/i.test(msg) ||
      /ChunkLoadError/i.test(error?.name || "");
    return { hasError: true, isChunkError, message: msg };
  }

  componentDidCatch(error: Error) {
    console.error("[ChunkErrorBoundary]", error);
  }

  handleReload = () => {
    // Hard reload to bypass any stale service worker / HTTP cache
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const title = this.state.isChunkError
      ? "New version available"
      : "Something went wrong";
    const description = this.state.isChunkError
      ? "The app was updated in the background. Reload to load the latest version."
      : "An unexpected error occurred while loading this page.";

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/70">{description}</p>
          <button
            onClick={this.handleReload}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

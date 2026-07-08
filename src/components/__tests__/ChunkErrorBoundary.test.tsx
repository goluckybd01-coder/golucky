import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { lazy, Suspense } from "react";
import ChunkErrorBoundary from "../ChunkErrorBoundary";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function Thrower({ error }: { error: Error }): JSX.Element {
  throw error;
}

describe("ChunkErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ChunkErrorBoundary>
        <div>child content</div>
      </ChunkErrorBoundary>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("shows chunk-specific UI for dynamic import failures", () => {
    const err = new Error(
      "Failed to fetch dynamically imported module: https://x/assets/Foo-abc.js"
    );
    render(
      <ChunkErrorBoundary>
        <Thrower error={err} />
      </ChunkErrorBoundary>
    );
    expect(screen.getByText("New version available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
  });
});

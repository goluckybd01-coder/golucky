import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameErrorBoundary } from "./GameErrorBoundary";
import * as logger from "@/lib/gameErrorLogger";

function Boom(): JSX.Element {
  throw new Error("Simulated render failure");
}

describe("GameErrorBoundary (MotoRace)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders friendly fallback and logs game error on render crash", () => {
    const logSpy = vi.spyOn(logger, "logGameError").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <GameErrorBoundary game="MotoRace">
        <Boom />
      </GameErrorBoundary>,
    );

    expect(screen.getByText(/MotoRace hit a snag/i)).toBeTruthy();
    expect(screen.getByText(/Simulated render failure/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /back/i })).toBeTruthy();

    expect(logSpy).toHaveBeenCalledWith(
      { game: "MotoRace" },
      "render",
      expect.any(Error),
    );
    expect(
      errSpy.mock.calls.some((c) =>
        String(c[0]).includes("[GameErrorBoundary:MotoRace]"),
      ),
    ).toBe(true);
  });

  it("recovers when Try again is clicked and child no longer throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;
    const Child = () => {
      if (shouldThrow) throw new Error("Simulated render failure");
      return <div>recovered</div>;
    };

    render(
      <GameErrorBoundary game="MotoRace">
        <Child />
      </GameErrorBoundary>,
    );

    expect(screen.getByText(/MotoRace hit a snag/i)).toBeTruthy();
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("recovered")).toBeTruthy();
  });
});

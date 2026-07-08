import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
import {
  useWingoResultBanner,
  WINGO_BANNER_DURATION_MS,
  WINGO_RESULT_EVENT,
} from "./useWingoResultBanner";

function Harness() {
  const banner = useWingoResultBanner();
  if (!banner) return <div data-testid="banner-empty" />;
  return (
    <div data-testid="banner">
      <span data-testid="num">{banner.number}</span>
      <span data-testid="color">{banner.color}</span>
      <span data-testid="bs">{banner.bigSmall}</span>
    </div>
  );
}

const dispatch = (number: number, color: string, bigSmall: string) =>
  act(() => {
    window.dispatchEvent(
      new CustomEvent(WINGO_RESULT_EVENT, {
        detail: { number, color, bigSmall },
      })
    );
  });

describe("useWingoResultBanner — two consecutive rounds", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shows once per round and stays visible for 3s each time", () => {
    render(<Harness />);
    expect(screen.queryByTestId("banner")).toBeNull();

    // Round 1
    dispatch(3, "green", "Small");
    expect(screen.getByTestId("num").textContent).toBe("3");
    expect(screen.getByTestId("color").textContent).toBe("green");

    // Still visible just before 3s
    act(() => {
      vi.advanceTimersByTime(WINGO_BANNER_DURATION_MS - 1);
    });
    expect(screen.queryByTestId("banner")).not.toBeNull();

    // Hidden at 3s
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("banner")).toBeNull();

    // Round 2
    dispatch(8, "red", "Big");
    expect(screen.getByTestId("num").textContent).toBe("8");
    expect(screen.getByTestId("color").textContent).toBe("red");
    expect(screen.getByTestId("bs").textContent).toBe("Big");

    act(() => {
      vi.advanceTimersByTime(WINGO_BANNER_DURATION_MS - 1);
    });
    expect(screen.queryByTestId("banner")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("banner")).toBeNull();
  });

  it("resets the timer when a new round arrives before the previous hides", () => {
    render(<Harness />);
    dispatch(0, "violet", "Small");
    expect(screen.getByTestId("color").textContent).toBe("violet");

    // Halfway through duration, fire next round
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    dispatch(5, "green", "Big");
    expect(screen.getByTestId("num").textContent).toBe("5");

    // Old timer would have hidden at 1500ms more; new banner must persist
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId("banner")).not.toBeNull();

    // Full 3s after the second event, hidden
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByTestId("banner")).toBeNull();
  });
});

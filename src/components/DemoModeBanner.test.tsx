import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";


// Helper: (re)load the component with a mocked feature flag value.
async function loadBanner(allowed: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/featureFlags", () => ({ DEMO_MODE_ALLOWED: allowed }));
  const mod = await import("./DemoModeBanner");
  return mod.default;
}

describe("DemoModeBanner", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    vi.resetModules();
  });

  it("renders nothing in production builds (DEMO_MODE_ALLOWED=false) even when demo flag is set", async () => {
    localStorage.setItem("section1_demo", "1");
    const Banner = await loadBanner(false);
    const { container } = render(<Banner />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders nothing in staging when demo mode is not active", async () => {
    const Banner = await loadBanner(true);
    const { container } = render(<Banner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders in staging when DEMO_MODE_ALLOWED and demo is active", async () => {
    localStorage.setItem("section1_demo", "1");
    const Banner = await loadBanner(true);
    render(<Banner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Demo Mode/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /turn off/i })).toBeInTheDocument();
  });

  it("Turn Off clears localStorage and immediately hides the banner", async () => {
    localStorage.setItem("section1_demo", "1");
    const Banner = await loadBanner(true);
    const { container } = render(<Banner />);

    const btn = screen.getByRole("button", { name: /turn off/i });
    fireEvent.click(btn);

    expect(localStorage.getItem("section1_demo")).toBe("0");
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

});

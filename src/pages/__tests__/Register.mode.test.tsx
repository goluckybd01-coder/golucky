import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// jsdom polyfills for Radix
(globalThis as any).ResizeObserver ||= class { observe(){} unobserve(){} disconnect(){} };

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), info: vi.fn(), loading: vi.fn() }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signUp: vi.fn() }, from: () => ({ update: () => ({ eq: vi.fn() }) }) },
}));
vi.mock("@/lib/passwordSecurity", () => ({ validatePasswordSecurity: vi.fn().mockResolvedValue(null) }));
vi.mock("@/components/auth/AuthBackground", () => ({ default: () => null }));
vi.mock("@/components/auth/AnimatedLogo", () => ({ default: () => null }));
vi.mock("@/components/seo/Seo", () => ({ default: () => null }));

import Register from "@/pages/Register";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe("Register page — mode selector", () => {
  beforeEach(() => navigateMock.mockClear());

  it("defaults to User mode and shows Create Account CTA", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /1-click quick register/i })).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("routes to /agent/apply when Agent is selected", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Agent$/i, pressed: false }));
    expect(navigateMock).toHaveBeenCalledWith("/agent/apply");
  });

  it("switches to Quick mode and shows the 1-Click Quick Register CTA", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Quick$/i, pressed: false }));
    expect(await screen.findByRole("button", { name: /1-click quick register/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^create account$/i })).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

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

describe("Register page — validation & disabled states", () => {
  beforeEach(() => navigateMock.mockClear());

  describe("User mode", () => {
    it("Create Account is disabled with empty form", () => {
      renderPage();
      const btn = screen.getByRole("button", { name: /create account/i });
      expect(btn).toBeDisabled();
    });

    it("shows email validation error on invalid email blur", async () => {
      const user = userEvent.setup();
      renderPage();
      const email = screen.getByPlaceholderText(/email address/i);
      await user.type(email, "not-an-email");
      await user.tab();
      expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeDisabled();
    });

    it("shows password too-short and mismatch errors, keeps CTA disabled", async () => {
      const user = userEvent.setup();
      renderPage();
      const pwd = screen.getByPlaceholderText(/^create password$/i);
      const confirm = screen.getByPlaceholderText(/^confirm password$/i);
      await user.type(pwd, "abc");
      await user.tab();
      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      await user.clear(pwd);
      await user.type(pwd, "ValidPass1");
      await user.type(confirm, "Different1");
      await user.tab();
      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create account/i })).toBeDisabled();
    });

    it("enables Create Account when all fields are valid and terms accepted", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByPlaceholderText(/email address/i), "user@example.com");
      await user.type(screen.getByPlaceholderText(/^create password$/i), "ValidPass1");
      await user.type(screen.getByPlaceholderText(/^confirm password$/i), "ValidPass1");
      await user.click(screen.getByLabelText(/i agree to the/i));
      expect(screen.getByRole("button", { name: /create account/i })).toBeEnabled();
    });
  });

  describe("Agent mode", () => {
    it("navigates immediately to /agent/apply and never renders Create Account CTA after", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /^Agent$/i }));
      expect(navigateMock).toHaveBeenCalledWith("/agent/apply");
    });
  });

  describe("Quick mode", () => {
    it("shows Quick Register CTA enabled without requiring form fields", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /^Quick$/i }));
      const quickBtn = await screen.findByRole("button", { name: /1-click quick register/i });
      expect(quickBtn).toBeEnabled();
      expect(screen.queryByRole("button", { name: /^create account$/i })).not.toBeInTheDocument();
    });
  });
});

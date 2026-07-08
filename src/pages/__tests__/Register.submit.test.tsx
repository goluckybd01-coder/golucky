import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

(globalThis as any).ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const signUpMock = vi.fn();
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
    from: () => ({ update: () => ({ eq: vi.fn().mockResolvedValue({}) }) }),
  },
}));
vi.mock("@/lib/passwordSecurity", () => ({
  validatePasswordSecurity: vi.fn().mockResolvedValue(null),
}));
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

describe("Register page — successful submission integration", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    signUpMock.mockReset();
  });

  it("User: signs up via email/password and redirects to /welcome", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u-1" }, session: { access_token: "t" } },
      error: null,
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "user@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/^create password$/i),
      "ValidPass1"
    );
    await user.type(
      screen.getByPlaceholderText(/^confirm password$/i),
      "ValidPass1"
    );
    await user.click(screen.getByLabelText(/i agree to the/i));

    const cta = screen.getByRole("button", { name: /create account/i });
    expect(cta).toBeEnabled();
    await user.click(cta);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          password: "ValidPass1",
        })
      );
      expect(navigateMock).toHaveBeenCalledWith("/welcome");
    });
  });

  it("User: shows email-confirmation success screen when no session is returned", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u-2" }, session: null },
      error: null,
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/email address/i),
      "confirm@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/^create password$/i),
      "ValidPass1"
    );
    await user.type(
      screen.getByPlaceholderText(/^confirm password$/i),
      "ValidPass1"
    );
    await user.click(screen.getByLabelText(/i agree to the/i));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email চেক করুন/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith("/welcome");
  });

  it("Agent: selecting Agent mode routes to /agent/apply without calling signUp", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Agent$/i }));
    expect(navigateMock).toHaveBeenCalledWith("/agent/apply");
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("Quick: 1-Click Quick Register creates an account and redirects to /welcome", async () => {
    signUpMock.mockResolvedValue({
      data: { user: { id: "u-3" }, session: { access_token: "t" } },
      error: null,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /^Quick$/i }));
    const quickBtn = await screen.findByRole("button", {
      name: /1-click quick register/i,
    });
    await user.click(quickBtn);

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(/@golucky\.app$/),
          options: expect.objectContaining({
            data: expect.objectContaining({ is_quick_register: true }),
          }),
        })
      );
      expect(navigateMock).toHaveBeenCalledWith("/welcome");
    });
  });
});

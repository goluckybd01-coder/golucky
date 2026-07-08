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

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
    info: vi.fn(),
    loading: vi.fn(),
  }),
}));

const signUpMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signUp: (...a: unknown[]) => signUpMock(...a) },
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

const fillValidUserForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByPlaceholderText(/email address/i),
    "fail@example.com"
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
};

describe("Register page — failure paths", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    signUpMock.mockReset();
    toastError.mockClear();
    toastSuccess.mockClear();
  });

  it("User: shows 'already registered' toast and does not redirect", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    const user = userEvent.setup();
    renderPage();
    await fillValidUserForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/already registered/i)
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("User: shows raw error message and does not redirect on generic signUp error", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Signup disabled" },
    });
    const user = userEvent.setup();
    renderPage();
    await fillValidUserForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Signup disabled");
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("User: shows generic failure toast when signUp throws", async () => {
    signUpMock.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderPage();
    await fillValidUserForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/registration failed/i)
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("Agent: does not invoke signUp and shows no error toast (navigation-only mode)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Agent$/i }));
    expect(navigateMock).toHaveBeenCalledWith("/agent/apply");
    expect(signUpMock).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("Quick: shows failure toast and does not redirect when signUp returns error", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "boom" },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Quick$/i }));
    const quickBtn = await screen.findByRole("button", {
      name: /1-click quick register/i,
    });
    await user.click(quickBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/quick registration failed/i)
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("Quick: shows generic failure toast when signUp throws", async () => {
    signUpMock.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^Quick$/i }));
    const quickBtn = await screen.findByRole("button", {
      name: /1-click quick register/i,
    });
    await user.click(quickBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/quick registration failed/i)
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

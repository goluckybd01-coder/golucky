import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const updateUser = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (e: string) => void) => {
        // immediately mark as ready
        setTimeout(() => cb("PASSWORD_RECOVERY"), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => Promise.resolve({ data: { session: { user: { id: "1" } } } }),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

import ResetPassword from "../ResetPassword";

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );

const getNewPassword = () =>
  document.querySelector('input[autocomplete="new-password"]:not([aria-describedby="confirm-password-error"])') as HTMLInputElement;

const getInputs = () => {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  return { newPw: inputs[0], confirmPw: inputs[1] };
};

describe("ResetPassword validation", () => {
  beforeEach(() => {
    updateUser.mockClear();
    window.location.hash = "";
  });

  it("shows weak-password error for short passwords", async () => {
    renderPage();
    await waitFor(() => expect(document.querySelectorAll('input[type="password"]').length).toBe(2));
    const { newPw, confirmPw } = getInputs();
    fireEvent.change(newPw, { target: { value: "abc" } });
    fireEvent.blur(newPw);
    fireEvent.change(confirmPw, { target: { value: "abc" } });
    fireEvent.blur(confirmPw);

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("shows uppercase/lowercase/number rule errors", async () => {
    renderPage();
    await waitFor(() => expect(document.querySelectorAll('input[type="password"]').length).toBe(2));
    const { newPw } = getInputs();

    fireEvent.change(newPw, { target: { value: "alllowercase" } });
    fireEvent.blur(newPw);
    expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();

    fireEvent.change(newPw, { target: { value: "ALLUPPERCASE1" } });
    expect(await screen.findByText(/lowercase letter/i)).toBeInTheDocument();

    fireEvent.change(newPw, { target: { value: "NoNumbersHere" } });
    expect(await screen.findByText(/must include a number/i)).toBeInTheDocument();
  });

  it("shows mismatch error when confirm password differs", async () => {
    renderPage();
    await waitFor(() => expect(document.querySelectorAll('input[type="password"]').length).toBe(2));
    const { newPw, confirmPw } = getInputs();

    fireEvent.change(newPw, { target: { value: "StrongPass1" } });
    fireEvent.blur(newPw);
    fireEvent.change(confirmPw, { target: { value: "StrongPass2" } });
    fireEvent.blur(confirmPw);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("submits when both passwords are valid and matching", async () => {
    renderPage();
    await waitFor(() => expect(document.querySelectorAll('input[type="password"]').length).toBe(2));
    const { newPw, confirmPw } = getInputs();

    fireEvent.change(newPw, { target: { value: "StrongPass1" } });
    fireEvent.change(confirmPw, { target: { value: "StrongPass1" } });

    const submit = screen.getByRole("button", { name: /update password/i });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ password: "StrongPass1" })
    );
  });

  it("shows inline error for expired reset token in URL hash", async () => {
    window.location.hash =
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
    renderPage();

    const alert = await screen.findByTestId("reset-link-error");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveTextContent(/expired/i);
    expect(screen.getByRole("button", { name: /request a new reset link/i })).toBeInTheDocument();
    expect(document.querySelectorAll('input[type="password"]').length).toBe(0);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("shows inline error for generic invalid reset token", async () => {
    window.location.hash = "#error=invalid_request&error_description=Invalid+token";
    renderPage();

    const alert = await screen.findByTestId("reset-link-error");
    expect(alert).toHaveTextContent(/invalid token|invalid/i);
    expect(document.querySelectorAll('input[type="password"]').length).toBe(0);
  });
});

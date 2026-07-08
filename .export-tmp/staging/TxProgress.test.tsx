import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TxProgress from "./TxProgress";

describe("TxProgress", () => {
  it("marks step 1 of 3 active while pending", () => {
    render(<TxProgress stage="pending" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
  });

  it("advances to step 2 on approved and step 3 on refreshed", () => {
    const { rerender } = render(<TxProgress stage="approved" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    rerender(<TxProgress stage="refreshed" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });

  it("stops at PENDING step when backend rejects before credit", () => {
    render(<TxProgress stage="failed" failedAt="pending" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(
      screen.getByText(/Transaction failed at Pending — balance unchanged\./i)
    ).toBeInTheDocument();
  });

  it("stops at CREDITED step when failure occurs after approval", () => {
    render(<TxProgress stage="failed" failedAt="approved" labels={{ approved: "Credited" }} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByText(/Transaction failed at Credited — balance unchanged\./i)
    ).toBeInTheDocument();
  });

  it("renders red outer container on failure (visual regression signal)", () => {
    const { container } = render(<TxProgress stage="failed" failedAt="pending" />);
    const wrapper = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(wrapper.getAttribute("style") || "").toMatch(/#EF4444|#7f1d1d/i);
  });

  it("supports a custom failure message (e.g. expired window)", () => {
    render(
      <TxProgress
        stage="failed"
        failedAt="pending"
        failedMessage="Payment window expired — no funds credited."
      />
    );
    expect(
      screen.getByText("Payment window expired — no funds credited.")
    ).toBeInTheDocument();
  });
});

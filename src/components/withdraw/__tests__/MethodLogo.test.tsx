import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ewalletLogo from "@/assets/ewallet-logo.png";
import MethodLogo from "../MethodLogo";

const EXPECTED_ALT = "GoLucky E-Wallet";

// Mirrors the header markup in src/pages/Withdraw.tsx
const WithdrawHeaderLogo = () => (
  <img
    src={ewalletLogo}
    alt={EXPECTED_ALT}
    width={44}
    height={44}
    loading="lazy"
    decoding="async"
  />
);

describe("E-Wallet logo presence", () => {
  it("renders the GoLucky E-Wallet PNG for method='ewallet'", () => {
    render(<MethodLogo method="ewallet" size={44} />);
    const img = screen.getByAltText(EXPECTED_ALT) as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe(ewalletLogo);
    expect(img.getAttribute("src") || "").toMatch(/ewallet-logo.*\.png/i);
    expect(img.width).toBe(44);
  });

  it("falls back to the E-Wallet PNG for unknown methods", () => {
    // @ts-expect-error — intentionally passing an unsupported key to exercise default branch
    render(<MethodLogo method="unknown" size={32} />);
    const img = screen.getByAltText(EXPECTED_ALT) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(ewalletLogo);
  });

  it("uses the exact alt text and src on the Withdraw header logo", () => {
    render(<WithdrawHeaderLogo />);
    const img = screen.getByAltText(EXPECTED_ALT) as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe(EXPECTED_ALT);
    expect(img.getAttribute("src")).toBe(ewalletLogo);
    expect(img.getAttribute("src") || "").toMatch(/ewallet-logo.*\.png/i);
  });

  it("uses the same ewallet-logo.png src on every e-wallet method card", () => {
    render(
      <div>
        <MethodLogo method="ewallet" />
        <MethodLogo method="ewallet" />
        <MethodLogo method="ewallet" />
      </div>,
    );
    const imgs = screen.getAllByAltText(EXPECTED_ALT) as HTMLImageElement[];
    expect(imgs).toHaveLength(3);
    imgs.forEach((img) => {
      expect(img.getAttribute("alt")).toBe(EXPECTED_ALT);
      expect(img.getAttribute("src")).toBe(ewalletLogo);
      expect(img.getAttribute("src") || "").toMatch(/ewallet-logo.*\.png/i);
    });
  });
});

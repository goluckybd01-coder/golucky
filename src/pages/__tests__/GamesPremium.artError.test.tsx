import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handlePopularArtError,
  reportPopularArtFailure,
  POPULAR_ART_PLACEHOLDER,
  __resetPopularArtReports,
} from "@/pages/GamesPremium";

describe("Popular artwork error reporting", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetPopularArtReports();
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
    delete (window as any).dataLayer;
    delete (window as any).gtag;
  });

  it("reportPopularArtFailure logs to console.error with details", () => {
    reportPopularArtFailure("Aviator", "Spribe", "/broken.jpg");
    expect(errSpy).toHaveBeenCalledTimes(1);
    const [tag, payload] = errSpy.mock.calls[0];
    expect(tag).toBe("[popular-art-missing]");
    expect(payload).toMatchObject({
      name: "Aviator",
      provider: "Spribe",
      attemptedSrc: "/broken.jpg",
    });
  });

  it("pushes analytics event to window.dataLayer when present", () => {
    (window as any).dataLayer = [];
    reportPopularArtFailure("WinGo", "GoLucky", "/x.jpg");
    expect((window as any).dataLayer[0]).toMatchObject({
      event: "popular_art_missing",
      name: "WinGo",
    });
  });

  it("handlePopularArtError swaps src to placeholder and reports once", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/missing.jpg";

    handlePopularArtError(img, "Crash", "GoLucky");
    expect(img.src).toBe(POPULAR_ART_PLACEHOLDER);
    expect(img.dataset.fallbackApplied).toBe("1");
    expect(errSpy).toHaveBeenCalledTimes(1);

    // second failure (placeholder also fails) should not re-report
    handlePopularArtError(img, "Crash", "GoLucky");
    expect(errSpy).toHaveBeenCalledTimes(1);
  });

  it("simulated <img> onError swaps to placeholder", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/nope.jpg";
    img.addEventListener("error", () =>
      handlePopularArtError(img, "K3", "GoLucky"),
    );
    img.dispatchEvent(new Event("error"));

    expect(img.src).toBe(POPULAR_ART_PLACEHOLDER);
    expect(errSpy).toHaveBeenCalledWith(
      "[popular-art-missing]",
      expect.objectContaining({ name: "K3", provider: "GoLucky" }),
    );
  });

  it("fires only once per image even across multiple error events / reloads", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/broken.jpg";
    img.addEventListener("error", () =>
      handlePopularArtError(img, "Aviator", "Spribe"),
    );

    // Simulate: initial load fails, browser retries, React re-render triggers
    // another error on the same element, and finally the placeholder itself errors.
    img.dispatchEvent(new Event("error"));
    img.dispatchEvent(new Event("error"));
    img.src = "https://cdn.example.com/broken.jpg"; // simulated reload
    img.dispatchEvent(new Event("error"));
    img.dispatchEvent(new Event("error"));

    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(img.dataset.fallbackApplied).toBe("1");
  });

  it("dedupes across image remounts using the stable (name+provider+src) key", () => {
    // First mount fails
    const img1 = document.createElement("img");
    img1.src = "https://cdn.example.com/aviator.jpg";
    handlePopularArtError(img1, "Aviator", "Spribe");

    // Component re-renders → brand new <img> element, same failing src
    const img2 = document.createElement("img");
    img2.src = "https://cdn.example.com/aviator.jpg";
    handlePopularArtError(img2, "Aviator", "Spribe");

    // And again with a cache-buster query — still the same asset
    const img3 = document.createElement("img");
    img3.src = "https://cdn.example.com/aviator.jpg?v=2";
    handlePopularArtError(img3, "Aviator", "Spribe");

    expect(errSpy).toHaveBeenCalledTimes(1);

    // A different game still reports independently
    const img4 = document.createElement("img");
    img4.src = "https://cdn.example.com/wingo.jpg";
    handlePopularArtError(img4, "WinGo", "GoLucky");
    expect(errSpy).toHaveBeenCalledTimes(2);
  });

  it("reportPopularArtFailure returns false on duplicate keys", () => {
    expect(reportPopularArtFailure("Crash", "GoLucky", "/c.jpg")).toBe(true);
    expect(reportPopularArtFailure("Crash", "GoLucky", "/c.jpg")).toBe(false);
    expect(errSpy).toHaveBeenCalledTimes(1);
  });
});

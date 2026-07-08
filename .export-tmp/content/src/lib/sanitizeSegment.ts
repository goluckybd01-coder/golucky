/**
 * Sanitize a single filename segment so it is safe on Linux, macOS, and
 * Windows CI runners: no spaces, no path separators, no reserved chars
 * (<>:"/\\|?*), no control codes, no leading/trailing dots, and capped length.
 *
 * Exported as its own module so it can be unit-tested without pulling in
 * Playwright (which the e2e helper depends on).
 */
export const SANITIZE_SEGMENT_MAX_LENGTH = 80;

/**
 * Windows reserved device names. A filename equal to one of these (case-
 * insensitive, with or without an extension) is invalid on Windows even
 * though every character is otherwise legal. We suffix such names so the
 * resulting attachment file always opens on Windows CI runners.
 */
const WINDOWS_RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

function isWindowsReservedName(name: string): boolean {
  const base = name.split(".")[0]?.toUpperCase() ?? "";
  return WINDOWS_RESERVED_NAMES.has(base);
}

export function sanitizeSegment(input: string, fallback = "segment"): string {
  const cleaned = (input ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[<>:"/\\|?*\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, SANITIZE_SEGMENT_MAX_LENGTH);
  const safe = cleaned || fallback;
  // Suffix reserved Windows device names so the file is openable on Windows.
  return isWindowsReservedName(safe) ? `${safe}-segment` : safe;
}

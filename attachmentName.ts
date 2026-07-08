import { sanitizeSegment } from "./sanitizeSegment";

export function slugifyTitle(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "untitled"
  );
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

export interface AttachmentNameParts {
  testTitle: string;
  label: string;
  invocation: number;
  attempt: number;
  retries: number;
}

/**
 * Build the deterministic, sortable attachment base name:
 *   <test>__<label>__step-NN__attempt-MM-of-RR
 *
 * Both `testTitle` and `label` are sanitized so the name is valid on every
 * CI platform (Linux, macOS, Windows — including Windows reserved device
 * names like CON or COM1).
 */
export function buildAttachmentBaseName(parts: AttachmentNameParts): string {
  const testSlug = sanitizeSegment(slugifyTitle(parts.testTitle), "test");
  const labelSlug = sanitizeSegment(parts.label, "label");
  return `${testSlug}__${labelSlug}__step-${pad(parts.invocation)}__attempt-${pad(parts.attempt)}-of-${pad(parts.retries)}`;
}

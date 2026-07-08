/**
 * GoLucky Premium ID System — formats, validators, and referral link builders.
 *
 * Sources of truth live on `profiles`:
 *   - glu_user_id     (GLU-XXXXXXXXXX)
 *   - agl_agent_id    (AGL-XXXXXX)
 *   - glr_referral_id (GLR-XXXXXX)
 *   - agr_referral_id (AGR-XXXXXX)
 *
 * The Postgres triggers keep the legacy `display_user_id` / `referral_code` /
 * `agent_code` / `display_referral_id` / `agent_display_id` columns mirrored to
 * these values for backward compatibility.
 */

export const ID_PATTERNS = {
  gluUser:     /^GLU-\d{10}$/,
  aglAgent:    /^AGL-\d{6}$/,
  glrReferral: /^GLR-[A-Z0-9]{6,8}$/, // supports GLR-ADMIN01 (8 chars)
  agrReferral: /^AGR-[A-Z0-9]{6,8}$/,
} as const;

export const isGluUserId     = (v: unknown): v is string => typeof v === "string" && ID_PATTERNS.gluUser.test(v);
export const isAglAgentId    = (v: unknown): v is string => typeof v === "string" && ID_PATTERNS.aglAgent.test(v);
export const isGlrReferralId = (v: unknown): v is string => typeof v === "string" && ID_PATTERNS.glrReferral.test(v);
export const isAgrReferralId = (v: unknown): v is string => typeof v === "string" && ID_PATTERNS.agrReferral.test(v);

/** Super-admin sentinel IDs. Never render these with any special badge. */
export const SUPER_ADMIN_IDS = {
  gluUser:     "GLU-0000001000",
  aglAgent:    "AGL-000100",
  glrReferral: "GLR-ADMIN01",
  agrReferral: "AGR-ADMIN01",
} as const;

/** Default referral inviter for organic (no-ref) signups. */
export const DEFAULT_REFERRAL_ID = SUPER_ADMIN_IDS.glrReferral;

const PUBLIC_ORIGIN =
  (typeof window !== "undefined" && window.location?.origin) || "https://golucky.com";

export function buildUserReferralLink(glr: string, origin: string = PUBLIC_ORIGIN): string {
  const code = isGlrReferralId(glr) ? glr : DEFAULT_REFERRAL_ID;
  return `${origin}/register?ref=${encodeURIComponent(code)}`;
}

export function buildAgentReferralLink(agr: string, origin: string = PUBLIC_ORIGIN): string {
  const code = isAgrReferralId(agr) ? agr : SUPER_ADMIN_IDS.agrReferral;
  return `${origin}/agent/register?ref=${encodeURIComponent(code)}`;
}

/**
 * Normalise a raw `?ref=` query value.
 * Returns the code if it matches either premium format, otherwise the admin default.
 */
export function resolveIncomingReferral(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_REFERRAL_ID;
  const trimmed = raw.trim().toUpperCase();
  if (isGlrReferralId(trimmed) || isAgrReferralId(trimmed)) return trimmed;
  return DEFAULT_REFERRAL_ID;
}

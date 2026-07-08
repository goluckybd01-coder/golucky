export const SUPER_ADMIN_USER_ID = "GLU-0000001000";
export const SUPER_ADMIN_MEMBER_SINCE = "02-04-2021";

/**
 * Formats a Date to DD-MM-YYYY.
 */
export function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Returns the "Member Since" string for the given user.
 * - Super Admin (GLU-0000001000): always 02-04-2021 (platform launch date).
 * - Everyone else (users and agents): the real created_at in DD-MM-YYYY.
 * - Never returns a placeholder or empty string — falls back to today.
 */
export function getMemberSince(params: {
  displayUserId?: string | null;
  createdAt?: string | Date | null;
}): string {
  if (params.displayUserId === SUPER_ADMIN_USER_ID) {
    return SUPER_ADMIN_MEMBER_SINCE;
  }
  if (params.createdAt) {
    const d = new Date(params.createdAt);
    if (!Number.isNaN(d.getTime())) return formatDDMMYYYY(d);
  }
  return formatDDMMYYYY(new Date());
}

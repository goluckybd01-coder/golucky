// Single source of truth for staff roles.
// Mirrors the database `staff_role` enum. Do NOT include 'admin' — it is not a
// valid enum value and using it silently disables role checks.

export const STAFF_ROLES = [
  'super_admin',
  'finance_admin',
  'game_admin',
  'agent_admin',
  'support',
] as const;

export type StaffRole = typeof STAFF_ROLES[number];

export function isStaffRole(v: string | null | undefined): v is StaffRole {
  return !!v && (STAFF_ROLES as readonly string[]).includes(v);
}

// Roles allowed into the Game Admin surface.
export const GAME_ADMIN_ALLOWED_ROLES: StaffRole[] = [
  'super_admin',
  'game_admin',
  'finance_admin',
];

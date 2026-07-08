// Pure mapping helpers for GameLaunchNotifications.
// `email` is intentionally excluded — see security finding
// `game_launch_notifications_email_exposed` (PII reduction).

export interface NotificationSignupRow {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  created_at: string;
  notified_at: string | null;
}

export interface ProfileRow {
  user_id: string;
  username: string | null;
  phone: string | null;
}

export interface NotificationSignup {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  created_at: string;
  notified_at: string | null;
  profile?: {
    username: string | null;
    phone: string | null;
  };
}

export function buildProfilesMap(profiles: ProfileRow[]) {
  return profiles.reduce<Record<string, { username: string | null; phone: string | null }>>(
    (acc, p) => {
      acc[p.user_id] = { username: p.username, phone: p.phone };
      return acc;
    },
    {},
  );
}

export function mapSignupsWithProfiles(
  signups: NotificationSignupRow[],
  profiles: ProfileRow[],
): NotificationSignup[] {
  const profilesMap = buildProfilesMap(profiles);
  return signups.map((signup) => ({
    ...signup,
    profile: profilesMap[signup.user_id] || undefined,
  }));
}

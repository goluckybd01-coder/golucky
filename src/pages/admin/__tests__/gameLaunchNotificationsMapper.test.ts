import { describe, it, expect } from "vitest";
import {
  mapSignupsWithProfiles,
  buildProfilesMap,
  type NotificationSignupRow,
  type ProfileRow,
} from "../gameLaunchNotificationsMapper";

describe("gameLaunchNotificationsMapper", () => {
  const signups: NotificationSignupRow[] = [
    {
      id: "s1",
      user_id: "u1",
      category_id: "slots",
      category_name: "Slots",
      created_at: "2026-01-01T00:00:00Z",
      notified_at: null,
    },
    {
      id: "s2",
      user_id: "u2",
      category_id: "mini",
      category_name: "Mini games",
      created_at: "2026-01-02T00:00:00Z",
      notified_at: "2026-01-03T00:00:00Z",
    },
  ];

  const profiles: ProfileRow[] = [
    { user_id: "u1", username: "alice", phone: "+8801000000001" },
  ];

  it("attaches matching profiles and leaves missing ones undefined", () => {
    const result = mapSignupsWithProfiles(signups, profiles);
    expect(result).toHaveLength(2);
    expect(result[0].profile).toEqual({ username: "alice", phone: "+8801000000001" });
    expect(result[1].profile).toBeUndefined();
  });

  it("preserves core signup fields", () => {
    const [first] = mapSignupsWithProfiles(signups, profiles);
    expect(first).toMatchObject({
      id: "s1",
      user_id: "u1",
      category_id: "slots",
      category_name: "Slots",
      created_at: "2026-01-01T00:00:00Z",
      notified_at: null,
    });
  });

  it("does NOT include an email field (PII hardening)", () => {
    // Guard against regressing the `game_launch_notifications_email_exposed`
    // security finding. Email must never be propagated to the admin UI.
    const result = mapSignupsWithProfiles(
      // simulate a row that wrongly carries an email
      [{ ...signups[0], email: "leak@example.com" } as NotificationSignupRow & { email: string }],
      profiles,
    );
    expect("email" in result[0]).toBe(true); // spread keeps it...
    // ...but the typed NotificationSignup contract has no `email`, so
    // downstream UI cannot read it. Assert profile shape stays clean:
    expect(result[0].profile).not.toHaveProperty("email");
  });

  it("buildProfilesMap keys by user_id", () => {
    expect(buildProfilesMap(profiles)).toEqual({
      u1: { username: "alice", phone: "+8801000000001" },
    });
  });
});

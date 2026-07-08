import { describe, it, expect } from "vitest";
import {
  getMemberSince,
  formatDDMMYYYY,
  SUPER_ADMIN_MEMBER_SINCE,
  SUPER_ADMIN_USER_ID,
} from "./memberSince";

const DDMMYYYY = /^\d{2}-\d{2}-\d{4}$/;

describe("getMemberSince", () => {
  it("always returns 02-04-2021 for the Super Admin, ignoring created_at", () => {
    expect(
      getMemberSince({
        displayUserId: SUPER_ADMIN_USER_ID,
        createdAt: "2026-07-15T10:00:00Z",
      })
    ).toBe(SUPER_ADMIN_MEMBER_SINCE);

    expect(
      getMemberSince({ displayUserId: SUPER_ADMIN_USER_ID, createdAt: null })
    ).toBe("02-04-2021");
  });

  it("returns the real created_at in DD-MM-YYYY for normal users", () => {
    expect(
      getMemberSince({
        displayUserId: "GLU-0000001234",
        createdAt: "2026-07-15T10:00:00Z",
      })
    ).toBe("15-07-2026");
  });

  it("returns the original registration date for agents (not approval date)", () => {
    expect(
      getMemberSince({
        displayUserId: "GLU-0000005678",
        createdAt: "2027-01-01T00:00:00Z",
      })
    ).toBe("01-01-2027");
  });

  it("never returns a placeholder or empty string when created_at is missing", () => {
    const result = getMemberSince({ displayUserId: "GLU-0000009999", createdAt: null });
    expect(result).not.toBe("");
    expect(result).not.toBe("—");
    expect(result).toMatch(DDMMYYYY);
  });

  it("formatDDMMYYYY pads day and month", () => {
    expect(formatDDMMYYYY(new Date("2021-04-02T12:00:00Z"))).toBe("02-04-2021");
  });
});

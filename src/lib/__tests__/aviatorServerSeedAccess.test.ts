import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gpcjwmaffrqliccdxnqt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2p3bWFmZnJxbGljY2R4bnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTIzMDEsImV4cCI6MjA4Mzk2ODMwMX0.eRCmYRHNU1AGj1-XOYICbaq0mbxkXlgi69aoKwqN2z0";

const shouldRun = process.env.RUN_REMOTE_SECURITY_TESTS === "1";
const d = shouldRun ? describe : describe.skip;

d("aviator_rounds.server_seed RLS/column grants", () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  it("anon cannot SELECT server_seed on completed rounds", async () => {
    const { data, error } = await supabase
      .from("aviator_rounds")
      .select("server_seed")
      .eq("phase", "completed")
      .limit(1);

    // Either Postgres rejects the column access, or it returns no rows.
    // It MUST NOT return a non-null server_seed value.
    if (error) {
      expect(error.message.toLowerCase()).toMatch(/permission|denied|server_seed/);
      return;
    }
    for (const row of data ?? []) {
      expect((row as { server_seed: unknown }).server_seed).toBeNull();
    }
  });

  it("anon can still read safe columns on completed rounds", async () => {
    const { error } = await supabase
      .from("aviator_rounds")
      .select("id, phase, crash_multiplier, started_at, ended_at")
      .eq("phase", "completed")
      .limit(1);
    expect(error).toBeNull();
  });
});

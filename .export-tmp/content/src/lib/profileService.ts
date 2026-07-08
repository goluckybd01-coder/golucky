/**
 * Supabase-backed Profile Service
 * Handles user profile operations with database persistence
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  id: string;
  user_id: string;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  display_user_id: string | null;
  display_referral_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's profile data
 */
export const fetchProfile = async (): Promise<ProfileData | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
};

/**
 * Update user's profile
 */
export const updateProfile = async (
  updates: Partial<Pick<ProfileData, "username" | "phone" | "avatar_url">>
): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get profile by referral code - uses secure RPC function
 * Only returns minimal data needed for referral lookup (profile_id, referral_code)
 */
export const fetchProfileByReferralCode = async (
  referralCode: string
): Promise<{ id: string; referral_code: string; display_referral_id: string | null } | null> => {
  // Validate input
  if (!referralCode || referralCode.length < 4) {
    console.warn("Invalid referral code format");
    return null;
  }

  // Use secure RPC function that doesn't expose sensitive profile data
  const { data, error } = await supabase.rpc("lookup_profile_by_referral_code", {
    p_referral_code: referralCode,
  });

  if (error) {
    console.error("Error fetching profile by referral code:", error);
    return null;
  }

  // RPC returns array of rows
  if (!data || data.length === 0) {
    return null;
  }

  const result = data[0];
  return {
    id: result.profile_id,
    referral_code: result.referral_code,
    display_referral_id: result.display_referral_id,
  };
};

/**
 * Set referred by profile
 */
export const setReferredBy = async (
  referrerProfileId: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: referrerProfileId })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error setting referred by:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile, ProfileFormValues, ProfileSummary } from "@/lib/types";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function isMissingProfileSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return error.code === "PGRST205" || error.message?.includes("public.profiles") === true;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "_");
}

export function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3-20 lowercase letters, numbers, or underscores.";
  }

  return null;
}

export function buildProfileDefaults(user: Pick<User, "id" | "email">, profile?: Partial<Profile> | null): Profile {
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    username: profile?.username ?? "",
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    bio: profile?.bio ?? null,
    created_at: profile?.created_at ?? new Date().toISOString(),
  };
}

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, avatar_url, bio, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (isMissingProfileSchemaError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function getProfileSummaryById(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileSummary | null> {
  const profile = await getProfileById(supabase, userId);

  if (!profile) {
    return null;
  }

  const { id, email, username, full_name, avatar_url } = profile;
  return { id, email, username, full_name, avatar_url };
}

export async function isUsernameAvailable(
  supabase: SupabaseClient,
  username: string,
  currentUserId?: string,
): Promise<boolean> {
  let query = supabase.from("profiles").select("id").eq("username", normalizeUsername(username)).limit(1);

  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  const { data, error } = await query;

  if (isMissingProfileSchemaError(error)) {
    return true;
  }

  if (error) {
    throw error;
  }

  return !data || data.length === 0;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  values: ProfileFormValues,
): Promise<Profile> {
  const payload = {
    username: normalizeUsername(values.username),
    full_name: values.full_name?.trim() || null,
    avatar_url: values.avatar_url?.trim() || null,
    bio: values.bio?.trim() || null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("id, email, username, full_name, avatar_url, bio, created_at")
    .single();

  if (isMissingProfileSchemaError(error)) {
    throw new Error("Profile setup is not available yet. Run the Supabase profiles SQL first.");
  }

  if (error) {
    throw error;
  }

  return data as Profile;
}

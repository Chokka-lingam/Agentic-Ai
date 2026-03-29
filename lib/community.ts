import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommunityMessage } from "@/lib/types";

function isMissingCommunitySchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.message?.includes("public.messages") === true ||
    error.message?.includes("public.profiles") === true
  );
}

function mapCommunityMessage(row: {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}): CommunityMessage {
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: row.profile ?? null,
  };
}

export async function listCommunityMessages(
  supabase: SupabaseClient,
  limit = 100,
): Promise<CommunityMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      user_id,
      content,
      created_at,
      profile:profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (isMissingCommunitySchemaError(error)) {
    return [];
  }

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapCommunityMessage(row as never));
}

export async function getCommunityMessageById(
  supabase: SupabaseClient,
  messageId: string,
): Promise<CommunityMessage | null> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      user_id,
      content,
      created_at,
      profile:profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("id", messageId)
    .maybeSingle();

  if (isMissingCommunitySchemaError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return data ? mapCommunityMessage(data as never) : null;
}

export async function sendCommunityMessage(
  supabase: SupabaseClient,
  userId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    content: content.trim(),
  });

  if (isMissingCommunitySchemaError(error)) {
    throw new Error("Community chat is not set up yet. Run the Supabase profiles SQL first.");
  }

  if (error) {
    throw error;
  }
}

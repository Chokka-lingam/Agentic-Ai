import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommunityMessage } from "@/lib/types";

export type CommunityChannel = {
  slug: string;
  name: string;
  description: string;
  topic: string;
};

export const COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    slug: "General",
    name: "General",
    description: "Live travel chat for everyone.",
    topic: "Quick questions, meetups, and anything travel-related.",
  },
  {
    slug: "Destinations",
    name: "Destinations",
    description: "City picks, itineraries, and hidden gems.",
    topic: "Compare places, neighborhoods, and route ideas.",
  },
  {
    slug: "Food",
    name: "Food",
    description: "Restaurants, cafes, markets, and street food.",
    topic: "Swap food finds and local dining tips.",
  },
  {
    slug: "Budget",
    name: "Budget",
    description: "Low-cost stays, transport, and hacks.",
    topic: "Help each other stretch every travel dollar.",
  },
];

export const DEFAULT_COMMUNITY_CHANNEL = COMMUNITY_CHANNELS[0].slug;

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

function isMissingChannelColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return error.message?.includes("channel_slug") === true;
}

function mapCommunityMessage(row: {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  channel_slug?: string | null;
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
    channel_slug: row.channel_slug ?? DEFAULT_COMMUNITY_CHANNEL,
    profile: row.profile ?? null,
  };
}

export async function listCommunityMessages(
  supabase: SupabaseClient,
  limit = 100,
): Promise<CommunityMessage[]> {
  const baseQuery = supabase
    .from("messages")
    .select(`
      id,
      user_id,
      content,
      created_at,
      channel_slug,
      profile:profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: true })
    .limit(limit);

  const { data, error } = await baseQuery;

  if (isMissingChannelColumnError(error)) {
    const fallback = await supabase
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

    if (isMissingCommunitySchemaError(fallback.error)) {
      return [];
    }

    if (fallback.error) {
      throw fallback.error;
    }

    return (fallback.data ?? []).map((row) => mapCommunityMessage(row as never));
  }

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
      channel_slug,
      profile:profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("id", messageId)
    .maybeSingle();

  if (isMissingChannelColumnError(error)) {
    const fallback = await supabase
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

    if (isMissingCommunitySchemaError(fallback.error)) {
      return null;
    }

    if (fallback.error) {
      throw fallback.error;
    }

    return fallback.data ? mapCommunityMessage(fallback.data as never) : null;
  }

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
  channelSlug = DEFAULT_COMMUNITY_CHANNEL,
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    user_id: userId,
    content: content.trim(),
    channel_slug: channelSlug,
  });

  if (isMissingChannelColumnError(error)) {
    if (channelSlug !== DEFAULT_COMMUNITY_CHANNEL) {
      throw new Error("Channel chat needs the latest Supabase community SQL before new rooms can store messages.");
    }

    const fallback = await supabase.from("messages").insert({
      user_id: userId,
      content: content.trim(),
    });

    if (isMissingCommunitySchemaError(fallback.error)) {
      throw new Error("Community chat is not set up yet. Run the Supabase profiles SQL first.");
    }

    if (fallback.error) {
      throw fallback.error;
    }

    return;
  }

  if (isMissingCommunitySchemaError(error)) {
    throw new Error("Community chat is not set up yet. Run the Supabase profiles SQL first.");
  }

  if (error) {
    throw error;
  }
}

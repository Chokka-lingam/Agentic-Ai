"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import {
  COMMUNITY_CHANNELS,
  DEFAULT_COMMUNITY_CHANNEL,
  getCommunityMessageById,
  sendCommunityMessage,
} from "@/lib/community";
import type { CommunityMessage, ProfileSummary } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/shared/UserAvatar";

type CommunityChatProps = {
  initialMessages: CommunityMessage[];
  currentProfile: ProfileSummary | null;
  canSend: boolean;
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getChannelPreview(message: CommunityMessage | undefined): string {
  if (!message) {
    return "No messages yet.";
  }

  return message.content.length > 52 ? `${message.content.slice(0, 52).trimEnd()}...` : message.content;
}

export function CommunityChat({ initialMessages, currentProfile, canSend }: CommunityChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedChannel, setSelectedChannel] = useState(DEFAULT_COMMUNITY_CHANNEL);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channels = useMemo(
    () =>
      COMMUNITY_CHANNELS.map((channel) => {
        const channelMessages = messages.filter((message) => message.channel_slug === channel.slug);
        const latestMessage = [...channelMessages].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];

        return {
          ...channel,
          messageCount: channelMessages.length,
          latestMessage,
        };
      }),
    [messages],
  );

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.slug === selectedChannel) ?? channels[0],
    [channels, selectedChannel],
  );

  const sortedMessages = useMemo(
    () =>
      [...messages]
        .filter((message) => message.channel_slug === selectedChannel)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages, selectedChannel],
  );

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setInput("");
    setError(null);
  }, [selectedChannel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length, selectedChannel]);

  useEffect(() => {
    let isMounted = true;
    let supabase;

    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return undefined;
    }

    const channel = supabase
      .channel("community-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload: RealtimePostgresInsertPayload<{ id: string }>) => {
          try {
            const nextMessage = await getCommunityMessageById(supabase, payload.new.id);

            if (!isMounted || !nextMessage) {
              return;
            }

            setMessages((current) => {
              if (current.some((message) => message.id === nextMessage.id)) {
                return current;
              }

              return [...current, nextMessage];
            });
          } catch {
            // Keep the chat resilient if a joined fetch fails temporarily.
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();

    if (!content || !currentProfile || !canSend || isSending || !activeChannel) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await sendCommunityMessage(supabase, currentProfile.id, content, activeChannel.slug);
      setInput("");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="card min-h-[72vh] p-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Channels</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Split the community into focused rooms so travelers can jump into the right conversation.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto px-3 py-3 lg:block lg:space-y-2 lg:overflow-visible lg:px-3 lg:py-3">
          {channels.map((channel) => {
            const isActive = channel.slug === activeChannel?.slug;

            return (
              <button
                key={channel.slug}
                type="button"
                onClick={() => setSelectedChannel(channel.slug)}
                className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition lg:block lg:w-full lg:min-w-0 ${
                  isActive
                    ? "border-sky-200 bg-white shadow-sm"
                    : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950"># {channel.slug}</p>
                    <p className="mt-1 text-sm text-slate-600">{channel.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {channel.messageCount}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{getChannelPreview(channel.latestMessage)}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-h-[72vh] flex-col">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950"># {activeChannel?.slug ?? DEFAULT_COMMUNITY_CHANNEL}</h3>
              <p className="mt-1 text-sm text-slate-500">{activeChannel?.topic ?? "Community chat"}</p>
            </div>
            <div className="ml-auto rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              {activeChannel?.name ?? "General"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {sortedMessages.length > 0 ? (
            <div className="space-y-4">
              {sortedMessages.map((message) => (
                <article
                  key={message.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <UserAvatar
                    username={message.profile?.username}
                    fullName={message.profile?.full_name}
                    avatarUrl={message.profile?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-semibold text-slate-900">
                        {message.profile?.full_name || message.profile?.username || "Traveler"}
                      </p>
                      <p className="text-sm text-slate-500">@{message.profile?.username || "traveler"}</p>
                      <span className="text-xs text-slate-400">{formatTimestamp(message.created_at)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
                  </div>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <div className="max-w-md rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                  # {activeChannel?.slug ?? DEFAULT_COMMUNITY_CHANNEL}
                </p>
                <h4 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Start this room</h4>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  No one has posted here yet. Kick things off with a question, recommendation, or trip idea for this channel.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 px-5 py-4">
          {canSend ? (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <p>
                  Posting in <span className="font-semibold text-slate-700"># {activeChannel?.slug ?? DEFAULT_COMMUNITY_CHANNEL}</span>
                </p>
                <p>{input.length}/1000</p>
              </div>
              <textarea
                className="input min-h-24 resize-none py-3"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Share something with # ${activeChannel?.slug ?? DEFAULT_COMMUNITY_CHANNEL}...`}
                maxLength={1000}
                disabled={isSending}
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSending || input.trim().length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSending ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Sign in to join the conversation and send messages.
            </div>
          )}

          {error ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        </footer>
      </div>
    </section>
  );
}

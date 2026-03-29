"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import type { CommunityMessage, ProfileSummary } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCommunityMessageById, sendCommunityMessage } from "@/lib/community";
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

export function CommunityChat({ initialMessages, currentProfile, canSend }: CommunityChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();

    if (!content || !currentProfile || !canSend || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await sendCommunityMessage(supabase, currentProfile.id, content);
      setInput("");
    } catch (messageError) {
      setError(messageError instanceof Error ? messageError.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="card flex min-h-[70vh] flex-col p-0">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Community chat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Join the global travel conversation, swap tips, and share inspiration in real time.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          {sortedMessages.map((message) => (
            <article key={message.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
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
      </div>

      <footer className="border-t border-slate-200 px-5 py-4">
        {canSend ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <textarea
              className="input min-h-24 resize-none py-3"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Share a travel tip, ask the community a question, or recommend a favorite spot..."
              maxLength={1000}
              disabled={isSending}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{input.length}/1000</p>
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
    </section>
  );
}

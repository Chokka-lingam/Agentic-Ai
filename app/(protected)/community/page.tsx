import type { Metadata } from "next";
import { AuthConfigNotice } from "@/components/auth/AuthConfigNotice";
import { CommunityChat } from "@/components/community/CommunityChat";
import { listCommunityMessages } from "@/lib/community";
import { getProfileSummaryById } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Community | Tripnova",
};

export default async function CommunityPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <section className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Community</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Travel with the community</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Share travel tips, ask for recommendations, and join the live community chat.
          </p>
        </div>
        <AuthConfigNotice />
      </section>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [messages, profile] = await Promise.all([
    listCommunityMessages(supabase),
    user ? getProfileSummaryById(supabase, user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Community</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Global traveler chat</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Meet other travelers, ask for destination advice, and exchange live recommendations in one shared room.
        </p>
      </section>

      <CommunityChat initialMessages={messages} currentProfile={profile} canSend={Boolean(user && profile)} />
    </div>
  );
}

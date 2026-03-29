import type { Metadata } from "next";
import { AuthConfigNotice } from "@/components/auth/AuthConfigNotice";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { buildProfileDefaults, getProfileById } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile | Tripnova",
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <section className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Set up your traveler profile</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Add a username, avatar, and bio so the community can recognize you.
          </p>
        </div>
        <AuthConfigNotice />
      </section>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfileById(supabase, user.id) : null;
  const initialProfile = user ? buildProfileDefaults(user, profile) : null;

  if (!initialProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Manage your public traveler profile</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Customize your username, avatar, and bio so other travelers can recognize you in the community.
        </p>
      </section>

      <ProfileForm initialProfile={initialProfile} />
    </div>
  );
}

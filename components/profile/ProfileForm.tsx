"use client";

import { useState, type FormEvent } from "react";
import type { Profile } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isUsernameAvailable, normalizeUsername, updateProfile, validateUsername } from "@/lib/profile";
import { UserAvatar } from "@/components/shared/UserAvatar";

type ProfileFormProps = {
  initialProfile: Profile;
};

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [username, setUsername] = useState(initialProfile.username);
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedUsername = normalizeUsername(username);
    const usernameValidationError = validateUsername(normalizedUsername);

    if (usernameValidationError) {
      setError(usernameValidationError);
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const available = await isUsernameAvailable(supabase, normalizedUsername, initialProfile.id);

      if (!available) {
        setError("That username is already taken. Try another one.");
        setIsSaving(false);
        return;
      }

      const profile = await updateProfile(supabase, initialProfile.id, {
        username: normalizedUsername,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio,
      });

      setSavedProfile(profile);
      setUsername(profile.username);
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setBio(profile.bio ?? "");
      setSuccess("Profile updated successfully.");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <div className="card h-fit space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            username={savedProfile.username}
            fullName={savedProfile.full_name}
            avatarUrl={savedProfile.avatar_url}
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {savedProfile.full_name || savedProfile.username}
            </h2>
            <p className="text-sm text-slate-500">@{savedProfile.username}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-900">Email</p>
            <p>{savedProfile.email}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Bio</p>
            <p>{savedProfile.bio || "Add a short intro so the community knows who you are."}</p>
          </div>
        </div>
      </div>

      <form className="card space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="triplover"
            autoComplete="username"
            disabled={isSaving}
            required
          />
          <p className="mt-2 text-xs text-slate-500">Use 3-20 lowercase letters, numbers, or underscores.</p>
        </div>

        <div>
          <label className="label" htmlFor="profile-full-name">Full name</label>
          <input
            id="profile-full-name"
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-avatar">Avatar URL</label>
          <input
            id="profile-avatar"
            className="input"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            className="input min-h-32 resize-y py-3"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell the community about your travel style."
            disabled={isSaving}
            maxLength={280}
          />
          <p className="mt-2 text-xs text-slate-500">{bio.length}/280</p>
        </div>

        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}

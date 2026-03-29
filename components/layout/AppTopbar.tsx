"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { ProfileSummary } from "@/lib/types";
import { UserAvatar } from "@/components/shared/UserAvatar";

type AppTopbarProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  userEmail?: string | null;
  profile?: ProfileSummary | null;
};

export function AppTopbar({ onMenuClick, showMenuButton = true, userEmail, profile }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {showMenuButton ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="min-w-0">
            <Link href="/" className="block truncate text-lg font-semibold tracking-tight text-slate-950">
              Tripnova
            </Link>
            <p className="truncate text-sm text-slate-500">
              {userEmail ? `Signed in as ${userEmail}` : "Smart planning for trips, itineraries, and travel support"}
            </p>
          </div>
        </div>

        {userEmail ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition-all hover:border-sky-200 hover:bg-sky-50"
            >
              <UserAvatar
                username={profile?.username}
                fullName={profile?.full_name}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {profile?.full_name || profile?.username || "Profile"}
                </p>
                <p className="text-xs text-slate-500">@{profile?.username || "traveler"}</p>
              </div>
            </Link>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-slate-400 hover:text-slate-950"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition-all hover:bg-slate-800"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

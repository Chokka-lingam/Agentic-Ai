"use client";
/* eslint-disable @next/next/no-img-element */

type UserAvatarProps = {
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-16 w-16 text-lg",
};

function getInitials(username?: string | null, fullName?: string | null): string {
  const source = fullName?.trim() || username?.trim() || "T";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({ username, fullName, avatarUrl, size = "md" }: UserAvatarProps) {
  const initials = getInitials(username, fullName);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName || username || "User avatar"}
        className={`${sizeClasses[size]} rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full bg-sky-100 font-semibold text-sky-700`}
      aria-label={fullName || username || "User avatar"}
    >
      {initials}
    </div>
  );
}

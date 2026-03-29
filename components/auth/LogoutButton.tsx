"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    await signOut();
  }

  return (
    <button
      type="button"
      onClick={() => startTransition(() => void handleClick())}
      disabled={isPending}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-70 ${className ?? ""}`}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}

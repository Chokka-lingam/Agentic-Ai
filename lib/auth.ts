import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/travel-form",
  "/travel-agent",
  "/itinerary",
  "/chat",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function buildLoginRedirectPath(nextRoute: string): string {
  const params = new URLSearchParams({ next: nextRoute });
  return `/login?${params.toString()}`;
}

export function isSupabaseAuthConfigured(): boolean {
  return getSupabaseEnv().isConfigured;
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

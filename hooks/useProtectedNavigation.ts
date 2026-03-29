"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildLoginRedirectPath, getCurrentSession, isSupabaseAuthConfigured } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

const LOGIN_NOTICE = "Please login to continue";

export function useProtectedNavigation() {
  const router = useRouter();
  const { session, user, isLoading } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleProtectedRoute(route: string) {
    if (!isSupabaseAuthConfigured()) {
      setNotice(null);
      router.push(route);
      return;
    }

    const activeSession = session ?? (isLoading ? await getCurrentSession() : null);
    const activeUser = user ?? activeSession?.user ?? null;

    if (activeUser) {
      setNotice(null);
      router.push(route);
      return;
    }

    setNotice(LOGIN_NOTICE);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      router.push(buildLoginRedirectPath(route));
    }, 900);
  }

  function clearNotice() {
    setNotice(null);
  }

  return {
    notice,
    clearNotice,
    handleProtectedRoute,
  };
}

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getProfileSummaryById } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const profile = await getProfileSummaryById(supabase, user.id);

    return <AppShell userEmail={user.email} profile={profile}>{children}</AppShell>;
  }

  return <AppShell>{children}</AppShell>;
}

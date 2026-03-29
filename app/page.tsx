import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home | AI Travel Guide Agent",
};

export default async function PublicHomePage() {
  const supabase = await createSupabaseServerClient();
  const userEmail = supabase
    ? (await supabase.auth.getUser()).data.user?.email ?? null
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <AppTopbar showMenuButton={false} userEmail={userEmail} />
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardOverview userEmail={userEmail} />
      </main>
    </div>
  );
}

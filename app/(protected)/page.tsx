import type { Metadata } from "next";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home | AI Travel Guide Agent",
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const userEmail = supabase
    ? (await supabase.auth.getUser()).data.user?.email ?? null
    : null;

  return <DashboardOverview userEmail={userEmail} />;
}

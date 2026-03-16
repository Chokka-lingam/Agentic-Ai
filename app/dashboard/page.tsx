import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthConfigNotice } from "@/components/auth/AuthConfigNotice";
import { LogoutButton } from "@/components/auth/LogoutButton";
import TravelTabs from "@/components/TravelTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | AI Travel Guide Agent",
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="card space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">Dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Supabase setup required</h1>
          <p className="text-slate-600">
            Add your Supabase URL and anon key to enable authentication and protect this dashboard.
          </p>
          <AuthConfigNotice />
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-orange-500">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI Travel Guide Agent
          </h1>
          <p className="mt-2 text-slate-600">
            Build an intelligent trip plan with itinerary, hotels, food, transport, budget, packing tips, and safety notes.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">For reliability, each request supports up to 14 trip days.</p>
        </div>
        <LogoutButton />
      </header>

      <TravelTabs />
    </main>
  );
}

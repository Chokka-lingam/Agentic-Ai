import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthConfigNotice } from "@/components/auth/AuthConfigNotice";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Signup | AI Travel Guide Agent",
};

export default async function SignupPage() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start a secure travel workspace with Supabase authentication and keep your AI planning tools behind login."
    >
      <div className="space-y-4">
        {!supabase ? <AuthConfigNotice /> : null}
        <SignupForm />
      </div>
    </AuthShell>
  );
}

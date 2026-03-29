import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthConfigNotice } from "@/components/auth/AuthConfigNotice";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Login | Tripnova",
};

export default async function LoginPage() {
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
      title="Welcome back"
      description="Sign in to access your protected travel dashboard and continue planning your next trip."
    >
      <div className="space-y-4">
        {!supabase ? <AuthConfigNotice /> : null}
        <LoginForm />
      </div>
    </AuthShell>
  );
}

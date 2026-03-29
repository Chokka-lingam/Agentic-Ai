"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "@/lib/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const normalizedUsername = normalizeUsername(username);
      const usernameValidationError = validateUsername(normalizedUsername);

      if (usernameValidationError) {
        setError(usernameValidationError);
        setIsLoading(false);
        return;
      }

      const available = await isUsernameAvailable(supabase, normalizedUsername);

      if (!available) {
        setError("That username is already taken. Try another one.");
        setIsLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          data: {
            username: normalizedUsername,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError("Signup did not complete. No user record was created in Supabase.");
        setIsLoading(false);
        return;
      }

      if (data.session) {
        // Force a full page reload to ensure server components see the updated session
        window.location.href = "/dashboard";
        return;
      }

      setMessage(
        "Account created. Check your inbox and spam folder for the confirmation email.",
      );
      setIsLoading(false);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to create account.");
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          type="text"
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="your_handle"
          autoComplete="username"
          required
          disabled={isLoading}
        />
        <p className="mt-2 text-xs text-slate-500">Choose a unique username for your public traveler profile.</p>
      </div>

      <div>
        <label className="label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          className="input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a strong password"
          autoComplete="new-password"
          minLength={6}
          required
          disabled={isLoading}
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Login
        </Link>
      </p>
    </form>
  );
}

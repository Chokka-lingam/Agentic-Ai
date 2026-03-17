"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginForm } from "@/lib/types";

type FormErrors = Partial<Record<keyof LoginForm, string>>;

const initialForm: LoginForm = {
  email: "",
  password: "",
};

function validate(form: LoginForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.includes("@")) {
    errors.email = "Enter a valid email address.";
  }

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sign In failed");
      }

      // Redirect after login
      router.push("/travelform");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/*Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center "
        style={{
          backgroundImage: "url('/SignBGCover.png')",
        }}
      />

      {/*Dark Overlay*/}
      <div className="absolute inset-0 bg-black/10" />

      {/*Login Form*/}
      <div className="relative flex min-h-screen items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-white/30 bg-white/70 backdrop-blur-lg shadow-2xl p-8"
        >
          <h2 className="mb-6 text-2xl font-semibold text-slate-800">Login</h2>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />

          {errors.email && (
            <p className="mb-3 text-xs text-red-600">{errors.email}</p>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />

          {errors.password && (
            <p className="mb-3 text-xs text-red-600">{errors.password}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 transition"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-4 text-sm text-slate-600 text-center">
            Don't have an account yet?{" "}
            <span
              onClick={() => router.push("/signup")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Signup
            </span>
          </p>

          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

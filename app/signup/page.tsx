"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SignupForm } from "@/lib/types";

type FormErrors = Partial<Record<keyof SignupForm, string>>;

const initialForm: SignupForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validate(form: SignupForm): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!form.email.includes("@")) {
    errors.email = "Enter a valid email.";
  }

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignupForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      router.push("/travelform");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/SignBGCover.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Signup Form */}
      <div className="relative flex min-h-screen items-center justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-white/30 bg-white/70 backdrop-blur-lg shadow-2xl p-8"
        >
          <h2 className="mb-6 text-2xl font-semibold text-slate-800">
            Create Account
          </h2>

          {/* Name */}
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>

          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-3"
            type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          {errors.name && (
            <p className="text-xs text-red-600 mb-2">{errors.name}</p>
          )}

          {/* Email */}
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>

          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-3"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />

          {errors.email && (
            <p className="text-xs text-red-600 mb-2">{errors.email}</p>
          )}

          {/* Password */}
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>

          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-3"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />

          {errors.password && (
            <p className="text-xs text-red-600 mb-2">{errors.password}</p>
          )}

          {/* Confirm Password */}
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password
          </label>

          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-2 mb-4"
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
          />

          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mb-2">
              {errors.confirmPassword}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 transition"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* Login link */}
          <p className="mt-4 text-sm text-slate-600 text-center">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/signin")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

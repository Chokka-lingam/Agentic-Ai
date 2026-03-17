"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="relative top-0 left-0 w-full z-20 bg-stone-600/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 py-3 text-white">
        {/* Logo */}
        <Link href="/" className="text-xl font-light tracking-wide">
          LOGO
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-8">
          <Link
            href="/signup"
            className="text-sm hover:text-orange-400 transition"
          >
            Sign Up
          </Link>

          <Link
            href="/signin"
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

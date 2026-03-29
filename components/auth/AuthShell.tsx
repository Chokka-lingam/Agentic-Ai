import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_45%,_#e2e8f0)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-2xl shadow-slate-300/40 backdrop-blur lg:grid-cols-[1.05fr,0.95fr]">
          <div className="hidden bg-slate-950 p-10 text-slate-100 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-300">TripNova AI Travel Guide</p>
              <h1 className="mt-6 font-serif text-4xl leading-tight">
                Plan smarter trips with a private travel workspace.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                Sign in to save your travel planning flow and keep itinerary generation, chat guidance,
                and maps in one secure dashboard.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
              <p className="font-medium text-white">Included in your dashboard</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li>Travel itinerary builder</li>
                <li>AI travel chat assistant</li>
                <li>Saved place discovery flow</li>
              </ul>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
              Tripnova
            </Link>
            <div className="mt-8 max-w-md">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="mt-8 max-w-md">{children}</div>
            {footer ? <div className="mt-6 max-w-md text-sm text-slate-600">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

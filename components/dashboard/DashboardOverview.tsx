import Link from "next/link";
import { BotMessageSquare, Compass, FileText, Sparkles } from "lucide-react";

type DashboardOverviewProps = {
  userEmail?: string | null;
};

const quickActions = [
  {
    href: "/travel-form",
    label: "Open Travel Iternary",
    description: "Generate structured itineraries with dates, budget, hotels, food, and map pins.",
    icon: FileText,
  },
  {
    href: "/travel-agent",
    label: "Open Travel Chat Agent",
    description: "Chat with the AI assistant for destination ideas, timing, transport, and budgeting help.",
    icon: BotMessageSquare,
  },
];

const highlights = [
  "Generate trip plans with a day-by-day itinerary and cost breakdown.",
  "Ask follow-up travel questions in the dedicated AI chat workspace.",
  "Keep the app responsive across desktop and mobile with a reusable shell.",
];

export function DashboardOverview({ userEmail }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10 lg:py-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              Travel workspace
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Plan faster with a cleaner travel command center.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Move between structured itinerary generation and free-form travel guidance from one place.
              {userEmail ? ` Your current session is signed in as ${userEmail}.` : ""}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/travel-form"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start planning
              </Link>
              <Link
                href="/travel-agent"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Ask the travel chat agent
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">What you can do</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Your travel toolkit</p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              {highlights.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {quickActions.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-100">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{label}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

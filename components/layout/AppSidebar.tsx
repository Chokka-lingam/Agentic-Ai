"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, FileText, PanelLeftClose, PanelLeftOpen } from "lucide-react";

type AppSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

const navigationItems = [
  {
    href: "/travel-form",
    label: "Create Itenary",
    icon: FileText,
  },
  {
    href: "/travel-agent",
    label: "Chat Agent",
    icon: BotMessageSquare,
  },
];

export function AppSidebar({ isOpen, onToggle, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 md:flex md:flex-col ${
        isOpen ? "md:w-72" : "md:w-24"
      }`}
    >
      <div className={`flex h-20 items-center border-b border-slate-200 px-4 ${isOpen ? "justify-between" : "justify-center"}`}>
        {isOpen ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Workspace</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Tripnova</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;

            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`group flex h-14 items-center rounded-2xl px-4 text-sm font-medium transition-all ${
                    isOpen ? "justify-start gap-3" : "justify-center"
                  } ${
                    isActive
                      ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  title={!isOpen ? label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`} />
                  {isOpen ? <span className="truncate">{label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

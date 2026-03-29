"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, FileText, MessagesSquare, X } from "lucide-react";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigationItems = [
  {
    href: "/travel-form",
    label: "Travel Form",
    icon: FileText,
  },
  {
    href: "/travel-agent",
    label: "Travel Agent",
    icon: BotMessageSquare,
  },
  {
    href: "/community",
    label: "Community",
    icon: MessagesSquare,
  },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-300 md:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Workspace</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Travel AI</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
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
                    onClick={onClose}
                    className={`flex h-14 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

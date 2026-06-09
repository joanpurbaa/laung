"use client";

import { usePathname, useRouter } from "next/navigation";
import { History, Home, MapIcon } from "lucide-react";

function useIsAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return false;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = useIsAuthenticated();

  const navItems = [
    { href: "/dashboard", label: "Beranda", icon: Home, protected: false },
    { href: "/map", label: "Peta ZPPI", icon: MapIcon, protected: false },
    { href: "/history", label: "Histori", icon: History, protected: true },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.protected && !isAuth) {
      router.push(`/login?from=${item.href}`);
      return;
    }
    router.push(item.href);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-1020 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-4 shadow-xl backdrop-blur-md">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isLocked = item.protected && !isAuth;

        return (
          <button
            key={item.href}
            onClick={() => handleNavClick(item)}
            className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
              isActive
                ? "font-bold text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={2.5} />
              {isLocked && (
                <span className="absolute -top-1 -right-2 text-[8px]">🔒</span>
              )}
            </div>
            <span className="text-[9px] font-bold tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

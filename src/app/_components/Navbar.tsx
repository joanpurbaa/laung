"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { History, Home, MapIcon, UserCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuth = status === "authenticated" && !!session?.user;

  const navItems = [
    { href: "/dashboard", label: "Beranda", icon: Home, protected: true },
    { href: "/map", label: "Peta ZPPI", icon: MapIcon, protected: false },
    { href: "/history", label: "Histori", icon: History, protected: true },
    { href: "/profile", label: "Profil", icon: UserCircle, protected: true },
  ];

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (isLoading) return;
    if (item.protected && !isAuth) {
      router.push(`/login?from=${encodeURIComponent(item.href)}`);
      return;
    }
    router.push(item.href);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-[1020] flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-2 shadow-xl backdrop-blur-md">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isLocked = item.protected && !isAuth && !isLoading;

        return (
          <button
            key={item.href}
            onClick={() => handleNavClick(item)}
            disabled={isLoading}
            className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 ${
              isActive
                ? "font-bold text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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

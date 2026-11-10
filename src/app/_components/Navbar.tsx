"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { History, Home, MapIcon, UserCircle, LifeBuoy } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  protected: boolean;
  emergency?: boolean;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuth = status === "authenticated" && !!session?.user;

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Beranda", icon: Home, protected: true },
    { href: "/map", label: "Peta", icon: MapIcon, protected: false },
    {
      href: "/map?emergency=true",
      label: "Darurat",
      icon: LifeBuoy,
      protected: false,
      emergency: true,
    },
    { href: "/history", label: "Histori", icon: History, protected: true },
    { href: "/profile", label: "Profil", icon: UserCircle, protected: true },
  ];

  const handleNavClick = (item: NavItem) => {
    if (isLoading) return;
    if (item.protected && !isAuth) {
      router.push(`/login?from=${encodeURIComponent(item.href)}`);
      return;
    }
    router.push(item.href);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-[1020] border-t border-slate-200/70 bg-white/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom,0px),4px)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const isEmergency = item.emergency === true;
          const isMap = item.href === "/map";
          
          let isActive = false;
          if (typeof window !== "undefined" && isEmergency) {
            isActive =
              pathname === "/map" &&
              window.location.search.includes("emergency=true");
          } else if (isMap) {
            isActive =
              pathname === "/map" &&
              (typeof window === "undefined" ||
                !window.location.search.includes("emergency=true"));
          } else {
            isActive = pathname === item.href;
          }

          const Icon = item.icon;
          const isLocked = item.protected && !isAuth && !isLoading;

          const colorClass = isEmergency
            ? isActive
              ? "text-rose-600 font-bold"
              : "text-rose-500/80 hover:text-rose-600"
            : isActive
              ? "text-emerald-600 font-bold"
              : "text-slate-400 hover:text-slate-600";

          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item)}
              disabled={isLoading}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-all active:scale-95 disabled:opacity-50 ${colorClass}`}
            >
              <div className="relative">
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={isEmergency && isActive ? "animate-pulse" : ""}
                />
                {isLocked && (
                  <span className="absolute -top-1 -right-2 text-[8px]">🔒</span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, MapIcon } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Beranda",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      icon: Home,
    },
    {
      href: "/home",
      label: "Peta ZPPI",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      icon: MapIcon,
    },
    {
      href: "/history",
      label: "Histori",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      icon: History,
    },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-1020 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/95 px-4 shadow-xl backdrop-blur-md">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
              isActive
                ? "font-bold text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

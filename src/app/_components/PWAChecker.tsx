"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PWAChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return <>{children}</>;
}

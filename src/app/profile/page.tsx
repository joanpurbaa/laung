"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Fish,
  MapPin,
  Clock,
} from "lucide-react";
import Navbar from "../_components/Navbar";
import { logoutAction } from "~/lib/actions/auth";
import PushNotifButton from "../_components/PushNotifButton";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </main>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?");

  const handleLogout = async () => {
    await logoutAction();
  };

  const infoItems = [
    {
      icon: User,
      label: "Nama Lengkap",
      value: user.name ?? "Tidak diset",
    },
    {
      icon: Mail,
      label: "Email",
      value: user.email ?? "-",
    },
    {
      icon: ShieldCheck,
      label: "Status Akun",
      value: "Terverifikasi",
      valueClass: "text-emerald-600 font-black",
    },
  ];

  const menuItems = [
    {
      icon: Fish,
      label: "Histori Tangkapan",
      desc: "Lihat semua log hasil tangkapan",
      onClick: () => router.push("/history"),
    },
    {
      icon: MapPin,
      label: "Peta ZPPI",
      desc: "Buka peta zona potensi ikan",
      onClick: () => router.push("/map"),
    },
    {
      icon: Clock,
      label: "Riwayat Aktivitas",
      desc: "Aktivitas terakhir akun kamu",
      onClick: () => null,
      disabled: true,
      badge: "Segera",
    },
  ];

  return (
    <main className="relative min-h-screen w-screen bg-slate-50 pb-24 font-sans select-none">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-4 pt-12 pb-6 shadow-sm">
        <p className="mb-4 text-[10px] font-black tracking-wider text-slate-400 uppercase">
          Akun Saya
        </p>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-100">
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-xl font-black text-slate-800"
              style={{ letterSpacing: "-0.03em" }}
            >
              {user.name ?? "Pengguna Laung"}
            </h1>
            <p className="truncate text-[12px] font-medium text-slate-400">
              {user.email}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600">
                Nelayan Terverifikasi
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Info akun */}
        <div>
          <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Informasi Akun
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {infoItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < infoItems.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    <Icon size={15} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400">
                      {item.label}
                    </p>
                    <p
                      className={`truncate text-[13px] font-bold text-slate-700 ${item.valueClass ?? ""}`}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Menu */}
        <div>
          <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Navigasi Cepat
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {menuItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors disabled:opacity-50 ${
                    i < menuItems.length - 1 ? "border-b border-slate-50" : ""
                  } hover:bg-slate-50 active:bg-slate-100`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <Icon size={15} className="text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-slate-700">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                  {item.badge ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-600">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-slate-300"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => void handleLogout()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-4 text-[13px] font-black text-red-500 transition-all hover:bg-red-100 active:scale-[0.98]"
        >
          <LogOut size={16} />
          Keluar dari Akun
        </button>

        <p className="text-center text-[10px] font-semibold text-slate-300">
          Laung v0.1.0 · Sistem Informasi Maritim Nelayan
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
          Notifikasi
        </p>
        <PushNotifButton />
      </div>

      <Navbar />
    </main>
  );
}

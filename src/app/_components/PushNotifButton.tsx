"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "~/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotifButton() {
  const [status, setStatus] = useState<
    "loading" | "granted" | "denied" | "default"
  >("loading");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("denied");
      return;
    }
    setStatus(Notification.permission as "granted" | "denied" | "default");
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const sub = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await subscribePushAction(sub);
      setStatus("granted");
    } catch (err) {
      console.error("Push subscription error:", err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribePushAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("default");
    } finally {
      setSubscribing(false);
    }
  };

  if (status === "loading") return null;

  if (!("Notification" in window)) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[12px] text-slate-400">
        <BellOff size={14} />
        Notifikasi tidak didukung browser ini
      </div>
    );
  }

  return (
    <button
      onClick={status === "granted" ? handleUnsubscribe : handleSubscribe}
      disabled={subscribing || status === "denied"}
      className={`flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
        status === "granted"
          ? "border border-emerald-100 bg-emerald-50"
          : status === "denied"
            ? "border border-slate-100 bg-slate-50"
            : "border border-slate-100 bg-white hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          status === "granted" ? "bg-emerald-100" : "bg-slate-100"
        }`}
      >
        {subscribing ? (
          <Loader2 size={15} className="animate-spin text-slate-400" />
        ) : status === "granted" ? (
          <Bell size={15} className="text-emerald-600" />
        ) : (
          <BellOff size={15} className="text-slate-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-black text-slate-700">
          {status === "granted"
            ? "Notifikasi Aktif"
            : status === "denied"
              ? "Notifikasi Diblokir"
              : "Aktifkan Notifikasi"}
        </p>
        <p className="text-[11px] font-medium text-slate-400">
          {status === "granted"
            ? "Pengingat cuaca & spot aktif — tap untuk nonaktifkan"
            : status === "denied"
              ? "Izinkan notifikasi di pengaturan browser"
              : "Terima pengingat waktu terbaik & peringatan cuaca"}
        </p>
      </div>
      {status === "granted" && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-600">
          ON
        </span>
      )}
    </button>
  );
}

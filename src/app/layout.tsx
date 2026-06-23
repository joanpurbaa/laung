import "../styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import "leaflet/dist/leaflet.css";
import PWAChecker from "./_components/PWAChecker";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Laung - Untuk Pelaut",
  description: "Bantu nelayan cari ikan dengan data satelit",
  icons: [{ rel: "icon", url: "/icon.svg" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
// Tambahkan suppressHydrationWarning di tag html
return (
  <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
    <body>
      <SessionProvider>
        <PWAChecker>{children}</PWAChecker>
      </SessionProvider>
    </body>
  </html>
);
}

import "../styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import "leaflet/dist/leaflet.css";
import PWAChecker from "./_components/PWAChecker";

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
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <PWAChecker>{children}</PWAChecker>
      </body>
    </html>
  );
}

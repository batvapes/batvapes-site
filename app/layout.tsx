import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "BatVapes Platform",
  description: "Customer portal with referral code system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-black text-white font-sans">
        <Navbar />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { UserProvider } from "@/lib/context/user";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Material Muse",
  description: "Fashion-first shopping and budgeting companion",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-cream text-warm-dark font-sans antialiased">
        <UserProvider>
          <div className="flex min-h-dvh flex-col md:flex-row">
            <Nav />
            <main className="flex-1 pb-20 md:pb-0 md:pl-60">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/layouts/AppHeader";
import { ChatWidget } from "@/components/features/chat/ChatWidget";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Falcky — Clothing Store",
  description: "Discover curated collections of quality clothing. Shop tops, bottoms, dresses, outerwear and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <AppHeader />
          {children}
          <ChatWidget />
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}

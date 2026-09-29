import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vox — Voice Intelligence & Multimodal Workspace",
  description: "Unified AI workspace featuring real-time WebRTC voice interaction, conversational chat, and creative image synthesis.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full dark ${playfair.variable} ${inter.variable}`}>
      <body className="h-full bg-black text-[var(--foreground)] font-sans antialiased selection:bg-[rgba(195,169,149,0.25)] selection:text-[#EDE4DC]">
        {children}
      </body>
    </html>
  );
}

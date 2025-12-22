import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawCalm - AI Dog Separation Anxiety Training",
  description: "AI-assisted separation anxiety training for dogs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@mux/mux-player@2"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
          🚧 Beta - We're actively building PawCalm. Expect bugs & changes!
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
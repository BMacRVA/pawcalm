import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
      <body className="flex flex-col min-h-screen">
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
          🚧 Beta - We're actively building PawCalm. Expect bugs & changes!
        </div>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-gray-900 text-gray-400 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-white font-semibold">🐾 PawCalm</p>
                <p className="text-sm">AI-assisted dog separation anxiety training</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a href="/terms" className="hover:text-white transition">Terms of Service</a>
                <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
                <a href="/disclaimer" className="hover:text-white transition">Disclaimer</a>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm">
              <p>© 2025 PawCalm. All rights reserved.</p>
              <p className="mt-2 text-xs text-gray-500">
                PawCalm provides AI-generated suggestions for informational purposes only. 
                Not a substitute for professional veterinary or behavioral advice.
              </p>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
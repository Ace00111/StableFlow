import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StableFlow | Arc Stablecoin Splitter",
  description: "Automate your USDC distributions on Arc Testnet with StableFlow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen selection:bg-blue-500/30`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

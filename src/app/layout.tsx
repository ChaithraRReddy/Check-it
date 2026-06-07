import type { Metadata } from "next";
import { Fraunces, DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"], variable: "--font-fraunces" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-dm-sans" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Check.it — Know before you buy",
  description: "An honest affordability gut-check for everyday purchases.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
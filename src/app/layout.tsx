import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Maxx Computers | Refurbished Laptops & Computer Services Bengaluru",
  description: "Maxx Computers Bengaluru offers professionally checked refurbished Dell and Lenovo laptops, computer services, upgrades and reliable after-sales support.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

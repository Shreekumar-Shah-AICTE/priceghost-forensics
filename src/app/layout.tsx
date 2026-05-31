import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PriceGhost — The Invisible Tax You're Already Paying",
  description: "Expose dynamic pricing discrimination in real-time. PriceGhost scans prices across 10+ global residential locations to calculate forensic evidence and Gini inequality indexes.",
  openGraph: {
    title: "PriceGhost — The Invisible Tax You're Already Paying",
    description: "Expose dynamic pricing discrimination in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#050506] text-[#F3F3F0] selection:bg-[#00FFFF] selection:text-[#050506]">
        {children}
      </body>
    </html>
  );
}

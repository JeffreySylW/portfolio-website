import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jeffrey Weaver — Software Engineer",
  description:
    "Software engineer specializing in full-stack development and machine learning. VCU CS grad, former NASA Langley Research Center intern.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink font-display">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Big_Shoulders, Silkscreen } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "800"],
  display: "swap",
});

const body = Atkinson_Hyperlegible_Next({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const pixel = Silkscreen({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jeffrey Weaver — Software Engineer",
  description:
    "Software engineer in Richmond, VA. VCU Computer Science 2026, former Software Engineering Intern at NASA Langley Research Center, freelance engineer for Bob The Tech Guy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${pixel.variable} h-full antialiased`}>
      <body className="min-h-full bg-void text-starlight font-body">{children}</body>
    </html>
  );
}

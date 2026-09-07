import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoutIQ — Recruitment Intelligence",
  description:
    "Football scouting and recruitment intelligence platform: performance, injury, contract, transfer and market-value data in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-pitch-900 text-text-primary">
        {children}
      </body>
    </html>
  );
}

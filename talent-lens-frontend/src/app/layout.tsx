import type { Metadata } from "next";
import { DM_Sans, Syne, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "TalentAI | Powered by Umurava",
  description: "AI-powered talent screening and applicant management platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${syne.variable} ${bricolage.variable} font-sans`} suppressHydrationWarning={true}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";

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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

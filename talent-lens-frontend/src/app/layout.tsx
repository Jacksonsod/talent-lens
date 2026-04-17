import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
});

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
    <html lang="en" className={bricolage.variable}>
      <body suppressHydrationWarning={true}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

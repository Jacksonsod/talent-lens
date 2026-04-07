"use client";

import "@/styles/globals.css";
import { store } from "@/lib/store";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Talent-lens</title>
        <meta name="description" content="AI-powered talent screening by Umurava" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Provider store={store}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1c1c26",
                color: "#f0f0f5",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
              },
            }}
          />
        </Provider>
      </body>
    </html>
  );
}

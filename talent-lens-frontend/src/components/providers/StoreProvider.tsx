"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { Toaster } from "react-hot-toast";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

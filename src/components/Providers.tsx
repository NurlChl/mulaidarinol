"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ModalProvider } from "./ModalProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default Providers;

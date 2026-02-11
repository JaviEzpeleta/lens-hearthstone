"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/components/Web3Provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Provider>{children}</Web3Provider>
    </ThemeProvider>
  );
}

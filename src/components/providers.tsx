"use client";

import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

function RainbowKitWithMode({ children }: { children: ReactNode }) {
  return (
    <RainbowKitProvider
      theme={{
        lightMode: lightTheme({
          accentColor: "#0F766E",
          borderRadius: "medium",
        }),
        darkMode: darkTheme({
          accentColor: "#14B8A6",
          borderRadius: "medium",
        }),
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWithMode>{children}</RainbowKitWithMode>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

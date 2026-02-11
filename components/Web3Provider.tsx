"use client";

import React, { useState, useEffect } from "react";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { LensProvider, PublicClient, mainnet, testnet } from "@lens-protocol/react";
import { chains } from "@lens-chain/sdk/viem";
import {
  NETWORK_MODE,
  RPC_URL_MAINNET,
  RPC_URL_TESTNET,
  NATIVE_TOKEN_NAME_MAINNET,
  NATIVE_TOKEN_NAME_TESTNET,
  EXPLORER_MAINNET,
  EXPLORER_TESTNET,
  WALLETCONNECT_PROJECT_ID,
} from "@/lib/web3/constants";
import { attemptSessionRecovery } from "@/lib/web3/auth-utils";

// Define the current network chain
const currentNetwork = {
  id: NETWORK_MODE === "mainnet" ? chains.mainnet.id : chains.testnet.id,
  name: NETWORK_MODE === "mainnet" ? "Lens Chain" : "Lens Testnet",
  nativeCurrency: {
    name:
      NETWORK_MODE === "mainnet"
        ? NATIVE_TOKEN_NAME_MAINNET
        : NATIVE_TOKEN_NAME_TESTNET,
    symbol:
      NETWORK_MODE === "mainnet"
        ? NATIVE_TOKEN_NAME_MAINNET
        : NATIVE_TOKEN_NAME_TESTNET,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [NETWORK_MODE === "mainnet" ? RPC_URL_MAINNET : RPC_URL_TESTNET],
    },
  },
  blockExplorers: {
    default: {
      name: "Lens Explorer",
      url: NETWORK_MODE === "mainnet" ? EXPLORER_MAINNET : EXPLORER_TESTNET,
      apiUrl: "",
    },
  },
};

// Create wagmi config with ConnectKit
const wagmiConfig = createConfig(
  getDefaultConfig({
    storage: createStorage({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: "lens-hearthstone-wallet",
    }),
    appName: "Lens Hearthstone",
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
    ssr: false,
    chains: [currentNetwork],
    transports: {
      [currentNetwork.id]: http(
        NETWORK_MODE === "mainnet" ? RPC_URL_MAINNET : RPC_URL_TESTNET
      ),
    },
  })
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [lensClient, setLensClient] = useState<PublicClient | null>(null);
  const [isResumingSession, setIsResumingSession] = useState(true);

  useEffect(() => {
    const client = PublicClient.create({
      environment: NETWORK_MODE === "mainnet" ? mainnet : testnet,
      storage: window.localStorage,
    });
    setLensClient(client);

    // Attempt to resume session on mount
    const resumeSession = async () => {
      try {
        await attemptSessionRecovery(client);
      } catch (error) {
        console.error("[Web3Provider] Session resume error:", error);
      } finally {
        setIsResumingSession(false);
      }
    };

    resumeSession();
  }, []);

  if (!lensClient) {
    return null;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="dark"
          customTheme={{
            "--ck-font-family": "var(--font-cinzel), serif",
            "--ck-connectbutton-font-weight": "600",
            "--ck-connectbutton-font-size": "14px",
            "--ck-connectbutton-color": "#fbbf24",
            "--ck-connectbutton-border-radius": "8px",
            "--ck-connectbutton-background": "rgba(30, 30, 30, 0.9)",
            "--ck-connectbutton-hover-background": "rgba(50, 50, 50, 0.9)",
            "--ck-body-background": "#1a1a2e",
            "--ck-body-color": "#ffffff",
            "--ck-primary-button-background": "#fbbf24",
            "--ck-primary-button-color": "#000000",
          }}
        >
          {lensClient && (
            <LensProvider client={lensClient}>{children}</LensProvider>
          )}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

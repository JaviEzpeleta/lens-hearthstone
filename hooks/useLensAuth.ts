"use client";

import { useAccount as useWagmiAccount } from "wagmi";
import {
  useAuthenticatedUser,
  useSessionClient,
} from "@lens-protocol/react";

/**
 * useLensAuth hook
 * Encapsulates authentication state for Lens Protocol.
 * Returns wallet connection status, Lens authentication status, and whether login is needed.
 */
export function useLensAuth() {
  const { address, isConnected } = useWagmiAccount();
  const { data: authenticatedUser, loading: authLoading } = useAuthenticatedUser();
  const { loading: sessionLoading } = useSessionClient();

  const isAuthenticated = !!authenticatedUser;
  const isLoading = authLoading || sessionLoading;
  const needsLensLogin = isConnected && !isAuthenticated && !isLoading;

  return {
    walletAddress: address,
    isWalletConnected: isConnected,
    isAuthenticated,
    isLoading,
    needsLensLogin,
    authenticatedUser,
  };
}

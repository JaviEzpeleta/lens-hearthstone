"use client";

import {
  useAuthenticatedUser,
  useSessionClient,
  useAccount as useLensAccount,
} from "@lens-protocol/react";

/**
 * useActiveAddress hook
 * Returns the active address for the authenticated user:
 * - Lens Account address if user has one
 * - Authenticated user address as fallback
 */
export function useActiveAddress() {
  const { data: authenticatedUser } = useAuthenticatedUser();
  const { loading: isAuthenticating } = useSessionClient();

  const { data: lensAccount } = useLensAccount({
    address: authenticatedUser?.address,
  });

  const activeAddress =
    lensAccount?.address || authenticatedUser?.address || null;
  const isLensAccount = !!lensAccount;

  return {
    activeAddress,
    isLensAccount,
    lensAccountData: lensAccount || null,
    isLoading: isAuthenticating,
    evmAddress: authenticatedUser?.address || null,
  };
}

"use client";

import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";
import type { AccountAvailable } from "@lens-protocol/graphql";
import { Loader2, User, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createLensClient } from "@/lib/lens/client";
import { APP_ADDRESS } from "@/lib/web3/constants";

interface LoginOptionsProps {
  walletAddress: string;
  onClose?: () => void;
}

// Type guard to check if account is owned (has owner field on account)
function isAccountOwned(item: AccountAvailable, walletAddress: string): boolean {
  // AccountOwned has just { account, addedAt }
  // AccountManaged has { account, addedAt, permissions }
  // We check if the wallet is the owner of the account
  const account = item.account;
  return account.owner.toLowerCase() === walletAddress.toLowerCase();
}

export function LoginOptions({ walletAddress, onClose }: LoginOptionsProps) {
  const [accounts, setAccounts] = useState<readonly AccountAvailable[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signingAccountAddress, setSigningAccountAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();

  // Fetch available accounts
  useEffect(() => {
    async function fetchAccounts() {
      if (!walletAddress) return;

      try {
        setLoading(true);
        setError(null);

        const client = createLensClient();
        const result = await fetchAccountsAvailable(client, {
          managedBy: evmAddress(walletAddress),
          includeOwned: true,
        });

        if (result.isErr()) {
          setError("Failed to fetch Lens accounts");
          console.error("[LoginOptions] Error fetching accounts:", result.error);
          return;
        }

        setAccounts(result.value.items);
      } catch (err) {
        console.error("[LoginOptions] Error:", err);
        setError("An error occurred while fetching accounts");
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [walletAddress]);

  // Handle login for a selected account
  const handleLogin = async (accountItem: AccountAvailable) => {
    if (!walletClient || !walletAddress) {
      setError("Wallet not connected");
      return;
    }

    if (!APP_ADDRESS) {
      setError("App address not configured. Please set NEXT_PUBLIC_APP_ADDRESS in your environment.");
      return;
    }

    const account = accountItem.account;
    setSigning(true);
    setSigningAccountAddress(account.address);
    setError(null);

    try {
      const client = createLensClient();
      const isOwner = isAccountOwned(accountItem, walletAddress);

      // Create the sign message function
      const signMessage = async (message: string) => {
        const signature = await walletClient.signMessage({
          account: walletAddress as `0x${string}`,
          message,
        });
        return signature;
      };

      // Determine challenge type based on owner/manager relationship
      let authenticated;
      if (isOwner) {
        authenticated = await client.login({
          accountOwner: {
            account: evmAddress(account.address),
            owner: evmAddress(walletAddress),
            app: evmAddress(APP_ADDRESS),
          },
          signMessage,
        });
      } else {
        authenticated = await client.login({
          accountManager: {
            account: evmAddress(account.address),
            manager: evmAddress(walletAddress),
            app: evmAddress(APP_ADDRESS),
          },
          signMessage,
        });
      }

      if (authenticated.isErr()) {
        setError(`Login failed: ${authenticated.error.message || "Unknown error"}`);
        console.error("[LoginOptions] Login error:", authenticated.error);
        return;
      }

      console.log("[LoginOptions] Login successful!");
      // Reload the page to pick up the new session
      window.location.reload();
    } catch (err) {
      console.error("[LoginOptions] Error during login:", err);
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setSigning(false);
      setSigningAccountAddress(null);
    }
  };

  // Get account display info
  const getAccountName = (account: AccountAvailable["account"]) => {
    if (account.metadata?.name) return account.metadata.name;
    if (account.username?.localName) return `@${account.username.localName}`;
    return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  };

  const getAccountHandle = (account: AccountAvailable["account"]) => {
    return account.username?.localName ? `@${account.username.localName}` : null;
  };

  const getAccountAvatar = (account: AccountAvailable["account"]) => {
    return account.metadata?.picture || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-gold/30 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h2 className="font-display text-xl text-gold">Select Lens Account</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-gold animate-spin mb-3" />
              <p className="text-gray-400">Loading your Lens accounts...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gold/20 text-gold border border-gold/50 rounded-lg hover:bg-gold/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-6 text-center">
              <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No Lens accounts found for this wallet.</p>
              <a
                href="https://lens.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 text-gold border border-gold/50 rounded-lg hover:bg-gold/30 transition-colors"
              >
                Create a Lens Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {accounts.map((accountItem) => {
                const account = accountItem.account;
                const isOwner = isAccountOwned(accountItem, walletAddress);
                const isSigning = signingAccountAddress === account.address;

                return (
                  <button
                    key={account.address}
                    onClick={() => handleLogin(accountItem)}
                    disabled={signing}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      signing && !isSigning
                        ? "bg-gray-800/50 border-gray-700 cursor-not-allowed opacity-50"
                        : "bg-gray-800/80 border-gray-700 hover:border-gold/50 hover:bg-gray-800"
                    )}
                  >
                    {/* Avatar */}
                    {getAccountAvatar(account) ? (
                      <img
                        src={getAccountAvatar(account)!}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border-2 border-gold/30 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-gold" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{getAccountName(account)}</p>
                      {getAccountHandle(account) && getAccountHandle(account) !== getAccountName(account) && (
                        <p className="text-gray-400 text-sm">{getAccountHandle(account)}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">
                        {isOwner ? "Owner" : "Manager"}
                      </p>
                    </div>

                    {/* Login Button / Loading */}
                    {isSigning ? (
                      <div className="flex items-center gap-2 text-gold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Signing...</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 bg-gold/20 text-gold text-sm rounded-md border border-gold/30">
                        Login
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gold/20 text-center">
          <p className="text-gray-500 text-xs">
            Sign a message to authenticate with Lens Protocol
          </p>
        </div>
      </div>
    </div>
  );
}

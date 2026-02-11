import { PublicClient, mainnet, testnet } from "@lens-protocol/client";
import { NETWORK_MODE } from "@/lib/web3/constants";

/**
 * Create a Lens PublicClient for login operations.
 * This client is used for fetching accounts and initiating login challenges.
 */
export function createLensClient(): PublicClient {
  return PublicClient.create({
    environment: NETWORK_MODE === "mainnet" ? mainnet : testnet,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });
}

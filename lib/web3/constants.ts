// Web3 and Lens Protocol configuration

export type NetworkMode = "mainnet" | "testnet";

// Set the network mode - change to 'testnet' for testing
export const NETWORK_MODE: NetworkMode =
  (process.env.NEXT_PUBLIC_NETWORK_MODE as NetworkMode) || "mainnet";

// RPC URLs
export const RPC_URL_MAINNET = "https://rpc.lens.xyz/";
export const RPC_URL_TESTNET = "https://rpc.testnet.lens.xyz";

// Chain IDs
export const CHAIN_ID_MAINNET = 232;
export const CHAIN_ID_TESTNET = 37111;

// Current chain based on network mode
export const CURRENT_CHAIN_ID =
  NETWORK_MODE === "mainnet" ? CHAIN_ID_MAINNET : CHAIN_ID_TESTNET;

// Native token names
export const NATIVE_TOKEN_NAME_MAINNET = "GHO";
export const NATIVE_TOKEN_NAME_TESTNET = "GRASS";

// Explorers
export const EXPLORER_MAINNET = "https://explorer.lens.xyz";
export const EXPLORER_TESTNET = "https://explorer.testnet.lens.xyz";

// WalletConnect Project ID (get one at https://cloud.walletconnect.com)
export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Lens App Address (register at Lens Builder dashboard)
export const APP_ADDRESS_MAINNET =
  process.env.NEXT_PUBLIC_APP_ADDRESS || "";
export const APP_ADDRESS_TESTNET =
  process.env.NEXT_PUBLIC_APP_ADDRESS_TESTNET || "";
export const APP_ADDRESS =
  NETWORK_MODE === "mainnet" ? APP_ADDRESS_MAINNET : APP_ADDRESS_TESTNET;

// Helper function to get the current RPC URL
export function getRpcUrl(): string {
  return NETWORK_MODE === "mainnet" ? RPC_URL_MAINNET : RPC_URL_TESTNET;
}

// Helper function to get the current explorer URL
export function getExplorerUrl(): string {
  return NETWORK_MODE === "mainnet" ? EXPLORER_MAINNET : EXPLORER_TESTNET;
}

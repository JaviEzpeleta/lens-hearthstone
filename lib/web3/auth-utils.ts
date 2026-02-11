import { PublicClient } from "@lens-protocol/client";

/**
 * Attempt to restore session using Lens SDK's built-in session management.
 * Uses the Lens SDK's resumeSession() which handles token refresh internally.
 */
export async function attemptSessionRecovery(
  client: PublicClient
): Promise<{ success: boolean; sessionClient?: unknown; error?: string }> {
  try {
    // Use SDK's resumeSession - handles token refresh internally
    const resumed = await client.resumeSession();

    if (resumed.isErr()) {
      return { success: false, error: resumed.error.message };
    }

    return { success: true, sessionClient: resumed.value };
  } catch (error) {
    console.error("[Auth] Error during session recovery:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate current session client
 */
export async function validateSessionClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionClient: any
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!sessionClient) {
      return { valid: false, error: "No session client available" };
    }

    const credentials = await sessionClient.getCredentials();

    if (credentials.isErr()) {
      return {
        valid: false,
        error: credentials.error.message || "Invalid credentials",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("[Auth] Error validating session:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

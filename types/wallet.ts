/**
 * Wallet and network types for StelloPay.
 *
 * Shared between {@link context/wallet-context} and the NetworkSwitcher
 * component so both stay in sync without circular imports.
 */

/**
 * A Stellar network the app can connect to.
 */
export interface Network {
  /** Stable machine-readable identifier, e.g. `"public"`, `"testnet"`, `"futurenet"`. */
  id: string;
  /** Human-readable label shown in the UI, e.g. `"Mainnet"`. */
  name: string;
  /**
   * Stellar network passphrase used to sign transactions and select the
   * correct Horizon/RPC endpoint. Only public, well-known passphrases
   * belong here — never a private key or seed phrase.
   */
  passphrase: string;
}

/**
 * The three live Stellar networks supported by StelloPay.
 *
 * EVM chains (ETH, Polygon, BSC, Arbitrum) are intentionally absent —
 * StelloPay is a Stellar-only product and has no EVM adapters.
 * Ordered with Mainnet first so it is the natural default.
 */
export const SUPPORTED_NETWORKS: readonly Network[] = [
  {
    id: "public",
    name: "Mainnet",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  {
    id: "testnet",
    name: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
  },
  {
    id: "futurenet",
    name: "Futurenet",
    passphrase: "Test SDF Future Network ; October 2022",
  },
] as const;

/**
 * The network used when no valid persisted selection exists.
 * Mainnet is the safe production default.
 */
export const DEFAULT_NETWORK: Network = SUPPORTED_NETWORKS[0];

/** localStorage key used to persist the user's active Stellar network. */
export const WALLET_NETWORK_STORAGE_KEY = "stellopay.wallet.network";

import type { Network, WalletConnectionResult } from "./wallet";

export const VALID_WALLET_ADDRESS =
  "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

export const VALID_WALLET_NETWORK: Network = {
  id: "stellar",
  name: "Stellar",
  passphrase: "Public Global Stellar Network ; September 2015",
};

export const VALID_WALLET_CONNECTION_PAYLOAD: WalletConnectionResult = {
  address: VALID_WALLET_ADDRESS,
  network: VALID_WALLET_NETWORK,
};

export const INVALID_SECRET_SEED =
  "SAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDGD";

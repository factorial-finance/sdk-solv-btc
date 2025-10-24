import { Address } from "@ton/core";

export type WalletState = {
  address: Address;
  balance: bigint;
  owner: Address;
  jetton: Address;
};

import { TonClient, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { AddressSender } from "sdk-solv-btc";

export async function config() {
  const network: "mainnet" | "testnet" = "mainnet";
  const client = new TonClient({
    endpoint:
      network === "mainnet"
        ? "https://mainnet.toncenter.com/api/v2/jsonRPC"
        : "https://testnet.toncenter.com/api/v2/jsonRPC",
  });
  const mnemonic =
    "test test test test test test test test test test test junk";
  const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));

  // Network global IDs, -239 is mainnet, -3 is testnet
  const wallet = client.open(
    WalletContractV5R1.create({
      publicKey: keyPair.publicKey,
      walletId: {
        networkGlobalId: network === "mainnet" ? -239 : -3,
        context: {
          workchain: 0,
          walletVersion: "v5r1",
          subwalletNumber: 0,
        },
      },
    }),
  );

  const sender: AddressSender = {
    address: wallet.address,
    send: wallet.sender(keyPair.secretKey).send,
  };
  return { client, wallet, sender, keyPair };
}

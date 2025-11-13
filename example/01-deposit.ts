import { Address, toNano } from "@ton/ton";
import { deposit, JettonMinter, SolvBTCVault } from "sdk-solv-btc";
import { config } from "./00-basic";

export async function run() {
  const { client, wallet, sender, keyPair } = await config();
  const depositAmount = toNano(1);

  const result = await deposit({
    sender,
    client,
    vaultAddress: Address.parse("SolvBTCVault"),
    depositCurrencyAddress: Address.parse("depositCurrency"),
    depositAmount: depositAmount,
  });
  console.log("deposit queryId:", result.queryId);
}

if (require.main === module) run().catch(console.error);

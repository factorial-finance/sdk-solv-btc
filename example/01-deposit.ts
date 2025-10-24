import { Address, toNano } from "@ton/ton";
import { deposit, JettonMinter, SolvBTCVault } from "sdk-solv-btc";
import { config } from "./00-basic";

export async function run() {
  const { client, wallet, sender, keyPair } = await config();
  const vault = client.open(
    SolvBTCVault.createFromAddress(Address.parse("SolvBTCVault")),
  );
  const depositCurrency = client.open(
    JettonMinter.createFromAddress(Address.parse("depositCurrency")),
  );
  const depositAmount = toNano(1);
  const result = await deposit({
    sender,
    vault,
    depositCurrency,
    depositAmount,
  });
  console.log("deposit queryId:", result.queryId);
}

if (require.main === module) run().catch(console.error);

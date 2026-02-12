import { Address, toNano } from "@ton/ton";
import { getWithdrawRequestInfo, withdrawRequest } from "sdk-solv-btc";
import { config } from "./00-basic";

export async function run() {
  const { client, wallet, sender, keyPair } = await config();
  const vaultAddress = Address.parse("SolvBTCVault");
  const withdrawAmount = toNano(0.5);

  // NOTE: Backend-provided requestHash. This will be used later in withdrawClaim tx.
  const requestHash = 9999n;
  const result = await withdrawRequest({
    sender,
    client,
    vaultAddress,
    withdrawAmount: withdrawAmount,
    requestHash: requestHash,
  });
  console.log("withdrawRequest queryId:", result.queryId);

  const { signInput, withdrawHash } = await getWithdrawRequestInfo({
    client,
    vaultAddress,
    withdrawer: wallet.address,
    requestHash,
  });
}

if (require.main === module) run().catch(console.error);

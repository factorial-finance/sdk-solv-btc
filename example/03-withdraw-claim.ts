import { Address, toNano } from "@ton/ton";
import {
  getWithdrawRequestInfo,
  JettonMinter,
  SolvBTCVault,
  withdrawClaim,
} from "sdk-solv-btc";
import { config } from "./00-basic";

export async function run() {
  const { client, wallet, sender, keyPair } = await config();
  const vault = client.open(
    SolvBTCVault.createFromAddress(Address.parse("SolvBTCVault")),
  );
  const vaultCurrency = client.open(
    JettonMinter.createFromAddress(Address.parse("vaultCurrency")),
  );
  const withdrawAmount = toNano(0.5);

  // NOTE: Use the same requestHash from withdrawRequest tx. Backend provides signature for verification.
  const requestHash = 9999n;
  const { signInput, withdrawHash } = await getWithdrawRequestInfo(
    client,
    vault,
    wallet.address,
    requestHash,
  );

  const signature = Buffer.from([]); //

  const result = await withdrawClaim({
    sender,
    vault,
    withdrawer: signInput.withdrawer,
    withdrawAmount: signInput.burnAmount,
    nav: signInput.nav,
    navDecimals: signInput.navDecimals,
    requestHash: signInput.requestHash,
    signature,
  });
  console.log("withdrawClaim queryId:", result.queryId);
}

if (require.main === module) run().catch(console.error);

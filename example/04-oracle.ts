import { Address, toNano } from "@ton/ton";
import { Oracle } from "sdk-solv-btc";
import { config } from "./00-basic";

export async function run() {
  const { client, wallet, sender, keyPair } = await config();
  const oracle = client.open(
    Oracle.createFromAddress(Address.parse("Oracle Address")),
  );

  const data = await oracle.getOracleData();
  const nav = data.nav;
  const navDecimals = data.navDecimals;

  console.log("nav:", nav);
  console.log("nav_decimal_precision:", navDecimals);

  const mintDecimals = BigInt(1e8);

  const depositAmount = BigInt(1e9);
  const depositAssetDecimals = BigInt(1e9);

  const mintAmount =
    (depositAmount * mintDecimals * navDecimals) / nav / depositAssetDecimals;

  const withdrawAssetDecimalPrecision = BigInt(1e9);
  const withdrawAmount =
    (mintAmount * withdrawAssetDecimalPrecision * nav) /
    navDecimals /
    mintDecimals;

  console.log("mint_amount:", mintAmount);
  console.log("withdraw_amount:", withdrawAmount);
}

if (require.main === module) run().catch(console.error);

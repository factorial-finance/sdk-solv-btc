import {
  Address,
  Sender,
  toNano,
  OpenedContract,
  Message,
  Dictionary,
  Transaction,
  SenderArguments,
} from "@ton/core";
import { SolvBTCVault } from "../wrapper/solv/SolvBTCVault";
import { JettonMinter } from "../wrapper/jetton/jetton-minter";
import { TonClient, WalletContractV5R1 } from "@ton/ton";
import { AddressSender } from "./type";

export async function treasurer_deposit(params: {
  sender: AddressSender;
  vault: OpenedContract<SolvBTCVault>;
  currency: OpenedContract<JettonMinter>;
  amount: bigint;
  value?: bigint;
  forwardTonAmount?: bigint;
  responseAddress?: Address;
}) {
  const jettonWallet = await params.currency.getWallet(params.sender.address);

  const forwardTonAmount = params.forwardTonAmount ?? toNano(0.2);
  const value = params.value ?? forwardTonAmount + toNano(0.1);

  const forwardPayload = SolvBTCVault.createTreasurerDepositPayload({
    currencyAddress: params.currency.address,
  });
  await jettonWallet.sendTransfer(params.sender, value, {
    amount: params.amount,
    recipient: params.vault.address,
    response: params.responseAddress ?? params.sender.address,
    forwardTonAmount: forwardTonAmount,
    forwardPayload: forwardPayload,
  });
}

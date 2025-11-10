import {
  Address,
  toNano,
  OpenedContract,
  Message,
  Dictionary,
  Transaction,
} from "@ton/core";
import { SolvBTCVault } from "../wrapper/solv/SolvBTCVault";
import { JettonMinter } from "../wrapper/jetton/jetton-minter";
import { TonClient } from "@ton/ton";
import { AddressSender } from "./type";
import { WithdrawReceipt } from "../wrapper/solv/WithdrawReceipt";
import { createQueryId } from "./utils";

export async function deposit(params: {
  sender: AddressSender;
  vault: OpenedContract<SolvBTCVault>;
  depositCurrency: OpenedContract<JettonMinter>;
  depositAmount: bigint;
  responseAddress?: Address;
  value?: bigint;
  forwardTonAmount?: bigint;
  queryId?: bigint;
}) {
  const jettonWallet = await params.depositCurrency.getWallet(
    params.sender.address,
  );

  const forwardTonAmount = params.forwardTonAmount ?? toNano(0.3); // TODO: review mint error(first mint: 1.2, after: 0.4...)
  const value = params.value ?? forwardTonAmount + toNano(0.03);

  const forwardPayload = SolvBTCVault.createDepositPayload({
    currencyAddress: params.depositCurrency.address,
  });
  const opts = {
    amount: params.depositAmount,
    recipient: params.vault.address,
    response: params.responseAddress ?? params.sender.address,
    forwardTonAmount: forwardTonAmount,
    forwardPayload: forwardPayload,
    queryId: 0n,
  };
  opts.queryId = params.queryId ?? createQueryId(opts);
  await jettonWallet.sendTransfer(params.sender, value, opts);
  return opts;
}

export async function withdrawRequest(params: {
  sender: AddressSender;
  vault: OpenedContract<SolvBTCVault>;
  vaultCurrency: OpenedContract<JettonMinter>;
  withdrawAmount: bigint;
  requestHash: bigint;
  responseAddress?: Address;
  value?: bigint;
  forwardTonAmount?: bigint;
  queryId?: bigint;
}) {
  const forwardPayload = SolvBTCVault.createWithdrawRequestPayload({
    requestHash: params.requestHash,
  });
  const vaultCurrencyWallet = await params.vaultCurrency.getWallet(
    params.sender.address,
  );

  const forwardTonAmount = params.forwardTonAmount ?? toNano(0.2);
  const value = params.value ?? forwardTonAmount + toNano(0.05);

  const opts = {
    amount: params.withdrawAmount,
    recipient: params.vault.address,
    response: params.responseAddress ?? params.sender.address,
    forwardTonAmount: forwardTonAmount,
    forwardPayload: forwardPayload,
    queryId: 0n,
  };
  opts.queryId = params.queryId ?? createQueryId(opts);

  await vaultCurrencyWallet.sendTransfer(params.sender, value, opts);
  return opts;
}

export async function withdrawClaim(params: {
  sender: AddressSender;
  vault: OpenedContract<SolvBTCVault>;
  withdrawer: Address;
  withdrawAmount: bigint;
  nav: bigint;
  navDecimals: bigint;
  requestHash: bigint;
  signature: Buffer<ArrayBufferLike>;
  value?: bigint;
  queryId?: bigint;
}) {
  const value = params.value ?? toNano(0.3);
  const opts = {
    requestHash: params.requestHash,
    withdrawer: params.withdrawer,
    targetTokenAmount: params.withdrawAmount,
    nav: params.nav,
    navDecimals: params.navDecimals,
    signature: params.signature,
    queryId: 0n,
  };
  opts.queryId = params.queryId ?? createQueryId(opts);
  await params.vault.sendWithdraw(params.sender, value, opts);
  return opts;
}

export async function findWithdrawInfoAndWait(
  params: {
    client: TonClient;
    vault: OpenedContract<SolvBTCVault>;
    withdrawer: Address;
    requestHash: bigint;
    queryId?: bigint;
  },
  waitSeconds: number = 90,
) {
  const startTime = Date.now();
  const pollInterval = 10 * 1000; // 10 seconds
  waitSeconds *= 1000;

  while (true) {
    try {
      return await getWithdrawRequestInfo(
        params.client,
        params.vault,
        params.withdrawer,
        params.requestHash,
        params.queryId,
      );
    } catch (error) {
      if (Date.now() - startTime > waitSeconds) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      continue; // retry
    }
  }
}

export async function getWithdrawRequestInfo(
  client: TonClient,
  vault: OpenedContract<SolvBTCVault>,
  withdrawer: Address,
  requestHash: bigint,
  queryId?: bigint,
) {
  const vaultData = await vault.getVaultData();
  const limit = 100;
  const txQuery: { lt?: string; hash?: string } = {
    lt: undefined,
    hash: undefined,
  };
  while (true) {
    const txs = await client.getTransactions(vault.address, {
      limit: 100,
      lt: txQuery.lt,
      hash: txQuery.hash,
      archival: true,
    });

    const tx = findWithdrawHashTx(txs, withdrawer, requestHash, queryId);
    if (tx) {
      const hashInfo = findWithdrawHashInfo(
        tx.outMessages,
        withdrawer,
        requestHash,
        vaultData.withdrawCurrencyAddress,
      );
      return hashInfo;
    } else {
      if (txs.length < limit) {
        throw new Error("Withdraw request Tx not found");
      }
      txQuery.lt = txs[txs.length - 1].lt.toString();
      txQuery.hash = txs[txs.length - 1].hash().toString("hex");
    }
  }
}

export function findWithdrawHashTx(
  txs: Transaction[],
  withdrawer: Address,
  requestHash: bigint,
  queryId?: bigint,
) {
  const withdrawRequestTxs = txs.filter((tx) => {
    const body = tx.inMessage?.body.beginParse();
    if (body) {
      const _op = body.loadUint(32);
      const _queryID = body.loadUintBig(64);
      if (queryId && queryId !== _queryID) return false;

      if (_op === SolvBTCVault.Op.TakeNav) {
        const _nav = body.loadCoins();
        const _navDecimals = body.loadCoins();
        const _subOp = body.loadUint(32);
        if (_subOp === SolvBTCVault.Op.WithdrawRequest) {
          const _burnAmount = body.loadCoins();
          const _withdrawerAddress = body.loadAddress();
          const _requestHash = body.loadUintBig(256);
          if (_withdrawerAddress.equals(withdrawer)) {
            if (_requestHash === requestHash) {
              return true;
            }
          }
        }
      }
    }
    return false;
  });
  if (withdrawRequestTxs.length === 1) {
    return withdrawRequestTxs[0];
  }
  throw new Error("Withdraw request Tx not found");
  // TODO: waiting confirms
}

export function findWithdrawHashInfo(
  outMessages: Dictionary<number, Message>,
  withdrawer: Address,
  requestHash: bigint,
  withdrawCurrencyAddress: Address,
  queryId?: bigint,
) {
  for (const [_, value] of outMessages) {
    const body = value.body.beginParse();
    const _op = body.loadUint(32);
    const _queryID = body.loadUintBig(64);
    if (queryId && queryId !== _queryID) continue;

    if (_op === WithdrawReceipt.Op.InitWithdrawRequest) {
      if (
        body.loadUintBig(256) === requestHash &&
        body.loadAddress().equals(withdrawer)
      ) {
        const initData = value.init!.data!.beginParse();
        initData.loadAddress(); // withdrawer
        const withdrawHash = initData.loadUintBig(256);
        return {
          signInput: {
            requestHash: requestHash,
            withdrawer: withdrawer,
            withdrawCurrency: withdrawCurrencyAddress,
            burnAmount: body.loadCoins(),
            nav: body.loadCoins(),
            navDecimals: body.loadCoins(),
          },
          withdrawHash: withdrawHash,
        };
      }
    }
  }
  throw new Error("Withdraw receipt init info not found");
}

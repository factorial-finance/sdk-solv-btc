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
  client: TonClient;
  vaultAddress: Address;
  depositCurrencyAddress: Address;
  depositAmount: bigint;
  responseAddress?: Address;
  value?: bigint;
  forwardTonAmount?: bigint;
  queryId?: bigint;
}) {
  const depositCurrency = params.client.open(
    JettonMinter.createFromAddress(params.depositCurrencyAddress),
  );
  const jettonWallet = await depositCurrency.getWallet(params.sender.address);

  const forwardTonAmount = params.forwardTonAmount ?? toNano(0.3);
  const value = params.value ?? forwardTonAmount + toNano(0.03);

  const forwardPayload = SolvBTCVault.createDepositPayload({
    currencyAddress: params.depositCurrencyAddress,
  });
  const opts = {
    amount: params.depositAmount,
    recipient: params.vaultAddress,
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
  client: TonClient;
  vaultAddress: Address;
  withdrawAmount: bigint;
  requestHash: bigint;
  responseAddress?: Address;
  value?: bigint;
  forwardTonAmount?: bigint;
  queryId?: bigint;
}) {
  const vault = params.client.open(
    SolvBTCVault.createFromAddress(params.vaultAddress),
  );
  const vaultData = await vault.getVaultData();
  const withdrawCurrency = params.client.open(
    JettonMinter.createFromAddress(vaultData.vaultTokenAddress),
  );
  const vaultCurrencyWallet = await withdrawCurrency.getWallet(
    params.sender.address,
  );

  const forwardPayload = SolvBTCVault.createWithdrawRequestPayload({
    requestHash: params.requestHash,
  });

  const forwardTonAmount = params.forwardTonAmount ?? toNano(0.2);
  const value = params.value ?? forwardTonAmount + toNano(0.05);

  const opts = {
    amount: params.withdrawAmount,
    recipient: vault.address,
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
  client: TonClient;
  vaultAddress: Address;
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

  const vault = params.client.open(
    SolvBTCVault.createFromAddress(params.vaultAddress),
  );
  await vault.sendWithdraw(params.sender, value, opts);
  return opts;
}

export async function findWithdrawRequestInfoAndWait(
  params: {
    client: TonClient;
    vaultAddress: Address;
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
      return await getWithdrawRequestInfo(params);
    } catch (error) {
      if (Date.now() - startTime > waitSeconds) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      continue; // retry
    }
  }
}

export async function getWithdrawRequestInfo(params: {
  client: TonClient;
  vaultAddress: Address;
  withdrawer: Address;
  requestHash: bigint;
  queryId?: bigint;
}) {
  const vault = params.client.open(
    SolvBTCVault.createFromAddress(params.vaultAddress),
  );
  const vaultData = await vault.getVaultData();
  const limit = 100;
  const txQuery: { lt?: string; hash?: string } = {
    lt: undefined,
    hash: undefined,
  };
  while (true) {
    const txs = await params.client.getTransactions(vault.address, {
      limit: 100,
      lt: txQuery.lt,
      hash: txQuery.hash,
      archival: true,
    });

    const tx = findWithdrawHashTx(
      txs,
      params.withdrawer,
      params.requestHash,
      params.queryId,
    );
    if (tx) {
      const hashInfo = findWithdrawHashInfo(
        tx.outMessages,
        params.withdrawer,
        params.requestHash,
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

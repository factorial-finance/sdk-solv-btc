"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = deposit;
exports.withdrawRequest = withdrawRequest;
exports.withdrawClaim = withdrawClaim;
exports.findWithdrawInfoAndWait = findWithdrawInfoAndWait;
exports.getWithdrawRequestInfo = getWithdrawRequestInfo;
exports.findWithdrawHashTx = findWithdrawHashTx;
exports.findWithdrawHashInfo = findWithdrawHashInfo;
const core_1 = require("@ton/core");
const SolvBTCVault_1 = require("../wrapper/solv/SolvBTCVault");
const WithdrawReceipt_1 = require("../wrapper/solv/WithdrawReceipt");
const utils_1 = require("./utils");
async function deposit(params) {
    const jettonWallet = await params.depositCurrency.getWallet(params.sender.address);
    const forwardTonAmount = params.forwardTonAmount ?? (0, core_1.toNano)(0.3); // TODO: review mint error(first mint: 1.2, after: 0.4...)
    const value = params.value ?? forwardTonAmount + (0, core_1.toNano)(0.03);
    const forwardPayload = SolvBTCVault_1.SolvBTCVault.createDepositPayload({
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
    opts.queryId = params.queryId ?? (0, utils_1.createQueryId)(opts);
    await jettonWallet.sendTransfer(params.sender, value, opts);
    return opts;
}
async function withdrawRequest(params) {
    const forwardPayload = SolvBTCVault_1.SolvBTCVault.createWithdrawRequestPayload({
        requestHash: params.requestHash,
    });
    const vaultCurrencyWallet = await params.vaultCurrency.getWallet(params.sender.address);
    const forwardTonAmount = params.forwardTonAmount ?? (0, core_1.toNano)(0.2);
    const value = params.value ?? forwardTonAmount + (0, core_1.toNano)(0.05);
    const opts = {
        amount: params.withdrawAmount,
        recipient: params.vault.address,
        response: params.responseAddress ?? params.sender.address,
        forwardTonAmount: forwardTonAmount,
        forwardPayload: forwardPayload,
        queryId: 0n,
    };
    opts.queryId = params.queryId ?? (0, utils_1.createQueryId)(opts);
    await vaultCurrencyWallet.sendTransfer(params.sender, value, opts);
    return opts;
}
async function withdrawClaim(params) {
    const value = params.value ?? (0, core_1.toNano)(0.3);
    const opts = {
        requestHash: params.requestHash,
        withdrawer: params.withdrawer,
        targetTokenAmount: params.withdrawAmount,
        nav: params.nav,
        navDecimals: params.navDecimals,
        signature: params.signature,
        queryId: 0n,
    };
    opts.queryId = params.queryId ?? (0, utils_1.createQueryId)(opts);
    await params.vault.sendWithdraw(params.sender, value, opts);
    return opts;
}
async function findWithdrawInfoAndWait(params, waitSeconds = 90) {
    const startTime = Date.now();
    const pollInterval = 10 * 1000; // 10 seconds
    waitSeconds *= 1000;
    while (true) {
        try {
            return await getWithdrawRequestInfo(params.client, params.vault, params.withdrawer, params.requestHash, params.queryId);
        }
        catch (error) {
            if (Date.now() - startTime > waitSeconds) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue; // retry
        }
    }
}
async function getWithdrawRequestInfo(client, vault, withdrawer, requestHash, queryId) {
    const vaultData = await vault.getVaultData();
    const limit = 100;
    const txQuery = {
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
            const hashInfo = findWithdrawHashInfo(tx.outMessages, withdrawer, requestHash, vaultData.withdrawCurrencyAddress);
            return hashInfo;
        }
        else {
            if (txs.length < limit) {
                throw new Error("Withdraw request Tx not found");
            }
            txQuery.lt = txs[txs.length - 1].lt.toString();
            txQuery.hash = txs[txs.length - 1].hash().toString("hex");
        }
    }
}
function findWithdrawHashTx(txs, withdrawer, requestHash, queryId) {
    const withdrawRequestTxs = txs.filter((tx) => {
        const body = tx.inMessage?.body.beginParse();
        if (body) {
            const _op = body.loadUint(32);
            const _queryID = body.loadUintBig(64);
            if (queryId && queryId !== _queryID)
                return false;
            if (_op === SolvBTCVault_1.SolvBTCVault.Op.TakeNav) {
                const _nav = body.loadCoins();
                const _navDecimals = body.loadCoins();
                const _subOp = body.loadUint(32);
                if (_subOp === SolvBTCVault_1.SolvBTCVault.Op.WithdrawRequest) {
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
function findWithdrawHashInfo(outMessages, withdrawer, requestHash, withdrawCurrencyAddress, queryId) {
    for (const [_, value] of outMessages) {
        const body = value.body.beginParse();
        const _op = body.loadUint(32);
        const _queryID = body.loadUintBig(64);
        if (queryId && queryId !== _queryID)
            continue;
        if (_op === WithdrawReceipt_1.WithdrawReceipt.Op.InitWithdrawRequest) {
            if (body.loadUintBig(256) === requestHash &&
                body.loadAddress().equals(withdrawer)) {
                const initData = value.init.data.beginParse();
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
//# sourceMappingURL=user.js.map
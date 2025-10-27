"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = deposit;
exports.withdrawRequest = withdrawRequest;
exports.withdrawClaim = withdrawClaim;
exports.getWithdrawRequestInfo = getWithdrawRequestInfo;
exports.findWithdrawHashTx = findWithdrawHashTx;
exports.findWithdrawHashInfo = findWithdrawHashInfo;
const core_1 = require("@ton/core");
const SolvBTCVault_1 = require("../wrapper/solv/SolvBTCVault");
// Verifier utility constants
const WITHDRAW_TYPE_STRING = "Withdraw(address vault,address withdrawer,address targetToken,coins targetTokenAmount,uint256 nav,uint256 navDecimals,uint256 deadline,uint256 requestHash)";
const WITHDRAW_TYPEHASH = 85907793864156741295910430585599355630093544773290176973931850047656250094574n;
const WORKCHAIN = 0;
async function deposit(params) {
    const forwardPayload = SolvBTCVault_1.SolvBTCVault.createDepositPayload({
        currencyAddress: params.depositCurrency.address,
    });
    const jettonWallet = await params.depositCurrency.getWallet(params.vault.address);
    const forwardTonAmount = params.forwardTonAmount ?? (0, core_1.toNano)(0.4);
    const value = params.value ?? forwardTonAmount + (0, core_1.toNano)(0.1);
    await jettonWallet.sendTransfer(params.sender, value, {
        amount: params.depositAmount,
        recipient: params.vault.address,
        response: params.responseAddress,
        forwardTonAmount: forwardTonAmount,
        forwardPayload: forwardPayload,
    });
}
async function withdrawRequest(params) {
    const forwardPayload = SolvBTCVault_1.SolvBTCVault.createWithdrawRequestPayload({
        requestHash: params.requestHash,
    });
    const jettonWallet = await params.withdrawCurrency.getWallet(params.vault.address);
    const forwardTonAmount = params.forwardTonAmount ?? (0, core_1.toNano)(0.25);
    const value = params.value ?? forwardTonAmount + (0, core_1.toNano)(0.1);
    await jettonWallet.sendTransfer(params.sender, value, {
        amount: params.withdrawAmount,
        recipient: params.vault.address,
        response: params.responseAddress,
        forwardTonAmount: forwardTonAmount,
        forwardPayload: forwardPayload,
    });
}
async function withdrawClaim(params) {
    const value = params.value ?? (0, core_1.toNano)(0.5);
    await params.vault.sendWithdraw(params.sender, value, {
        requestHash: params.requestHash,
        withdrawer: params.withdrawer,
        targetTokenAmount: params.withdrawAmount,
        nav: params.nav,
        navDecimals: params.navDecimals,
        signature: params.signature,
    });
}
async function getWithdrawRequestInfo(client, vault, withdrawer, requestHash) {
    const [txs, vaultData] = await Promise.all([
        client.getTransactions(vault.address, {
            limit: 100,
        }),
        vault.getVaultData(),
    ]);
    const tx = findWithdrawHashTx(txs, withdrawer, requestHash);
    const hashInfo = findWithdrawHashInfo(tx.outMessages, withdrawer, requestHash, vaultData.withdrawCurrencyAddress);
    return hashInfo;
}
function findWithdrawHashTx(txs, withdrawer, requestHash) {
    const withdrawRequestTxs = txs.filter((tx) => {
        const body = tx.inMessage?.body.beginParse();
        if (body) {
            if (body.loadUint(32) === SolvBTCVault_1.SolvBTCVault.Op.TakeNav) {
                if (body.loadUint(32) === SolvBTCVault_1.SolvBTCVault.Op.WithdrawRequest) {
                    body.loadCoins(); // withdraw amount
                    if (body.loadAddress().equals(withdrawer)) {
                        if (body.loadUintBig(256) === requestHash) {
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
    throw new Error("Withdraw request not found");
    // TODO: waiting confirms
}
function findWithdrawHashInfo(outMessages, withdrawer, requestHash, withdrawCurrencyAddress) {
    for (const [_, value] of outMessages) {
        const body = value.body.beginParse();
        if (body.loadUint(32) === SolvBTCVault_1.SolvBTCVault.Op.TryLockWithdrawRequest) {
            body.loadUint(64); // query ID
            if (body.loadUintBig(256) === requestHash &&
                body.loadAddress().equals(withdrawer)) {
                const initData = value.init.data.beginParse();
                initData.loadAddress(); // withdrawer
                return {
                    signInput: {
                        requestHash: requestHash,
                        withdrawer: withdrawer,
                        withdrawCurrency: withdrawCurrencyAddress,
                        burnAmount: body.loadCoins(),
                        nav: body.loadCoins(),
                        navDecimals: body.loadCoins(),
                    },
                    withdrawHash: initData.loadUintBig(256),
                };
            }
        }
    }
    throw new Error("Withdraw receipt init info not found");
}
//# sourceMappingURL=index.js.map
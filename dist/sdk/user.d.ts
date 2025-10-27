import { Address, OpenedContract, Message, Dictionary, Transaction } from "@ton/core";
import { SolvBTCVault } from "../wrapper/solv/SolvBTCVault";
import { JettonMinter } from "../wrapper/jetton/jetton-minter";
import { TonClient } from "@ton/ton";
import { AddressSender } from "./type";
export declare function deposit(params: {
    sender: AddressSender;
    vault: OpenedContract<SolvBTCVault>;
    depositCurrency: OpenedContract<JettonMinter>;
    depositAmount: bigint;
    responseAddress?: Address;
    value?: bigint;
    forwardTonAmount?: bigint;
    queryId?: bigint;
}): Promise<{
    amount: bigint;
    recipient: Address;
    response: Address;
    forwardTonAmount: bigint;
    forwardPayload: import("@ton/core").Cell;
    queryId: bigint;
}>;
export declare function withdrawRequest(params: {
    sender: AddressSender;
    vault: OpenedContract<SolvBTCVault>;
    vaultCurrency: OpenedContract<JettonMinter>;
    withdrawAmount: bigint;
    requestHash: bigint;
    responseAddress?: Address;
    value?: bigint;
    forwardTonAmount?: bigint;
    queryId?: bigint;
}): Promise<{
    amount: bigint;
    recipient: Address;
    response: Address;
    forwardTonAmount: bigint;
    forwardPayload: import("@ton/core").Cell;
    queryId: bigint;
}>;
export declare function withdrawClaim(params: {
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
}): Promise<{
    requestHash: bigint;
    withdrawer: Address;
    targetTokenAmount: bigint;
    nav: bigint;
    navDecimals: bigint;
    signature: Buffer<ArrayBufferLike>;
    queryId: bigint;
}>;
export declare function findWithdrawInfoAndWait(params: {
    client: TonClient;
    vault: OpenedContract<SolvBTCVault>;
    withdrawer: Address;
    requestHash: bigint;
    queryId?: bigint;
}, waitSeconds?: number): Promise<{
    signInput: {
        requestHash: bigint;
        withdrawer: Address;
        withdrawCurrency: Address;
        burnAmount: bigint;
        nav: bigint;
        navDecimals: bigint;
    };
    withdrawHash: bigint;
}>;
export declare function getWithdrawRequestInfo(client: TonClient, vault: OpenedContract<SolvBTCVault>, withdrawer: Address, requestHash: bigint, queryId?: bigint): Promise<{
    signInput: {
        requestHash: bigint;
        withdrawer: Address;
        withdrawCurrency: Address;
        burnAmount: bigint;
        nav: bigint;
        navDecimals: bigint;
    };
    withdrawHash: bigint;
}>;
export declare function findWithdrawHashTx(txs: Transaction[], withdrawer: Address, requestHash: bigint, queryId?: bigint): Transaction;
export declare function findWithdrawHashInfo(outMessages: Dictionary<number, Message>, withdrawer: Address, requestHash: bigint, withdrawCurrencyAddress: Address, queryId?: bigint): {
    signInput: {
        requestHash: bigint;
        withdrawer: Address;
        withdrawCurrency: Address;
        burnAmount: bigint;
        nav: bigint;
        navDecimals: bigint;
    };
    withdrawHash: bigint;
};
//# sourceMappingURL=user.d.ts.map
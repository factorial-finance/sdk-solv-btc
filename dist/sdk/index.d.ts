import { Address, Sender, OpenedContract, Message, Dictionary, Transaction } from "@ton/core";
import { SolvBTCVault } from "../wrapper/solv/SolvBTCVault";
import { JettonMinter } from "../wrapper/jetton/jetton-minter";
import { TonClient } from "@ton/ton";
export interface SolvRequestHashPayload {
    deadline: bigint;
}
export interface WithdrawPayload {
    vault: Address;
    withdrawer: Address;
    targetToken: Address;
    targetTokenAmount: bigint;
    nav: bigint;
    navDecimals: bigint;
    deadline: bigint;
}
export interface WithdrawSignParams {
    withdrawPayload: WithdrawPayload;
    requestHash: bigint;
    secretKey: Buffer;
}
export declare function deposit(params: {
    sender: Sender;
    vault: OpenedContract<SolvBTCVault>;
    depositCurrency: OpenedContract<JettonMinter>;
    depositAmount: bigint;
    responseAddress: Address;
    value?: bigint;
    forwardTonAmount?: bigint;
}): Promise<void>;
export declare function withdrawRequest(params: {
    sender: Sender;
    vault: OpenedContract<SolvBTCVault>;
    withdrawAmount: bigint;
    withdrawCurrency: OpenedContract<JettonMinter>;
    requestHash: bigint;
    responseAddress: Address;
    value?: bigint;
    forwardTonAmount?: bigint;
}): Promise<void>;
export declare function withdrawClaim(params: {
    sender: Sender;
    vault: OpenedContract<SolvBTCVault>;
    withdrawer: Address;
    withdrawCurrency: OpenedContract<JettonMinter>;
    withdrawAmount: bigint;
    nav: bigint;
    navDecimals: bigint;
    requestHash: bigint;
    responseAddress: Address;
    signature: Buffer<ArrayBufferLike>;
    value?: bigint;
}): Promise<void>;
export declare function getWithdrawRequestInfo(client: TonClient, vault: OpenedContract<SolvBTCVault>, withdrawer: Address, requestHash: bigint): Promise<{
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
export declare function findWithdrawHashTx(txs: Transaction[], withdrawer: Address, requestHash: bigint): Transaction;
export declare function findWithdrawHashInfo(outMessages: Dictionary<number, Message>, withdrawer: Address, requestHash: bigint, withdrawCurrencyAddress: Address): {
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
//# sourceMappingURL=index.d.ts.map
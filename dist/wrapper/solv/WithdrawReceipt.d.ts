import { Address, Cell, Contract, ContractProvider, Sender } from "@ton/core";
export type WithdrawReceiptConfig = {
    vaultAddress: Address;
    hash: bigint;
};
export type WithdrawReceiptData = {
    vaultAddress: Address;
    hash: bigint;
    status: number;
};
export declare function withdrawReceiptConfigToCell(config: WithdrawReceiptConfig): Cell;
export declare class WithdrawReceipt implements Contract {
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    static Op: {
        InitWithdrawRequest: number;
        TakeInitWithdrawResult: number;
        ExecuteWithdrawRequest: number;
        TakeExecuteWithdrawResult: number;
        RevertExecuteWithdraw: number;
    };
    static Error: {
        NotAdmin: number;
        NotNavManager: number;
        NotNextAdmin: number;
        InvalidNav: number;
        WrongOp: number;
    };
    static Status: {
        NOT_EXIST: number;
        PENDING: number;
        DONE: number;
    };
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    static createFromAddress(address: Address): WithdrawReceipt;
    static createFromConfig(config: WithdrawReceiptConfig, code: Cell, workchain?: number): WithdrawReceipt;
    sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void>;
    sendMsgBody(provider: ContractProvider, via: Sender, value: bigint, msgBody: Cell): Promise<void>;
    getState(provider: ContractProvider): Promise<import("@ton/core").ContractState>;
    getWithdrawReceiptData(provider: ContractProvider): Promise<WithdrawReceiptData>;
}
//# sourceMappingURL=WithdrawReceipt.d.ts.map
import { WalletState } from "./type";
import { Contract, Cell, ContractProvider, Sender, ContractABI, Address } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";
export declare class JettonWallet implements Contract {
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    abi?: Maybe<ContractABI>;
    static Op: {
        TransferNotification: number;
        InternalTransfer: number;
        Transfer: number;
        Burn: number;
        Excesses: number;
        BurnNotification: number;
    };
    static Gas: {
        Transfer: bigint;
    };
    static createFromAddress(address: Address): JettonWallet;
    sendTransfer(provider: ContractProvider, via: Sender, value: bigint, opts: {
        amount: bigint;
        recipient: Address;
        response: Address;
        forwardTonAmount: bigint;
        forwardPayload?: Cell;
        queryId?: bigint;
    }): Promise<Cell>;
    createTransferBody(opts: {
        queryId?: bigint;
        recipient: Address;
        response: Address;
        amount: bigint;
        forwardTonAmount: bigint;
        forwardPayload?: Cell;
    }): Cell;
    static createTransferBody(opts: {
        queryId?: bigint;
        recipient: Address;
        response: Address;
        amount: bigint;
        forwardTonAmount: bigint;
        forwardPayload?: Cell;
    }): Cell;
    static getBurnMsgBody(opts: {
        amount: bigint;
        response: Address;
    }): Cell;
    sendBurn(provider: ContractProvider, via: Sender, value: bigint, opts: {
        amount: bigint;
        response: Address;
        forwardPayload?: Cell;
        queryId?: bigint;
    }): Promise<Cell>;
    getState(provider: ContractProvider): Promise<import("@ton/core").ContractState>;
    getWalletData(provider: ContractProvider): Promise<WalletState>;
    createInternalTransfer(value: bigint, opts: {
        amount: bigint;
        recipient: Address;
        response: Address;
        forwardTonAmount: bigint;
        forwardPayload?: Cell;
        queryId?: bigint;
    }): {
        to: Address;
        value: bigint;
        body: Cell;
    };
    createInternalBurn(value: bigint, opts: {
        amount: bigint;
        response: Address;
        forwardPayload?: Cell;
        queryId?: bigint;
    }): {
        to: Address;
        value: bigint;
        body: Cell;
    };
}
//# sourceMappingURL=jetton-wallet.d.ts.map
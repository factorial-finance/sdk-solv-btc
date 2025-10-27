import { Address, Cell, Contract, ContractProvider, Sender, Slice } from "@ton/core";
export type OracleConfig = {
    nav: bigint;
    navDecimals: bigint;
    navManager: Address;
    adminAddress: Address;
    nextAdminAddress: Address;
    vaultAddress: Address;
};
export type OracleData = ReturnType<typeof Oracle.parseOracleStorage>;
export declare function oracleConfigToCell(config: OracleConfig): Cell;
export declare const Opcodes: {
    provideAccountStatusAndLock: number;
    ExecuteAction: number;
};
export declare class Oracle implements Contract {
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    static Op: {
        ProvideNav: number;
        TakeNav: number;
        SetNav: number;
        SetMaxNavChange: number;
        SetNavManager: number;
        ProvideWithdrawFeeRatio: number;
        TakeWithdrawFeeRatio: number;
        ChangeAdmin: number;
        ClaimAdmin: number;
        UpgradeCode: number;
    };
    static Error: {
        NotAdmin: number;
        NotNavManager: number;
        NotNextAdmin: number;
        InvalidNav: number;
        WrongOp: number;
    };
    static Event: {
        SetNav: string;
        SetNavManager: string;
        ChangeAdmin: string;
        ClaimAdmin: string;
        UpgradeCode: string;
    };
    static createFromAddress(address: Address): Oracle;
    static createFromConfig(config: OracleConfig, code: Cell, workchain?: number): Oracle;
    sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void>;
    sendSetNav(provider: ContractProvider, via: Sender, params: {
        nav: bigint;
        queryId?: bigint;
    }): Promise<void>;
    sendSetMaxNavChange(provider: ContractProvider, via: Sender, params: {
        maxNavChange: bigint;
        queryId?: bigint;
    }): Promise<void>;
    sendSetNavManager(provider: ContractProvider, via: Sender, params: {
        navManager: Address;
        queryId?: bigint;
    }): Promise<void>;
    sendChangeAdmin(provider: ContractProvider, via: Sender, params: {
        newAdmin: Address;
        queryId?: bigint;
    }): Promise<void>;
    sendClaimAdmin(provider: ContractProvider, via: Sender, params: {
        queryId?: bigint;
    }): Promise<void>;
    sendUpgradeCode(provider: ContractProvider, via: Sender, value: bigint, newCode: Cell): Promise<void>;
    sendProvideNav(provider: ContractProvider, via: Sender, params: {
        forwardPayload: Cell;
        queryId?: bigint;
    }): Promise<void>;
    getState(provider: ContractProvider): Promise<import("@ton/core").ContractState>;
    getOracleData(provider: ContractProvider): Promise<{
        nav: bigint;
        navDecimals: bigint;
        navManager: Address;
        adminAddress: Address;
        nextAdminAddress: Address;
        vaultAddress: Address;
    }>;
    static parseOracleStorage(slice: Slice): {
        nav: bigint;
        navDecimals: bigint;
        navManager: Address;
        adminAddress: Address;
        nextAdminAddress: Address;
        vaultAddress: Address;
    };
    static parseSetNavEvent(body: Cell | Slice): {
        preNav: bigint;
        newNav: bigint;
        navDecimals: bigint;
    };
    static parseSetNavManagerEvent(body: Cell | Slice): {
        navManagerAddress: Address;
    };
    static parseChangeAdminEvent(body: Cell | Slice): {
        newNextAdminAddress: Address;
    };
    static parseClaimAdminEvent(body: Cell | Slice): {
        newAdminAddress: Address;
    };
    static parseUpgradeCodeEvent(body: Cell | Slice): {
        codeHash: bigint;
    };
    static parseEvent(eventName: string, body: Cell | Slice): any;
}
//# sourceMappingURL=Oracle.d.ts.map
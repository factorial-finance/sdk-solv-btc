import { Address, Builder, Cell, Contract, ContractProvider, Sender, Slice } from "@ton/core";
export type SolvBTCVaultConfig = {
    currencies?: Cell | null;
    withdrawCurrencyAddress: Address;
    adminAddress: Address;
    oracleAddress: Address | null;
    verifierAddress: Address;
    treasurerAddress: Address;
    vaultTokenAddress: Address;
    withdrawReceiptCode: Cell;
    withdrawCurrencyDecimals: bigint;
    vaultTokenDecimals: bigint;
    withdrawFeeRatio?: bigint;
    withdrawFeeReceiver?: Address;
};
export declare function solvBTCVaultConfigToCell(config: SolvBTCVaultConfig): Cell;
export declare const Opcodes: {
    provideAccountStatusAndLock: number;
    ExecuteAction: number;
};
export declare class SolvBTCVault implements Contract {
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
        DiscoveryWalletAddress: number;
        Deposit: number;
        WithdrawRequest: number;
        Withdraw: number;
        TreasurerDeposit: number;
        ProvideNav: number;
        TakeNav: number;
        TryLockWithdrawRequest: number;
        TakeLockWithdrawResult: number;
        ConfirmWithdraw: number;
        RevertWithdraw: number;
        AddCurrency: number;
        RemoveCurrency: number;
        ChangeAdmin: number;
        ClaimAdmin: number;
        SetOracle: number;
        SetVerifier: number;
        SetTreasurer: number;
        SetWithdrawFeeRatio: number;
        SetWithdrawFeeReceiver: number;
        UpgradeCode: number;
        ProvideWithdrawFeeRatio: number;
        TakeWithdrawFeeRatio: number;
    };
    static GasConstants: {
        JettonBurn: bigint;
        JettonTransfer: bigint;
        JettonMint: bigint;
        JettonMintForwardTon: bigint;
        DepositGasConsumption: bigint;
        TakeNavGasConsumption: bigint;
        NavGasConsumption: bigint;
        WithdrawGasConsumption: bigint;
        InitWithdrawGasConsumption: bigint;
        ReceiptGasConsumption: bigint;
        NANOTON_1e7: bigint;
    };
    static calculateDepositFee(fwdFee: bigint): bigint;
    static calculateWithdrawRequestFee(fwdFee: bigint): bigint;
    static calculateWithdrawExecuteFee(fwdFee: bigint): bigint;
    static Error: {
        CellUnderflow: number;
        WrongWorkchain: number;
        WrongOp: number;
        InvalidStorage: number;
        CurrencyNotWhitelisted: number;
        InvalidWalletAddress: number;
        InvalidOracleAddress: number;
        InvalidTreasurerAddress: number;
        InvalidWithdrawCurrencyAddress: number;
        InvalidSignature: number;
        UnauthorizedWithdrawRequest: number;
        InvalidWithdrawReceiptAddress: number;
        NotAdmin: number;
        CurrencyAlreadyAdded: number;
        CurrencyNotAdded: number;
        NotNextAdmin: number;
        NotEnoughGas: number;
        InvalidWithdrawFeeRatio: number;
        NavDecreased: number;
        InvalidCurrencyDecimals: number;
        AlreadyWithdraw: number;
        NotEnoughWithdrawCurrencyBalance: number;
        AlreadyWithdrawRequest: number;
    };
    static Event: {
        Deposit: string;
        WithdrawRequest: string;
        Withdraw: string;
        TreasurerDeposit: string;
        SetWithdrawVerifier: string;
        SetTreasurer: string;
        SetOracle: string;
        SetFeeReceiver: string;
        SetWithdrawFeeRatio: string;
        SetAllowedCurrency: string;
        WithdrawRequestFailed: string;
        WithdrawFailed: string;
    };
    static createFromAddress(address: Address): SolvBTCVault;
    static createFromConfig(config: SolvBTCVaultConfig, code: Cell, workchain?: number): SolvBTCVault;
    sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void>;
    sendDiscoveryWalletAddress(provider: ContractProvider, via: Sender, value: bigint): Promise<void>;
    sendMsg(provider: ContractProvider, via: Sender, value: bigint, opts: {
        body: Cell;
    }): Promise<void>;
    sendWithdraw(provider: ContractProvider, via: Sender, value: bigint, opts: {
        requestHash: bigint;
        withdrawer: Address;
        targetTokenAmount: bigint;
        nav: bigint;
        navDecimals: bigint;
        signature: Buffer;
        queryID?: number;
    }): Promise<void>;
    sendProvideAccountStatusAndLock(provider: ContractProvider, via: Sender, opts: {
        value: bigint;
        forwardPayload: Builder;
        queryID?: number;
    }): Promise<void>;
    static createDepositPayload(params: {
        currencyAddress: Address;
    }): Cell;
    static createTreasurerDepositPayload(params: {
        currencyAddress: Address;
    }): Cell;
    static createWithdrawRequestPayload(params: {
        requestHash: bigint;
    }): Cell;
    getState(provider: ContractProvider): Promise<import("@ton/core").ContractState>;
    parseState(state: Cell): {
        currencies: Cell | null;
        withdrawCurrencyAddress: Address;
        adminAddress: Address;
        nextAdminAddress: Address | null;
        withdrawCurrencyBalance: bigint;
        oracleAddress: Address;
        verifierAddress: Address;
        treasurerAddress: Address;
        withdrawCurrencyWalletAddress: Address;
        vaultTokenAddress: Address;
        vaultTokenWalletAddress: Address;
        withdrawReceiptCode: Cell;
        withdrawFeeRatio: bigint;
        withdrawFeeReceiver: Address | null;
        withdrawCurrencyDecimals: bigint;
        vaultTokenDecimals: bigint;
    };
    getVaultData(provider: ContractProvider): Promise<{
        currencies: Cell | null;
        withdrawCurrencyAddress: Address;
        adminAddress: Address;
        nextAdminAddress: Address | null;
        withdrawCurrencyBalance: bigint;
        oracleAddress: Address;
        verifierAddress: Address;
        treasurerAddress: Address;
        withdrawCurrencyWalletAddress: Address;
        vaultTokenAddress: Address;
        vaultTokenWalletAddress: Address;
        withdrawReceiptCode: Cell;
        withdrawFeeRatio: bigint;
        withdrawFeeReceiver: Address | null;
        withdrawCurrencyDecimals: bigint;
        vaultTokenDecimals: bigint;
    }>;
    static Dictionary: {
        Values: {
            Currency: () => {
                serialize: (src: Currency, builder: Builder) => Builder;
                parse: (src: Slice) => Currency;
            };
        };
    };
    sendAddCurrency(provider: ContractProvider, via: Sender, value: bigint, currencyAddress: Address, currencyDecimals: bigint): Promise<void>;
    sendRemoveCurrency(provider: ContractProvider, via: Sender, value: bigint, currencyAddress: Address): Promise<void>;
    sendChangeAdmin(provider: ContractProvider, via: Sender, value: bigint, newAdminAddress: Address): Promise<void>;
    sendClaimAdmin(provider: ContractProvider, via: Sender, value: bigint): Promise<void>;
    sendSetOracle(provider: ContractProvider, via: Sender, value: bigint, newOracleAddress: Address): Promise<void>;
    sendSetVerifier(provider: ContractProvider, via: Sender, value: bigint, newVerifierAddress: Address): Promise<void>;
    sendSetTreasurer(provider: ContractProvider, via: Sender, value: bigint, newTreasurerAddress: Address): Promise<void>;
    sendSetWithdrawFeeRatio(provider: ContractProvider, via: Sender, value: bigint, newWithdrawFeeRatio: bigint): Promise<void>;
    sendSetWithdrawFeeReceiver(provider: ContractProvider, via: Sender, value: bigint, newWithdrawFeeReceiver: Address): Promise<void>;
    sendUpgradeCode(provider: ContractProvider, via: Sender, value: bigint, newCode: Cell): Promise<void>;
    sendProvideWithdrawFeeRatio(provider: ContractProvider, via: Sender, opts: {
        forwardPayload: Cell;
        queryId?: bigint;
    }): Promise<void>;
    static parseDepositEvent(body: Cell | Slice): {
        currencyAddress: Address;
        userAddress: Address;
        amount: bigint;
        shares: bigint;
    };
    static parseWithdrawRequestEvent(body: Cell | Slice): {
        userAddress: Address;
        withdrawTokenAddress: Address;
        shares: bigint;
        requestHash: bigint;
        nav: bigint;
    };
    static parseWithdrawEvent(body: Cell | Slice): {
        userAddress: Address;
        withdrawTokenAddress: Address;
        amount: bigint;
        timestamp: bigint;
    };
    static parseTreasurerDepositEvent(body: Cell | Slice): {
        currencyAddress: Address;
        amount: bigint;
    };
    static parseSetWithdrawVerifierEvent(body: Cell | Slice): {
        withdrawVerifierAddress: Address;
    };
    static parseSetTreasurerEvent(body: Cell | Slice): {
        treasurerAddress: Address;
    };
    static parseSetOracleEvent(body: Cell | Slice): {
        oracleAddress: Address;
    };
    static parseSetFeeReceiverEvent(body: Cell | Slice): {
        feeReceiverAddress: Address;
    };
    static parseSetWithdrawFeeRatioEvent(body: Cell | Slice): {
        withdrawFeeRatio: bigint;
    };
    static parseSetAllowedCurrencyEvent(body: Cell | Slice): {
        currencyAddress: Address;
        allowed: boolean;
    };
    static parseWithdrawRequestFailedEvent(body: Cell | Slice): {
        userAddress: Address;
        receiptAddress: Address;
        errorCode: bigint;
    };
    static parseWithdrawFailedEvent(body: Cell | Slice): {
        userAddress: Address;
        receiptAddress: Address;
        errorCode: bigint;
    };
    static parseEvent(eventName: string, body: Cell | Slice): any;
}
type Currency = {
    walletAddress: Address | null;
    decimals: bigint;
};
export {};
//# sourceMappingURL=SolvBTCVault.d.ts.map
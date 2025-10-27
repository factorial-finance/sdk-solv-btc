"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolvBTCVault = exports.Opcodes = void 0;
exports.solvBTCVaultConfigToCell = solvBTCVaultConfigToCell;
const core_1 = require("@ton/core");
function solvBTCVaultConfigToCell(config) {
    return (0, core_1.beginCell)()
        .storeMaybeRef(config.currencies)
        .storeAddress(config.withdrawCurrencyAddress)
        .storeAddress(config.adminAddress)
        .storeAddress(null)
        .storeCoins(0)
        .storeRef((0, core_1.beginCell)()
        .storeAddress(config.oracleAddress ?? null)
        .storeAddress(config.verifierAddress)
        .storeAddress(config.treasurerAddress)
        .endCell())
        .storeRef((0, core_1.beginCell)()
        .storeAddress(null)
        .storeAddress(config.vaultTokenAddress)
        .storeAddress(null)
        .endCell())
        .storeRef((0, core_1.beginCell)()
        .storeRef(config.withdrawReceiptCode)
        .storeCoins(config.withdrawFeeRatio ?? 0)
        .storeAddress(config.withdrawFeeReceiver ?? null)
        .storeCoins(config.withdrawCurrencyDecimals)
        .storeCoins(config.vaultTokenDecimals)
        .endCell())
        .endCell();
}
exports.Opcodes = {
    provideAccountStatusAndLock: 0xbf281c87,
    ExecuteAction: 0x2be12d37,
};
class SolvBTCVault {
    constructor(address, init) {
        this.address = address;
        this.init = init;
    }
    static calculateDepositFee(fwdFee) {
        const computeFee = (gas) => gas; // Simplified compute fee calculation
        return (fwdFee * 2n +
            computeFee(SolvBTCVault.GasConstants.DepositGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.NavGasConsumption) +
            SolvBTCVault.GasConstants.JettonTransfer +
            SolvBTCVault.GasConstants.JettonMint +
            SolvBTCVault.GasConstants.NANOTON_1e7);
    }
    static calculateWithdrawRequestFee(fwdFee) {
        const computeFee = (gas) => gas; // Simplified compute fee calculation
        return (fwdFee * 5n +
            computeFee(SolvBTCVault.GasConstants.InitWithdrawGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.ReceiptGasConsumption) +
            SolvBTCVault.GasConstants.JettonBurn +
            SolvBTCVault.GasConstants.NANOTON_1e7);
    }
    static calculateWithdrawExecuteFee(fwdFee) {
        const computeFee = (gas) => gas; // Simplified compute fee calculation
        return (fwdFee * 5n +
            computeFee(SolvBTCVault.GasConstants.WithdrawGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
            computeFee(SolvBTCVault.GasConstants.ReceiptGasConsumption) +
            SolvBTCVault.GasConstants.JettonTransfer * 2n +
            SolvBTCVault.GasConstants.NANOTON_1e7);
    }
    static createFromAddress(address) {
        return new SolvBTCVault(address);
    }
    static createFromConfig(config, code, workchain = 0) {
        const data = solvBTCVaultConfigToCell(config);
        const init = { code, data };
        return new SolvBTCVault((0, core_1.contractAddress)(workchain, init), init);
    }
    async sendDeploy(provider, via, value) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)().endCell(),
        });
    }
    async sendDiscoveryWalletAddress(provider, via, value) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.DiscoveryWalletAddress, 32)
                .storeUint(0, 64)
                .endCell(),
        });
    }
    async sendMsg(provider, via, value, opts) {
        await provider.internal(via, {
            value: value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: opts.body,
        });
    }
    async sendWithdraw(provider, via, value, opts) {
        await provider.internal(via, {
            value: value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.Withdraw, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef((0, core_1.beginCell)().storeBuffer(opts.signature).endCell())
                .storeUint(opts.requestHash, 256)
                .storeAddress(opts.withdrawer)
                .storeCoins(opts.targetTokenAmount)
                .storeCoins(opts.nav)
                .storeCoins(opts.navDecimals)
                .endCell(),
        });
    }
    async sendProvideAccountStatusAndLock(provider, via, opts) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(exports.Opcodes.provideAccountStatusAndLock, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeBuilder(opts.forwardPayload)
                .endCell(),
        });
    }
    static createDepositPayload(params) {
        return (0, core_1.beginCell)()
            .storeUint(SolvBTCVault.Op.Deposit, 32)
            .storeAddress(params.currencyAddress)
            .endCell();
    }
    static createTreasurerDepositPayload(params) {
        return (0, core_1.beginCell)()
            .storeUint(SolvBTCVault.Op.TreasurerDeposit, 32)
            .storeAddress(params.currencyAddress)
            .endCell();
    }
    static createWithdrawRequestPayload(params) {
        return (0, core_1.beginCell)()
            .storeUint(SolvBTCVault.Op.WithdrawRequest, 32)
            .storeUint(params.requestHash, 256)
            .endCell();
    }
    async getState(provider) {
        return await provider.getState();
    }
    parseState(state) {
        const slice = state.beginParse();
        const currencies = slice.loadMaybeRef();
        const withdrawCurrencyAddress = slice.loadAddress();
        const adminAddress = slice.loadAddress();
        const nextAdminAddress = slice.loadMaybeAddress(); // maybe
        const withdrawCurrencyBalance = slice.loadCoins();
        const subSlice1 = slice.loadRef().beginParse();
        const oracleAddress = subSlice1.loadAddress();
        const verifierAddress = subSlice1.loadAddress();
        const treasurerAddress = subSlice1.loadAddress();
        const subSlice2 = slice.loadRef().beginParse();
        const withdrawCurrencyWalletAddress = subSlice2.loadAddress();
        const vaultTokenAddress = subSlice2.loadAddress();
        const vaultTokenWalletAddress = subSlice2.loadAddress();
        const subSlice3 = slice.loadRef().beginParse();
        const withdrawReceiptCode = subSlice3.loadRef();
        const withdrawFeeRatio = subSlice3.loadCoins();
        const withdrawFeeReceiver = subSlice3.loadMaybeAddress(); // maybe
        const withdrawCurrencyDecimals = subSlice3.loadCoins();
        const vaultTokenDecimals = subSlice3.loadCoins();
        return {
            currencies,
            withdrawCurrencyAddress,
            adminAddress,
            nextAdminAddress,
            withdrawCurrencyBalance,
            oracleAddress,
            verifierAddress,
            treasurerAddress,
            withdrawCurrencyWalletAddress,
            vaultTokenAddress,
            vaultTokenWalletAddress,
            withdrawReceiptCode,
            withdrawFeeRatio,
            withdrawFeeReceiver,
            withdrawCurrencyDecimals,
            vaultTokenDecimals,
        };
    }
    async getVaultData(provider) {
        const vaultState = await this.getState(provider);
        if (vaultState.state.type !== "active")
            throw Error("not active");
        if (!vaultState.state.data)
            throw Error("not active");
        const data = core_1.Cell.fromBoc(vaultState.state.data)[0];
        return this.parseState(data);
    }
    async sendAddCurrency(provider, via, value, currencyAddress, currencyDecimals) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.AddCurrency, 32)
                .storeUint(0, 64)
                .storeAddress(currencyAddress)
                .storeCoins(currencyDecimals)
                .endCell(),
        });
    }
    async sendRemoveCurrency(provider, via, value, currencyAddress) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.RemoveCurrency, 32)
                .storeUint(0, 64)
                .storeAddress(currencyAddress)
                .endCell(),
        });
    }
    async sendChangeAdmin(provider, via, value, newAdminAddress) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.ChangeAdmin, 32)
                .storeUint(0, 64)
                .storeAddress(newAdminAddress)
                .endCell(),
        });
    }
    async sendClaimAdmin(provider, via, value) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.ClaimAdmin, 32)
                .storeUint(0, 64)
                .endCell(),
        });
    }
    async sendSetOracle(provider, via, value, newOracleAddress) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.SetOracle, 32)
                .storeUint(0, 64)
                .storeAddress(newOracleAddress)
                .endCell(),
        });
    }
    async sendSetVerifier(provider, via, value, newVerifierAddress) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.SetVerifier, 32)
                .storeUint(0, 64)
                .storeAddress(newVerifierAddress)
                .endCell(),
        });
    }
    async sendSetTreasurer(provider, via, value, newTreasurerAddress) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.SetTreasurer, 32)
                .storeUint(0, 64)
                .storeAddress(newTreasurerAddress)
                .endCell(),
        });
    }
    async sendSetWithdrawFeeRatio(provider, via, value, newWithdrawFeeRatio) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.SetWithdrawFeeRatio, 32)
                .storeUint(0, 64)
                .storeCoins(newWithdrawFeeRatio)
                .endCell(),
        });
    }
    async sendSetWithdrawFeeReceiver(provider, via, value, newWithdrawFeeReceiver) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.SetWithdrawFeeReceiver, 32)
                .storeUint(0, 64)
                .storeAddress(newWithdrawFeeReceiver)
                .endCell(),
        });
    }
    async sendUpgradeCode(provider, via, value, newCode) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.UpgradeCode, 32)
                .storeUint(0, 64)
                .storeRef(newCode)
                .endCell(),
        });
    }
    async sendProvideWithdrawFeeRatio(provider, via, opts) {
        await provider.internal(via, {
            value: (0, core_1.toNano)("0.1"),
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(SolvBTCVault.Op.ProvideWithdrawFeeRatio, 32)
                .storeUint(opts.queryId ?? 0, 64)
                .storeRef(opts.forwardPayload)
                .endCell(),
        });
    }
    // Event parsing methods
    static parseDepositEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const currencyAddress = slice.loadAddress();
        const userAddress = slice.loadAddress();
        const amount = slice.loadCoins();
        const shares = slice.loadCoins();
        return { currencyAddress, userAddress, amount, shares };
    }
    static parseWithdrawRequestEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const userAddress = slice.loadAddress();
        const withdrawTokenAddress = slice.loadAddress();
        const shares = slice.loadCoins();
        const requestHash = slice.loadUintBig(256);
        const nav = slice.loadCoins();
        return { userAddress, withdrawTokenAddress, shares, requestHash, nav };
    }
    static parseWithdrawEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const userAddress = slice.loadAddress();
        const withdrawTokenAddress = slice.loadAddress();
        const amount = slice.loadCoins();
        const timestamp = slice.loadUintBig(64);
        return { userAddress, withdrawTokenAddress, amount, timestamp };
    }
    static parseTreasurerDepositEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const currencyAddress = slice.loadAddress();
        const amount = slice.loadCoins();
        return { currencyAddress, amount };
    }
    static parseSetWithdrawVerifierEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const withdrawVerifierAddress = slice.loadAddress();
        return { withdrawVerifierAddress };
    }
    static parseSetTreasurerEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const treasurerAddress = slice.loadAddress();
        return { treasurerAddress };
    }
    static parseSetOracleEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const oracleAddress = slice.loadAddress();
        return { oracleAddress };
    }
    static parseSetFeeReceiverEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const feeReceiverAddress = slice.loadAddress();
        return { feeReceiverAddress };
    }
    static parseSetWithdrawFeeRatioEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const withdrawFeeRatio = slice.loadCoins();
        return { withdrawFeeRatio };
    }
    static parseSetAllowedCurrencyEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const currencyAddress = slice.loadAddress();
        const allowed = slice.loadBoolean();
        return { currencyAddress, allowed };
    }
    static parseWithdrawRequestFailedEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const userAddress = slice.loadAddress();
        const receiptAddress = slice.loadAddress();
        const errorCode = slice.loadCoins();
        return { userAddress, receiptAddress, errorCode };
    }
    static parseWithdrawFailedEvent(body) {
        const slice = body instanceof core_1.Cell ? body.beginParse() : body;
        const userAddress = slice.loadAddress();
        const receiptAddress = slice.loadAddress();
        const errorCode = slice.loadCoins();
        return { userAddress, receiptAddress, errorCode };
    }
    // Generic event parser
    static parseEvent(eventName, body) {
        switch (eventName) {
            case SolvBTCVault.Event.Deposit:
                return SolvBTCVault.parseDepositEvent(body);
            case SolvBTCVault.Event.WithdrawRequest:
                return SolvBTCVault.parseWithdrawRequestEvent(body);
            case SolvBTCVault.Event.Withdraw:
                return SolvBTCVault.parseWithdrawEvent(body);
            case SolvBTCVault.Event.TreasurerDeposit:
                return SolvBTCVault.parseTreasurerDepositEvent(body);
            case SolvBTCVault.Event.SetWithdrawVerifier:
                return SolvBTCVault.parseSetWithdrawVerifierEvent(body);
            case SolvBTCVault.Event.SetTreasurer:
                return SolvBTCVault.parseSetTreasurerEvent(body);
            case SolvBTCVault.Event.SetOracle:
                return SolvBTCVault.parseSetOracleEvent(body);
            case SolvBTCVault.Event.SetFeeReceiver:
                return SolvBTCVault.parseSetFeeReceiverEvent(body);
            case SolvBTCVault.Event.SetWithdrawFeeRatio:
                return SolvBTCVault.parseSetWithdrawFeeRatioEvent(body);
            case SolvBTCVault.Event.SetAllowedCurrency:
                return SolvBTCVault.parseSetAllowedCurrencyEvent(body);
            case SolvBTCVault.Event.WithdrawRequestFailed:
                return SolvBTCVault.parseWithdrawRequestFailedEvent(body);
            case SolvBTCVault.Event.WithdrawFailed:
                return SolvBTCVault.parseWithdrawFailedEvent(body);
            default:
                throw new Error(`Unknown event type: ${eventName}`);
        }
    }
}
exports.SolvBTCVault = SolvBTCVault;
SolvBTCVault.Op = {
    DiscoveryWalletAddress: 0x34d0613d,
    Deposit: 0xf9471134,
    WithdrawRequest: 0xf2de0fef,
    Withdraw: 0xcb03bfaf,
    TreasurerDeposit: 0xd7eb6e5e,
    ProvideNav: 0xc57779f2,
    TakeNav: 0x396297f6,
    TryLockWithdrawRequest: 0x3e8ea7db,
    TakeLockWithdrawResult: 0x6f027bbc,
    ConfirmWithdraw: 0x6f027bbc,
    RevertWithdraw: 0x1db9287c,
    AddCurrency: 0x33e2d644,
    RemoveCurrency: 0x7d9791,
    ChangeAdmin: 0xb6801836,
    ClaimAdmin: 0x37f6346c,
    SetOracle: 0x34fb5566,
    SetVerifier: 0xa7263978,
    SetTreasurer: 0x8af7d185,
    SetWithdrawFeeRatio: 0x883b66c1,
    SetWithdrawFeeReceiver: 0x117a3f15,
    UpgradeCode: 0x61bddf8b,
    ProvideWithdrawFeeRatio: 0x8cde1508,
    TakeWithdrawFeeRatio: 0x2a38f37c,
};
SolvBTCVault.GasConstants = {
    JettonBurn: 100000000n, // 0.1 TON
    JettonTransfer: 100000000n, // 0.1 TON
    JettonMint: 100000000n, // 0.1 TON
    JettonMintForwardTon: 50000000n, // 0.05 TON
    DepositGasConsumption: 10000n,
    TakeNavGasConsumption: 15000n,
    NavGasConsumption: 10000n,
    WithdrawGasConsumption: 15000n,
    InitWithdrawGasConsumption: 10000n,
    ReceiptGasConsumption: 10000n,
    NANOTON_1e7: 10000000n,
};
SolvBTCVault.Error = {
    CellUnderflow: 9,
    WrongWorkchain: 333,
    WrongOp: 0xffff,
    InvalidStorage: 1004,
    CurrencyNotWhitelisted: 1005,
    InvalidWalletAddress: 1006,
    InvalidOracleAddress: 1007,
    InvalidTreasurerAddress: 1008,
    InvalidWithdrawCurrencyAddress: 1009,
    InvalidSignature: 1010,
    UnauthorizedWithdrawRequest: 1012,
    InvalidWithdrawReceiptAddress: 1014,
    NotAdmin: 1016,
    CurrencyAlreadyAdded: 1017,
    CurrencyNotAdded: 1018,
    NotNextAdmin: 1020,
    NotEnoughGas: 1021,
    InvalidWithdrawFeeRatio: 1022,
    NavDecreased: 1023,
    InvalidCurrencyDecimals: 1024,
    AlreadyWithdraw: 1025,
    NotEnoughWithdrawCurrencyBalance: 1026,
    AlreadyWithdrawRequest: 1027,
};
SolvBTCVault.Event = {
    Deposit: "event::deposit",
    WithdrawRequest: "event::withdraw_request",
    Withdraw: "event::withdraw",
    TreasurerDeposit: "event::treasurer_deposit",
    SetWithdrawVerifier: "event::set_withdraw_verifier",
    SetTreasurer: "event::set_treasurer",
    SetOracle: "event::set_oracle",
    SetFeeReceiver: "event::set_fee_receiver",
    SetWithdrawFeeRatio: "event::set_withdraw_fee_ratio",
    SetAllowedCurrency: "event::set_allowed_currency",
    WithdrawRequestFailed: "event::withdraw_request_failed",
    WithdrawFailed: "event::withdraw_failed",
};
SolvBTCVault.Dictionary = {
    Values: {
        Currency: () => ({
            serialize: (src, builder) => {
                builder.storeAddress(src.walletAddress);
                builder.storeCoins(src.decimals);
                return builder;
            },
            parse: (src) => {
                const walletAddress = src.loadMaybeAddress();
                const decimals = src.loadCoins();
                return {
                    walletAddress,
                    decimals,
                };
            },
        }),
    },
};
//# sourceMappingURL=SolvBTCVault.js.map
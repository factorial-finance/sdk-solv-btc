import {
  Address,
  beginCell,
  Builder,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Dictionary,
  Sender,
  SendMode,
  Slice,
  TupleItemInt,
  TupleItemSlice,
  toNano,
} from "@ton/core";

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

export function solvBTCVaultConfigToCell(config: SolvBTCVaultConfig): Cell {
  return beginCell()
    .storeMaybeRef(config.currencies)
    .storeAddress(config.withdrawCurrencyAddress)
    .storeAddress(config.adminAddress)
    .storeAddress(null)
    .storeCoins(0)
    .storeRef(
      beginCell()
        .storeAddress(config.oracleAddress ?? null)
        .storeAddress(config.verifierAddress)
        .storeAddress(config.treasurerAddress)
        .endCell(),
    )
    .storeRef(
      beginCell()
        .storeAddress(null)
        .storeAddress(config.vaultTokenAddress)
        .storeAddress(null)
        .endCell(),
    )
    .storeRef(
      beginCell()
        .storeRef(config.withdrawReceiptCode)
        .storeCoins(config.withdrawFeeRatio ?? 0)
        .storeAddress(config.withdrawFeeReceiver ?? null)
        .storeCoins(config.withdrawCurrencyDecimals)
        .storeCoins(config.vaultTokenDecimals)
        .endCell(),
    )
    .endCell();
}

export const Opcodes = {
  provideAccountStatusAndLock: 0xbf281c87,
  ExecuteAction: 0x2be12d37,
};

export class SolvBTCVault implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static Op = {
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

  static GasConstants = {
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

  static calculateDepositFee(fwdFee: bigint): bigint {
    const computeFee = (gas: bigint) => gas; // Simplified compute fee calculation
    return (
      fwdFee * 2n +
      computeFee(SolvBTCVault.GasConstants.DepositGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.NavGasConsumption) +
      SolvBTCVault.GasConstants.JettonTransfer +
      SolvBTCVault.GasConstants.JettonMint +
      SolvBTCVault.GasConstants.NANOTON_1e7
    );
  }

  static calculateWithdrawRequestFee(fwdFee: bigint): bigint {
    const computeFee = (gas: bigint) => gas; // Simplified compute fee calculation
    return (
      fwdFee * 5n +
      computeFee(SolvBTCVault.GasConstants.InitWithdrawGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.ReceiptGasConsumption) +
      SolvBTCVault.GasConstants.JettonBurn +
      SolvBTCVault.GasConstants.NANOTON_1e7
    );
  }

  static calculateWithdrawExecuteFee(fwdFee: bigint): bigint {
    const computeFee = (gas: bigint) => gas; // Simplified compute fee calculation
    return (
      fwdFee * 5n +
      computeFee(SolvBTCVault.GasConstants.WithdrawGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.TakeNavGasConsumption) +
      computeFee(SolvBTCVault.GasConstants.ReceiptGasConsumption) +
      SolvBTCVault.GasConstants.JettonTransfer * 2n +
      SolvBTCVault.GasConstants.NANOTON_1e7
    );
  }

  static Error = {
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

  static Event = {
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

  static createFromAddress(address: Address) {
    return new SolvBTCVault(address);
  }

  static createFromConfig(
    config: SolvBTCVaultConfig,
    code: Cell,
    workchain = 0,
  ) {
    const data = solvBTCVaultConfigToCell(config);
    const init = { code, data };
    return new SolvBTCVault(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendDiscoveryWalletAddress(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.DiscoveryWalletAddress, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendMsg(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
      body: Cell;
    },
  ) {
    await provider.internal(via, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: opts.body,
    });
  }

  async sendWithdraw(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
      requestHash: bigint;
      withdrawer: Address;
      targetTokenAmount: bigint;
      nav: bigint;
      navDecimals: bigint;
      signature: Buffer;
      queryID?: number;
    },
  ) {
    await provider.internal(via, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.Withdraw, 32)
        .storeUint(opts.queryID ?? 0, 64)
        .storeRef(beginCell().storeBuffer(opts.signature).endCell())
        .storeUint(opts.requestHash, 256)
        .storeAddress(opts.withdrawer)
        .storeCoins(opts.targetTokenAmount)
        .storeCoins(opts.nav)
        .storeCoins(opts.navDecimals)
        .endCell(),
    });
  }

  async sendProvideAccountStatusAndLock(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value: bigint;
      forwardPayload: Builder;
      queryID?: number;
    },
  ) {
    await provider.internal(via, {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.provideAccountStatusAndLock, 32)
        .storeUint(opts.queryID ?? 0, 64)
        .storeBuilder(opts.forwardPayload)
        .endCell(),
    });
  }

  static createDepositPayload(params: { currencyAddress: Address }) {
    return beginCell()
      .storeUint(SolvBTCVault.Op.Deposit, 32)
      .storeAddress(params.currencyAddress)
      .endCell();
  }

  static createTreasurerDepositPayload(params: { currencyAddress: Address }) {
    return beginCell()
      .storeUint(SolvBTCVault.Op.TreasurerDeposit, 32)
      .storeAddress(params.currencyAddress)
      .endCell();
  }

  static createWithdrawRequestPayload(params: { requestHash: bigint }) {
    return beginCell()
      .storeUint(SolvBTCVault.Op.WithdrawRequest, 32)
      .storeUint(params.requestHash, 256)
      .endCell();
  }

  async getState(provider: ContractProvider) {
    return await provider.getState();
  }

  parseState(state: Cell) {
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

  async getVaultData(provider: ContractProvider) {
    const vaultState = await this.getState(provider);
    if (vaultState.state.type !== "active") throw Error("not active");
    if (!vaultState.state.data) throw Error("not active");

    const data = Cell.fromBoc(vaultState.state.data)[0];
    return this.parseState(data);
  }

  static Dictionary = {
    Values: {
      Currency: () => ({
        serialize: (src: Currency, builder: Builder): Builder => {
          builder.storeAddress(src.walletAddress);
          builder.storeCoins(src.decimals);
          return builder;
        },
        parse: (src: Slice): Currency => {
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

  async sendAddCurrency(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    currencyAddress: Address,
    currencyDecimals: bigint,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.AddCurrency, 32)
        .storeUint(0, 64)
        .storeAddress(currencyAddress)
        .storeCoins(currencyDecimals)
        .endCell(),
    });
  }

  async sendRemoveCurrency(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    currencyAddress: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.RemoveCurrency, 32)
        .storeUint(0, 64)
        .storeAddress(currencyAddress)
        .endCell(),
    });
  }

  async sendChangeAdmin(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newAdminAddress: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.ChangeAdmin, 32)
        .storeUint(0, 64)
        .storeAddress(newAdminAddress)
        .endCell(),
    });
  }

  async sendClaimAdmin(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.ClaimAdmin, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendSetOracle(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newOracleAddress: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.SetOracle, 32)
        .storeUint(0, 64)
        .storeAddress(newOracleAddress)
        .endCell(),
    });
  }

  async sendSetVerifier(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newVerifierAddress: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.SetVerifier, 32)
        .storeUint(0, 64)
        .storeAddress(newVerifierAddress)
        .endCell(),
    });
  }

  async sendSetTreasurer(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newTreasurerAddress: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.SetTreasurer, 32)
        .storeUint(0, 64)
        .storeAddress(newTreasurerAddress)
        .endCell(),
    });
  }

  async sendSetWithdrawFeeRatio(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newWithdrawFeeRatio: bigint,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.SetWithdrawFeeRatio, 32)
        .storeUint(0, 64)
        .storeCoins(newWithdrawFeeRatio)
        .endCell(),
    });
  }

  async sendSetWithdrawFeeReceiver(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newWithdrawFeeReceiver: Address,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.SetWithdrawFeeReceiver, 32)
        .storeUint(0, 64)
        .storeAddress(newWithdrawFeeReceiver)
        .endCell(),
    });
  }

  async sendUpgradeCode(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    newCode: Cell,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.UpgradeCode, 32)
        .storeUint(0, 64)
        .storeRef(newCode)
        .endCell(),
    });
  }

  async sendProvideWithdrawFeeRatio(
    provider: ContractProvider,
    via: Sender,
    opts: {
      forwardPayload: Cell;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(SolvBTCVault.Op.ProvideWithdrawFeeRatio, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeRef(opts.forwardPayload)
        .endCell(),
    });
  }

  // Event parsing methods
  static parseDepositEvent(body: Cell | Slice): {
    currencyAddress: Address;
    userAddress: Address;
    amount: bigint;
    shares: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const currencyAddress = slice.loadAddress();
    const userAddress = slice.loadAddress();
    const amount = slice.loadCoins();
    const shares = slice.loadCoins();

    return { currencyAddress, userAddress, amount, shares };
  }

  static parseWithdrawRequestEvent(body: Cell | Slice): {
    userAddress: Address;
    withdrawTokenAddress: Address;
    shares: bigint;
    requestHash: bigint;
    nav: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const userAddress = slice.loadAddress();
    const withdrawTokenAddress = slice.loadAddress();
    const shares = slice.loadCoins();
    const requestHash = slice.loadUintBig(256);
    const nav = slice.loadCoins();

    return { userAddress, withdrawTokenAddress, shares, requestHash, nav };
  }

  static parseWithdrawEvent(body: Cell | Slice): {
    userAddress: Address;
    withdrawTokenAddress: Address;
    amount: bigint;
    timestamp: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const userAddress = slice.loadAddress();
    const withdrawTokenAddress = slice.loadAddress();
    const amount = slice.loadCoins();
    const timestamp = slice.loadUintBig(64);

    return { userAddress, withdrawTokenAddress, amount, timestamp };
  }

  static parseTreasurerDepositEvent(body: Cell | Slice): {
    currencyAddress: Address;
    amount: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const currencyAddress = slice.loadAddress();
    const amount = slice.loadCoins();

    return { currencyAddress, amount };
  }

  static parseSetWithdrawVerifierEvent(body: Cell | Slice): {
    withdrawVerifierAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const withdrawVerifierAddress = slice.loadAddress();

    return { withdrawVerifierAddress };
  }

  static parseSetTreasurerEvent(body: Cell | Slice): {
    treasurerAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const treasurerAddress = slice.loadAddress();

    return { treasurerAddress };
  }

  static parseSetOracleEvent(body: Cell | Slice): {
    oracleAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const oracleAddress = slice.loadAddress();

    return { oracleAddress };
  }

  static parseSetFeeReceiverEvent(body: Cell | Slice): {
    feeReceiverAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const feeReceiverAddress = slice.loadAddress();

    return { feeReceiverAddress };
  }

  static parseSetWithdrawFeeRatioEvent(body: Cell | Slice): {
    withdrawFeeRatio: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const withdrawFeeRatio = slice.loadCoins();

    return { withdrawFeeRatio };
  }

  static parseSetAllowedCurrencyEvent(body: Cell | Slice): {
    currencyAddress: Address;
    allowed: boolean;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const currencyAddress = slice.loadAddress();
    const allowed = slice.loadBoolean();

    return { currencyAddress, allowed };
  }

  static parseWithdrawRequestFailedEvent(body: Cell | Slice): {
    userAddress: Address;
    receiptAddress: Address;
    errorCode: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const userAddress = slice.loadAddress();
    const receiptAddress = slice.loadAddress();
    const errorCode = slice.loadCoins();

    return { userAddress, receiptAddress, errorCode };
  }

  static parseWithdrawFailedEvent(body: Cell | Slice): {
    userAddress: Address;
    receiptAddress: Address;
    errorCode: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const userAddress = slice.loadAddress();
    const receiptAddress = slice.loadAddress();
    const errorCode = slice.loadCoins();

    return { userAddress, receiptAddress, errorCode };
  }

  // Generic event parser
  static parseEvent(eventName: string, body: Cell | Slice): any {
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

type Currency = {
  walletAddress: Address | null;
  decimals: bigint;
};

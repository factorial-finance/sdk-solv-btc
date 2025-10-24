import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  Slice,
  toNano,
} from "@ton/core";

export type OracleConfig = {
  nav: bigint;
  navDecimals: bigint;
  navManager: Address;
  adminAddress: Address;
  nextAdminAddress: Address;
  vaultAddress: Address;
};

export type OracleData = {
  nav: bigint;
  navDecimals: bigint;
  navManager: Address;
  adminAddress: Address;
  nextAdminAddress: Address | null;
  vaultAddress: Address;
};

export function oracleConfigToCell(config: OracleConfig): Cell {
  return beginCell()
    .storeCoins(config.nav)
    .storeCoins(config.navDecimals)
    .storeAddress(config.navManager)
    .storeAddress(config.adminAddress)
    .storeRef(
      beginCell()
        .storeAddress(config.nextAdminAddress)
        .storeAddress(config.vaultAddress)
        .endCell(),
    )
    .endCell();
}

export const Opcodes = {
  provideAccountStatusAndLock: 0xbf281c87,
  ExecuteAction: 0x2be12d37,
};

export class Oracle implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static Op = {
    ProvideNav: 0xc57779f2,
    TakeNav: 0x396297f6,
    SetNav: 0x6cbc3612,
    SetMaxNavChange: 0x65f3982d,
    SetNavManager: 0x4a8b2bb8,
    ProvideWithdrawFeeRatio: 0x8cde1508,
    TakeWithdrawFeeRatio: 0x2a38f37c,
    ChangeAdmin: 0xb6801836,
    ClaimAdmin: 0x37f6346c,
    UpgradeCode: 0x61bddf8b,
  };

  static Error = {
    NotAdmin: 1000,
    NotNavManager: 1001,
    NotNextAdmin: 1002,
    InvalidNav: 1003,
    WrongOp: 0xffff,
  };

  static Event = {
    SetNav: "event::set_nav",
    SetNavManager: "event::set_nav_manager",
    ChangeAdmin: "event::change_admin",
    ClaimAdmin: "event::claim_admin",
    UpgradeCode: "event::upgrade_code",
  };

  static createFromAddress(address: Address) {
    return new Oracle(address);
  }

  static createFromConfig(config: OracleConfig, code: Cell, workchain = 0) {
    const data = oracleConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new Oracle(address, init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendSetNav(
    provider: ContractProvider,
    via: Sender,
    params: {
      nav: bigint;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.SetNav, 32) // op::set_nav
        .storeUint(params.queryId ?? 0, 64)
        .storeCoins(params.nav)
        .endCell(),
    });
  }

  async sendSetMaxNavChange(
    provider: ContractProvider,
    via: Sender,
    params: {
      maxNavChange: bigint;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.SetMaxNavChange, 32) // op::set_max_nav_change
        .storeUint(params.queryId ?? 0, 64)
        .storeCoins(params.maxNavChange)
        .endCell(),
    });
  }

  async sendSetNavManager(
    provider: ContractProvider,
    via: Sender,
    params: {
      navManager: Address;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.SetNavManager, 32) // op::set_nav_manager
        .storeUint(params.queryId ?? 0, 64)
        .storeAddress(params.navManager)
        .endCell(),
    });
  }

  async sendChangeAdmin(
    provider: ContractProvider,
    via: Sender,
    params: {
      newAdmin: Address;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.ChangeAdmin, 32) // op::change_admin
        .storeUint(params.queryId ?? 0, 64)
        .storeAddress(params.newAdmin)
        .endCell(),
    });
  }

  async sendClaimAdmin(
    provider: ContractProvider,
    via: Sender,
    params: {
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.ClaimAdmin, 32) // op::claim_admin
        .storeUint(params.queryId ?? 0, 64)
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
        .storeUint(Oracle.Op.UpgradeCode, 32)
        .storeUint(0, 64)
        .storeRef(newCode)
        .endCell(),
    });
  }

  async sendProvideNav(
    provider: ContractProvider,
    via: Sender,
    params: {
      forwardPayload: Cell;
      queryId?: bigint;
    },
  ) {
    await provider.internal(via, {
      value: toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Oracle.Op.ProvideNav, 32) // op::provide_nav
        .storeUint(params.queryId ?? 0, 64)
        .storeRef(params.forwardPayload)
        .endCell(),
    });
  }

  async getState(provider: ContractProvider) {
    return await provider.getState();
  }

  async getOracleData(provider: ContractProvider): Promise<OracleData> {
    const { stack } = await provider.get("get_oracle_data", []);
    const tuple = stack.readTuple();

    const nav = tuple.readBigNumber();
    const navDecimals = tuple.readBigNumber();
    const navManager = tuple.readAddress();
    const adminAddress = tuple.readAddress();
    const nextAdminAddress = tuple.readAddressOpt();
    const vaultAddress = tuple.readAddress();

    return {
      nav,
      navDecimals,
      navManager,
      adminAddress,
      nextAdminAddress,
      vaultAddress,
    };
  }

  // Event parsing methods
  static parseSetNavEvent(body: Cell | Slice): {
    preNav: bigint;
    newNav: bigint;
    navDecimals: bigint;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const preNav = slice.loadCoins();
    const newNav = slice.loadCoins();
    const navDecimals = slice.loadCoins();

    return { preNav, newNav, navDecimals };
  }

  static parseSetNavManagerEvent(body: Cell | Slice): {
    navManagerAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const navManagerAddress = slice.loadAddress();

    return { navManagerAddress };
  }

  static parseChangeAdminEvent(body: Cell | Slice): {
    newNextAdminAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const newNextAdminAddress = slice.loadAddress();

    return { newNextAdminAddress };
  }

  static parseClaimAdminEvent(body: Cell | Slice): {
    newAdminAddress: Address;
  } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const newAdminAddress = slice.loadAddress();

    return { newAdminAddress };
  }

  static parseUpgradeCodeEvent(body: Cell | Slice): { codeHash: bigint } {
    const slice = body instanceof Cell ? body.beginParse() : body;
    const codeHash = slice.loadUintBig(256);

    return { codeHash };
  }

  // Generic event parser
  static parseEvent(eventName: string, body: Cell | Slice): any {
    switch (eventName) {
      case Oracle.Event.SetNav:
        return Oracle.parseSetNavEvent(body);
      case Oracle.Event.SetNavManager:
        return Oracle.parseSetNavManagerEvent(body);
      case Oracle.Event.ChangeAdmin:
        return Oracle.parseChangeAdminEvent(body);
      case Oracle.Event.ClaimAdmin:
        return Oracle.parseClaimAdminEvent(body);
      case Oracle.Event.UpgradeCode:
        return Oracle.parseUpgradeCodeEvent(body);
      default:
        throw new Error(`Unknown event type: ${eventName}`);
    }
  }
}

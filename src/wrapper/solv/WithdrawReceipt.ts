import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";

export type WithdrawReceiptConfig = {
  vaultAddress: Address;
  hash: bigint;
};

export type WithdrawReceiptData = {
  vaultAddress: Address;
  hash: bigint;
  status: number;
};

export function withdrawReceiptConfigToCell(
  config: WithdrawReceiptConfig,
): Cell {
  return beginCell()
    .storeAddress(config.vaultAddress)
    .storeUint(config.hash, 256)
    .storeUint(WithdrawReceipt.Status.NOT_EXIST, 2)
    .endCell();
}

export class WithdrawReceipt implements Contract {
  static Op = {
    InitWithdrawRequest: 0x57b2d007,
    TakeInitWithdrawResult: 0x503c44dc,
    ExecuteWithdrawRequest: 0xc290ad68,
    TakeExecuteWithdrawResult: 0xb1d4302c,
    RevertExecuteWithdraw: 0xd8666bc6,
  };

  static Error = {
    NotAdmin: 1000,
    NotNavManager: 1001,
    NotNextAdmin: 1002,
    InvalidNav: 1003,
    WrongOp: 0xffff,
  };

  static Status = {
    NOT_EXIST: 0,
    PENDING: 1,
    DONE: 2,
  };

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new WithdrawReceipt(address);
  }

  static createFromConfig(
    config: WithdrawReceiptConfig,
    code: Cell,
    workchain = 0,
  ) {
    const data = withdrawReceiptConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);
    return new WithdrawReceipt(address, init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendMsgBody(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    msgBody: Cell,
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msgBody,
    });
  }

  async getState(provider: ContractProvider) {
    return await provider.getState();
  }

  async getWithdrawReceiptData(
    provider: ContractProvider,
  ): Promise<WithdrawReceiptData> {
    const { stack } = await provider.get("get_withdraw_receipt_data", []);
    const tuple = stack.readTuple();
    const vaultAddress = tuple.readAddress();
    const hash = tuple.readBigNumber();
    const status = tuple.readNumber();

    return {
      vaultAddress,
      hash,
      status: status,
    };
  }
}

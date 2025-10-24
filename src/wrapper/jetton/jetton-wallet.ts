import { WalletState } from "./type";
import {
  Contract,
  Cell,
  toNano,
  ContractProvider,
  Sender,
  beginCell,
  SendMode,
  ContractABI,
  Address,
} from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

export class JettonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}
  abi?: Maybe<ContractABI>;

  static Op = {
    TransferNotification: 0x7362d09c,
    InternalTransfer: 0x178d4519,
    Transfer: 0xf8a7ea5,
    Burn: 0x595f07bc,
    Excesses: 0xd53276db,
    BurnNotification: 0x7bdd97de,
  };

  static Gas = {
    Transfer: toNano(0.05),
  };

  static createFromAddress(address: Address) {
    return new JettonWallet(address);
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
      amount: bigint;
      recipient: Address;
      response: Address;
      forwardTonAmount: bigint;
      forwardPayload?: Cell;
      queryId?: bigint;
    },
  ) {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Transfer, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.recipient)
      .storeAddress(opts.response)
      .storeDict(null)
      .storeCoins(opts.forwardTonAmount)
      .storeMaybeRef(opts.forwardPayload)
      .endCell();

    await provider.internal(via, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: body,
    });
    return body;
  }

  createTransferBody(opts: {
    queryId?: bigint;
    recipient: Address;
    response: Address;
    amount: bigint;
    forwardTonAmount: bigint;
    forwardPayload?: Cell;
  }): Cell {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Transfer, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.recipient)
      .storeAddress(opts.response)
      .storeDict(null)
      .storeCoins(opts.forwardTonAmount)
      .storeMaybeRef(opts.forwardPayload)
      .endCell();

    return body;
  }

  static createTransferBody(opts: {
    queryId?: bigint;
    recipient: Address;
    response: Address;
    amount: bigint;
    forwardTonAmount: bigint;
    forwardPayload?: Cell;
  }): Cell {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Transfer, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.recipient)
      .storeAddress(opts.response)
      .storeDict(null)
      .storeCoins(opts.forwardTonAmount)
      .storeMaybeRef(opts.forwardPayload)
      .endCell();

    return body;
  }

  static getBurnMsgBody(opts: { amount: bigint; response: Address }): Cell {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Burn, 32)
      .storeUint(0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.response)
      .endCell();

    return body;
  }

  async sendBurn(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
      amount: bigint;
      response: Address;
      forwardPayload?: Cell;
      queryId?: bigint;
    },
  ) {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Burn, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.response)
      .storeMaybeRef(opts.forwardPayload ?? null)
      .endCell();

    await provider.internal(via, {
      value: value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: body,
    });
    return body;
  }

  async getState(provider: ContractProvider) {
    return await provider.getState();
  }

  async getWalletData(provider: ContractProvider): Promise<WalletState> {
    const _result = await provider.get("get_wallet_data", []);

    const balance = _result.stack.readBigNumber();
    const owner = _result.stack.readAddress();
    const jetton = _result.stack.readAddress();

    return {
      address: this.address,
      balance,
      owner,
      jetton,
    };
  }

  createInternalTransfer(
    value: bigint,
    opts: {
      amount: bigint;
      recipient: Address;
      response: Address;
      forwardTonAmount: bigint;
      forwardPayload?: Cell;
      queryId?: bigint;
    },
  ) {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Transfer, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.recipient)
      .storeAddress(opts.response)
      .storeDict(null)
      .storeCoins(opts.forwardTonAmount)
      .storeMaybeRef(opts.forwardPayload)
      .endCell();

    return {
      to: this.address,
      value: value,
      body,
    };
  }

  createInternalBurn(
    value: bigint,
    opts: {
      amount: bigint;
      response: Address;
      forwardPayload?: Cell;
      queryId?: bigint;
    },
  ) {
    const body = beginCell()
      .storeUint(JettonWallet.Op.Burn, 32)
      .storeUint(opts.queryId ?? 0, 64)
      .storeCoins(opts.amount)
      .storeAddress(opts.response)
      .storeMaybeRef(opts.forwardPayload ?? null)
      .endCell();

    return {
      to: this.address,
      value: value,
      body,
    };
  }
}

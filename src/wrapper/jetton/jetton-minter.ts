import {
  Contract,
  Cell,
  ContractProvider,
  beginCell,
  OpenedContract,
  ContractABI,
  Address,
  contractAddress,
  SendMode,
  toNano,
  Sender,
} from "@ton/core";
import { JettonWallet } from "./jetton-wallet";
import { Maybe } from "@ton/core/dist/utils/maybe";

export type JettonMinterContent = {
  uri: string;
};

export interface JettonMinterConfig {
  adminAddress: Address;
  mintToAuthority: Address | null;
  walletCode: Cell;
  jettonContent: Cell | JettonMinterContent;
}

export function jettonContentToCell(content: JettonMinterContent) {
  return beginCell()
    .storeStringRefTail(content.uri) //Snake logic under the hood
    .endCell();
}

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
  const content =
    config.jettonContent instanceof Cell
      ? config.jettonContent
      : jettonContentToCell(config.jettonContent);
  return beginCell()
    .storeCoins(0)
    .storeAddress(config.adminAddress)
    .storeAddress(null) // Transfer admin address
    .storeAddress(config.mintToAuthority)
    .storeMaybeRef(null)
    .storeRef(config.walletCode)
    .storeRef(content)
    .endCell();
}

export class JettonMinter implements Contract {
  static Op = {
    TOP_UP: 0xd372158c,
    ChangeMetadataURI: 0xcb862902,
    InternalTransfer: 0x178d4519,
    Mint: 0x642b7d07,
    GrantRole: 0xf3a6d21d,
  };

  static RoleId = {
    Minter: 1,
    Burner: 2,
  };

  static mintMessage(
    to: Address,
    jetton_amount: bigint,
    from?: Address | null,
    response?: Address | null,
    customPayload?: Cell | null,
    forward_ton_amount = 0n,
    total_ton_amount = 0n,
  ) {
    const mintMsg = beginCell()
      .storeUint(JettonMinter.Op.InternalTransfer, 32)
      .storeUint(0, 64)
      .storeCoins(jetton_amount)
      .storeAddress(from)
      .storeAddress(response)
      .storeCoins(forward_ton_amount)
      .storeMaybeRef(customPayload)
      .endCell();
    return beginCell()
      .storeUint(JettonMinter.Op.Mint, 32)
      .storeUint(0, 64) // op, queryId
      .storeAddress(to)
      .storeCoins(total_ton_amount)
      .storeRef(mintMsg)
      .endCell();
  }

  static grantRoleMessage(roleId: number, address: Address) {
    return beginCell()
      .storeUint(JettonMinter.Op.GrantRole, 32)
      .storeUint(0, 64) // op, queryId
      .storeUint(roleId, 16)
      .storeAddress(address)
      .endCell();
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}
  abi?: Maybe<ContractABI>;

  static createFromAddress(address: Address) {
    return new JettonMinter(address);
  }

  static createFromConfig(
    config: JettonMinterConfig,
    code: Cell,
    workchain = 0,
  ) {
    const data = jettonMinterConfigToCell(config);
    const init = { code, data };
    return new JettonMinter(contractAddress(workchain, init), init);
  }

  async getState(provider: ContractProvider) {
    return await provider.getState();
  }

  async getJettonData(provider: ContractProvider) {
    const res = await provider.get("get_jetton_data", []);
    const totalSupply = res.stack.readBigNumber();
    const mintable = res.stack.readBoolean();
    const adminAddress = res.stack.readAddress();
    const content = res.stack.readCell();
    const walletCode = res.stack.readCell();
    return {
      totalSupply,
      mintable,
      adminAddress,
      content,
      walletCode,
    };
  }

  async getWalletAddress(provider: ContractProvider, address: Address) {
    const result = await provider.get("get_wallet_address", [
      {
        type: "slice",
        cell: beginCell().storeAddress(address).endCell(),
      },
    ]);
    return result.stack.readAddress();
  }

  async getWallet(
    provider: ContractProvider,
    address: Address,
  ): Promise<OpenedContract<JettonWallet>> {
    const walletAddress = await this.getWalletAddress(provider, address);
    return provider.open(JettonWallet.createFromAddress(walletAddress));
  }

  async getTokenBalance(
    provider: ContractProvider,
    address: Address,
  ): Promise<bigint> {
    const wallet = await this.getWallet(provider, address);
    const jettonData = await wallet.getWalletData();
    return jettonData.balance;
  }

  async sendDeploy(
    provider: ContractProvider,
    via: Sender,
    value: bigint = toNano(1.1), // minter reserve 1 ton
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(JettonMinter.Op.TOP_UP, 32)
        .storeUint(0, 64)
        .endCell(),
    });
  }

  async sendChangeMetadataURI(
    provider: ContractProvider,
    via: Sender,
    uri: string,
    value: bigint = toNano(0.01), // minter reserve 1 ton
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(JettonMinter.Op.ChangeMetadataURI, 32)
        .storeUint(0, 64) // queryId
        .storeStringTail(uri)
        .endCell(),
    });
  }

  async sendMint(
    provider: ContractProvider,
    via: Sender,
    to: Address,
    jetton_amount: bigint,
    from?: Address | null,
    response_addr?: Address | null,
    customPayload?: Cell | null,
    forward_ton_amount: bigint = toNano(0.01),
    total_ton_amount: bigint = toNano(0.03),
  ) {
    await provider.internal(via, {
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonMinter.mintMessage(
        to,
        jetton_amount,
        from,
        response_addr,
        customPayload,
        forward_ton_amount,
        total_ton_amount,
      ),
      value: total_ton_amount,
    });
  }

  async sendGrantRole(
    provider: ContractProvider,
    via: Sender,
    roleId: number,
    address: Address,
  ) {
    await provider.internal(via, {
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonMinter.grantRoleMessage(roleId, address),
      value: toNano(0.05),
    });
  }
}

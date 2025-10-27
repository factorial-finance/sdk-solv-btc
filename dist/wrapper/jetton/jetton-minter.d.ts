import { Contract, Cell, ContractProvider, OpenedContract, ContractABI, Address, Sender } from "@ton/core";
import { JettonWallet } from "./jetton-wallet";
import { Maybe } from "@ton/core/dist/utils/maybe";
export type JettonMinterContent = {
    uri: string;
};
export interface JettonMinterConfig {
    adminAddress: Address;
    mintToAuthority: Address;
    walletCode: Cell;
    jettonContent: Cell | JettonMinterContent;
}
export declare function jettonContentToCell(content: JettonMinterContent): Cell;
export declare function jettonMinterConfigToCell(config: JettonMinterConfig): Cell;
export declare class JettonMinter implements Contract {
    readonly address: Address;
    readonly init?: {
        code: Cell;
        data: Cell;
    } | undefined;
    static Op: {
        TOP_UP: number;
        InternalTransfer: number;
        Mint: number;
        GrantRole: number;
    };
    static RoleId: {
        Minter: number;
        Burner: number;
    };
    static mintMessage(to: Address, jetton_amount: bigint, from?: Address | null, response?: Address | null, customPayload?: Cell | null, forward_ton_amount?: bigint, total_ton_amount?: bigint): Cell;
    static grantRoleMessage(roleId: number, address: Address): Cell;
    constructor(address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    abi?: Maybe<ContractABI>;
    static createFromAddress(address: Address): JettonMinter;
    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain?: number): JettonMinter;
    getState(provider: ContractProvider): Promise<import("@ton/core").ContractState>;
    getJettonData(provider: ContractProvider): Promise<{
        totalSupply: bigint;
        mintable: boolean;
        adminAddress: Address;
        content: Cell;
        walletCode: Cell;
    }>;
    getWalletAddress(provider: ContractProvider, address: Address): Promise<Address>;
    getWallet(provider: ContractProvider, address: Address): Promise<OpenedContract<JettonWallet>>;
    getTokenBalance(provider: ContractProvider, address: Address): Promise<bigint>;
    sendDeploy(provider: ContractProvider, via: Sender, value?: bigint): Promise<void>;
    sendMint(provider: ContractProvider, via: Sender, to: Address, jetton_amount: bigint, from?: Address | null, response_addr?: Address | null, customPayload?: Cell | null, forward_ton_amount?: bigint, total_ton_amount?: bigint): Promise<void>;
    sendGrantRole(provider: ContractProvider, via: Sender, roleId: number, address: Address): Promise<void>;
}
//# sourceMappingURL=jetton-minter.d.ts.map
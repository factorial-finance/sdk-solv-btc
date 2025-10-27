import { Address, OpenedContract } from "@ton/core";
import { SolvBTCVault } from "../wrapper/solv/SolvBTCVault";
import { JettonMinter } from "../wrapper/jetton/jetton-minter";
import { AddressSender } from "./type";
export declare function treasurer_deposit(params: {
    sender: AddressSender;
    vault: OpenedContract<SolvBTCVault>;
    currency: OpenedContract<JettonMinter>;
    amount: bigint;
    value?: bigint;
    forwardTonAmount?: bigint;
    responseAddress?: Address;
}): Promise<void>;
//# sourceMappingURL=treasurer.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonMinter = void 0;
exports.jettonContentToCell = jettonContentToCell;
exports.jettonMinterConfigToCell = jettonMinterConfigToCell;
const core_1 = require("@ton/core");
const jetton_wallet_1 = require("./jetton-wallet");
function jettonContentToCell(content) {
    return (0, core_1.beginCell)()
        .storeStringRefTail(content.uri) //Snake logic under the hood
        .endCell();
}
function jettonMinterConfigToCell(config) {
    const content = config.jettonContent instanceof core_1.Cell
        ? config.jettonContent
        : jettonContentToCell(config.jettonContent);
    return (0, core_1.beginCell)()
        .storeCoins(0)
        .storeAddress(config.adminAddress)
        .storeAddress(null) // Transfer admin address
        .storeAddress(config.mintToAuthority)
        .storeMaybeRef(null)
        .storeRef(config.walletCode)
        .storeRef(content)
        .endCell();
}
class JettonMinter {
    static mintMessage(to, jetton_amount, from, response, customPayload, forward_ton_amount = 0n, total_ton_amount = 0n) {
        const mintMsg = (0, core_1.beginCell)()
            .storeUint(JettonMinter.Op.InternalTransfer, 32)
            .storeUint(0, 64)
            .storeCoins(jetton_amount)
            .storeAddress(from)
            .storeAddress(response)
            .storeCoins(forward_ton_amount)
            .storeMaybeRef(customPayload)
            .endCell();
        return (0, core_1.beginCell)()
            .storeUint(JettonMinter.Op.Mint, 32)
            .storeUint(0, 64) // op, queryId
            .storeAddress(to)
            .storeCoins(total_ton_amount)
            .storeRef(mintMsg)
            .endCell();
    }
    static grantRoleMessage(roleId, address) {
        return (0, core_1.beginCell)()
            .storeUint(JettonMinter.Op.GrantRole, 32)
            .storeUint(0, 64) // op, queryId
            .storeUint(roleId, 16)
            .storeAddress(address)
            .endCell();
    }
    constructor(address, init) {
        this.address = address;
        this.init = init;
    }
    static createFromAddress(address) {
        return new JettonMinter(address);
    }
    static createFromConfig(config, code, workchain = 0) {
        const data = jettonMinterConfigToCell(config);
        const init = { code, data };
        return new JettonMinter((0, core_1.contractAddress)(workchain, init), init);
    }
    async getState(provider) {
        return await provider.getState();
    }
    async getJettonData(provider) {
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
    async getWalletAddress(provider, address) {
        const result = await provider.get("get_wallet_address", [
            {
                type: "slice",
                cell: (0, core_1.beginCell)().storeAddress(address).endCell(),
            },
        ]);
        return result.stack.readAddress();
    }
    async getWallet(provider, address) {
        const walletAddress = await this.getWalletAddress(provider, address);
        return provider.open(jetton_wallet_1.JettonWallet.createFromAddress(walletAddress));
    }
    async getTokenBalance(provider, address) {
        const wallet = await this.getWallet(provider, address);
        const jettonData = await wallet.getWalletData();
        return jettonData.balance;
    }
    async sendDeploy(provider, via, value = (0, core_1.toNano)(1.1)) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)()
                .storeUint(JettonMinter.Op.TOP_UP, 32)
                .storeUint(0, 64)
                .endCell(),
        });
    }
    async sendMint(provider, via, to, jetton_amount, from, response_addr, customPayload, forward_ton_amount = (0, core_1.toNano)(0.01), total_ton_amount = (0, core_1.toNano)(0.03)) {
        await provider.internal(via, {
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: JettonMinter.mintMessage(to, jetton_amount, from, response_addr, customPayload, forward_ton_amount, total_ton_amount),
            value: total_ton_amount,
        });
    }
    async sendGrantRole(provider, via, roleId, address) {
        await provider.internal(via, {
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: JettonMinter.grantRoleMessage(roleId, address),
            value: (0, core_1.toNano)(0.05),
        });
    }
}
exports.JettonMinter = JettonMinter;
JettonMinter.Op = {
    TOP_UP: 0xd372158c,
    InternalTransfer: 0x178d4519,
    Mint: 0x642b7d07,
    GrantRole: 0xf3a6d21d,
};
JettonMinter.RoleId = {
    Minter: 1,
    Burner: 2,
};
//# sourceMappingURL=jetton-minter.js.map
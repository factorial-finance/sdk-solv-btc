"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JettonWallet = void 0;
const core_1 = require("@ton/core");
class JettonWallet {
    constructor(address, init) {
        this.address = address;
        this.init = init;
    }
    static createFromAddress(address) {
        return new JettonWallet(address);
    }
    async sendTransfer(provider, via, value, opts) {
        const body = (0, core_1.beginCell)()
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
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: body,
        });
        return body;
    }
    createTransferBody(opts) {
        const body = (0, core_1.beginCell)()
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
    static createTransferBody(opts) {
        const body = (0, core_1.beginCell)()
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
    static getBurnMsgBody(opts) {
        const body = (0, core_1.beginCell)()
            .storeUint(JettonWallet.Op.Burn, 32)
            .storeUint(0, 64)
            .storeCoins(opts.amount)
            .storeAddress(opts.response)
            .endCell();
        return body;
    }
    async sendBurn(provider, via, value, opts) {
        const body = (0, core_1.beginCell)()
            .storeUint(JettonWallet.Op.Burn, 32)
            .storeUint(opts.queryId ?? 0, 64)
            .storeCoins(opts.amount)
            .storeAddress(opts.response)
            .storeMaybeRef(opts.forwardPayload ?? null)
            .endCell();
        await provider.internal(via, {
            value: value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: body,
        });
        return body;
    }
    async getState(provider) {
        return await provider.getState();
    }
    async getWalletData(provider) {
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
    createInternalTransfer(value, opts) {
        const body = (0, core_1.beginCell)()
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
    createInternalBurn(value, opts) {
        const body = (0, core_1.beginCell)()
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
exports.JettonWallet = JettonWallet;
JettonWallet.Op = {
    TransferNotification: 0x7362d09c,
    InternalTransfer: 0x178d4519,
    Transfer: 0xf8a7ea5,
    Burn: 0x595f07bc,
    Excesses: 0xd53276db,
    BurnNotification: 0x7bdd97de,
};
JettonWallet.Gas = {
    Transfer: (0, core_1.toNano)(0.05),
};
//# sourceMappingURL=jetton-wallet.js.map
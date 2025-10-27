"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawReceipt = void 0;
exports.withdrawReceiptConfigToCell = withdrawReceiptConfigToCell;
const core_1 = require("@ton/core");
function withdrawReceiptConfigToCell(config) {
    return (0, core_1.beginCell)()
        .storeAddress(config.vaultAddress)
        .storeUint(config.hash, 256)
        .storeUint(WithdrawReceipt.Status.NOT_EXIST, 2)
        .endCell();
}
class WithdrawReceipt {
    constructor(address, init) {
        this.address = address;
        this.init = init;
    }
    static createFromAddress(address) {
        return new WithdrawReceipt(address);
    }
    static createFromConfig(config, code, workchain = 0) {
        const data = withdrawReceiptConfigToCell(config);
        const init = { code, data };
        const address = (0, core_1.contractAddress)(workchain, init);
        return new WithdrawReceipt(address, init);
    }
    async sendDeploy(provider, via, value) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: (0, core_1.beginCell)().endCell(),
        });
    }
    async sendMsgBody(provider, via, value, msgBody) {
        await provider.internal(via, {
            value,
            sendMode: core_1.SendMode.PAY_GAS_SEPARATELY,
            body: msgBody,
        });
    }
    async getState(provider) {
        return await provider.getState();
    }
    async getWithdrawReceiptData(provider) {
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
exports.WithdrawReceipt = WithdrawReceipt;
WithdrawReceipt.Op = {
    InitWithdrawRequest: 0x57b2d007,
    TakeInitWithdrawResult: 0x503c44dc,
    ExecuteWithdrawRequest: 0xc290ad68,
    TakeExecuteWithdrawResult: 0xb1d4302c,
    RevertExecuteWithdraw: 0xd8666bc6,
};
WithdrawReceipt.Error = {
    NotAdmin: 1000,
    NotNavManager: 1001,
    NotNextAdmin: 1002,
    InvalidNav: 1003,
    WrongOp: 0xffff,
};
WithdrawReceipt.Status = {
    NOT_EXIST: 0,
    PENDING: 1,
    DONE: 2,
};
//# sourceMappingURL=WithdrawReceipt.js.map
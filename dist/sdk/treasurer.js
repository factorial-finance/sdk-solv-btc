"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treasurer_deposit = treasurer_deposit;
const core_1 = require("@ton/core");
const SolvBTCVault_1 = require("../wrapper/solv/SolvBTCVault");
async function treasurer_deposit(params) {
    const jettonWallet = await params.currency.getWallet(params.sender.address);
    const forwardTonAmount = params.forwardTonAmount ?? (0, core_1.toNano)(0.2);
    const value = params.value ?? forwardTonAmount + (0, core_1.toNano)(0.1);
    const forwardPayload = SolvBTCVault_1.SolvBTCVault.createTreasurerDepositPayload({
        currencyAddress: params.currency.address,
    });
    await jettonWallet.sendTransfer(params.sender, value, {
        amount: params.amount,
        recipient: params.vault.address,
        response: params.responseAddress ?? params.sender.address,
        forwardTonAmount: forwardTonAmount,
        forwardPayload: forwardPayload,
    });
}
//# sourceMappingURL=treasurer.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.createQueryId = createQueryId;
const crypto_1 = require("crypto");
const core_1 = require("@ton/core");
function sha256(message) {
    return (0, crypto_1.createHash)("sha256").update(message).digest("hex");
}
function jsonReplacer(_, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (value instanceof core_1.Address) {
        return value.toString();
    }
    if (value instanceof core_1.Cell) {
        return value.hash().toString("hex");
    }
    return value;
}
function createQueryId(data, timestamp = Date.now()) {
    const json = JSON.stringify({
        ...data,
        __timestamp__: timestamp,
    }, jsonReplacer);
    const hash = sha256(Buffer.from(json));
    return BigInt("0x" + Buffer.from(hash).subarray(0, 8).toString("hex"));
}
//# sourceMappingURL=utils.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierUtils = void 0;
const core_1 = require("@ton/core");
const crypto_1 = require("@ton/crypto");
const crypto = __importStar(require("crypto"));
// Type string used to generate the hash
const WITHDRAW_TYPE_STRING = "Withdraw(uint256 requestHash,address withdrawer,address withdrawCurrency,coins targetTokenAmount,coins nav,coins navDecimals)";
const WITHDRAW_TYPEHASH = 21281832289894155434319040296942117528090618725823760669759728506610364871690n;
const WORKCHAIN = 0;
class VerifierUtils {
    /**
     * Signs withdraw data using EIP-712 like structure
     */
    static sign(params) {
        // Validation
        this.validateWithdrawParams(params);
        const withdrawData = this.buildWithdrawData(params);
        const hash = withdrawData.hash();
        const signature = (0, crypto_1.sign)(hash, params.secretKey);
        return { hash, signature };
    }
    /**
     * Verifies withdraw signature
     */
    static verify(params) {
        try {
            this.validateWithdrawParams(params);
            const withdrawData = this.buildWithdrawData(params);
            return (0, crypto_1.signVerify)(withdrawData.hash(), params.signature, params.publicKey);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Generates a new keypair from random seed
     */
    static generateKeyPair() {
        return (0, crypto_1.keyPairFromSeed)(crypto.randomBytes(32));
    }
    /**
     * Generates a keypair from provided seed
     */
    static keyPairFromSeed(seed) {
        return (0, crypto_1.keyPairFromSeed)(seed);
    }
    /**
     * Computes hash of a type string
     */
    static async hashTypeString(typeString) {
        const hash = await (0, crypto_1.sha256)(typeString);
        return BigInt("0x" + hash.toString("hex"));
    }
    /**
     * Gets the current withdraw type hash
     */
    static getWithdrawTypeHash() {
        return WITHDRAW_TYPEHASH;
    }
    /**
     * Gets the withdraw type string
     */
    static getWithdrawTypeString() {
        return WITHDRAW_TYPE_STRING;
    }
    /**
     * Builds withdraw data cell structure
     */
    static buildWithdrawData(params) {
        const domainData = (0, core_1.beginCell)()
            .storeUint(WITHDRAW_TYPEHASH, 256)
            .storeAddress(params.vault)
            .storeUint(WORKCHAIN, 32);
        return (0, core_1.beginCell)()
            .storeRef(domainData)
            .storeUint(params.requestHash, 256)
            .storeRef((0, core_1.beginCell)()
            .storeAddress(params.withdrawer)
            .storeAddress(params.withdrawCurrency)
            .storeCoins(params.targetTokenAmount)
            .storeCoins(params.nav)
            .storeCoins(params.navDecimals)
            .endCell())
            .endCell();
    }
    /**
     * Validates withdraw parameters
     */
    static validateWithdrawParams(params) {
        // if (params.targetTokenAmount <= 0n) {
        //     throw new Error('Withdraw amount must be positive');
        // }
        // if (params.nav < 0n) {
        //     throw new Error('NAV cannot be negative');
        // }
        // if (params.navDecimals < 0n) {
        //     throw new Error('NAV decimals cannot be negative');
        // }
        // // TODO: limit 1 years
        // const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        // if (params.deadline <= currentTimestamp) {
        //     throw new Error('Deadline must be in the future');
        // }
    }
}
exports.VerifierUtils = VerifierUtils;
// Usage example:
/*
const keyPair = VerifierUtils.generateKeyPair();

const signature = VerifierUtils.sign({
    vault: Address.parse("..."),
    withdrawer: Address.parse("..."),
    targetToken: Address.parse("..."),
    targetTokenAmount: 1000000000n,
    nav: 2000000000n,
    navDecimals: 9n,
    nonce: 1n,
    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    requestHash: 123456789n,
    secretKey: keyPair.secretKey
});

const isValid = VerifierUtils.verify({
    // ... same params as above
    signature,
    publicKey: keyPair.publicKey
});
*/
//# sourceMappingURL=verifier-utils.js.map
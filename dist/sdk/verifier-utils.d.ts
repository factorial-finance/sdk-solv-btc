import { Address } from "@ton/core";
import { KeyPair } from "@ton/crypto";
export interface WithdrawSignParams {
    vault: Address;
    withdrawer: Address;
    withdrawCurrency: Address;
    targetTokenAmount: bigint;
    nav: bigint;
    navDecimals: bigint;
    requestHash: bigint;
    secretKey: Buffer;
}
export interface WithdrawVerifyParams {
    vault: Address;
    withdrawer: Address;
    withdrawCurrency: Address;
    targetTokenAmount: bigint;
    nav: bigint;
    navDecimals: bigint;
    requestHash: bigint;
    signature: Buffer;
    publicKey: Buffer;
}
export declare class VerifierUtils {
    /**
     * Signs withdraw data using EIP-712 like structure
     */
    static sign(params: WithdrawSignParams): {
        hash: Buffer;
        signature: Buffer;
    };
    /**
     * Verifies withdraw signature
     */
    static verify(params: WithdrawVerifyParams): boolean;
    /**
     * Generates a new keypair from random seed
     */
    static generateKeyPair(): KeyPair;
    /**
     * Generates a keypair from provided seed
     */
    static keyPairFromSeed(seed: Buffer): KeyPair;
    /**
     * Computes hash of a type string
     */
    static hashTypeString(typeString: string): Promise<bigint>;
    /**
     * Gets the current withdraw type hash
     */
    static getWithdrawTypeHash(): bigint;
    /**
     * Gets the withdraw type string
     */
    static getWithdrawTypeString(): string;
    /**
     * Builds withdraw data cell structure
     */
    private static buildWithdrawData;
    /**
     * Validates withdraw parameters
     */
    private static validateWithdrawParams;
}
//# sourceMappingURL=verifier-utils.d.ts.map
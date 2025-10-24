import { Address, beginCell, Cell } from "@ton/core";
import {
  sha256,
  sign,
  keyPairFromSeed,
  signVerify,
  KeyPair,
} from "@ton/crypto";
import * as crypto from "crypto";

// Type string used to generate the hash
const WITHDRAW_TYPE_STRING =
  "Withdraw(uint256 requestHash,address withdrawer,address withdrawCurrency,coins targetTokenAmount,coins nav,coins navDecimals)";
const WITHDRAW_TYPEHASH =
  21281832289894155434319040296942117528090618725823760669759728506610364871690n;
const WORKCHAIN = 0;

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

export class VerifierUtils {
  /**
   * Signs withdraw data using EIP-712 like structure
   */
  static sign(params: WithdrawSignParams): { hash: Buffer; signature: Buffer } {
    // Validation
    this.validateWithdrawParams(params);

    const withdrawData = this.buildWithdrawData(params);
    const hash = withdrawData.hash();
    const signature = sign(hash, params.secretKey);

    return { hash, signature };
  }

  /**
   * Verifies withdraw signature
   */
  static verify(params: WithdrawVerifyParams): boolean {
    try {
      this.validateWithdrawParams(params);

      const withdrawData = this.buildWithdrawData(params);
      return signVerify(
        withdrawData.hash(),
        params.signature,
        params.publicKey,
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a new keypair from random seed
   */
  static generateKeyPair(): KeyPair {
    return keyPairFromSeed(crypto.randomBytes(32));
  }

  /**
   * Generates a keypair from provided seed
   */
  static keyPairFromSeed(seed: Buffer): KeyPair {
    return keyPairFromSeed(seed);
  }

  /**
   * Computes hash of a type string
   */
  static async hashTypeString(typeString: string): Promise<bigint> {
    const hash = await sha256(typeString);
    return BigInt("0x" + hash.toString("hex"));
  }

  /**
   * Gets the current withdraw type hash
   */
  static getWithdrawTypeHash(): bigint {
    return WITHDRAW_TYPEHASH;
  }

  /**
   * Gets the withdraw type string
   */
  static getWithdrawTypeString(): string {
    return WITHDRAW_TYPE_STRING;
  }

  /**
   * Builds withdraw data cell structure
   */
  private static buildWithdrawData(
    params: Omit<
      WithdrawSignParams | WithdrawVerifyParams,
      "secretKey" | "signature" | "publicKey"
    >,
  ): Cell {
    const domainData = beginCell()
      .storeUint(WITHDRAW_TYPEHASH, 256)
      .storeAddress(params.vault)
      .storeUint(WORKCHAIN, 32);

    return beginCell()
      .storeRef(domainData)
      .storeUint(params.requestHash, 256)
      .storeRef(
        beginCell()
          .storeAddress(params.withdrawer)
          .storeAddress(params.withdrawCurrency)
          .storeCoins(params.targetTokenAmount)
          .storeCoins(params.nav)
          .storeCoins(params.navDecimals)
          .endCell(),
      )
      .endCell();
  }

  /**
   * Validates withdraw parameters
   */
  private static validateWithdrawParams(
    params: Omit<
      WithdrawSignParams | WithdrawVerifyParams,
      "secretKey" | "signature" | "publicKey"
    >,
  ): void {
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

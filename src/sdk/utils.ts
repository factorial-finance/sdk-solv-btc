import { BinaryLike, createHash } from "crypto";
import { Address, Cell } from "@ton/core";

export function sha256(message: BinaryLike): string {
  return createHash("sha256").update(message).digest("hex");
}

function jsonReplacer(_: string, value: any): any {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Address) {
    return value.toString();
  }
  if (value instanceof Cell) {
    return value.hash().toString("hex");
  }
  return value;
}

export function createQueryId(
  data: any,
  timestamp: number = Date.now(),
): bigint {
  const json = JSON.stringify(
    {
      ...data,
      __timestamp__: timestamp,
    },
    jsonReplacer,
  );
  const hash = sha256(Buffer.from(json));
  return BigInt("0x" + Buffer.from(hash).subarray(0, 8).toString("hex"));
}

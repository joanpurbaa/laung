import "server-only";
import { randomBytes, timingSafeEqual } from "crypto";

export const REPORT_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REPORT_CODE_LENGTH = 6;

export function generateReportCode(): string {
  const bytes = randomBytes(REPORT_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < REPORT_CODE_LENGTH; i++) {
    code += REPORT_CODE_CHARS[bytes[i]! % REPORT_CODE_CHARS.length];
  }
  return code;
}

export function normalizeReportCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function codesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
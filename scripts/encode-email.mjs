import { randomInt } from "node:crypto";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/encode-email.mjs <email-address>");
  process.exit(1);
}

const seed = randomInt(256);
const bytes = [seed, ...new TextEncoder().encode(email).map((byte, i) => byte ^ ((seed + i * 0x9d) & 0xff))];

console.log(bytes.map((byte) => byte.toString(16).padStart(2, "0")).join(""));

"use client";

import { useSyncExternalStore } from "react";

export function decodeEmail(encoded: string): string {
  const [seed = 0, ...payload] = (encoded.match(/[0-9a-f]{2}/gi) ?? []).map((pair) => parseInt(pair, 16));
  return new TextDecoder().decode(Uint8Array.from(payload, (byte, i) => byte ^ ((seed + i * 0x9d) & 0xff)));
}

const subscribe = () => () => {};

// The address is only decoded in the browser, so the prerendered HTML never contains it.
export function useMailtoHref(encoded: string): string | undefined {
  return useSyncExternalStore(subscribe, () => `mailto:${decodeEmail(encoded)}`, () => undefined);
}

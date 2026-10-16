import {
  decodeShare,
  encodeShare,
  maxShareCodeLength,
} from "@/features/chat/engine";

/**
 * Share links carry the message in the URL hash, `#m=<share code>&c=<channel>`
 * (ADR 0015). Browsers never send the hash to the server, so a shared message stays
 * in the browser, and the chat page stays static.
 */
export type SharedMessage =
  | { readonly kind: "none" }
  | { readonly kind: "broken" }
  | {
      readonly kind: "message";
      readonly markup: string;
      /** A channel the registry knows, or null to keep the current one. */
      readonly channel: string | null;
    };

/** The hash for a message, or null when its code is too long to open again. */
export function shareHash(markup: string, channel: string): string | null {
  const code = encodeShare(markup);
  if (code.length > maxShareCodeLength) {
    return null;
  }
  return `#${new URLSearchParams({ m: code, c: channel }).toString()}`;
}

/**
 * Reads a share link's hash. A hash without a message is "none"; a code that does not
 * decode is "broken". The markup is untrusted text: render it as text only.
 */
export function readShareHash(
  hash: string,
  channelNames: readonly string[],
): SharedMessage {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("m");
  if (code === null) {
    return { kind: "none" };
  }
  const markup = decodeShare(code);
  if (markup === null) {
    return { kind: "broken" };
  }
  if (markup === "") {
    return { kind: "none" };
  }
  const channel = params.get("c");
  return {
    kind: "message",
    markup,
    channel:
      channel !== null && channelNames.includes(channel) ? channel : null,
  };
}

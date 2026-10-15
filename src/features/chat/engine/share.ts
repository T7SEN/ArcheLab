/**
 * Share codes: a message inside a URL (`/tools/chat?m=<code>`, SKILL.md section 5.4).
 * Format version 1: the character "1", then the message as generalized UTF-8 (WTF-8,
 * which also carries unpaired surrogates) in unpadded base64url. Decoded messages are
 * untrusted text.
 */
const formatVersion = "1";

/** Longer codes are rejected without decoding. Chat messages are at most a few hundred characters. */
export const maxShareCodeLength = 8192;

const base64urlAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const bitsPerByte = 8;
const bitsPerChar = 6;
const sextetMask = 0b111111;
const byteMask = 0xff;

const surrogate = {
  highFirst: 0xd800,
  highLast: 0xdbff,
  lowFirst: 0xdc00,
  lowLast: 0xdfff,
} as const;
const supplementaryOffset = 0x10000;
const surrogateShift = 10;
const continuation = {
  marker: 0b1000_0000,
  mask: 0b1100_0000,
  payload: 0b0011_1111,
} as const;
const utf8 = {
  oneByteLast: 0x7f,
  twoByteLast: 0x7ff,
  threeByteLast: 0xffff,
  maxCodePoint: 0x10ffff,
  twoBytePrefix: 0b1100_0000,
  threeBytePrefix: 0b1110_0000,
  fourBytePrefix: 0b1111_0000,
  twoByteLeadFirst: 0xc2,
  twoByteLeadLast: 0xdf,
  threeByteLeadFirst: 0xe0,
  threeByteLeadLast: 0xef,
  fourByteLeadFirst: 0xf0,
  fourByteLeadLast: 0xf4,
  twoBytePayload: 0b0001_1111,
  threeBytePayload: 0b0000_1111,
  fourBytePayload: 0b0000_0111,
} as const;

function encodeWtf8(text: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    let codePoint = text.charCodeAt(index);
    const next = text.charCodeAt(index + 1);
    if (
      codePoint >= surrogate.highFirst &&
      codePoint <= surrogate.highLast &&
      next >= surrogate.lowFirst &&
      next <= surrogate.lowLast
    ) {
      codePoint =
        supplementaryOffset +
        ((codePoint - surrogate.highFirst) << surrogateShift) +
        (next - surrogate.lowFirst);
      index += 1;
    }
    if (codePoint <= utf8.oneByteLast) {
      bytes.push(codePoint);
    } else if (codePoint <= utf8.twoByteLast) {
      bytes.push(utf8.twoBytePrefix | (codePoint >> bitsPerChar));
      bytes.push(continuation.marker | (codePoint & continuation.payload));
    } else if (codePoint <= utf8.threeByteLast) {
      bytes.push(utf8.threeBytePrefix | (codePoint >> (2 * bitsPerChar)));
      bytes.push(
        continuation.marker |
          ((codePoint >> bitsPerChar) & continuation.payload),
      );
      bytes.push(continuation.marker | (codePoint & continuation.payload));
    } else {
      bytes.push(utf8.fourBytePrefix | (codePoint >> (3 * bitsPerChar)));
      bytes.push(
        continuation.marker |
          ((codePoint >> (2 * bitsPerChar)) & continuation.payload),
      );
      bytes.push(
        continuation.marker |
          ((codePoint >> bitsPerChar) & continuation.payload),
      );
      bytes.push(continuation.marker | (codePoint & continuation.payload));
    }
  }
  return bytes;
}

function isContinuation(byte: number | undefined): byte is number {
  return (
    byte !== undefined && (byte & continuation.mask) === continuation.marker
  );
}

/** Strict generalized UTF-8 decoding. Returns null on any malformed sequence. */
function decodeWtf8(bytes: readonly number[]): string | null {
  let out = "";
  let index = 0;
  while (index < bytes.length) {
    const lead = bytes[index] ?? 0;
    let codePoint: number;
    let length: number;
    if (lead <= utf8.oneByteLast) {
      codePoint = lead;
      length = 1;
    } else if (lead >= utf8.twoByteLeadFirst && lead <= utf8.twoByteLeadLast) {
      codePoint = lead & utf8.twoBytePayload;
      length = 2;
    } else if (
      lead >= utf8.threeByteLeadFirst &&
      lead <= utf8.threeByteLeadLast
    ) {
      codePoint = lead & utf8.threeBytePayload;
      length = 3;
    } else if (
      lead >= utf8.fourByteLeadFirst &&
      lead <= utf8.fourByteLeadLast
    ) {
      codePoint = lead & utf8.fourBytePayload;
      length = 4;
    } else {
      return null;
    }
    for (let offset = 1; offset < length; offset += 1) {
      const byte = bytes[index + offset];
      if (!isContinuation(byte)) {
        return null;
      }
      codePoint = (codePoint << bitsPerChar) | (byte & continuation.payload);
    }
    const shortest =
      length === 1 ||
      (length === 2 && codePoint > utf8.oneByteLast) ||
      (length === 3 && codePoint > utf8.twoByteLast) ||
      (length === 4 &&
        codePoint > utf8.threeByteLast &&
        codePoint <= utf8.maxCodePoint);
    if (!shortest) {
      return null;
    }
    out += String.fromCodePoint(codePoint);
    index += length;
  }
  return out;
}

function toBase64url(bytes: readonly number[]): string {
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << bitsPerByte) | byte;
    bits += bitsPerByte;
    while (bits >= bitsPerChar) {
      bits -= bitsPerChar;
      out += base64urlAlphabet.charAt((buffer >> bits) & sextetMask);
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) {
    out += base64urlAlphabet.charAt(
      (buffer << (bitsPerChar - bits)) & sextetMask,
    );
  }
  return out;
}

/** Strict unpadded base64url. Returns null on unknown characters or leftover bits. */
function fromBase64url(text: string): number[] | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const value = base64urlAlphabet.indexOf(char);
    if (value === -1) {
      return null;
    }
    buffer = (buffer << bitsPerChar) | value;
    bits += bitsPerChar;
    if (bits >= bitsPerByte) {
      bits -= bitsPerByte;
      bytes.push((buffer >> bits) & byteMask);
    }
    buffer &= (1 << bits) - 1;
  }
  return bits >= bitsPerChar || buffer !== 0 ? null : bytes;
}

/** Encodes any string as a URL-safe share code. */
export function encodeShare(markup: string): string {
  return formatVersion + toBase64url(encodeWtf8(markup));
}

/**
 * Decodes a share code. Returns null for anything that is not a valid code; never
 * throws (invariant 5). The result is untrusted text: render it as text only.
 */
export function decodeShare(code: unknown): string | null {
  try {
    if (typeof code !== "string" || code.length > maxShareCodeLength) {
      return null;
    }
    if (!code.startsWith(formatVersion)) {
      return null;
    }
    const bytes = fromBase64url(code.slice(formatVersion.length));
    return bytes === null ? null : decodeWtf8(bytes);
  } catch {
    return null;
  }
}

// RFC 4122 v4 UUIDs. Prefer crypto.randomUUID; fall back to getRandomValues.
// Figma plugin sandbox exposes `crypto` on the main thread and in the UI iframe.
// Avoids optional chaining, nullish coalescing, and padStart to satisfy the
// ES2017 bundle contract enforced by src/plugin/__tests__/build-plugin.test.ts.

interface CryptoLike {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
}

function getCrypto(): CryptoLike | null {
  const g = globalThis as unknown as { crypto?: CryptoLike };
  return g.crypto ? g.crypto : null;
}

function byteHex(byte: number): string {
  const text = (byte & 0xff).toString(16);
  return text.length >= 2 ? text : "0" + text;
}

export function uuidv4(): string {
  const c = getCrypto();
  if (c && c.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  if (c && c.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let out = "";
  for (let i = 0; i < 16; i += 1) {
    out += byteHex(bytes[i]);
    if (i === 3 || i === 5 || i === 7 || i === 9) out += "-";
  }
  return out;
}

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: unknown): value is string {
  return typeof value === "string" && UUID_V4_RE.test(value);
}

// Human-readable correlation id that wraps a UUID. Kept short by slicing the
// random segment so log lines stay scannable. Do not use for uniqueness-critical
// keys — use uuidv4() directly for those.
export function correlationId(prefix: string): string {
  const short = uuidv4().replace(/-/g, "").substring(0, 10);
  return prefix + "-" + short;
}

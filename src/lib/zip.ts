/**
 * Minimal, dependency-free ZIP writer (STORE method — no compression).
 *
 * Produces a valid `.zip` archive from a set of UTF-8 text files. Used by the
 * Obsidian vault export so we don't pull in a third-party zip dependency.
 *
 * Implements the subset of the ZIP spec needed for text files: local file
 * headers, a central directory, and the end-of-central-directory record.
 */

export interface ZipEntry {
  /** Path within the archive, e.g. "Readiness/Index.md". */
  path: string;
  /** File contents (text). */
  content: string;
}

const CRC_TABLE: number[] = (() => {
  const table: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]!)! & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** DOS date/time. Fixed to a stable value to keep exports deterministic. */
const DOS_TIME = 0;
const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1; // 2024-01-01

function u16(v: number): number[] {
  return [v & 0xff, (v >>> 8) & 0xff];
}
function u32(v: number): number[] {
  return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: number[] = [];
  const centralParts: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (signature 0x04034b50).
    const local: number[] = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0x0800), // general purpose flag: bit 11 = UTF-8 filenames
      ...u16(0), // compression = store
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size), // compressed size
      ...u32(size), // uncompressed size
      ...u16(nameBytes.length),
      ...u16(0), // extra length
      ...nameBytes,
      ...dataBytes,
    ];

    // Central directory header (signature 0x02014b50).
    const central: number[] = [
      ...u32(0x02014b50),
      ...u16(20), // version made by
      ...u16(20), // version needed
      ...u16(0x0800),
      ...u16(0),
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra length
      ...u16(0), // comment length
      ...u16(0), // disk number start
      ...u16(0), // internal attributes
      ...u32(0), // external attributes
      ...u32(offset), // local header offset
      ...nameBytes,
    ];

    localParts.push(...local);
    centralParts.push(...central);
    offset += local.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.length;

  const eocd: number[] = [
    ...u32(0x06054b50),
    ...u16(0), // disk number
    ...u16(0), // disk with central directory
    ...u16(entries.length), // entries on this disk
    ...u16(entries.length), // total entries
    ...u32(centralSize),
    ...u32(centralOffset),
    ...u16(0), // comment length
  ];

  return Uint8Array.from([...localParts, ...centralParts, ...eocd]);
}

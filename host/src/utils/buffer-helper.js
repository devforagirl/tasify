// -- Chrome Native Messaging Buffer Helpers --
//
// Protocol: [4-byte Uint32 length][JSON string bytes]
// Chrome uses native byte order (little-endian on x86 Windows).

const LENGTH_BYTES = 4;

export function encodeMessage(msg) {
  const json = JSON.stringify(msg);
  const jsonBuf = Buffer.from(json, "utf-8");
  const lengthBuf = Buffer.alloc(LENGTH_BYTES);
  lengthBuf.writeUInt32LE(jsonBuf.length, 0);
  return Buffer.concat([lengthBuf, jsonBuf]);
}

export function decodeMessages(buf) {
  const messages = [];
  let offset = 0;

  while (offset + LENGTH_BYTES <= buf.length) {
    const msgLen = buf.readUInt32LE(offset);
    const start = offset + LENGTH_BYTES;
    const end = start + msgLen;

    if (end > buf.length) break;

    const json = buf.toString("utf-8", start, end);
    try {
      messages.push(JSON.parse(json));
    } catch {
      // Malformed JSON -- skip this message
    }
    offset = end;
  }

  return {
    messages,
    remainder: offset < buf.length ? buf.subarray(offset) : Buffer.alloc(0),
  };
}

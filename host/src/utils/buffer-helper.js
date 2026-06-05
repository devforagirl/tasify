// -- Chrome Native Messaging Buffer Helpers --
//
// Protocol: [4-byte Uint32BE length][JSON string bytes]
// All multi-byte integers are in network byte order (big-endian).

const LENGTH_BYTES = 4;

/**
 * Encode a JSON-serializable object into a Buffer
 * prefixed with its 4-byte big-endian length.
 *
 * @param {object} msg
 * @returns {Buffer}
 */
export function encodeMessage(msg) {
  const json = JSON.stringify(msg);
  const jsonBuf = Buffer.from(json, 'utf-8');
  const lengthBuf = Buffer.alloc(LENGTH_BYTES);
  lengthBuf.writeUInt32BE(jsonBuf.length, 0);
  return Buffer.concat([lengthBuf, jsonBuf]);
}

/**
 * Decode a raw Buffer (from stdin) into parsed messages.
 * Handles partial reads: returns { messages, remainder }.
 *
 * @param {Buffer} buf - accumulated buffer chunk
 * @returns {{ messages: object[], remainder: Buffer }}
 */
export function decodeMessages(buf) {
  const messages = [];
  let offset = 0;

  while (offset + LENGTH_BYTES <= buf.length) {
    const msgLen = buf.readUInt32BE(offset);
    const start = offset + LENGTH_BYTES;
    const end = start + msgLen;

    if (end > buf.length) break; // incomplete message, wait for more data

    const json = buf.toString("utf-8", start, end);
    try {
      messages.push(JSON.parse(json));
    } catch {
      // Malformed JSON � skip this message
    }
    offset = end;
  }

  return {
    messages,
    remainder: offset < buf.length ? buf.subarray(offset) : Buffer.alloc(0),
  };
}

import { describe, it, expect } from "vitest";
import { encodeMessage, decodeMessages } from "../src/utils/buffer-helper.js";

describe("buffer-helper", () => {
  it("should encode a message with correct 4-byte length prefix", () => {
    const msg = { hello: "world" };
    const buf = encodeMessage(msg);

    // First 4 bytes = length of JSON
    const json = JSON.stringify(msg);
    const length = buf.readUInt32BE(0);
    expect(length).toBe(Buffer.byteLength(json));

    // Remaining bytes = JSON string
    const decoded = buf.toString("utf-8", 4);
    expect(JSON.parse(decoded)).toEqual(msg);
  });

  it("should decode a single complete message", () => {
    const msg = { type: "EXEC_COMMAND", command: "stop" };
    const buf = encodeMessage(msg);
    const { messages, remainder } = decodeMessages(buf);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(msg);
    expect(remainder.length).toBe(0);
  });

  it("should decode multiple concatenated messages", () => {
    const msgs = [
      { type: "msg-1", seq: 1 },
      { type: "msg-2", seq: 2 },
      { type: "msg-3", seq: 3 },
    ];
    const fullBuf = Buffer.concat(msgs.map(encodeMessage));
    const { messages, remainder } = decodeMessages(fullBuf);

    expect(messages).toHaveLength(3);
    expect(messages[0].seq).toBe(1);
    expect(messages[1].seq).toBe(2);
    expect(messages[2].seq).toBe(3);
    expect(remainder.length).toBe(0);
  });

  it("should handle partial messages (chunked read)", () => {
    const msg = { type: "partial_test", data: "1234567890" };
    const fullBuf = encodeMessage(msg);

    // Simulate reading only first 2 bytes initially
    const chunk1 = fullBuf.subarray(0, 2);
    const result1 = decodeMessages(chunk1);
    expect(result1.messages).toHaveLength(0);
    expect(result1.remainder).toEqual(chunk1);

    // Feed the rest
    const chunk2 = fullBuf.subarray(2);
    const combined = Buffer.concat([result1.remainder, chunk2]);
    const result2 = decodeMessages(combined);
    expect(result2.messages).toHaveLength(1);
    expect(result2.messages[0]).toEqual(msg);
    expect(result2.remainder.length).toBe(0);
  });

  it("should handle messages split at JSON boundary", () => {
    const msg = { deep: { nested: "value" } };
    const fullBuf = encodeMessage(msg);

    // Split after the 4-byte prefix + 5 bytes of JSON
    const splitAt = 4 + 5;
    const chunk1 = fullBuf.subarray(0, splitAt);
    const chunk2 = fullBuf.subarray(splitAt);

    let remainder = chunk1;
    let result1 = decodeMessages(remainder);
    expect(result1.messages).toHaveLength(0);
    remainder = Buffer.concat([result1.remainder, chunk2]);

    const result2 = decodeMessages(remainder);
    expect(result2.messages).toHaveLength(1);
    expect(result2.messages[0]).toEqual(msg);
  });

  it("should skip malformed JSON gracefully", () => {
    // Manually craft a buffer with invalid JSON
    const buf = Buffer.alloc(4 + 5);
    buf.writeUInt32BE(5, 0);
    buf.write("{:bad", 4, 5, "utf-8");
    // Also append a valid message after it so we can still parse
    const validMsg = { ok: true };
    const validBuf = encodeMessage(validMsg);
    const combined = Buffer.concat([buf, validBuf]);

    const { messages, remainder } = decodeMessages(combined);
    // Bad message skipped, valid message parsed
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(validMsg);
    expect(remainder.length).toBe(0);
  });

  it("should handle empty messages gracefully", () => {
    const buf = Buffer.alloc(0);
    const { messages, remainder } = decodeMessages(buf);
    expect(messages).toHaveLength(0);
    expect(remainder.length).toBe(0);
  });
});

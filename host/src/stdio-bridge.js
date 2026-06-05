// -- Stdio Bridge — Chrome Native Messaging Protocol --

import { encodeMessage, decodeMessages } from "./utils/buffer-helper.js";
import { logger } from "./logger.js";

class StdioBridge {
  constructor() {
    this._handler = null;
    this._buffer = Buffer.alloc(0);
    this._running = false;
    this._onClose = null;
  }

  start(onMessage, onClose) {
    this._handler = onMessage;
    // Don't auto-exit on stdin close — let keepalive manage lifecycle
    this._onClose = onClose || (() => {
      logger.info("stdin closed (default handler — staying alive)");
    });
    this._running = true;

    process.stdin.on("data", (chunk) => {
      this._buffer = Buffer.concat([this._buffer, chunk]);
      const { messages, remainder } = decodeMessages(this._buffer);
      this._buffer = remainder;
      for (const msg of messages) {
        try {
          this._handler(msg);
        } catch (err) {
          logger.error("message handler error", { error: err.message });
        }
      }
    });

    process.stdin.on("end", () => {
      logger.info("stdin closed");
      this._running = false;
      if (this._onClose) this._onClose();
    });

    process.stdin.on("error", (err) => {
      logger.error("stdin error", { error: err.message });
    });
  }

  send(msg) {
    if (!this._running) {
      logger.warn("cannot send — bridge not running");
      return;
    }
    const buf = encodeMessage(msg);
    process.stdout.write(buf);
  }

  stop() {
    this._running = false;
    process.stdin.removeAllListeners();
  }
}

export default StdioBridge;

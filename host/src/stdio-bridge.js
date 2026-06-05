// -- Stdio Bridge � Chrome Native Messaging Protocol --
//
// Sends/receives messages over process.stdin/stdout using
// the [4-byte length][JSON] framing protocol.

import { encodeMessage, decodeMessages } from "./utils/buffer-helper.js";
import { logger } from "./logger.js";

class StdioBridge {
  constructor() {
    this._handler = null;
    this._buffer = Buffer.alloc(0);
    this._running = false;
    this._onClose = null;
  }

  /**
   * Start listening on stdin.
   * @param {function} onMessage � called with parsed message objects
   * @param {function} [onClose] � called when stdin closes (browser disconnected)
   */
  start(onMessage, onClose) {
    this._handler = onMessage;
    this._onClose = onClose || (() => process.exit(0));
    this._running = true;

    process.stdin.on("data", (chunk) => {
      this._buffer = Buffer.concat([this._buffer, chunk]);
      const { messages, remainder } = decodeMessages(this._buffer);
      this._buffer = remainder;
      for (const msg of messages) {
        logger.debug("stdin message received", { type: msg.type });
        try {
          this._handler(msg);
        } catch (err) {
          logger.error("message handler error", { error: err.message });
        }
      }
    });

    process.stdin.on("end", () => {
      logger.info("stdin closed � browser disconnected");
      this._running = false;
      if (this._onClose) this._onClose();
    });

    process.stdin.on("error", (err) => {
      logger.error("stdin error", { error: err.message });
      this._running = false;
      if (this._onClose) this._onClose();
    });
  }

  /**
   * Send a message to the browser via stdout.
   * @param {object} msg
   */
  send(msg) {
    if (!this._running) {
      logger.warn("cannot send � bridge not running");
      return;
    }
    const buf = encodeMessage(msg);
    process.stdout.write(buf);
  }

  /** Gracefully stop */
  stop() {
    this._running = false;
    process.stdin.removeAllListeners();
  }
}

export default StdioBridge;

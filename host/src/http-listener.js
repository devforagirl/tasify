// -- HTTP Listener � Express Server --
// Receives Claude Code hook events via POST /hooks
// and forwards them to the Chrome Extension via StdioBridge.

import express from "express";
import cors from "cors";
import { logger } from "./logger.js";

class HttpListener {
  /**
   * @param {object} options
   * @param {number} options.port
   * @param {string|null} options.hookToken
   * @param {import("./stdio-bridge.js").default} options.bridge
   */
  constructor({ port, hookToken = null, bridge }) {
    this._port = port;
    this._hookToken = hookToken;
    this._bridge = bridge;
    this._app = null;
    this._server = null;
  }

  /**
   * Start the Express server.
   * @returns {Promise<void>}
   */
  start() {
    return new Promise((resolve, reject) => {
      const app = express();
      this._app = app;

      app.use(cors());
      app.use(express.json());

      // Health check
      app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", uptime: process.uptime() });
      });

      // Claude Code hook receiver
      app.post("/hooks", (req, res) => {
        const hookEvent = req.body;

        // Token validation (optional)
        if (this._hookToken) {
          const token =
            req.headers["authorization"]?.replace(/^Bearer\s+/i, "") ||
            req.headers["x-hook-token"];
          if (token !== this._hookToken) {
            logger.warn("hook rejected � invalid token");
            return res.status(401).json({ error: "Invalid token" });
          }
        }

        if (!hookEvent || !hookEvent.event) {
          logger.warn("hook rejected � missing event field");
          return res.status(400).json({ error: "Missing event field" });
        }

        logger.info("hook received", { event: hookEvent.event });

        // Forward to Chrome via StdioBridge
        this._bridge.send({
          type: "CLAUDE_EVENT",
          data: {
            event: hookEvent.event,
            payload: hookEvent.payload || {},
            timestamp: Date.now(),
          },
        });

        res.json({ received: true });
      });

      // Start listening
      this._server = app.listen(this._port, () => {
        logger.info("HTTP listener started", { port: this._port });
        resolve();
      });

      this._server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          logger.error(`Port ${this._port} is already in use`);
          reject(new Error(`Port ${this._port} is already in use`));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Stop the Express server.
   * @returns {Promise<void>}
   */
  stop() {
    return new Promise((resolve) => {
      if (this._server) {
        this._server.close(() => resolve());
        this._server = null;
      } else {
        resolve();
      }
    });
  }
}

export default HttpListener;

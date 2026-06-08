import express from "express";
import cors from "cors";
import { logger } from "./logger.js";
import crypto from "crypto";

const PERMISSION_TIMEOUT_MS = 86400_000;

class HttpListener {
  constructor({ port, hookToken = null, bridge }) {
    this._port = port;
    this._hookToken = hookToken;
    this._bridge = bridge;
    this._bridge.httpListener = this;
    this._app = null;
    this._server = null;
    this._pendingRes = new Map();
  }

  start() {
    return new Promise((resolve, reject) => {

      const app = express();
      this._app = app;

      app.use(cors());
      app.use(express.json({ limit: "1mb" }));
      app.use(express.text({ type: "text/*", limit: "1mb" }));

      app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", uptime: process.uptime(), host: "tasify" });
      });

      app.post("/hooks", (req, res) => {
        let hookEvent = req.body;
        if (typeof hookEvent === "string") {
          try { hookEvent = JSON.parse(hookEvent); }
          catch (e) { return res.status(400).json({ error: "Invalid JSON" }); }
        }
        if (hookEvent && hookEvent.hook_event_name && !hookEvent.event) {
          hookEvent.event = hookEvent.hook_event_name;
        }
        if (!hookEvent || !hookEvent.event) {
          return res.status(400).json({ error: "Missing event field" });
        }

        if (this._hookToken) {
          const token = req.headers["authorization"]?.replace(/^Bearer\s+/i, "") || req.headers["x-hook-token"];
          if (token !== this._hookToken) { return res.status(401).json({ error: "Invalid token" }); }
        }

        logger.info("hook received", { event: hookEvent.event });

        if (hookEvent.event === "PermissionRequest") {
          const correlationId = crypto.randomUUID();
          const payload = hookEvent.payload || {};
          const timer = setTimeout(() => {
            this.resolvePending(correlationId, {
              behavior: "deny",
              message: "Timed out waiting for approval",
            });
          }, PERMISSION_TIMEOUT_MS);
          this._pendingRes.set(correlationId, { res, timer });
          try {
            this._bridge.send({
              type: "CLAUDE_EVENT",
              data: {
                event: "PermissionRequest",
                payload: {
                  tool_name: hookEvent.tool_name || "",
                  command: (hookEvent.tool_input && hookEvent.tool_input.command) || "",
                  description: (hookEvent.tool_input && hookEvent.tool_input.description) || "",
                },
                correlationId,
                timestamp: Date.now(),
              },
            });
            process.stderr.write("[tasify] PermissionRequest forwarded, correlationId=" + correlationId + "\n");
          } catch (err) {
            process.stderr.write("[tasify] PermissionRequest bridge.send FAILED: " + err.message + "\n");
            this.resolvePending(correlationId, {
              behavior: "deny",
              message: "Bridge unavailable, auto-denied",
            });
          }
          return;
        }

        res.json({ received: true });

        try {
          this._bridge.send({
            type: "CLAUDE_EVENT",
            data: {
              event: hookEvent.event,
              payload: hookEvent.payload || hookEvent,
              timestamp: Date.now(),
            },
          });
          process.stderr.write("[tasify] bridge.send completed\n");
        } catch (err) {
          process.stderr.write("[tasify] bridge.send FAILED: " + err.message + "\n");
        }
      });

      app.use((err, _req, res, _next) => {
        process.stderr.write("[tasify] express error: " + err.message + "\n");
        if (!res.headersSent) res.status(500).json({ error: err.message });
      });

      this._server = app.listen(this._port, () => {
        process.stderr.write("[tasify] HTTP ready\n");
        resolve();
      });
      this._server.on("error", (err) => {
        if (err.code === "EADDRINUSE") reject(new Error("Port " + this._port + " is already in use"));
        else reject(err);
      });
    });
  }

  resolvePending(correlationId, decision) {
    const entry = this._pendingRes.get(correlationId);
    if (!entry) {
      process.stderr.write("[tasify] resolvePending: unknown correlationId=" + correlationId + " (already resolved)\n");
      return;
    }
    clearTimeout(entry.timer);
    entry.res.json({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision,
      },
    });
    this._pendingRes.delete(correlationId);
    process.stderr.write("[tasify] PermissionRequest resolved, correlationId=" + correlationId + " decision=" + JSON.stringify(decision) + "\n");
    this._bridge.send({
      type: "PERMISSION_RESOLVED",
      data: { correlationId, decision },
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this._server) { this._server.close(() => resolve()); this._server = null; } else resolve();
    });
  }
}

export default HttpListener;

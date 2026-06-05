// -- Tasify Native Messaging Host � Entry Point --
//
// Assembles StdioBridge, HttpListener, and ShellExecutor.
// Bridges Claude Code HTTP Hooks ? Chrome Extension (Stdio)
// and Chrome Commands (Stdio) ? Claude Code CLI (Shell).

import { config } from "./config.js";
import StdioBridge from "./stdio-bridge.js";
import HttpListener from "./http-listener.js";
import ShellExecutor from "./shell-executor.js";
import { logger } from "./logger.js";

// -- Bootstrap --

const bridge = new StdioBridge();
const executor = new ShellExecutor({ cliPath: config.cliPath, bridge });
let httpListener;

// Wire Stdio messages from the browser
bridge.start((msg) => {
  switch (msg.type) {
    case "EXEC_COMMAND": {
      const command = msg.command || "status";
      const params = msg.params || {};
      executor.execute(command, params);
      break;
    }
    case "KILL_PROCESS":
      executor.kill();
      break;
    default:
      logger.warn("unknown command type from browser", { type: msg.type });
      bridge.send({
        type: "CLAUDE_ERROR",
        data: { message: `Unknown command type: ${msg.type}` },
      });
  }
});

// Start HTTP listener for Claude Code hooks
httpListener = new HttpListener({
  port: config.port,
  hookToken: config.hookToken,
  bridge,
});

try {
  await httpListener.start();
  logger.info("Tasify Native Host started", {
    port: config.port,
    hostName: config.hostName,
  });
} catch (err) {
  logger.error("Failed to start HTTP listener", { error: err.message });
  process.exit(1);
}

// -- Graceful Shutdown --

// Chrome Native Messaging protocol: when the browser disconnects,
// stdin is closed. Detect that and clean up.
const shutdown = async () => {
  logger.info("shutting down...");
  bridge.stop();
  executor.kill();
  if (httpListener) await httpListener.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.stdin.on("end", shutdown);

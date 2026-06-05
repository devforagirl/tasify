// -- Tasify Native Messaging Host — Entry Point --

import { config } from "./config.js";
import StdioBridge from "./stdio-bridge.js";
import HttpListener from "./http-listener.js";
import ShellExecutor from "./shell-executor.js";
import { logger } from "./logger.js";

process.stderr.write("[tasify] starting...\n");

const bridge = new StdioBridge();
const executor = new ShellExecutor({ cliPath: config.cliPath, bridge });
let httpListener;

// Wire messages first
bridge.start((msg) => {
  process.stderr.write("[tasify] msg: " + msg.type + "\n");
  switch (msg.type) {
    case "EXEC_COMMAND": {
      executor.execute(msg.command || "status", msg.params || {});
      break;
    }
    case "KILL_PROCESS":
      executor.kill();
      break;
    default:
      bridge.send({ type: "CLAUDE_ERROR", data: { message: "Unknown: " + msg.type } });
  }
});

// Start HTTP listener
httpListener = new HttpListener({ port: config.port, hookToken: config.hookToken, bridge });

try {
  await httpListener.start();
  process.stderr.write("[tasify] HTTP on port " + config.port + "\n");
} catch (err) {
  process.stderr.write("[tasify] HTTP failed: " + err.message + " (stdio-only mode)\n");
}

process.stderr.write("[tasify] ready\n");

// -- Keepalive: ensure event loop never exits --
// Node exits when nothing keeps the event loop alive.
// Chrome Native Messaging requires the process to stay running.
setInterval(() => {}, 60000);

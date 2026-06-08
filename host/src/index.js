import { config } from "./config.js";
import StdioBridge from "./stdio-bridge.js";
import HttpListener from "./http-listener.js";
import ShellExecutor from "./shell-executor.js";

const bridge = new StdioBridge();
const executor = new ShellExecutor({ cliPath: config.cliPath, bridge });
let httpListener;

bridge.start((msg) => {
  switch (msg.type) {
    case "EXEC_COMMAND": {
      executor.execute(msg.command || "status", msg.params || {});
      break;
    }
    case "KILL_PROCESS":
      executor.kill();
      break;
    case "PERMISSION_DECISION":
      const { correlationId, decision } = msg;
      if (httpListener && httpListener.resolvePending) {
        httpListener.resolvePending(correlationId, decision);
      }
      break;
    default:
      bridge.send({ type: "CLAUDE_ERROR", data: { message: "Unknown: " + msg.type } });
  }
});

httpListener = new HttpListener({ port: config.port, hookToken: config.hookToken, bridge });
try {
  await httpListener.start();
} catch (err) {
  process.stderr.write("[tasify] WARNING: " + err.message + "\n");
}

process.stderr.write("[tasify] ready\n");

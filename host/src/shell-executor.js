// -- Shell Executor � CLI Wrapper --
// Spawns claude-code processes and pipes output back via StdioBridge.

import { spawn } from "node:child_process";
import { logger } from "./logger.js";

class ShellExecutor {
  /**
   * @param {object} config
   * @param {string} [config.cliPath] � path to claude-code binary, defaults to "npx claude-code"
   * @param {import("./stdio-bridge.js").default} config.bridge
   */
  constructor({ cliPath = "npx claude-code", bridge }) {
    this._cliPath = cliPath;
    this._bridge = bridge;
    this._child = null;
    this._abortController = null;
  }

  /**
   * Execute a command against the claude-code CLI.
   * Results are streamed back via the bridge.
   *
   * @param {string} action � subcommand or flag (e.g. "stop", "--version")
   * @param {object} [params={}]
   *   Special `_` key provides positional args (used for test compat).
   * @returns {Promise<{ exitCode: number | null, signal: string | null }>}
   */
  execute(action, params = {}) {
    return new Promise((resolve) => {
      // Build the command string
      const parts = [this._cliPath];
      if (action) parts.push(action);
      if (Array.isArray(params._)) parts.push(...params._);
      for (const [key, value] of Object.entries(params)) {
        if (key === "_") continue;
        if (value === true) parts.push(`--${key}`);
        else if (value !== false && value !== null) parts.push(`--${key}`, String(value));
      }
      const fullCmd = parts.join(" ");

      logger.info("spawning claude-code", { cmd: fullCmd });

      this._abortController = new AbortController();
      const child = spawn(fullCmd, [], {
        signal: this._abortController.signal,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
        windowsHide: true,
      });
      this._child = child;

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        stdout += text;
        this._bridge.send({
          type: "CLAUDE_OUTPUT",
          data: { stream: "stdout", text },
        });
      });

      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderr += text;
        this._bridge.send({
          type: "CLAUDE_OUTPUT",
          data: { stream: "stderr", text },
        });
      });

      child.on("error", (err) => {
        if (err.name === "AbortError") {
          logger.info("process killed via abort signal");
          resolve({ exitCode: null, signal: "SIGTERM" });
          return;
        }
        logger.error("spawn error", { error: err.message });
        this._bridge.send({
          type: "CLAUDE_ERROR",
          data: { message: `Failed to spawn claude-code: ${err.message}` },
        });
        resolve({ exitCode: null, signal: null });
      });

      child.on("close", (exitCode, signal) => {
        logger.info("process closed", { exitCode, signal });
        this._bridge.send({
          type: "CLAUDE_RESULT",
          data: {
            action,
            exitCode,
            signal,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
          },
        });
        this._child = null;
        this._abortController = null;
        resolve({ exitCode, signal });
      });
    });
  }

  /** Kill the currently running child process (if any). */
  kill() {
    if (this._abortController) {
      this._abortController.abort();
      this._bridge.send({
        type: "CLAUDE_OUTPUT",
        data: { stream: "system", text: "Process terminated by user" },
      });
    }
  }

  /** Check if a child process is currently running */
  get isRunning() {
    return this._child !== null;
  }
}

export default ShellExecutor;

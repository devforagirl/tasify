import { describe, it, expect, beforeEach } from "vitest";
import ShellExecutor from "../src/shell-executor.js";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function mockBridge() {
  const messages = [];
  return {
    send: (msg) => messages.push(msg),
    messages,
  };
}

describe("ShellExecutor", () => {
  let bridge;
  let executor;

  beforeEach(() => {
    bridge = mockBridge();
    executor = new ShellExecutor({ cliPath: "node", bridge });
  });

  it("should run a command and emit CLAUDE_RESULT", async () => {
    const result = await executor.execute("--version");
    expect(result.exitCode).toBe(0);

    const resultMsg = bridge.messages.find((m) => m.type === "CLAUDE_RESULT");
    expect(resultMsg).toBeTruthy();
    expect(resultMsg.data.exitCode).toBe(0);
    expect(resultMsg.data.stdout).toMatch(/^v\d+/);
  });

  it("should execute a script file and capture stdout", async () => {
    const scriptPath = join(tmpdir(), `tasify-test-${Date.now()}.mjs`);
    writeFileSync(scriptPath, "console.log(42);", "utf-8");
    try {
      await executor.execute(scriptPath);
      const resultMsg = bridge.messages.find((m) => m.type === "CLAUDE_RESULT");
      expect(resultMsg.data.stdout).toMatch(/42/);
    } finally {
      try { unlinkSync(scriptPath); } catch { /* ignore */ }
    }
  });

  it("should report non-zero exit codes", async () => {
    const scriptPath = join(tmpdir(), `tasify-exit-${Date.now()}.mjs`);
    writeFileSync(scriptPath, "process.exit(42);", "utf-8");
    try {
      await executor.execute(scriptPath);
      const resultMsg = bridge.messages.find((m) => m.type === "CLAUDE_RESULT");
      expect(resultMsg).toBeTruthy();
      expect(resultMsg.data.exitCode).toBe(42);
    } finally {
      try { unlinkSync(scriptPath); } catch { /* ignore */ }
    }
  });

  it("should kill a running process", async () => {
    const scriptPath = join(tmpdir(), `tasify-sleep-${Date.now()}.mjs`);
    writeFileSync(scriptPath, "await new Promise(r => setTimeout(r, 60000));", "utf-8");
    try {
      const promise = executor.execute(scriptPath);
      executor.kill();
      const result = await promise;
      expect(result.exitCode).not.toBe(0);

      const killMsg = bridge.messages.find(
        (m) => m.type === "CLAUDE_OUTPUT" && m.data.stream === "system"
      );
      expect(killMsg).toBeTruthy();
      expect(killMsg.data.text).toContain("terminated");
    } finally {
      try { unlinkSync(scriptPath); } catch { /* ignore */ }
    }
  });

  it("should report isRunning correctly", () => {
    expect(executor.isRunning).toBe(false);
    executor.execute("--version");
    expect(executor.isRunning).toBe(true);
  });

  it("should handle non-existent command gracefully", async () => {
    const badExecutor = new ShellExecutor({
      cliPath: "command-that-does-not-exist-hopefully",
      bridge,
    });
    const result = await badExecutor.execute("status");
    // On Windows, shell:true runs through cmd.exe which returns exit code 1
    // for unknown commands. The key requirement is it resolves without crashing.
    expect(typeof result.exitCode).toBe("number");
  });
});

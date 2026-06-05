// ── Simulate Chrome Extension (stdin/stdout) ──
// Usage: node test-helpers/simulate-chrome.js
//
// Connects to the Tasify Native Host via stdin/stdout using the
// Chrome Native Messaging protocol.
// Sends a test EXEC_COMMAND and prints responses.

import { encodeMessage, decodeMessages } from "../src/utils/buffer-helper.js";

// Read a framed message from stdin
function readMessage() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.once("readable", () => {
      // Read 4-byte length header
      const header = process.stdin.read(4);
      if (!header) return reject(new Error("stdin closed"));
      const len = header.readUInt32BE(0);
      const body = process.stdin.read(len);
      if (!body) return reject(new Error("incomplete message"));
      try {
        resolve(JSON.parse(body.toString("utf-8")));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || "status";

  console.error("[simulate-chrome] sending EXEC_COMMAND:", action);

  // Send command to host
  const msg = { type: "EXEC_COMMAND", command: action, params: {} };
  process.stdout.write(encodeMessage(msg));

  // Read responses until we get a CLAUDE_RESULT
  let done = false;
  while (!done) {
    const response = await readMessage();
    console.error("[simulate-chrome] received:", response.type);
    if (response.type === "CLAUDE_RESULT") {
      console.log(JSON.stringify(response.data, null, 2));
      done = true;
    } else if (response.type === "CLAUDE_OUTPUT") {
      process.stdout.write(response.data.text);
    } else if (response.type === "CLAUDE_ERROR") {
      console.error("[simulate-chrome] error:", response.data.message);
      done = true;
    }
  }
}

main().catch((err) => {
  console.error("[simulate-chrome] fatal:", err.message);
  process.exit(1);
});
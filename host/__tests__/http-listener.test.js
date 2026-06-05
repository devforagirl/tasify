import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "node:http";
import HttpListener from "../src/http-listener.js";

function mockBridge() {
  const messages = [];
  return {
    send: (msg) => messages.push(msg),
    messages,
  };
}

function postJson(url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(data || "{}") })
        );
      }
    );
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.get(parsed, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: JSON.parse(data || "{}") })
      );
    });
    req.on("error", reject);
  });
}

describe("HttpListener", () => {
  let bridge;
  let listener;
  let port;
  let baseUrl;

  beforeEach(async () => {
    bridge = mockBridge();
    port = 0; // let OS assign
    listener = new HttpListener({ port: 0, bridge });
    await listener.start();
    // Find the assigned port
    const addr = listener._server.address();
    port = addr.port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await listener.stop();
  });

  it("should respond to health check", async () => {
    const res = await getJson(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("should accept a valid hook event and forward via bridge", async () => {
    const payload = {
      event: "on_task_completed",
      payload: {
        task_id: "t-123",
        status: "success",
        result: "Files refactored",
      },
    };
    const res = await postJson(`${baseUrl}/hooks`, payload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Verify the bridge forwarded the event
    expect(bridge.messages).toHaveLength(1);
    const msg = bridge.messages[0];
    expect(msg.type).toBe("CLAUDE_EVENT");
    expect(msg.data.event).toBe("on_task_completed");
    expect(msg.data.payload.task_id).toBe("t-123");
  });

  it("should reject events missing the event field", async () => {
    const res = await postJson(`${baseUrl}/hooks`, { notAnEvent: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing event/i);
    expect(bridge.messages).toHaveLength(0);
  });

  it("should validate token when configured", async () => {
    // Create a new listener with a token
    const secureBridge = mockBridge();
    const secureListener = new HttpListener({
      port: 0,
      hookToken: "my-secret",
      bridge: secureBridge,
    });
    await secureListener.start();
    const secureAddr = secureListener._server.address();
    const secureUrl = `http://127.0.0.1:${secureAddr.port}`;

    try {
      // Without token -> 401
      const res1 = await postJson(`${secureUrl}/hooks`, { event: "test", payload: {} });
      expect(res1.status).toBe(401);

      // With correct token -> 200
      const res2 = await postJson(`${secureUrl}/hooks`, { event: "test", payload: {} }, "my-secret");
      expect(res2.status).toBe(200);
      expect(res2.body.received).toBe(true);
    } finally {
      await secureListener.stop();
    }
  });

  it("should forward multiple webhook events sequentially", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await postJson(`${baseUrl}/hooks`, {
        event: `event-${i}`,
        payload: { seq: i },
      });
      expect(res.status).toBe(200);
    }
    expect(bridge.messages).toHaveLength(3);
    expect(bridge.messages.map((m) => m.data.event)).toEqual([
      "event-0",
      "event-1",
      "event-2",
    ]);
  });
});

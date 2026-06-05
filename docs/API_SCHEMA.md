# Tasify — Data Contract / API Schema

> Phase 1: Mock Server over WebSocket (Socket.io)
> Phase 3: Chrome Runtime Messages (same schema)

---

## 1. Event Push (Server ? Client)

### `CLAUDE_EVENT`

```json
{
  "type": "CLAUDE_EVENT",
  "payload": {
    "id": "uuid-v4",
    "event_name": "task_completed",
    "timestamp": 1717536000,
    "severity": "SUCCESS",
    "details": {
      "task_name": "Refactor Auth Module",
      "duration": "12.5s",
      "message": "Optional human-readable description"
    }
  }
}
```

**Fields:**

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Always `"CLAUDE_EVENT"`. Discriminant for routing. |
| `payload.id` | `string` (UUID v4) | Unique event identifier. |
| `payload.event_name` | `string` | Machine-readable event name (snake_case). See [Event Catalog](#2-event-catalog). |
| `payload.timestamp` | `number` (Unix seconds) | When the event occurred. |
| `payload.severity` | `enum` | One of: `INFO`, `SUCCESS`, `WARNING`, `ERROR`. |
| `payload.details` | `object` | Arbitrary JSON payload with event-specific fields. |

### `STATE_CHANGE`

```json
{
  "status": "EXECUTING",
  "timestamp": 1717536000
}
```

**Status Values:** `IDLE`, `THINKING`, `EXECUTING`, `HOOK_TRIGGERED`, `ERROR`

---

## 2. Event Catalog

| event_name | severity | Description |
|---|---|---|
| `task_started` | `INFO` | A new task has begun execution. |
| `task_progress` | `INFO` | Progress update for the current task. |
| `file_edited` | `INFO` | Claude has modified a file. |
| `task_completed` | `SUCCESS` | Task finished successfully. |
| `state_synced` | `SUCCESS` | State refreshed / synchronized. |
| `warning_raised` | `WARNING` | Non-critical warning from the runtime. |
| `error_occurred` | `ERROR` | An error was encountered. |
| `hook_triggered` | `INFO` | A Hook event was intercepted. |
| `task_interrupted` | `WARNING` | Task stopped by user action. |
| `unknown_command` | `WARNING` | Server received an unrecognized command. |

---

## 3. Command (Client ? Server)

### `EXECUTE_ACTION`

```json
{
  "command": "EXECUTE_ACTION",
  "params": {
    "action_type": "STOP_TASK",
    "target_id": "task-123"
  }
}
```

**Action Types:**

| action_type | params | Description |
|---|---|---|
| `STOP_TASK` | `{ target_id: string }` | Interrupt the currently running task. |
| `SYNC_STATE` | `{}` | Force a full state re-sync. |
| `TRIGGER_MOCK_HOOK` | `{ event_name: string }` | (Mock only) Trigger an artificial Hook event. |

---

## 4. REST Endpoints (Mock Server Only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check. Returns `{ status, uptime }`. |

---

## 5. Transport Notes

- **Phase 1 (Web Mock):** Socket.io over WebSocket. Events are namespaced as Socket.io event names (`CLAUDE_EVENT`, `STATE_CHANGE`, `COMMAND`).
- **Phase 3 (Chrome Extension):** Same JSON schema transmitted via `chrome.runtime.sendMessage` / `chrome.runtime.connect`. The `Transport` adapter class abstracts the difference.
- UI components **never** reference Socket.io or Chrome APIs directly — they consume events through `ClaudeService` only.

#!/usr/bin/env bash
# ── Simulate Claude Code sending a Hook event ──
# Usage: ./test-helpers/send-test-hook.sh [event_name] [port]

EVENT="${1:-on_task_completed}"
PORT="${2:-3000}"

curl -s -X POST "http://localhost:${PORT}/hooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"${EVENT}\",
    \"payload\": {
      \"task_id\": \"t-$(date +%s)\",
      \"status\": \"success\",
      \"result\": \"Simulated from send-test-hook.sh\"
    }
  }" | jq .
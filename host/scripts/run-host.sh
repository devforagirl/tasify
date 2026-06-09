#!/usr/bin/env bash
# Tasify Native Messaging Host — Unix launcher
# Chrome spawns this process for stdio Native Messaging.
# We delegate to the Node.js runtime.

DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/../src/index.js"

#!/usr/bin/env bash
# Tasify Native Messaging Host — macOS / Linux Uninstall Script
# Usage: bash uninstall-host.sh

set -euo pipefail

HOST_NAME="com.tasify.claude.host"

case "$(uname -s)" in
  Darwin)
    MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    ;;
  Linux)
    MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
    ;;
  *)
    echo "Unsupported platform: $(uname -s)"
    exit 1
    ;;
esac

MANIFEST="$MANIFEST_DIR/$HOST_NAME.json"
if [ -f "$MANIFEST" ]; then
  rm "$MANIFEST"
  echo "Manifest removed: $MANIFEST"
else
  echo "No manifest found at $MANIFEST"
fi
echo "Uninstall complete."

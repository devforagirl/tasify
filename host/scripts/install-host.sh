#!/usr/bin/env bash
# Tasify Native Messaging Host — macOS / Linux Installation Script
# Usage: bash install-host.sh [--uninstall]

set -euo pipefail

HOST_NAME="com.tasify.claude.host"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LAUNCHER="$SCRIPT_DIR/run-host.sh"
EXTENSION_ID="lbknkjhpipbgoelflkfdncfnbbpdgmje"

# Detect platform
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

install_host() {
  echo "=== Tasify Native Host Installation ==="
  echo "Host directory: $PKG_ROOT"
  echo ""

  mkdir -p "$MANIFEST_DIR"

  if [ -f "$LAUNCHER" ]; then
    chmod +x "$LAUNCHER"
  else
    echo "Error: Launcher not found at $LAUNCHER"
    exit 1
  fi

  MANIFEST="$MANIFEST_DIR/$HOST_NAME.json"
  cat > "$MANIFEST" <<-EOF
{
  "name": "$HOST_NAME",
  "description": "Tasify Native Messaging Host",
  "path": "$LAUNCHER",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXTENSION_ID/"]
}
EOF

  echo "Manifest written to: $MANIFEST"
  echo "  Launcher: $LAUNCHER"
  echo "  Allowed origins: chrome-extension://$EXTENSION_ID/"
  echo ""
  echo "Installation complete!"
}

uninstall_host() {
  echo "=== Tasify Native Host Uninstall ==="

  MANIFEST="$MANIFEST_DIR/$HOST_NAME.json"
  if [ -f "$MANIFEST" ]; then
    rm "$MANIFEST"
    echo "Manifest removed: $MANIFEST"
  else
    echo "No manifest found at $MANIFEST"
  fi
  echo "Uninstall complete."
}

if [ "${1:-}" = "--uninstall" ]; then
  uninstall_host
else
  install_host
fi

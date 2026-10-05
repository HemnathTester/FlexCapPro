#!/usr/bin/env bash
set -euo pipefail
export PATH="$PATH:$HOME/.maestro/bin"
if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      # The get.maestro.mobile.dev installer targets macOS/Linux; on Windows use the release zip.
      TMP_DIR="$(mktemp -d)"
      curl -fL "https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip" -o "$TMP_DIR/maestro.zip"
      unzip -q "$TMP_DIR/maestro.zip" -d "$TMP_DIR"
      rm -rf "$HOME/.maestro"
      mv "$TMP_DIR/maestro" "$HOME/.maestro"
      rm -rf "$TMP_DIR"
      echo "Installed to $HOME/.maestro — add %USERPROFILE%\\.maestro\\bin to your user PATH."
      ;;
    *)
      curl -Ls "https://get.maestro.mobile.dev" | bash
      ;;
  esac
fi
maestro --version

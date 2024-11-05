#!/bin/bash

# Define directories
VSCODE_CONFIG="$HOME/Library/Application Support/Code/User"
VSCODE_DIR="$PWD/.vscode"

# Create .vscode directory if it doesn't exist
mkdir -p "$VSCODE_DIR"

echo "Exporting VS Code settings to .vscode..."

# Export settings.json
if [ -f "$VSCODE_CONFIG/settings.json" ]; then
    cp "$VSCODE_CONFIG/settings.json" "$VSCODE_DIR/settings-exported.json"
    echo "✓ Exported settings.json"
fi

# Export keybindings.json
if [ -f "$VSCODE_CONFIG/keybindings.json" ]; then
    cp "$VSCODE_CONFIG/keybindings.json" "$VSCODE_DIR/keybindings.json"
    echo "✓ Exported keybindings.json"
fi

# Export snippets
if [ -d "$VSCODE_CONFIG/snippets" ]; then
    rm -rf "$VSCODE_DIR/snippets"
    cp -r "$VSCODE_CONFIG/snippets" "$VSCODE_DIR/"
    echo "✓ Exported snippets"
fi

# Export extensions list
if command -v code &> /dev/null; then
    code --list-extensions > "$VSCODE_DIR/vscode-extensions.txt"
    echo "✓ Exported VS Code extensions list"
else
    echo "⚠️  VS Code command not found - couldn't export extensions"
fi

echo "Done! VS Code settings exported to $VSCODE_DIR"
ls -la "$VSCODE_DIR"

# Create README if it doesn't exist
cat > "$VSCODE_DIR/README.md" << 'EOF'
# VS Code Settings

## To restore settings:
1. Copy `settings.json`, `keybindings.json` to:
   - macOS: `~/Library/Application Support/Code/User/`
   - Linux: `~/.config/Code/User/`
   - Windows: `%APPDATA%\Code\User\`

2. Install extensions:
```bash
cat vscode-extensions.txt | xargs -n 1 code --install-extension
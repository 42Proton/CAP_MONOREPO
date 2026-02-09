#!/usr/bin/env bash
set -euo pipefail

# ─── Create a new shared TypeScript package ───
# Usage: ./scripts/create-package.sh <package-name>
# Example: ./scripts/create-package.sh utils

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_NAME="${1:-}"

if [ -z "$PACKAGE_NAME" ]; then
  echo "Usage: $0 <package-name>"
  echo "Example: $0 utils"
  exit 1
fi

PACKAGE_DIR="$REPO_ROOT/packages/$PACKAGE_NAME"

if [ -d "$PACKAGE_DIR" ]; then
  echo "Error: Directory packages/$PACKAGE_NAME already exists."
  exit 1
fi

echo "Creating package: @mono/$PACKAGE_NAME"
echo "───────────────────────────────────────────────────"

# Create directory structure
mkdir -p "$PACKAGE_DIR/src"

# ─── package.json ───
cat > "$PACKAGE_DIR/package.json" <<EOF
{
  "name": "@mono/$PACKAGE_NAME",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@mono/eslint-config": "workspace:*",
    "@mono/typescript-config": "workspace:*",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
EOF

# ─── tsconfig.json ───
cat > "$PACKAGE_DIR/tsconfig.json" <<'EOF'
{
  "extends": "@mono/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ─── .eslintrc.cjs ───
cat > "$PACKAGE_DIR/.eslintrc.cjs" <<'EOF'
module.exports = {
  extends: ['@mono/eslint-config/node'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
EOF

# ─── src/index.ts ───
cat > "$PACKAGE_DIR/src/index.ts" <<EOF
// @mono/$PACKAGE_NAME — shared package
// Export your modules here
EOF

echo ""
echo "Package '@mono/$PACKAGE_NAME' created at packages/$PACKAGE_NAME/"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm install' from the repo root"
echo "  2. Add exports to packages/$PACKAGE_NAME/src/index.ts"
echo "  3. Import with: import { ... } from '@mono/$PACKAGE_NAME'"
echo ""

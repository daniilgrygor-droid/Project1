#!/bin/bash
cd /c/Users/dengr/Project1
rm -rf dist node_modules/.vite
npm install --prefer-offline 2>&1 | tail -15
echo "INSTALL EXIT: $?"
echo "=== check vite binary ==="
ls -la node_modules/.bin/vite 2>&1 || echo "NO VITE BIN"

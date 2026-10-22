#!/usr/bin/env bash
# Builds a standalone copy of the check-in for static hosting (GitHub Pages) into _site/.
#
# index.html is written for claude.ai Artifacts, which wrap it in a document skeleton at
# publish time. This script adds that skeleton itself and marks the page as standalone,
# which hides the feedback box (there is no shared database outside claude.ai yet).
set -euo pipefail
cd "$(dirname "$0")/.."

out=_site
rm -rf "$out"
mkdir -p "$out"

{
  printf '%s' '<!doctype html><html lang="en"><head><meta charset="utf-8">'
  printf '%s' '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  printf '%s' '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  printf '%s' 'body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>'
  printf '%s' '<script>document.documentElement.classList.add("standalone")</script>'
  printf '%s\n' '</head><body>'
  cat index.html
  printf '%s\n' '</body></html>'
} > "$out/index.html"

cp dashboard.js dashboard.css "$out/"
touch "$out/.nojekyll"
echo "Built $out/ ($(wc -c < "$out/index.html") bytes)"

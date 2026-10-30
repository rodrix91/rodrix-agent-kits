#!/usr/bin/env bash
# Deploy dist/ to the gh-pages branch (GitHub Pages "Deploy from branch").
# Used because the box's gh token lacks the `workflow` scope; once CI is enabled (see ci/), CI deploys instead.
set -euo pipefail
npm test
tmp=$(mktemp -d); cp -r dist/. "$tmp"; cd "$tmp"
git init -q -b gh-pages && git add -A && git -c user.name="Rodrix Agent Kits" -c user.email="rodrix91@users.noreply.github.com" commit -qm "deploy $(date -u +%FT%TZ)"
git push -f https://github.com/rodrix91/rodrix-agent-kits.git gh-pages
echo "Deployed → https://rodrix91.github.io/rodrix-agent-kits/"

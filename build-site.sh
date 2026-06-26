#!/usr/bin/env bash
# Monta o site servido pelo Worker crm-remax:
#   _site/                -> build do CRM (SPA na raiz)
#   _site/<slug>/         -> cada Landing Page, no caminho do seu slug
#
# Empreendimento novo = criar landing-pages/<slug>/ ; este script o inclui
# automaticamente (sem hardcode de slug aqui). account_id + slug viajam no
# tracking.config.js de cada LP, não no código.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> build do CRM"
( cd apps/crm && npm install && npm run build )

echo "==> montando _site/"
rm -rf _site
cp -r apps/crm/dist _site

echo "==> copiando landing pages (uma por slug)"
for dir in landing-pages/*/; do
  slug="$(basename "$dir")"
  cp -r "$dir" "_site/$slug"
  echo "    + /$slug"
done

echo "==> pronto: _site/"

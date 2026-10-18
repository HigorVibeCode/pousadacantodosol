#!/bin/bash
# Gera a prévia estática (modo demonstração) em $1 a partir do repositório
set -e
OUT=$1; cd "$(dirname "$0")/.."
PUBLIC_DEMO=1 PUBLIC_SITE_URL=https://pousadacantodosol.vercel.app npx astro build 2>&1 | grep -E "ERROR|Complete!"
rm -rf "$OUT" && cp -r .vercel/output/static "$OUT" && cd "$OUT"
rm -rf sitemap-*.xml robots.txt images/README.md a-pousada acomodacoes-em-prado-ba fotos o-que-fazer-em-prado-ba quartos
mv _astro assets
python3 - "$OUT" <<'PY'
import os, re, sys
root = sys.argv[1]; pages = set()
for dp, _, fs in os.walk(root):
    for f in fs:
        if f == 'index.html':
            rel = os.path.relpath(dp, root).replace(os.sep, '/'); pages.add('' if rel == '.' else rel)
for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith('.html'): continue
        path = os.path.join(dp, f); r = os.path.relpath(dp, root)
        prefix = '../' * (0 if r == '.' else r.count(os.sep) + 1)
        s = open(path, encoding='utf-8').read()
        def fix(m):
            attr, url = m.group(1), m.group(2)
            if url.startswith('//'): return m.group(0)
            frag = ''
            if '#' in url: url, frag = url.split('#', 1); frag = '#' + frag
            u = url.strip('/')
            new = prefix + ((u + '/' if u else '') + 'index.html' if u in pages else u)
            return f'{attr}="{new}{frag}"'
        s = re.sub(r'\b(href|src)="(/[^"]*)"', fix, s).replace('_astro/', 'assets/')
        open(path, 'w', encoding='utf-8').write(s)
PY
for f in assets/_*; do [ -e "$f" ] || continue; n="assets/$(basename "$f" | sed 's/^_//')"; mv "$f" "$n"; grep -rl "$(basename "$f")" . | xargs -r sed -i "s#$(basename "$f")#$(basename "$n")#g"; done
grep -rl '"/_astro\|"/assets' assets | head -3 || true
echo "prévia em $OUT"; find . -type f | wc -l

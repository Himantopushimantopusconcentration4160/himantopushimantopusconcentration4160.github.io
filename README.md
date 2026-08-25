# brendaong.com

Personal site — static HTML/CSS/JS, no build step, no dependencies.
Deployed via GitHub Pages to the custom domain in `CNAME`.

## Structure

```
index.html                  Homepage (all sections)
work/*.html                 Four project case studies
assets/css/style.css        Design system — all tokens at the top
assets/js/main.js           Progressive enhancement only; site works without JS
assets/img/                 Responsive photography (webp + jpg)
assets/img/work/            Figures copied from the research repos
assets/cv/                  Downloadable CVs, one per positioning lane
CNAME                       Custom domain
.nojekyll                   Serve files as-is
```

## Local preview

```bash
python3 -m http.server 8000
```

## Maintenance notes

**CV files.** `assets/cv/` currently holds interim copies of the most recent
tailored resumes. Replace with the generalised, de-company-ified versions,
keeping the same three filenames so no links break:

- `Brenda-Ong-CV-Trust-and-Safety.pdf`
- `Brenda-Ong-CV-Strategy-and-Operations.pdf`
- `Brenda-Ong-CV-Communications-and-Policy.pdf`

**Repo links.** Two case studies show a "Repo publishing soon" pill instead of a
link, because those repositories are not public yet:

- `work/ai-misuse-atlas.html` — no git remote configured yet
- `work/policy-to-eval-harness.html` — remote exists, repo still private

When each goes public, swap the `pill--soon` badge on `index.html` for
`pill--live`, and replace the closing callout on the case-study page with the
same `View repository` button pattern used in
`work/enforcement-ops-simulator.html`.

**Design tokens.** Colours, type scale and spacing all live in `:root` at the
top of `style.css`. The accent (`#B26136`) is sampled from the photography.

## Making edits

Edit files in this folder — it is the source of truth for the live site.

```bash
./preview.sh                 # local preview at localhost:8811, Ctrl-C to stop
./publish.sh "what changed"  # commit + push; live in ~30-60s
```

Text lives in `index.html` (homepage) and `work/*.html` (case studies), marked
with `<!-- ====== SECTION ====== -->` banners. Two rules: write `&amp;` not a
bare `&`, and leave `class="..."` attributes alone.

Do not edit files through the GitHub website as well as locally — the two copies
will diverge and the next `./publish.sh` will fail.

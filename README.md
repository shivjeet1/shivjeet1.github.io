# shivjeet1.tech

Personal engineering portfolio and blog for Shivam Lawale, built with
[Hugo](https://gohugo.io/) and deployed to GitHub Pages.

This is a plain Hugo project: no theme module, no git submodules, and no Node
build step. Markup is generated from `layouts/` at build time, and the single
stylesheet/script bundle is produced by Hugo Pipes.

## Stack

- **Hugo Extended** `0.167.0` (site generator)
- **Plain CSS and vanilla JavaScript** (no Sass, no npm dependencies for the build)
- **[three.js](https://threejs.org/)** on the home page only, for the laptop hero
- **GitHub Actions** + **GitHub Pages** for deployment

## Repository layout

```
archetypes/   front-matter templates used by `hugo new` (default.md, blogs.md)
assets/       files processed by Hugo Pipes (bundled, minified, fingerprinted)
  css/          base stylesheet, dark theme, and per-section stylesheets
  js/           main.js plus vendored feather-icons and svg-injector
  models/       untouched source .glb for the hero model (not published)
  resume/       last-known-good resume PDF used as a build fallback
content/      pages and posts (home, about, projects, blogs/*)
data/         structured content: projects.yml, skills.yml
i18n/         translation strings (en.toml)
layouts/      templates: index, _default, partials, shortcodes
scripts/      maintenance scripts (see below)
static/       copied verbatim: fonts, images, icons, models, resume, sw.js, CNAME
```

## Local development

Prerequisites: **Hugo Extended 0.167.0** and **Git**. No Node.js, npm, or Sass
is required to build the site.

```bash
hugo version          # confirm the extended 0.167.0 build
hugo server           # dev server on http://localhost:1313
hugo --minify         # production build into public/
```

## Docker

The Docker image pins the same toolchain as CI and needs no local dependencies.

Build the image:

```bash
docker build -t hugo-site .
```

Optional base-URL override (for serving from a sub-path):

```bash
docker build --build-arg BASE_URL=/ -t hugo-site .
```

Run the container:

```bash
docker run -p 1313:80 hugo-site
```

Then open <http://localhost:1313>.

## Hero model

The home page renders `static/models/laptop_dell.glb` with three.js
(`static/js/hero-laptop.js`). It is loaded lazily and degrades gracefully: no
script runs under `prefers-reduced-motion`, on small screens, or when WebGL is
unavailable, and `static/models/leptop.glb` is used as a fallback.

The Dell export ships with specular/glossiness materials, which three.js no
longer reads, so it is converted offline and committed pre-optimised. To
regenerate it from the source:

```bash
bash scripts/optimize-model.sh
```

The script works from `assets/models/laptop_dell.source.glb` and writes
`static/models/laptop_dell.glb`. Its `npm`/`npx` requirements are intentionally
kept out of the site build.

## Caching

`static/sw.js` caches two things: the versioned three.js modules from unpkg,
cache-first, since the URL pins the version and the response is immutable; and
same-origin files under `/images/` and `/models/`, stale-while-revalidate, so a
repeat visit is served from the device while a background request refreshes the
copy. Nothing is pre-fetched: an asset is cached the first time a page asks for
it. HTML, CSS and the JS bundle stay with the browser's HTTP cache, because the
stylesheets are not fingerprinted and a stale one could pair with a fresh page.

Registration lives in `assets/js/main.js` and is skipped without service worker
support, outside a secure context, on `localhost` (so a local preview cannot
answer from the previous build's cache), or under `saveData`. If registration or
caching fails, the site behaves exactly as before.

Bump `VERSION` at the top of `static/sw.js` to invalidate everything: image and
model filenames are not fingerprinted, so a changed file keeps its name. GitHub
Pages caches `sw.js` for ten minutes, so a bump reaches returning visitors shortly
after; registration passes `updateViaCache: 'none'` so the browser revalidates
the worker script itself. To remove caching, delete `static/sw.js` and the
`registerServiceWorker` call. To exercise the worker locally, serve `public/` from
a non-local HTTPS host and check the Application panel in devtools.

## Resume

`scripts/fetch-resume.sh` compiles the public Overleaf read-only project and
writes `static/resume/Shivam-Lawale.pdf`, which the site serves at
`/resume/Shivam-Lawale.pdf`. If Overleaf is unreachable it copies the committed
fallback from `assets/resume/Shivam-Lawale.pdf`, so a transient outage cannot
break a deploy. The GitHub Actions workflow runs this script before building.

## Deployment

`.github/workflows/hugo.yml` builds the site with Hugo `0.167.0` on every push
to `master` and publishes `public/` to GitHub Pages. The production build is a
plain `hugo --minify`; the same command works locally.

## License

MIT. See [LICENSE](LICENSE), which records the full upstream copyright chain.

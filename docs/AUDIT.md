# Audit Report — shivjeet1.github.io

**Date:** 2026-10-11  
**Auditor:** OpenCode Agent  
**Hugo version (local):** v0.167.0+extended  
**Hugo version (Dockerfile/CI):** v0.128.0  
**Hugo version (last build artifact):** v0.165.0  

---

## 1. Template Tree and What Each File Renders

```
layouts/
├── index.html                  # Home page: hero → about → projects → blogs → resume CTA
├── 404.html                    # Styled 404 with random ASCII emoji
├── _default/
│   ├── baseof.html             # HTML shell: <head>, header, <main>, footer
│   ├── single.html             # Single content page (post → post.html + toc, page → page.html + toc)
│   ├── list.html               # Section list page (e.g., /blogs/) — groups posts by year "2026" only
│   └── terms.html              # Tags listing page
├── partials/
│   ├── head.html               # <head>: meta, SEO, OG, Twitter, CSS, JS bundle, custom head HTML
│   ├── header.html             # Sticky header: avatar, nav links, theme toggle, hamburger menu
│   ├── footer.html             # Social icons, copyright, author link
│   ├── home-intro.html         # Home page intro section (from _index.md content)
│   ├── home-projects.html      # Home "Top Projects" section (3 cards from content/pages or data/projects.yml)
│   ├── home-blogs.html         # Home "Recent Blogs" section (3 cards from content/pages or data/blogs.yml)
│   ├── list.html               # Blog list: groups by year "2026" (BUG: only shows 2026 posts)
│   ├── list-posts.html         # Single blog post item in list (title + date)
│   ├── post.html               # Blog post single: title, date, tags, content, prev/next nav
│   ├── page.html               # Generic page: title + content
│   ├── prev-next.html          # Previous/Next post navigation
│   ├── back-to-top.html        # Back-to-top button (fixed, bottom-right)
│   └── toc.html                # Table of contents (aside, fixed position)
└── shortcodes/
    ├── development.html        # Project card with client-side GitHub commit count fetch
    ├── skills.html             # Skills grid from data/skills.yml
    ├── project.html            # Project cards (content pages or data file)
    ├── project_list.html       # Project list with client-side GitHub commit count fetch
    ├── intextimg.html          # Inline image with custom height
    └── br.html                 # Line break
```

---

## 2. Where "Commits: ..." Comes From

**Source:** `layouts/shortcodes/development.html` (line 65) and `layouts/shortcodes/project_list.html` (lines 13-14).

**Mechanism:** Both shortcodes render a placeholder (`Commits: ...` or `Loading...`) and then use **client-side JavaScript** to fetch the commit count from the GitHub REST API:

```javascript
fetch(`https://api.github.com/repos/${repoPath}/commits?per_page=1`)
  .then(res => {
    const linkHeader = res.headers.get('Link');
    // parse last page number from Link header
  });
```

**Why it's broken:**
- GitHub API has a rate limit of 60 requests/hour per IP for unauthenticated requests
- Multiple project cards = multiple API calls = rapid rate limiting
- CORS may block requests in some browsers
- Shows `Commits: ...` or `Commits: N/A` when rate-limited or failed
- No build-time fallback

**Recommendation:** Remove commit counts entirely. If desired, fetch at build time via GitHub Actions and write to `data/github_stats.json`.

---

## 3. Why Blog Cards Show "Home" Label

**Investigation result:** The `home-blogs.html` partial uses `.Title` for card titles, which should render the blog post title (e.g., "Desktop Apps with Tauri + Rust"). The blog posts all have proper `title:` front matter.

**Possible cause:** The `where .Site.RegularPages "Section" "blogs"` query may be including the `_index.md` branch page (which has `title: "Blogs"`) or the home page itself in some edge cases. Alternatively, this may be a CSS/styling issue where a parent label is visually appearing on the cards.

**Status:** Needs further investigation in Phase 1. The template code appears correct; may be a rendering artifact or a content edge case.

---

## 4. Why Theme Control Repeats in Mobile Menu

**Source:** `layouts/partials/header.html`

- **Lines 26-30:** Theme toggle in the main nav (visible on desktop)
- **Lines 48-53:** Theme toggle repeated inside the hamburger menu (visible on mobile)

Additionally, `assets/css/pureblack.css` (line 52) hides the desktop toggle:
```css
.header .dark-theme-toggle { display: none !important; }
```

This means:
- On desktop: the toggle is hidden by CSS but still in the DOM
- On mobile: the toggle appears inside the hamburger menu
- Both toggles are wired to the same JS event listener

**Result:** Duplicate toggle controls in the DOM, confusing for screen readers and keyboard navigation.

---

## 5. How Content Is Stored

| Content Type | Storage Location | Rendered By |
|-------------|-----------------|-------------|
| **Projects** | `data/projects.yml` (YAML data) + `content/projects.md` (shortcodes) | `layouts/_default/list.html` → falls back to data file; `layouts/partials/home-projects.html` → same fallback |
| **Experience** | `content/about.md` (hardcoded markdown) | `layouts/index.html` → `{{ .Content }}` |
| **Skills** | `data/skills.yml` (YAML data) | `layouts/shortcodes/skills.html` |
| **Certifications** | `content/about.md` (hardcoded markdown) | `layouts/index.html` |
| **Leadership** | `content/about.md` (hardcoded markdown) | `layouts/index.html` |
| **Education** | `content/about.md` (hardcoded markdown) | `layouts/index.html` |
| **Blog posts** | `content/blogs/blog1-18.md` (markdown) | `layouts/_default/single.html` → `post.html` |
| **Blog list** | `content/blogs/_index.md` + auto-generated | `layouts/_default/list.html` |
| **Social links** | `hugo.toml` `[params] socialIcons` | `layouts/partials/footer.html` |
| **Nav menu** | `hugo.toml` `[menu]` | `layouts/partials/header.html` |

**Key insight:** Projects are stored in BOTH `data/projects.yml` and `content/projects.md` (as shortcodes). The `list.html` template first checks for content pages in `content/projects/` (none exist), then falls back to `data/projects.yml`. The `content/projects.md` file is rendered on the home page via `{{ .Content }}` and uses the `development` shortcode.

---

## 6. JS Files and Sizes

| File | Size (bytes) | Size (KB) | Minified |
|------|-------------|-----------|----------|
| `assets/js/feather-icons.min.js` | 76,047 | 74.3 KB | Yes |
| `assets/js/main.js` | 5,332 | 5.2 KB | No |
| `assets/js/svg-injector.min.js` | 4,579 | 4.5 KB | Yes |
| **Total** | **85,958** | **84.0 KB** | |

**Note:** All JS is concatenated into a single bundle via Hugo pipes (`resources.Concat "js/bundle.js"`) and fingerprinted. Total gzipped size will be significantly smaller (~25-30 KB estimated).

---

## 7. CSS Files and Sizes

| File | Size (bytes) | Size (KB) | Minified |
|------|-------------|-----------|----------|
| `assets/css/main.css` | 11,269 | 11.0 KB | No |
| `assets/css/dark.css` | 2,361 | 2.3 KB | No |
| `assets/css/navbar.css` | 216 | 0.2 KB | No |
| `assets/css/pureblack.css` | 4,008 | 3.9 KB | No |
| `assets/css/math.css` | 1,091 | 1.1 KB | No |
| `assets/css/skills.css` | 3,359 | 3.3 KB | No |
| `assets/css/normalize.min.css` | 1,785 | 1.7 KB | Yes |
| **Total** | **24,089** | **23.5 KB** | |

**Note:** All CSS is minified via Hugo pipes (`| minify`). Total gzipped size will be significantly smaller (~5-7 KB estimated).

**Additional CSS inlined in templates:**
- `layouts/shortcodes/development.html` — 58 lines of `<style>` block
- `layouts/shortcodes/project_list.html` — 11 lines of `<style>` block
- `layouts/shortcodes/intextimg.html` — 5 lines of `<style>` block
- `layouts/partials/back-to-top.html` — 68 lines of `<style>` block

**Total inline CSS:** ~142 lines across 4 files.

---

## 8. Hugo Deprecation Warnings

**Unable to run `hugo --gc --minify`** during Phase 0 (read-only audit). 

**Observations:**
- Local Hugo version: v0.167.0 (newer than Dockerfile/CI's v0.128.0)
- Last build artifact was generated with Hugo v0.165.0
- Version mismatch between local, CI, and last build may cause inconsistencies

**Potential deprecations to check in Phase 1:**
- `hugo.toml` uses TOML format (correct for v0.128.0)
- `.Site.Params` access patterns (should be fine)
- `resources.Get`, `resources.Concat`, `resources.Fingerprint` (stable APIs)
- `i18n` function usage (stable)
- No `.Scratch` deprecations visible

---

## 9. Confirmed Issues (from Plan Section 1)

| # | Issue | Confirmed? | Notes |
|---|-------|-----------|-------|
| 1 | `Commits: ...` placeholder on project cards | **YES** | Client-side GitHub API fetch, rate-limited |
| 2 | Project cards plain (no screenshot, chips, status) | **YES** | Only title, date, summary, link |
| 3 | Blog cards prefixed with "Home" | **UNCLEAR** | Template code looks correct; needs investigation |
| 4 | Mobile menu repeats theme control | **YES** | Duplicate `.dark-theme-toggle` in header.html |
| 5 | Name spelling inconsistency | **RESOLVED** | All "Lavhale" → "Lawale" (completed) |
| 6 | SEO/meta titles weak | **YES** | `<title>` is just "Home", "Projects", etc. |
| 7 | Mixed positioning message | **YES** | Alt text: "QA & Systems Engineer", meta: SDET/QA, hero: DevOps/Systems |
| 8 | Skills as flat h4 tags, no depth signal | **YES** | Each skill is an `<h4>` inside `.skill-card` |
| 9 | Home page long scroll, projects far down | **YES** | Order: hero → about → projects → blogs |
| 10 | Contact only footer icons, no email text | **YES** | No visible email, no "open to work" status |
| 11 | CV on third-party host (s-ul.eu) | **YES** | `resumeURL = "https://shivjeet1.s-ul.eu/NhiM9pPs"` |
| 12 | Blog slugs are blog16, blog17, blog18 | **YES** | No `slug` in front matter; filenames are blog1-18 |
| 13 | Projects page no filtering, GDG Leaderboard missing from home | **PARTIAL** | No filtering exists; GDG Leaderboard is in `projects.md` but not in `data/projects.yml` |

---

## 10. Additional Issues Found

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| A | Blog list only shows 2026 posts | **High** | `list.html` uses `GroupByDate "2026"` — posts from 2020-2025 are invisible on `/blogs/` |
| B | Version mismatch (local v0.167.0 vs CI v0.128.0) | **Medium** | May cause build inconsistencies |
| C | Inline `<style>` blocks in 4 template files | **Medium** | ~142 lines of CSS not minified or cached |
| D | `pureblack.css` hides desktop theme toggle | **Medium** | Toggle is in DOM but invisible; only mobile toggle works |
| E | No `slug` in blog front matter | **Medium** | URLs are `/blogs/blog1/` instead of `/blogs/unlocking-bootloader/` |
| F | No `aliases` for old blog URLs | **Low** | If slugs change, old URLs will 404 |
| G | `home-blogs.html` fallback references `data/blogs.yml` | **Low** | File doesn't exist; fallback is dead code |
| H | No structured data (JSON-LD) | **Medium** | Missing Person, BlogPosting, BreadcrumbList schemas |
| I | No favicon | **Low** | No SVG/PNG favicon set |
| J | No RSS link in `<head>` | **Low** | Hugo generates RSS but no `<link rel="alternate">` |
| K | Skills use `<h4>` for individual skill names | **Medium** | Heading semantics abused; should be `<span>` or `<p>` |
| L | No `prefers-reduced-motion` handling | **Medium** | CSS transitions/animations not disabled for reduced motion |
| M | No skip-to-content link | **Medium** | Accessibility issue for keyboard users |
| N | No print stylesheet | **Low** | Page doesn't print cleanly |
| O | `math.css` loads KaTeX from CDN | **Low** | External dependency; may slow page load |

---

## 11. Risks for Redesign

1. **Template complexity:** The project has a custom theme (not a Hugo theme module). Changes to layouts require understanding the full template tree.
2. **Data file dependency:** Projects are in `data/projects.yml` but also referenced via shortcodes in `content/projects.md`. Migration to a new schema must handle both.
3. **Client-side JS:** The commit count fetch is embedded in shortcodes. Removing it requires editing the shortcode files.
4. **CSS fragmentation:** CSS is split across 7 files plus 4 inline `<style>` blocks. A design system refactor must consolidate these.
5. **Blog list bug:** The `GroupByDate "2026"` bug means most blog posts are currently invisible on `/blogs/`. This should be fixed before any blog UX work.
6. **Version mismatch:** Local Hugo (v0.167.0) is newer than CI (v0.128.0). Testing locally may not reflect CI behavior.
7. **No automated tests:** No link checker, no HTML validation, no accessibility tests exist. Changes must be manually verified.
8. **Content coupling:** Experience, certifications, leadership, and education are hardcoded in `content/about.md`. Making these data-driven requires content migration.

---

## 12. Recommendations

### Immediate (Phase 1)
1. Remove `Commits: ...` placeholder from `development.html` and `project_list.html` shortcodes
2. Fix `list.html` to show all blog posts (not just 2026)
3. Deduplicate theme toggle in `header.html`
4. Add `slug` to blog front matter + `aliases` for old URLs
5. Move resume to `static/resume/` (local file)

### Short-term (Phases 2-3)
6. Restructure home page: Hero → Featured Projects → Experience → Skills → Writing → Education → Contact
7. Create `data/projects.yaml` with structured schema
8. Add visible email + contact section
9. Fix SEO titles and meta descriptions

### Medium-term (Phases 4-7)
10. Consolidate CSS into design tokens + components
11. Add JSON-LD structured data
12. Improve blog UX (TOC, code highlighting, related posts)
13. Add favicon, RSS link, print stylesheet

---

*End of audit.*

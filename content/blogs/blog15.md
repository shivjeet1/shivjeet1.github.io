---
title: "Blog Doesn't Need React: The SSG & Markdown Supremacy"
date: 2025-11-05
tags: ["Web Dev", "Hugo", "Markdown", "Neovim", "Anti-Bloat"]
description: "Why deploying a React app to serve static text is a crime against hardware, and how to use Hugo instead."
summary: "Ditching JavaScript frameworks for a pure Markdown to HTML pipeline using Hugo and automated CI/CD."
ShowPostNavLinks: true
weight: 85
type: post
image: "/images/blogs/ssg.jpg"
showTableOfContents: true
draft: false

---

## Introduction

Modern web development has lost its mind. 

If you want to publish a simple article containing three paragraphs of text and an image, the industry standard is to drag in a JavaScript framework, set up a virtual DOM, download 400MB of `node_modules`, and force the user's browser to execute client-side routing just to render a `<p>` tag.

Now comes the real part:
**Serving raw, static HTML generated directly from your terminal, with zero JavaScript.**

This blog explains how to use **Hugo** (a Static Site Generator written in Go) to turn plain Markdown files into a blazing-fast website. You write in Neovim, you push to Git, and a server does the rest.

![Static Site Generator Setup](/images/blogs/ssg.jpg "Static Site Generator")

---

## Credits (Important)

Before anything else:

- **[The Hugo Team](https://gohugo.io/)** – for building a compiler that generates thousands of pages in milliseconds.
- **[John Gruber](https://daringfireball.net/projects/markdown/)** – for inventing Markdown so we never have to type HTML brackets manually again.

Without these tools, we would be stuck waiting for Webpack to compile our spelling errors.

---

## What This Setup Achieves

By moving to an SSG pipeline, we get:

- Zero JavaScript by default.
- Pure HTML/CSS that loads instantly on any connection.
- A 100% terminal-based writing workflow (Neovim + Markdown).
- A pure black, high-contrast AMOLED aesthetic.
- Git-triggered automated deployments (CI/CD).

Minimal complexity, maximum durability.

---

## Prerequisites

- Arch Linux (or any environment with a terminal)
- Neovim
- Git
- Hugo (The extended version)

Grab the engine:

```bash
sudo pacman -S hugo git
```

---

## Step 1: Scaffold the Engine

Do not use a heavy starter template. Build it raw.

```bash
hugo new site minimal-blog
cd minimal-blog
git init
```

---

## Step 2: The Anti-Theme (Pure Black CSS)

Most Hugo themes are just as bloated as React templates. We are bypassing them entirely by dropping a single, highly optimized CSS file into the static folder.

Create `static/style.css`:

```css
:root {
  --bg: #000000;
  --text: #e0e0e0;
  --accent: #ff4500;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: monospace;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
```

Create a dead-simple layout in `layouts/_default/single.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ .Title }}</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <header><h1>{{ .Title }}</h1></header>
    <main>
        {{ .Content }}
    </main>
</body>
</html>
```

---

## Step 3: The Content Pipeline

This is where the terminal workflow shines. No CMS, no web dashboards.

```bash
hugo new posts/hello-world.md
```

Open it in Neovim (`nvim content/posts/hello-world.md`):

```markdown
---
title: "Hello World"
date: 2026-08-05T12:00:00Z
draft: false
---

This page contains zero JavaScript. It rendered in 2 milliseconds. 
My battery life is safe.
```

Test it locally:

```bash
hugo server -D
```

Open `localhost:1313`. It is instantly fast and pure black.

---

## Step 4: The Lazy Deployment (CI/CD)

You should never have to manually upload HTML files to a server.

Connect your repository to **Cloudflare Pages** or **GitHub Pages**.
Tell the platform that your build command is `hugo` and your output directory is `public`.

From now on, your entire publishing workflow is just:

```bash
git add .
git commit -m "wrote a new post"
git push
```

The CI/CD pipeline catches the push, compiles the Go binary, generates the static HTML, and deploys it to a global CDN in under 10 seconds.

---

## Common Issues

* **Blank Screen:** You forgot to set `draft: false` in your Markdown frontmatter.
* **CSS Not Loading:** Check your file paths in the layout. Static files live at the root `/` during build.

---

## Conclusion

Text belongs in HTML documents.

By stripping away the modern layers of JavaScript abstraction, you are left with a website that will still load and function perfectly 20 years from now.

---

## Personal Opinion

> I am an engineer, not a content manager.
> This exists so I can open a terminal, dump my thoughts into a markdown file, and push to a repository without thinking about database migrations or frontend state management.
> It is just text on a screen — and that is enough.

---








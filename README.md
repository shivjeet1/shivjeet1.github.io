# Portfolio Website

This is my personal portfolio built with **Hugo (Extended)** and deployed via **GitHub Pages**.  
The site can be built **locally** or **using Docker**, matching the same toolchain used in CI.

---

## Prerequisites (Local Build)

To build the site **without Docker**, you need:

- **Hugo Extended** `v0.128.0`
- **Dart Sass** (required for SCSS processing)
- **Git**

Verify installation:

```bash
hugo version
sass --version
```

Build locally:

```bash
hugo --minify
```

Serve locally:

```bash
hugo server
```

---

## Docker Build (Recommended)

Docker uses the same build logic as the GitHub Actions workflow and requires **no local dependencies**.

### Build the image

```bash
docker build -t hugo-site .
```

(Optional base URL override)

```bash
docker build --build-arg BASE_URL=/ -t hugo-site .
```

### Run the container

```bash
docker run -p 1313:80 hugo-site
```

Open in browser:

```
http://localhost:1313
```

---

## Notes

- The Docker image is **Alpine-based** and intentionally minimal
- No Node.js or npm is used
- The `public/` directory is generated during the build
- GitHub Pages deployment is handled separately via GitHub Actions

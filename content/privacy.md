---
author : 'Shivam Lawale'
title : 'Privacy'
showBackToTopButton : true
type : page
---

This is a personal website. It has no analytics, no advertising, no tracking pixels and no cookies.

## What is stored on your device

Your light or dark theme choice is kept in your browser's `localStorage` under the key `theme-preference`. It is read back to render the theme you picked and is never sent anywhere.

The site also registers a service worker, defined in `sw.js` in the site source. After a page loads, that worker keeps its own copy of the files the page already downloaded: the three.js library, the images and 3D models, and nothing else. On a repeat visit those files are served from your device instead of the network, and a background request refreshes the copy for next time. The cache lives in your browser's Cache Storage, is never sent anywhere, and is erased when you clear site data for this site.

## Third-party requests

Pages are served by GitHub Pages. Two external services are contacted while a page loads:

- The home page loads the three.js library from `unpkg.com` to draw the laptop animation.
- The skills list loads icon styles from `cdn.jsdelivr.net`.

As with any request to a third-party server, those providers can see your IP address and browser user agent. No other external requests are made.

## Contact

Questions about this page can be sent to [shivamlawale2005@gmail.com](mailto:shivamlawale2005@gmail.com).

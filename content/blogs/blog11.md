---
title: "Arch Linux Post-Installation Setup (My Lazy Setup)"
date: 2023-09-18
tags: ["Linux", "Arch Linux", "Post Install", "DWM", "Dotfiles"]
description: "A practical Arch Linux post-installation setup using automated scripts, dotfiles, and suckless tools."
summary: "How I set up my Arch Linux system after installation using scripts, dotfiles, and a minimal DWM workflow."
ShowPostNavLinks: true
weight: 89
type: post
image: "/images/blogs/setup.jpg"
showTableOfContents: true
draft: false

---

## Introduction

So you survived the **[Arch Linux manual installation](../blog10)**.  
System boots, terminal works, internet is alive — good enough.

Now comes the real part:
**Making Arch usable without wasting your entire weekend.**

I already maintain my own dotfiles, and a friend of mine — **[BackToVedas](https://github.com/backtovedas/)** — has automated most of the boring post-install stuff using a bash script.

This blog explains **post-installation setup**, his script, that installs my dotfiles & other setups with minimal effort and maximum laziness.

![Arch Linux Post Installation Setup](/images/blogs/setup.jpg "Arch Linux Post Installation Setup")

---

## Credits (Important)

Before anything else:

- **[backtovedas](https://github.com/backtovedas)** – for the automated post-installation setup script  
  Repo: https://github.com/backtovedas/post-installation-setup/
- **[0xguava](https://github.com/0xguava)** – for the `st` (simple terminal) fork used in this setup

Without these two, this setup would take much more manual effort.

---

## What This Setup Installs

Using the automated script + my dotfiles, we get:

- DWM (suckless window manager)
- slstatus (status bar for DWM)
- st (simple terminal – forked by 0xguava)
- Basic development tools
- Audio, fonts, networking essentials
- A usable desktop without bloated DEs

Minimal, fast, and keyboard-driven.

---

## Prerequisites

- Fresh Arch Linux install
- Working internet
- Non-root user with sudo access
- Basic patience

---

## Step 1: Clone the Post-Installation Script

```bash
git clone https://github.com/backtovedas/post-installation-setup.git
cd post-installation-setup
```

Take a quick look at the script before running it.

---

## Step 2: Run the Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This handles:
- Package installation
- Building DWM, slstatus, and st
- Xorg, fonts, audio setup

Coffee break recommended. Might take a while.

---

## Step 3: Reboot

```bash
reboot
```

If it boots, congratulations.

Tweak as needed.

---

## About st (Simple Terminal)

Uses a fork by **[0xguava](https://github.com/0xguava)**:
- Better defaults
- Extra patches
- Still minimal

Fits perfectly with DWM.

---

## Common Issues

- Black screen → check `.xinitrc`
- Broken keybinds → rebuild DWM

Fixing is part of Arch life.

---

## Conclusion

Thanks to **BackToVedas** and **[0xguava](https://github.com/0xguava)**, setting up Arch after install doesn’t have to be painful.

Minimal setup, maximum control.

---

## Personal Opinion

> I don’t enjoy redoing setups.
>
> This exists so I can install Arch, run one script, apply dotfiles, and move on.
>
> Not perfect, but it works — and that’s enough.

---

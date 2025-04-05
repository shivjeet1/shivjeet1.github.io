---
title: "Building a 10MB Linux OS: Kernel + BusyBox + QEMU"
date: 2026-05-31
tags: ["Linux", "Kernel", "QEMU", "BusyBox", "Minimalism"]
description: "How to compile a custom x86_64 kernel and minimal initramfs without losing your sanity."
summary: "Ditching full desktop distributions to build a bootable Linux OS from scratch that fits in 10MB, run safely inside QEMU."
ShowPostNavLinks: true
weight: 83
type: post
image: "/images/blogs/kernel.jpg"
showTableOfContents: true
draft: false

---

## Introduction

Modern operating systems are disasters of storage. An Ubuntu ISO is over 4GB. Windows 11 requires 64GB of disk space just to boot and show you advertisements. 

This is ridiculous. The Linux kernel itself can comfortably run in a few megabytes.

Now comes the real part:
**Compiling a barebones x86_64 kernel, packaging a minimal userland, and booting it instantly without bricking your actual hardware.**

This blog explains how to use the Linux source tree, **BusyBox**, and **QEMU**. We are going to strip out the bloat, compile a static filesystem, and boot an entire OS in under 10 megabytes. 

![Minimal Kernel Compilation Setup](/images/blogs/minimal-kernel.jpg "Minimal Kernel Compilation Setup")

---

## Credits (Important)

Before anything else:

- **[Linus Torvalds & Kernel Devs](https://kernel.org/)** – for maintaining the core of the internet.
- **[The BusyBox Team](https://busybox.net/)** – for cramming hundreds of UNIX utilities into a single binary.
- **[QEMU](https://www.qemu.org/)** – for letting us test operating systems without constantly rebooting our machines.

---

## What This Setup Achieves

By building this from scratch, we get:

- A bootable x86_64 Linux OS in under 10MB.
- Sub-second boot times.
- Zero background services, zero telemetry, zero GUI.
- A contained QEMU environment (safe to break).
- Absolute control over the system architecture.

Minimal, educational, and incredibly fast.

---

## Prerequisites

- Arch Linux (or any Linux host environment)
- Standard build tools (`sudo pacman -S base-devel cpio`)
- QEMU (`sudo pacman -S qemu-full`)
- Patience for C compilation times

Create a working directory before you start downloading source code:

```bash
mkdir ~/minimal-os
cd ~/minimal-os
```

---

## Step 1: Compiling the Kernel

Do not configure a kernel for every piece of hardware on earth. We only need it to run in a virtual machine.

Download the latest stable kernel from kernel.org and extract it:

```bash
wget https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-6.1.tar.xz
tar -xf linux-6.18.20.tar.xz
cd linux-6.18.20

```

Generate a minimal configuration tailored for KVM/QEMU, then compile it. This strips out drivers for webcams, bluetooth, and other things a VM does not need.

```bash
make defconfig
make kvm_config
make -j$(nproc)
```

When it finishes, grab the compiled kernel image:

```bash
cp arch/x86/boot/bzImage ~/minimal-os/
cd ~/minimal-os
```

---

## Step 2: The Userland (BusyBox)

The kernel is useless without programs to run. BusyBox combines core utilities (ls, grep, awk, sh) into one binary.

Download and extract BusyBox:

```bash
wget [https://busybox.net/downloads/busybox-1.36.1.tar.bz2](https://busybox.net/downloads/busybox-1.36.1.tar.bz2)
tar -xf busybox-1.36.1.tar.bz2
cd busybox-1.36.1
```

We must compile BusyBox statically. If we do not, it will look for shared C libraries (like glibc) that we are not going to provide.

```bash
make defconfig
```

Open the menu configuration:

```bash
make menuconfig
```

Navigate to `Settings` -> Check `Build static binary (no shared libs)`. Save and exit.

Compile and install it into a temporary directory:

```bash
make -j$(nproc)
make CONFIG_PREFIX=../initramfs install
cd ..

```

---

## Step 3: The Initramfs

The initramfs (Initial RAM Filesystem) is the root filesystem the kernel mounts into memory during boot.

Navigate to the folder where BusyBox was installed:

```bash
cd initramfs
```

Create the missing UNIX directory structure:

```bash
mkdir -p bin sbin etc proc sys usr/bin usr/sbin
```

Now, write the `init` script. This is the absolute first process (PID 1) that runs when the kernel finishes loading.

Create `init` and add this code:

```bash
#!/bin/sh

mount -t proc none /proc
mount -t sysfs none /sys

# Welcome message
echo "======================================"
echo " Welcome to the Minimal 10MB OS "
echo "======================================"

exec /bin/sh
```

Make the script executable:

```bash
chmod +x init
```

Package the directory into a compressed `cpio` archive:

```bash
find . -print0 | cpio --null -ov --format=newc | gzip -9 > ../initramfs.cpio.gz
cd ..
```

---

## Step 4: Booting the OS

You now have two files in your `~/minimal-os` folder:

1. `bzImage` (The Kernel)
2. `initramfs.cpio.gz` (The Filesystem)

Boot them using QEMU. We will use the `-nographic` flag to keep it strictly in the terminal.

```bash
qemu-system-x86_64 \
    -kernel bzImage \
    -initrd initramfs.cpio.gz \
    -nographic \
    -append "console=ttyS0"
```

The screen will flood with kernel logs for a fraction of a second, and then drop you directly into a root shell.

To exit QEMU from the terminal, press `Ctrl+A`, let go, and press `X`.

---

## Common Issues

* **Kernel Panic (VFS: Unable to mount root fs):** You probably forgot to make the `init` script executable, or BusyBox was not compiled statically.
* **No Keyboard Input in QEMU:** Ensure you passed the `-append "console=ttyS0"` argument so the kernel knows to route input/output to the terminal console.

Fixing these errors is the best way to understand how Linux actually works.

---

## Conclusion

Building a baseline OS demystifies the magic of operating systems.

There is no registry, no hidden telemetry processes, and no bloatware. Just a bootloader, a kernel, a memory filesystem, and a shell.

---

## Personal Opinion

> I get tired of fighting with massive systemd configurations and dependency hell.
> This exists so I can remind myself that an operating system is just a piece of software that manages hardware and runs processes. Nothing more.
> It takes 10 minutes to build, boots instantly, and teaches you more about Linux than years of using desktop environments.

---





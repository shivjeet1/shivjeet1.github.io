---
title: "Installing Arch Linux Manually"
date: 2023-08-12
tags: ["Linux", "Arch Linux", "Installation", "Manual Install", "ArchWiki"]
description: "A step-by-step guide to installing Arch Linux manually, following ArchWiki principles, without shortcuts."
summary: "Learn how to install Arch Linux manually, the proper ArchWiki way, with explanations that actually make sense."
ShowPostNavLinks: true
weight: 90
type: post
image: "/images/blogs/arch-linux-install.jpg"
showTableOfContents: true
draft: false

---

## Introduction

If you’re here, you probably already know one thing:

**Arch Linux is not hard - it’s just very honest.**

This blog walks through a **manual Arch Linux installation**, following the **ArchWiki approach**, but explained in a slightly relaxed, no-pressure way.

No installers.  
No scripts doing magic in background.  
Just you, the terminal, and some patience.

![Arch Linux Installation](/images/blogs/arch-linux-install.jpg "Installing Arch Linux manually")

---

## What You Should Know Before Starting

Arch Linux assumes:
- You are okay with terminal usage
- You understand disks can be wiped (completely)
- You are willing to read errors instead of panicking

First install almost always goes wrong somewhere. Normal hai.

---

## Requirements

- PC or laptop (UEFI preferred)
- Latest Arch Linux ISO
- Bootable USB (Ventoy / Rufus / dd)
- Stable internet
- At least 20–30 GB free disk space

Take time. Arch install is not a race.

---

## Step 1: Boot Into Arch ISO

Boot from USB and you’ll land in a root shell.

Check boot mode:

```bash
ls /sys/firmware/efi/efivars
```

If it exists → UEFI  
If not → Legacy BIOS

---

## Step 2: Keyboard & Internet

(Optional) Set keyboard:

```bash
loadkeys us
```

Check internet:

```bash
ping -c 3 archlinux.org
```

If ping fails, stop here and fix network first.

---

## Step 3: Disk Partitioning

⚠️ **This will erase data.**

List disks:

```bash
lsblk
```

Use `cfdisk` (recommended):

```bash
cfdisk /dev/nvme0n1
```

Example layout (UEFI):
- EFI System Partition (512M)
- Root partition (rest)

Don’t rush this step.

---

## Step 4: Format & Mount

Format:

```bash
mkfs.fat -F32 /dev/nvme0n1p1
mkfs.ext4 /dev/nvme0n1p2
```

Mount root:

```bash
mount /dev/nvme0n1p2 /mnt
```

Mount EFI:

```bash
mkdir -p /mnt/boot
mount /dev/nvme0n1p1 /mnt/boot
```

---

## Step 5: Install Base System

Install core packages:

```bash
pacstrap /mnt base linux linux-firmware vim networkmanager
```

Let it finish. Arch mirrors test your patience.

---

## Step 6: Generate fstab

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

Verify:

```bash
cat /mnt/etc/fstab
```

If mounts look correct, continue.

---

## Step 7: Chroot

```bash
arch-chroot /mnt
```

Now you’re inside your new system.

---

## Step 8: Timezone & Locale

Timezone:

```bash
ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime
hwclock --systohc
```

Locale:

```bash
vim /etc/locale.gen
```

Uncomment:
```
en_US.UTF-8 UTF-8
```

Generate:

```bash
locale-gen
```

Set language:

```bash
echo "LANG=en_US.UTF-8" > /etc/locale.conf
```

---

## Step 9: Network & Hostname

Enable network:

```bash
systemctl enable NetworkManager
```

Set hostname:

```bash
echo archlinux > /etc/hostname
```

---

## Step 10: Root Password

```bash
passwd
```

Pick something memorable.

---

## Step 11: Bootloader (GRUB)

Install packages:

```bash
pacman -S grub efibootmgr
```

Install GRUB:

```bash
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB
```

Generate config:

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

---

## Step 12: User & Sudo

Create user:

```bash
useradd -m -G wheel user
passwd user
```

Enable sudo:

```bash
EDITOR=vim visudo
```

Uncomment:
```
%wheel ALL=(ALL) ALL
```

---

## Step 13: Finish Installation

Exit chroot:

```bash
exit
```

Unmount:

```bash
umount -R /mnt
```

Reboot:

```bash
reboot
```

Remove USB.  
If it boots — congratulations.

---

## What You Have Now

- Minimal Arch Linux
- No desktop
- No bloat
- Full control

Everything else is your choice.

---

## Common Mistakes

- Wrong disk selection
- EFI not mounted
- Forgot NetworkManager
- Locale not generated

Happens to everyone.

---

## Conclusion

Installing Arch Linux manually teaches you how Linux actually works.

Slow? Yes.  
Worth it? Also yes.

---

## Personal Opinion

> Arch install looks scary until you do it once.
>
> After that, it’s just steps and logic.
> You break it, you fix it — that’s the learning.
>
> If you want full control, Arch is worth the effort.

---


---
author: "Shivam Lavhale"
title: "Rooting Redmi Note 8"
date: 2021-08-22
description: "A step-by-step guide to installing Magisk on the Redmi Note 8, enabling root access for customizations and advanced tweaks."
summary: "This guide explains how to install Magisk on your Redmi Note 8 using TWRP recovery. If you've already unlocked your bootloader and installed a custom recovery, this is the next step in your modding journey."
tags: ["Magisk", "Rooting", "Redmi Note 8", "Custom ROMs", "TWRP"]
ShowPostNavLinks: true
weight: 27
type: post
image: "/images/blog4/install-magisk.jpg"
showTableOfContents: true
draft: false
---

Installing Magisk and Rooting Redmi Note 8
---
Once you've [unlocked your bootloader](../unlocking-bootloader-redmi-note8/) and [installed TWRP](../installing-twrp-custom-recovery-without-a-pc/) on your Redmi Note 8, you're all set to root your device. Rooting grants you superuser access, allowing full control of the Android OS. This guide walks you through the process of installing Magisk, the most popular and systemless rooting tool available.

![Magisk Logo](/images/blog4/install-magisk.jpg "Magisk Root")

What is Magisk?
---
Magisk is a systemless root solution that modifies the boot image rather than system files. This helps in passing SafetyNet checks, allowing you to use apps like Google Pay, banking apps, and Netflix even on a rooted device.

Benefits of Magisk:
---
- ✅ **Systemless Rooting** – Doesn’t touch the system partition
- ✅ **Magisk Modules** – Enhance your phone with add-ons like Viper4Android, ad-blockers, and more
- ✅ **Pass SafetyNet** – Works with apps that detect root
- ✅ **Hide Root from Apps** – With MagiskHide (deprecated in latest versions but partially functional through modules)
- ✅ **OTA Support** – Easier updates without losing root (in some cases)

Prerequisites
---
- Bootloader must be **unlocked** (see [Unlocking Guide](../unlocking-bootloader-redmi-note8/))
- **TWRP** must be installed (see [TWRP Without PC](../installing-twrp-custom-recovery-without-a-pc/))
- **Magisk ZIP or APK file** downloaded from the [official GitHub releases](https://github.com/topjohnwu/Magisk/releases)
- Battery level above 50%

Steps to Install Magisk Using TWRP
---

### Step 1: Download Magisk
Download the latest **Magisk APK** and rename the `.apk` to `.zip` (e.g., `Magisk-v27.0.apk` → `Magisk-v27.0.zip`). This will make it flashable through recovery.

You can grab the latest version from the [Magisk GitHub page](https://github.com/topjohnwu/Magisk/releases).

### Step 2: Boot into TWRP Recovery
Turn off your device and boot into recovery:
- Press and hold **Power + Volume Up** until the TWRP logo appears.

### Step 3: Flash Magisk ZIP
In TWRP:
1. Tap **Install**
2. Navigate to the `Magisk-vXX.zip` file you downloaded
3. Swipe to confirm the flash

Wait for the process to finish.

### Step 4: Reboot and Verify
1. Tap **Reboot System** after flashing
2. Once booted, install the **Magisk APK** (if not already installed)
3. Open the app to verify root access

You should now see Magisk installed with root access granted 🎉

Post-Installation Tips
---
- Use **Zygisk** and **HideProps** module to pass SafetyNet if needed
- Explore modules like **LSPosed**, **AppSystemizer**, or **Viper4Android**
- **Update Magisk** only from within the Magisk app for safety

Troubleshooting
---
- **Stuck in bootloop?** – Reboot to recovery and remove Magisk via TWRP if needed
- **App crashes after root?** – Hide root using Zygisk or configure denylist
- **Boot image mismatch?** – Use a patched boot image instead of ZIP if needed

Conclusion
---
Magisk is the gateway to truly advanced Android customization. With root access on your Redmi Note 8, you can tweak your device to your heart's content. Whether it’s ad-blocking, audio mods, or theming – the possibilities are endless.

> Next steps? Try installing a [custom ROM like crDroid](https://crdroid.net/devices/ginkgo/10) to enhance performance and aesthetics!

Happy rooting and modding!


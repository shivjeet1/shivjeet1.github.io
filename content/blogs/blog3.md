---
author: "Shivam Lavhale"
title: "Installing CrDroid: CUSTOM ROM"
date: 2021-07-20
description: "A step-by-step guide to installing crDroid on your Redmi Note 8 using TWRP. Includes prerequisites, downloads, and flashing instructions."
summary: "This blog walks you through the process of installing crDroid on the Redmi Note 8 (codename: ginkgo), covering everything from prerequisites to first boot setup."
tags: ["crDroid", "Custom ROMs", "Redmi Note 8"]
ShowPostNavLinks: true
weight: 97
type: post
image: "/images/blogs/images.jpg"
showTableOfContents: true
draft: false
---

Installing CrDroid on Redmi Note 8: A Complete Guide
---
So, you've unlocked your bootloader and installed TWRP—what next? Time to breathe new life into your Redmi Note 8 (codename: ginkgo) by flashing **crDroid**, a performance-focused, privacy-respecting custom ROM based on AOSP.

This guide walks you through installing crDroid on your device using TWRP. 🛠️

![CrDroid Logo](/images/blogs/images.jpg "crDroid")

What is CrDroid?
---
**CrDroid** is a custom Android ROM built on top of LineageOS, offering more features and better performance without bloat. It's known for:

- Smooth, stable experience ⚡
- Frequent updates and support
- Lots of customization options
- Clean UI with useful additions

Prerequisites 
---
Before you begin, make sure you have:

- **Redmi Note 8 (ginkgo)** with **unlocked bootloader**
- **TWRP or OrangeFox Recovery** installed
- **Battery charged to at least 50%**
- **USB cable** and access to a PC (optional, for file transfer)

### Required Files:
Download the following before starting:

1. **CrDroid ROM for ginkgo** – [Official CrDroid Downloads](https://crdroid.net/ginkgo)
2. **Firmware** (if required) – Usually included in the CrDroid package
3. **MindTheGapps** or **NikGapps** – Choose one: [MindTheGapps](https://mindthegapps.org/) / [NikGapps](https://nikgapps.com/)
4. (Optional) **Magisk** – If you want root access: [Magisk GitHub](https://github.com/topjohnwu/Magisk)

⚠️ Backup everything before proceeding. Flashing a new ROM will wipe your data!

Installation Steps
---

### Step 1: Transfer Files
Transfer the CrDroid ROM, GApps, and optionally Magisk to your phone’s internal storage or SD card.

### Step 2: Boot into Recovery
- Power off your device
- Hold **Power + Volume Up** to enter TWRP/OrangeFox

### Step 3: Factory Reset
- Go to **Wipe** → **Advanced Wipe**
- Select: Dalvik / ART Cache, Data, Cache, System
- Swipe to wipe

### Step 4: Flash crDroid
- Go to **Install** → select crDroid ZIP
- Swipe to confirm flash

### Step 5: Flash GApps (Optional)
- Go back to **Install** → select GApps ZIP
- Swipe to confirm flash

### Step 6 (Optional): Flash Magisk
- Flash Magisk ZIP the same way if you want root

### Step 7: Reboot
- Go to **Reboot** → **System**
- First boot can take 5–10 minutes

First Boot Experience 
---
- Go through setup like a stock Android phone
- Connect Wi-Fi, add Google Account (if GApps installed)
- Enjoy your new ROM!

Troubleshooting Tips
---
- [Bootloop? Try wiping again or check firmware version.](https://miuirom.org/updates/xiaomi-bootloop)
- [No GApps? Reboot into recovery and flash GApps again.]
- [No root? Make sure Magisk flashed correctly.]

Conclusion
---
CrDroid gives your Redmi Note 8 a fresh, clean, and customizable Android experience. Once installed, it opens up the full potential of your device while keeping things smooth and battery-efficient.

Happy flashing, and welcome to the world of custom ROMs!


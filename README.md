# BetterYoutubeControls 🎥⚡

A lightweight, high-performance browser extension designed to enhance and clean your YouTube experience. Built with performance in mind, it avoids continuous background loop polling (`setInterval`) and relies on native page/player events to execute modifications efficiently.

Specifically designed and optimized for **Zen Browser** (Firefox-based) and standard modern browsers.

---

## ✨ Features

### 🩳 Shorts Control
- **Redirect Shorts**: Automatically open YouTube Shorts inside the standard video player layout.
- **Hide Shorts Feed**: Remove Shorts shelves and recommendations from your subscription/home feeds.
- **Remove YT Shorts Tabs**: Hide the "Shorts" sidebar and pivot tab buttons entirely.

### 💬 Comments & Chat Blocker
- **Hide Comments**: Remove comments section completely.
- **Hide Comment Box**: Keep comments visible but hide the main comment input box to prevent distraction.
- **Hide Live Chat**: Instantly hide the Live Chat replay and streams overlay panel.

### 🎯 Focus Mode & Clutter Removal
- **Hide Home Feed**: Remove all recommendations from your homepage, leaving a clean interface with a "Focus Mode Active" display.
- **Hide Related Videos**: Clean the watch page sidebar by removing suggested video lists.
- **Hide End Screens**: Strip away annoing video overlays, recommendation cards, and channel subscription popups at the end of videos.
- **Disable Ambient Glow**: Shut down the theatrical cinematic background lighting behind the player for zero CPU overhead.

### 🎛️ Advanced Player Options
- **Scroll Volume**: Adjust the volume level easily by scrolling your mouse wheel anywhere over the video player.
- **Preferred Quality**: Specify your preferred default resolution (Auto, 480p, 720p, 1080p, 1440p, 2160p/4K, or Max Quality).
- **Default Playback Speed**: Automatically apply your preferred speed (between `1.0x` and `4.0x`) on every video load.

### ⚙️ System & Backup
- **Import/Export Settings**: Easily back up or transfer your configured extension preferences via JSON.
- **Manual Language Override**: Switch between English and Türkçe instantly without modifying your browser's default language.

---

## 🛠️ Installation Guide

### 🦊 Zen Browser & Firefox (Developer Mode)
1. Download or clone this repository:
   ```bash
   git clone https://github.com/Tarcher42/BetterYoutubeControls.git
   ```
2. Open your browser and navigate to `about:debugging`.
3. Click on **"This Firefox"** (or **"This Zen"**).
4. Click **"Load Temporary Add-on..."**.
5. Select the `manifest.json` file inside the `BetterYoutubeControls` folder.

### 🌐 Google Chrome & Edge
1. Download or clone this repository.
2. Open your browser and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top-right corner.
4. Click **"Load unpacked"** in the top-left corner.
5. Select the `BetterYoutubeControls` folder.

---

## 📈 Performance & Architecture Optimizations
- **No Background Loops**: The extension does not use any timer loops or constant `setInterval` queries to monitor the video. Instead, it hooks into native HTML5 Video `ratechange` and `play` events, along with YouTube's `yt-navigate-finish` event.
- **Pure CSS Dynamic Triggers**: Interface elements are hidden using fast CSS selectors combined with root attributes (`html[cc_hide_comments="true"]`), avoiding slow JavaScript DOM manipulation.
- **Vector-Only Branding**: Uses a single lightweight `.svg` icon for all manifest declarations to keep storage and memory footprint minimal.

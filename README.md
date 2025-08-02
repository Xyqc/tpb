## 📦 TPB Sorter — Pirate Bay Torrent Sorter

Sorts [The Pirate Bay](https://thepiratebaye.org/) search results automatically by **video quality**, **resolution**, and **uploader status** (VIP / Trusted). Includes **highlighting**, **ranking**, and **dropdown filters**.

### 🔧 Features

* ✅ Automatically sorts search results by:

  * Format (e.g. Remux, Blu-ray, x265)
  * Resolution (e.g. 4K, 1080p, 720p)
  * VIP and Trusted uploaders
* 🎨 Visual highlights:

  * ⭐ Yellow: Highest ranked
  * ✅ Green border: VIP
  * 🔮 Purple border: Trusted
  * 🔴 Red: Highlighted quality terms (e.g. 1080p, x265)
* 🔍 Filter dropdown to filter by format (e.g. Remux, CAM, etc.)
* 🧠 Sort dropdown to prioritize rating, VIPs, or Trusted

## 🧩 Chrome Extension

### 🔹 How to Install

1. Clone or download this repository.
2. Open **Chrome** and go to `chrome://extensions`
3. Enable **Developer Mode**
4. Click **"Load Unpacked"**
5. Select the **chrome-extension** folder containing:

   * `manifest.json`
   * `popup.html`
   * `popup.js`
6. The extension icon will appear in your toolbar.

### 🔹 How to Use

1. Navigate to [https://thepiratebaye.org](https://thepiratebaye.org)
2. Perform a search (e.g. `Oppenheimer 2023`)
3. Click the extension icon.
4. The sorted and filtered list will appear in a popup.

## 🐵 Tampermonkey Userscript

### 🔹 How to Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Click **"Create a new script"**
3. Paste the contents of the `tpb-sorter.user.js` file (provided in this repo).
4. Save the script.

### 🔹 How to Use

1. Go to [https://thepiratebaye.org](https://thepiratebaye.org)
2. Perform any search.
3. A sorted panel will appear **at the top of the page**.
4. Use dropdowns to filter or re-sort.

## ⚙️ Quality Ranking (0–10 scale)

* **Formats**

  * `ISO` – 6
  * `Remux + Atmos` – 5
  * `Remux` – 4
  * `Blu-ray / Hybrid` – 3
  * `x265 / x264` – 2
  * `WEB-DL / WEBRip` – 1
  * `HDTS / TS / CAM / SCR` – 0
* **Resolutions**

  * `8K` – 4
  * `4K / 2160p` – 3
  * `1080p` – 2
  * `720p` – 1
  * `576p / 480p` – 0

## 📁 Files Included

| File                            | Description                   |
| ------------------------------- | ----------------------------- |
| `popup.html`                    | Chrome extension popup UI     |
| `popup.js`                      | Chrome extension script logic |
| `manifest.json`                 | Chrome extension manifest     |
| `tpb-sorter.user.js` (optional) | Tampermonkey version          |

## 📬 Feedback & Contributions

If you'd like to contribute, suggest features, or report bugs, feel free to open an issue or pull request.

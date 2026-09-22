# TPBQuality - The Pirate Bay Torrent Sorter

TPBQuality automatically sorts The Pirate Bay search results based on **video quality**, **resolution**, and **uploader status**.

It is available as both a **Chrome extension** and a **Tampermonkey userscript**.

## Features

* Automatically sorts search results by:

  * Format, such as Remux, Blu-ray, and x265
  * Resolution, such as 4K, 1080p, and 720p
  * VIP and Trusted uploader status
* Highlights results based on quality and uploader status
* Filter results by format
* Sort results by:

  * Quality rating
  * VIP status
  * Trusted status
* Supports multiple video formats and resolutions

## Chrome Extension

### Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `chrome-extension` folder.
6. Make sure the folder contains:

   * `manifest.json`
   * `popup.html`
   * `popup.js`

The extension will now appear in your Chrome extensions list.

### Usage

1. Open The Pirate Bay.
2. Perform a search.
3. Click the TPBQuality extension icon.
4. The results will be sorted and filtered in the extension popup.

## Tampermonkey Userscript

### Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open Tampermonkey and create a new script.
3. Copy the contents of `TPBQuality.user.js` into the script.
4. Save the script.

### Usage

1. Open The Pirate Bay.
2. Perform a search.
3. TPBQuality will automatically add a sorted results panel to the top of the page.
4. Use the dropdown menus to filter and sort the results.

## Quality Ranking

TPBQuality uses a 0-10 quality ranking system based on format and resolution.

### Format Ranking

| Format                | Score |
| --------------------- | ----: |
| ISO                   |     6 |
| Remux + Atmos         |     5 |
| Remux                 |     4 |
| Blu-ray / Hybrid      |     3 |
| x265 / x264           |     2 |
| WEB-DL / WEBRip       |     1 |
| HDTS / TS / CAM / SCR |     0 |

### Resolution Ranking

| Resolution  | Score |
| ----------- | ----: |
| 8K          |     4 |
| 4K / 2160p  |     3 |
| 1080p       |     2 |
| 720p        |     1 |
| 576p / 480p |     0 |

## Files

| File                     | Description               |
| ------------------------ | ------------------------- |
| `chrome-extension/`      | Chrome extension files    |
| `popup.html`             | Extension popup interface |
| `popup.js`               | Extension logic           |
| `manifest.json`          | Chrome extension manifest |
| `TPBQuality-1.0.user.js` | Tampermonkey userscript   |

## Contributing

Contributions, feature suggestions, and bug reports are welcome.

Feel free to open an issue or submit a pull request.

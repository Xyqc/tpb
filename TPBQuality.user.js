// ==UserScript==
// @name         TPBQuality
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Sort Pirate Bay results by quality, resolution, VIP/Trusted; add filter and sort UI
// @author       Xy
// @include      /^https?:\/\/[^/]*(?:the)?piratebay[^/]*\.[^/]+(?:\/.*)?$/
// @include      /^https?:\/\/[^/]*tpbs?[^/]*\.[^/]+(?:\/.*)?$/
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  let initialized = false;

  const waitForResults = () => {
    if (initialized) return;

    const items = getTorrentItems();

    if (items.length) {
      initialized = true;
      sortByTitleQuality();
    } else {
      setTimeout(waitForResults, 500);
    }
  };

  waitForResults();

  function getTorrentItems() {
    const selectors = [
      'span.item-title > a',
      'span.list-item.item-name.item-title > a',
      '.item-title > a',
      '.item-title a'
    ];

    for (const selector of selectors) {
      const items = document.querySelectorAll(selector);

      if (items.length) {
        return Array.from(items);
      }
    }

    return [];
  }

  function sortByTitleQuality() {
    const baseUrl = location.origin;
    const items = getTorrentItems();
    const torrents = [];

    const highlightTerms = [
      "iso", "remux", "atmos", "hybrid", "x265", "x264",
      "web-dl", "webdl", "webrip", "bluray", "blu-ray", "hdts",
      "scr", "ts", "telesync", "cam",
      "8k", "4k", "2160p", "1080p", "720p", "576p", "480p"
    ];

    for (const a of items) {
      const href = a.getAttribute('href');
      if (!href) continue;

      const rawTitle = a.innerText.trim();
      if (!rawTitle) continue;

      let title = rawTitle
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const lowerTitle = title.toLowerCase();

      let fullLink;
      try {
        fullLink = new URL(href, location.href).href;
      } catch {
        fullLink = baseUrl + href;
      }

      const rank = Math.min(getCombinedRank(lowerTitle), 10);

      highlightTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        title = title.replace(
          regex,
          '<span style="color:red;font-weight:bold;">$1</span>'
        );
      });

      let vip = false;
      let trusted = false;

      const parent = a.closest('tr, li, div');

      if (parent) {
        const icons = parent.querySelector('span.item-icons');

        if (icons) {
          if (
            icons.querySelector(
              'img[src*="/static/images/vip.gif"][alt="VIP"], img[alt="VIP"]'
            )
          ) {
            vip = true;
          }

          if (
            icons.querySelector(
              'img[src*="/static/images/trusted.png"][alt="Trusted"], img[alt="Trusted"]'
            )
          ) {
            trusted = true;
          }
        }
      }

      torrents.push({
        title,
        link: fullLink,
        rank,
        vip,
        trusted,
        rawTitle
      });
    }

    if (!torrents.length) return;

    let existing = document.getElementById("tpb-sorter-container");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.id = "tpb-sorter-container";

    Object.assign(container.style, {
      backgroundColor: "white",
      color: "black",
      zIndex: "9999",
      overflow: "auto",
      padding: "10px",
      maxHeight: "90vh",
      width: "95%",
      margin: "10px auto",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontFamily: "sans-serif",
      boxSizing: "border-box"
    });

    const titleEl = document.createElement("h2");
    titleEl.textContent = "Removed the stress.";
    container.appendChild(titleEl);

    const controls = document.createElement("div");
    controls.style.marginBottom = "10px";

    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Filter by type: ";
    filterLabel.style.fontWeight = "bold";

    const filterSelect = document.createElement("select");

    [
      "all",
      "iso",
      "remux",
      "hybrid",
      "x265",
      "web-dl",
      "webrip",
      "bluray",
      "hdts",
      "cam"
    ].forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt.toUpperCase();
      filterSelect.appendChild(o);
    });

    filterLabel.appendChild(filterSelect);

    const sortLabel = document.createElement("label");
    sortLabel.style.marginLeft = "20px";
    sortLabel.textContent = "Sort by: ";
    sortLabel.style.fontWeight = "bold";

    const sortSelect = document.createElement("select");

    ["rating", "vip", "trusted"].forEach(opt => {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent =
        opt.charAt(0).toUpperCase() + opt.slice(1);
      sortSelect.appendChild(o);
    });

    sortLabel.appendChild(sortSelect);

    controls.appendChild(filterLabel);
    controls.appendChild(sortLabel);
    container.appendChild(controls);

    const resultsContainer = document.createElement("div");
    resultsContainer.id = "tpb-results";
    container.appendChild(resultsContainer);

    function renderResults(
      filterType = "all",
      sortMode = "rating"
    ) {
      resultsContainer.innerHTML = "";

      let filtered = torrents.filter(t => {
        if (filterType === "all") return true;

        return t.rawTitle
          .toLowerCase()
          .includes(filterType.toLowerCase());
      });

      if (sortMode === "vip") {
        filtered.sort((a, b) => {
          if (b.vip !== a.vip) {
            return Number(b.vip) - Number(a.vip);
          }

          return b.rank - a.rank;
        });
      } else if (sortMode === "trusted") {
        filtered.sort((a, b) => {
          if (b.trusted !== a.trusted) {
            return Number(b.trusted) - Number(a.trusted);
          }

          return b.rank - a.rank;
        });
      } else {
        filtered.sort((a, b) => {
          if (b.rank !== a.rank) {
            return b.rank - a.rank;
          }

          if (b.vip !== a.vip) {
            return Number(b.vip) - Number(a.vip);
          }

          if (b.trusted !== a.trusted) {
            return Number(b.trusted) - Number(a.trusted);
          }

          return 0;
        });
      }

      const highestRank =
        filtered.length ? filtered[0].rank : 0;

      for (const t of filtered) {
        const el = document.createElement("div");

        el.className = "result";

        Object.assign(el.style, {
          padding: "5px 8px",
          marginBottom: "6px",
          borderRadius: "4px",
          border: "2px solid transparent"
        });

        if (
          t.rank === highestRank &&
          sortMode === "rating"
        ) {
          el.style.backgroundColor = "yellow";
        }

        if (t.vip) {
          el.style.border = "3px solid green";
          el.style.backgroundColor = "#e6ffe6";
        } else if (t.trusted) {
          el.style.border = "3px solid purple";
          el.style.backgroundColor = "#f3e6ff";
        }

        el.innerHTML =
          `<b>${t.rank}/10</b> — ` +
          `<a href="${t.link}" target="_blank">${t.title}</a>`;

        resultsContainer.appendChild(el);
      }
    }

    filterSelect.addEventListener("change", () => {
      renderResults(
        filterSelect.value,
        sortSelect.value
      );
    });

    sortSelect.addEventListener("change", () => {
      renderResults(
        filterSelect.value,
        sortSelect.value
      );
    });

    renderResults(
      filterSelect.value,
      sortSelect.value
    );

    document.body.prepend(container);

    function getCombinedRank(name) {
      return getFormatRank(name) + getResolutionRank(name);
    }

    function getFormatRank(name) {
      if (name.includes("iso")) return 6;
      if (name.includes("remux") && name.includes("atmos")) return 5;
      if (name.includes("remux")) return 4;
      if (name.includes("bluray") || name.includes("blu-ray")) return 3;
      if (name.includes("hybrid")) return 3;
      if (name.includes("x265") || name.includes("x264")) return 2;
      if (name.includes("web-dl") || name.includes("webdl")) return 1;
      if (name.includes("webrip") || name.includes("web")) return 1;
      if (name.includes("hdts")) return 0;
      if (name.includes("scr")) return 0;
      if (name.includes("ts") || name.includes("telesync")) return 0;
      if (name.includes("cam")) return 0;
      return 0;
    }

    function getResolutionRank(name) {
      if (name.includes("8k")) return 4;
      if (name.includes("4k") || name.includes("2160p")) return 3;
      if (name.includes("1080p")) return 2;
      if (name.includes("720p")) return 1;
      if (name.includes("576p")) return 0;
      if (name.includes("480p")) return 0;
      return 0;
    }
  }
})();

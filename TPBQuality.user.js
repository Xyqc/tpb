// ==UserScript==
// @name         TPBQuality
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Sort Pirate Bay results by quality, resolution, VIP/Trusted; add filter and sort UI
// @author       Xy
// @include      *://*piratebay*/*
// @include      *://*tpb*/*
// @icon         https://thepiratebaye.org/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const CONTAINER_ID = "tpb-sorter-container";
  const TABLE_SELECTOR = "#searchResult";

  const waitForResults = () => {
    const items = document.querySelectorAll(
      '#searchResult tbody tr > td:nth-child(2) > a[href*="/torrent/"]'
    );

    if (items.length) {
      sortByTitleQuality();
    } else {
      setTimeout(waitForResults, 500);
    }
  };

  waitForResults();

  function sortByTitleQuality() {
    const table = document.querySelector(TABLE_SELECTOR);

    if (!table) return;

    const rows = Array.from(
      table.querySelectorAll(
        'tbody > tr'
      )
    );

    const items = Array.from(
      table.querySelectorAll(
        'tbody > tr > td:nth-child(2) > a[href*="/torrent/"]'
      )
    );

    if (!items.length) return;

    const torrents = [];
    const originalRows = [];

    const highlightTerms = [
      "iso", "remux", "atmos", "hybrid", "x265", "x264",
      "web-dl", "webdl", "webrip", "bluray", "blu-ray", "hdts",
      "scr", "ts", "telesync", "cam",
      "8k", "4k", "2160p", "1080p", "720p", "576p", "480p"
    ];

    for (const row of rows) {
      const torrentLink = row.querySelector(
        'td:nth-child(2) > a[href*="/torrent/"]'
      );

      if (!torrentLink) continue;

      originalRows.push(row);

      const href = torrentLink.getAttribute("href");
      const rawTitle = torrentLink.innerText.trim();

      if (!href || !rawTitle) continue;

      let title = rawTitle
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const lowerTitle = title.toLowerCase();

      let fullLink;

      try {
        fullLink = new URL(href, location.href).href;
      } catch {
        fullLink = href;
      }

      const rank = Math.min(
        getCombinedRank(lowerTitle),
        10
      );

      highlightTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, "gi");

        title = title.replace(
          regex,
          '<span style="color:red;font-weight:bold;">$1</span>'
        );
      });

      let vip = false;
      let trusted = false;

      if (row.querySelector('img[alt="VIP"]')) {
        vip = true;
      }

      if (row.querySelector('img[alt="Trusted"]')) {
        trusted = true;
      }

      torrents.push({
        row,
        title,
        link: fullLink,
        rank,
        vip,
        trusted,
        rawTitle
      });
    }

    if (!torrents.length) return;

    let existing = document.getElementById(CONTAINER_ID);

    if (existing) {
      existing.remove();
    }

    const container = document.createElement("div");

    container.id = CONTAINER_ID;

    container.style.backgroundColor = "white";
    container.style.color = "black";
    container.style.zIndex = "9999";
    container.style.overflow = "auto";
    container.style.padding = "10px";
    container.style.maxHeight = "90vh";
    container.style.width = "95%";
    container.style.margin = "10px auto";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.fontFamily = "sans-serif";
    container.style.boxSizing = "border-box";

    const controls = document.createElement("div");

    controls.style.marginBottom = "10px";

    const displayLabel = document.createElement("label");

    displayLabel.textContent = "Display: ";
    displayLabel.style.fontWeight = "bold";

    const displaySelect = document.createElement("select");

    [
      ["list", "Sorted List"],
      ["table", "Reorder Original Table"]
    ].forEach(([value, text]) => {
      const option = document.createElement("option");

      option.value = value;
      option.textContent = text;

      displaySelect.appendChild(option);
    });

    displayLabel.appendChild(displaySelect);

    const filterLabel = document.createElement("label");

    filterLabel.textContent = "Filter by type: ";
    filterLabel.style.fontWeight = "bold";
    filterLabel.style.marginLeft = "20px";

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

    sortLabel.textContent = "Sort by: ";
    sortLabel.style.fontWeight = "bold";
    sortLabel.style.marginLeft = "20px";

    const sortSelect = document.createElement("select");

    [
      "rating",
      "vip",
      "trusted"
    ].forEach(opt => {
      const o = document.createElement("option");

      o.value = opt;
      o.textContent =
        opt.charAt(0).toUpperCase() +
        opt.slice(1);

      sortSelect.appendChild(o);
    });

    sortLabel.appendChild(sortSelect);

    controls.appendChild(displayLabel);
    controls.appendChild(filterLabel);
    controls.appendChild(sortLabel);

    container.appendChild(controls);

    const resultsContainer = document.createElement("div");

    resultsContainer.id = "tpb-results";

    container.appendChild(resultsContainer);

    document.body.prepend(container);

    const savedOriginalOrder = [...originalRows];

    function getFilteredAndSorted() {
      let filtered = torrents.filter(t => {
        if (filterSelect.value === "all") {
          return true;
        }

        return t.rawTitle
          .toLowerCase()
          .includes(filterSelect.value.toLowerCase());
      });

      if (sortSelect.value === "vip") {
        filtered.sort((a, b) => {
          if (b.vip !== a.vip) {
            return (
              Number(b.vip) -
              Number(a.vip)
            );
          }

          return b.rank - a.rank;
        });
      } else if (sortSelect.value === "trusted") {
        filtered.sort((a, b) => {
          if (b.trusted !== a.trusted) {
            return (
              Number(b.trusted) -
              Number(a.trusted)
            );
          }

          return b.rank - a.rank;
        });
      } else {
        filtered.sort((a, b) => {
          if (b.rank !== a.rank) {
            return b.rank - a.rank;
          }

          if (b.vip !== a.vip) {
            return (
              Number(b.vip) -
              Number(a.vip)
            );
          }

          if (b.trusted !== a.trusted) {
            return (
              Number(b.trusted) -
              Number(a.trusted)
            );
          }

          return 0;
        });
      }

      return filtered;
    }

    function renderResults() {
      resultsContainer.innerHTML = "";

      const filtered = getFilteredAndSorted();

      const highestRank =
        filtered.length
          ? filtered[0].rank
          : 0;

      for (const t of filtered) {
        const el = document.createElement("div");

        el.className = "result";

        el.style.padding = "5px 8px";
        el.style.marginBottom = "6px";
        el.style.borderRadius = "4px";
        el.style.border = "2px solid transparent";

        if (
          t.rank === highestRank &&
          sortSelect.value === "rating"
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

    function reorderOriginalTable() {
      const tbody = table.querySelector("tbody");

      if (!tbody) return;

      const sorted = getFilteredAndSorted();

      const sortedRows = sorted.map(t => t.row);

      const visibleSet = new Set(sortedRows);

      const hiddenRows = savedOriginalOrder.filter(
        row => !visibleSet.has(row)
      );

      const finalOrder = [
        ...sortedRows,
        ...hiddenRows
      ];

      for (const row of finalOrder) {
        tbody.appendChild(row);
      }

      for (let i = 0; i < finalOrder.length; i++) {
        const row = finalOrder[i];

        if (i % 2 === 1) {
          row.classList.add("alt");
        } else {
          row.classList.remove("alt");
        }

        const torrent = torrents.find(
          t => t.row === row
        );

        if (torrent) {
          const visible = visibleSet.has(row);

          row.style.display =
            visible ? "" : "none";
        }
      }
    }

    function restoreOriginalTable() {
      const tbody = table.querySelector("tbody");

      if (!tbody) return;

      for (const row of savedOriginalOrder) {
        tbody.appendChild(row);

        row.style.display = "";
      }

      for (let i = 0; i < savedOriginalOrder.length; i++) {
        const row = savedOriginalOrder[i];

        if (i % 2 === 1) {
          row.classList.add("alt");
        } else {
          row.classList.remove("alt");
        }
      }
    }

    function updateDisplay() {
      if (displaySelect.value === "list") {
        restoreOriginalTable();

        resultsContainer.style.display = "";

        renderResults();
      } else {
        resultsContainer.style.display = "none";

        reorderOriginalTable();
      }
    }

    displaySelect.addEventListener(
      "change",
      updateDisplay
    );

    filterSelect.addEventListener(
      "change",
      updateDisplay
    );

    sortSelect.addEventListener(
      "change",
      updateDisplay
    );

    updateDisplay();

    function getCombinedRank(name) {
      return (
        getFormatRank(name) +
        getResolutionRank(name)
      );
    }

    function getFormatRank(name) {
      if (name.includes("iso")) return 6;

      if (
        name.includes("remux") &&
        name.includes("atmos")
      ) {
        return 5;
      }

      if (name.includes("remux")) return 4;

      if (
        name.includes("bluray") ||
        name.includes("blu-ray")
      ) {
        return 3;
      }

      if (name.includes("hybrid")) return 3;

      if (
        name.includes("x265") ||
        name.includes("x264")
      ) {
        return 2;
      }

      if (
        name.includes("web-dl") ||
        name.includes("webdl")
      ) {
        return 1;
      }

      if (
        name.includes("webrip") ||
        name.includes("web")
      ) {
        return 1;
      }

      if (name.includes("hdts")) return 0;
      if (name.includes("scr")) return 0;

      if (
        name.includes("ts") ||
        name.includes("telesync")
      ) {
        return 0;
      }

      if (name.includes("cam")) return 0;

      return 0;
    }

    function getResolutionRank(name) {
      if (name.includes("8k")) return 4;

      if (
        name.includes("4k") ||
        name.includes("2160p")
      ) {
        return 3;
      }

      if (name.includes("1080p")) return 2;
      if (name.includes("720p")) return 1;
      if (name.includes("576p")) return 0;
      if (name.includes("480p")) return 0;

      return 0;
    }
  }
})();

// ==UserScript==
// @name         TPBQuality
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sort Pirate Bay results by quality, resolution, VIP/Trusted; add filter and sort UI
// @author       Xy
// @match        https://thepiratebaye.org/*
// @icon         https://thepiratebaye.org/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const waitForResults = () => {
    const items = document.querySelectorAll('span.item-title > a');
    if (items.length) {
      sortByTitleQuality();
    } else {
      setTimeout(waitForResults, 500);
    }
  };

  waitForResults();

  function sortByTitleQuality() {
    const baseUrl = location.origin;
    const items = Array.from(document.querySelectorAll('span.item-title > a'));
    const torrents = [];

    const highlightTerms = [
      "iso", "remux", "atmos", "hybrid", "x265", "x264",
      "web-dl", "webdl", "webrip", "bluray", "blu-ray", "hdts",
      "scr", "ts", "telesync", "cam",
      "8k", "4k", "2160p", "1080p", "720p", "576p", "480p"
    ];

    for (const a of items) {
      const href = a.getAttribute('href');
      let rawTitle = a.innerText.trim();
      let title = rawTitle
        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const lowerTitle = title.toLowerCase();
      const fullLink = baseUrl + href;
      const rank = Math.min(getCombinedRank(lowerTitle), 10);

      highlightTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        title = title.replace(regex, '<span style="color:red;font-weight:bold;">$1</span>');
      });

      let vip = false, trusted = false;
      const parent = a.closest('tr, li, div');
      if (parent) {
        const icons = parent.querySelector('span.item-icons');
        if (icons) {
          if (icons.querySelector('img[src="/static/images/vip.gif"][alt="VIP"]')) vip = true;
          if (icons.querySelector('img[src="/static/images/trusted.png"][alt="Trusted"]')) trusted = true;
        }
      }

      torrents.push({ title, link: fullLink, rank, vip, trusted, rawTitle });
    }

    let existing = document.getElementById("tpb-sorter-container");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.id = "tpb-sorter-container";
    container.style.backgroundColor = "white";
    container.style.zIndex = "9999";
    container.style.overflow = "auto";
    container.style.padding = "10px";
    container.style.maxHeight = "90vh";
    container.style.width = "95%";
    container.style.margin = "10px auto";
    container.style.border = "1px solid #ccc";
    container.style.borderRadius = "8px";
    container.style.fontFamily = "sans-serif";

    const titleEl = document.createElement("h2");
    titleEl.textContent = "Sorted Pirate Bay Results";
    container.appendChild(titleEl);

    const controls = document.createElement("div");
    controls.style.marginBottom = "10px";

    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Filter by Type: ";
    filterLabel.style.fontWeight = "bold";

    const filterSelect = document.createElement("select");
    ["all", "iso", "remux", "hybrid", "x265", "web-dl", "webrip", "bluray", "hdts", "cam"].forEach(opt => {
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
      o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      sortSelect.appendChild(o);
    });
    sortLabel.appendChild(sortSelect);

    controls.appendChild(filterLabel);
    controls.appendChild(sortLabel);
    container.appendChild(controls);

    function renderResults(filterType = "all", sortMode = "rating") {
      container.querySelectorAll(".result").forEach(e => e.remove());

      let filtered = torrents.filter(t => {
        if (filterType === "all") return true;
        return t.rawTitle.toLowerCase().includes(filterType);
      });

      if (sortMode === "vip") {
        filtered.sort((a, b) => (b.vip ? 1 : 0) - (a.vip ? 1 : 0));
      } else if (sortMode === "trusted") {
        filtered.sort((a, b) => (b.trusted ? 1 : 0) - (a.trusted ? 1 : 0));
      } else {
        filtered.sort((a, b) => b.rank - a.rank);
      }

      const highestRank = filtered.length ? filtered[0].rank : 0;

      for (const t of filtered) {
        const el = document.createElement("div");
        el.className = "result";
        el.style.padding = "5px 8px";
        el.style.marginBottom = "6px";
        el.style.borderRadius = "4px";
        el.style.border = "2px solid transparent";

        if (t.rank === highestRank && sortMode === "rating") {
          el.style.backgroundColor = "yellow";
        }
        if (t.vip) {
          el.style.border = "3px solid green";
          el.style.backgroundColor = "#e6ffe6";
        } else if (t.trusted) {
          el.style.border = "3px solid purple";
          el.style.backgroundColor = "#f3e6ff";
        }

        el.innerHTML = `<b>${t.rank}/10</b> — <a href="${t.link}" target="_blank">${t.title}</a>`;
        container.appendChild(el);
      }
    }

    filterSelect.addEventListener("change", () => {
      renderResults(filterSelect.value, sortSelect.value);
    });
    sortSelect.addEventListener("change", () => {
      renderResults(filterSelect.value, sortSelect.value);
    });

    renderResults();
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
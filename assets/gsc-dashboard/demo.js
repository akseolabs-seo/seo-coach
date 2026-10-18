(function (root) {
  "use strict";

  // Demo connector: a deterministic, in-memory stand-in that implements the same
  // contract as a real GSC bridge. Every number it returns is synthetic.

  const engine = root.SEOCoachGscEngine;
  const HISTORY_DAYS = engine.MAX_HISTORY_DAYS;

  // [query, path, impressions per day, position, trend, language country]
  const MAIN = [
    ["pixel coffee maker", "/coffee-makers/", 420, 4.2, "flat"],
    ["best coffee maker 2026", "/guides/best-coffee-maker/", 380, 7.8, "down"],
    ["best coffee maker 2026", "/coffee-makers/", 140, 13.5, "flat"],
    ["how to clean a coffee maker", "/guides/clean-coffee-maker/", 310, 5.6, "cliff:70"],
    ["coffee maker descaling", "/guides/descaling/", 190, 11.4, "up"],
    ["descale coffee machine vinegar", "/guides/descaling/", 150, 14.8, "flat"],
    ["descale coffee machine vinegar", "/guides/clean-coffee-maker/", 90, 17.2, "flat"],
    ["espresso grind size chart", "/guides/grind-size/", 260, 8.9, "up"],
    ["burr grinder vs blade grinder", "/guides/burr-vs-blade/", 170, 12.6, "down"],
    ["cold brew ratio", "/recipes/cold-brew/", 330, 3.4, "flat"],
    ["cold brew concentrate recipe", "/recipes/cold-brew/", 120, 9.7, "up"],
    ["pour over coffee ratio", "/recipes/pour-over/", 210, 6.3, "flat"],
    ["french press steep time", "/recipes/french-press/", 160, 15.9, "down"],
    ["aeropress recipe", "/recipes/aeropress/", 140, 18.4, "flat"],
    ["moka pot instructions", "/recipes/moka-pot/", 95, 22.7, "up"],
    ["coffee to water ratio", "/guides/coffee-ratio/", 280, 10.8, "cliff:45"],
    ["single origin vs blend", "/guides/single-origin/", 70, 26.3, "flat"],
    ["decaf coffee caffeine content", "/guides/decaf/", 115, 19.5, "down"],
    ["coffee maker warranty", "/support/warranty/", 60, 2.1, "flat"],
    ["pixel coffee review", "/reviews/", 85, 1.6, "up"],
    ["coffee subscription box", "/subscription/", 130, 24.2, "new:110"],
    ["smart coffee maker app", "/coffee-makers/smart/", 100, 16.1, "new:75"],
    ["milk frother how to use", "/guides/milk-frother/", 150, 12.2, "new:40"],
    ["latte art for beginners", "/guides/latte-art/", 180, 20.6, "new:150"],
    ["espresso machine under 500", "/guides/espresso-under-500/", 220, 9.4, "new:20"],
    ["machine à café pixel", "/fr/machines-a-cafe/", 160, 5.1, "flat", "fra"],
    ["nettoyer machine à café", "/fr/guides/nettoyage/", 140, 8.7, "up", "fra"],
    ["recette cold brew", "/fr/recettes/cold-brew/", 90, 12.9, "down", "fra"],
    ["kaffeemaschine entkalken", "/de/ratgeber/entkalken/", 210, 6.8, "up", "deu"],
    ["kaffeemaschine reinigen", "/de/ratgeber/reinigen/", 170, 10.3, "flat", "deu"],
    ["mahlgrad espresso", "/de/ratgeber/mahlgrad/", 110, 15.2, "down", "deu"],
    ["コーヒーメーカー 掃除", "/ja/guides/cleaning/", 130, 7.4, "up", "jpn"],
    ["水出しコーヒー 作り方", "/ja/recipes/cold-brew/", 100, 11.8, "new:95", "jpn"],
    ["咖啡機 清潔", "/zh-tw/guides/cleaning/", 150, 6.1, "up", "twn"],
    ["冷萃咖啡 比例", "/zh-tw/recipes/cold-brew/", 120, 9.2, "flat", "twn"],
    ["手沖咖啡 粉水比", "/zh-tw/recipes/pour-over/", 90, 13.7, "new:60", "twn"],
  ];

  const SHOP = [
    ["buy coffee beans online", "/beans/", 240, 9.1, "up"],
    ["ethiopian yirgacheffe beans", "/beans/yirgacheffe/", 150, 6.4, "flat"],
    ["colombian coffee beans", "/beans/colombia/", 130, 12.8, "down"],
    ["coffee filter paper size 4", "/accessories/filters/", 110, 4.7, "flat"],
    ["coffee filter paper size 4", "/accessories/", 60, 15.3, "flat"],
    ["gooseneck kettle", "/accessories/kettles/", 170, 17.6, "up"],
    ["coffee gift set", "/gifts/", 90, 21.4, "new:50"],
    ["reusable coffee pods", "/accessories/pods/", 120, 10.9, "cliff:60"],
  ];

  const SITES = [
    { siteUrl: "sc-domain:pixel-coffee.example", origin: "https://pixel-coffee.example", entities: MAIN, permissionLevel: "siteOwner" },
    { siteUrl: "https://shop.pixel-coffee.example/", origin: "https://shop.pixel-coffee.example", entities: SHOP, permissionLevel: "siteFullUser" },
  ];

  function hash(text) {
    let value = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 16777619);
    }
    return (value >>> 0) / 4294967296;
  }

  function trendFactor(trend, daysAgo) {
    const age = daysAgo / HISTORY_DAYS;
    if (trend === "up") return 1.6 - 1.1 * age;
    if (trend === "down") return 0.5 + 1.2 * age;
    const [kind, value] = trend.split(":");
    const mark = Number(value);
    if (kind === "new") return daysAgo > mark ? 0 : Math.min(1, (mark - daysAgo + 3) / 30);
    if (kind === "cliff") return daysAgo < mark ? 0.45 : 1;
    return 1;
  }

  function positionDrift(trend, daysAgo) {
    const age = daysAgo / HISTORY_DAYS;
    if (trend === "up") return 6 * age;
    if (trend === "down") return 5 * (1 - age);
    if (trend.startsWith("cliff")) return daysAgo < Number(trend.split(":")[1]) ? 4 : 0;
    if (trend.startsWith("new")) return Math.min(12, daysAgo / 8);
    return 0;
  }

  const factCache = new Map();

  function factsFor(site, today) {
    const cacheKey = `${site.siteUrl}|${today}`;
    if (factCache.has(cacheKey)) return factCache.get(cacheKey);
    const facts = [];
    const fallbackCountries = ["usa", "gbr", "can", "aus"];
    site.entities.forEach(([query, path, base, position, trend, country], entityIndex) => {
      for (let daysAgo = 1; daysAgo <= HISTORY_DAYS; daysAgo += 1) {
        const date = engine.addDays(today, -daysAgo);
        const seed = `${site.siteUrl}|${entityIndex}|${date}`;
        const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
        const factor = trendFactor(trend, daysAgo) * (weekday === 0 || weekday === 6 ? 0.8 : 1) * (0.8 + hash(seed) * 0.4);
        const impressions = Math.round(base * factor);
        if (impressions <= 0) continue;
        const rank = Math.min(90, Math.max(1, position + positionDrift(trend, daysAgo) + (hash(`${seed}p`) - 0.5) * 1.6));
        const ctr = Math.min(0.5, 0.32 / rank ** 1.05) * (0.7 + hash(`${entityIndex}c`) * 0.6);
        facts.push({
          query,
          page: site.origin + path,
          date,
          country: country || fallbackCountries[Math.floor(hash(`${seed}g`) * fallbackCountries.length)],
          device: hash(`${seed}d`) < 0.62 ? "MOBILE" : hash(`${seed}d`) < 0.94 ? "DESKTOP" : "TABLET",
          clicks: Math.floor(impressions * ctr + hash(`${seed}k`)),
          impressions,
          position: rank,
        });
      }
    });
    factCache.set(cacheKey, facts);
    return facts;
  }

  function matches(fact, filter) {
    const value = String(fact[filter.dimension] || "");
    const expression = String(filter.expression || "");
    const lower = value.toLowerCase();
    const needle = expression.toLowerCase();
    switch (filter.operator) {
      case "equals":
        return lower === needle;
      case "notEquals":
        return lower !== needle;
      case "notContains":
        return !lower.includes(needle);
      case "includingRegex":
        return new RegExp(expression, "i").test(value);
      case "excludingRegex":
        return !new RegExp(expression, "i").test(value);
      default:
        return lower.includes(needle);
    }
  }

  function findSite(siteUrl) {
    const site = SITES.find((item) => item.siteUrl === siteUrl);
    if (!site) throw engine.codedError("unknownSite", `Unknown demo property: ${siteUrl}`);
    return site;
  }

  function createDemoConnector(options) {
    const today = () => (options && options.today) || engine.localToday();
    return {
      demo: true,
      version: 2,
      label: "DEMO",
      async listSites() {
        return SITES.map((site) => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel }));
      },
      async query(request) {
        const site = findSite(request.siteUrl);
        const dimensions = request.dimensions || [];
        const filters = (request.dimensionFilterGroups || []).flatMap((group) => group.filters || []);
        const facts = factsFor(site, today()).filter((fact) => fact.date >= request.startDate && fact.date <= request.endDate && filters.every((filter) => matches(fact, filter)));
        const rows = engine
          .group(facts, dimensions.length ? dimensions : ["_all"])
          .map((item) => ({ keys: dimensions.map((dimension) => item[dimension]), clicks: item.clicks, impressions: item.impressions, ctr: item.ctr, position: item.position }))
          .filter((row) => dimensions.length || row.impressions > 0)
          .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
        const startRow = request.startRow || 0;
        return { rows: rows.slice(startRow, startRow + (request.rowLimit || 1000)), responseAggregationType: dimensions.includes("page") ? "byPage" : "byProperty" };
      },
      async inspectUrl(request) {
        findSite(request.siteUrl);
        const roll = hash(request.inspectionUrl);
        const base = { robotsTxtState: "ALLOWED", indexingState: "INDEXING_ALLOWED", pageFetchState: "SUCCESSFUL", crawledAs: "MOBILE", userCanonical: request.inspectionUrl, googleCanonical: request.inspectionUrl, lastCrawlTime: `${engine.addDays(today(), -Math.ceil(roll * 20))}T08:00:00Z` };
        let index;
        if (roll < 0.68) index = { ...base, verdict: "PASS", coverageState: "Submitted and indexed" };
        else if (roll < 0.8) index = { ...base, verdict: "NEUTRAL", coverageState: "Crawled - currently not indexed" };
        else if (roll < 0.88) index = { ...base, verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed", pageFetchState: "PAGE_FETCH_STATE_UNSPECIFIED", lastCrawlTime: "" };
        else if (roll < 0.94) index = { ...base, verdict: "NEUTRAL", coverageState: "Alternate page with proper canonical tag", googleCanonical: request.inspectionUrl.replace(/\/[^/]*\/?$/, "/") };
        else index = { ...base, verdict: "NEUTRAL", coverageState: "Excluded by 'noindex' tag", indexingState: "BLOCKED_BY_META_TAG" };
        return { inspectionResult: { indexStatusResult: index } };
      },
      // Two made-up updates that line up with the planted traffic cliffs.
      async listUpdates() {
        return [
          { date: engine.addDays(today(), -70), end: engine.addDays(today(), -58), title: "Demo core update (synthetic)", url: "", source: "demo" },
          { date: engine.addDays(today(), -45), end: engine.addDays(today(), -43), title: "Demo spam update (synthetic)", url: "", source: "demo" },
        ];
      },
      async fetchSitemapUrls(request) {
        const site = findSite(request.siteUrl);
        return Array.from(new Set(site.entities.map((entity) => site.origin + entity[1])));
      },
    };
  }

  root.SEOCoachGscDemo = { createDemoConnector };
})(typeof window !== "undefined" ? window : globalThis);

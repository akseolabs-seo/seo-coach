import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const assetDir = join(scriptDir, "..", "assets", "gsc-dashboard");
const localeDir = join(assetDir, "locales");
const read = (name) => readFile(join(assetDir, name), "utf8");
const [engineSource, demoSource, coreSource, viewsSource, appSource, htmlSource, configSource, localSource] = await Promise.all(["engine.js", "demo.js", "core.js", "views.js", "app.js", "index.html", "panel-config.js", "local.js"].map(read));
const toolSource = await readFile(join(scriptDir, "..", "assets", "gsc-tools", "gsc.mjs"), "utf8");
const localeFiles = (await readdir(localeDir)).filter((name) => name.endsWith(".js")).sort();
const localeSources = await Promise.all(localeFiles.map(async (name) => [name, await readFile(join(localeDir, name), "utf8")]));

const context = { window: {}, console };
context.globalThis = context;
vm.runInNewContext(engineSource, context, { filename: "engine.js" });
vm.runInNewContext(demoSource, context, { filename: "demo.js" });
const engine = context.window.SEOCoachGscEngine;
const demo = context.window.SEOCoachGscDemo;
assert.ok(engine, "engine must be exposed for the browser app");
assert.ok(demo, "demo connector must be exposed for the browser app");
const plain = (value) => JSON.parse(JSON.stringify(value));

// --- dates and ranges -----------------------------------------------------------
const TODAY = "2026-10-07";
assert.equal(engine.addDays("2026-03-01", -1), "2026-02-28", "addDays crosses month ends");
assert.equal(engine.diffDays("2026-01-01", "2026-01-31"), 30);
const threeMonths = engine.resolveRange("3m", TODAY);
assert.equal(threeMonths.end, "2026-10-04", "ranges end three days back so only final data is requested");
assert.equal(threeMonths.days, 91);
assert.equal(threeMonths.previous.end, engine.addDays(threeMonths.start, -1), "the comparison period ends the day before the current one");
assert.equal(engine.diffDays(threeMonths.previous.start, threeMonths.previous.end) + 1, 91, "the comparison period has the same length");
assert.equal(engine.resolveRange("12m", TODAY).previous, null, "no comparison period is invented past the 16-month history");
assert.ok(engine.resolveRange("16m", TODAY).start >= engine.oldestDate(TODAY), "the longest range stays inside the available history");
const yearly = engine.resolveRange("3m", TODAY, undefined, "year");
assert.equal(yearly.previous.start, engine.addDays(yearly.start, -364), "year-over-year compares the same weekdays one year earlier");
assert.equal(engine.resolveRange("6m", TODAY, undefined, "year").previous, null, "no year-over-year window is invented past the available history");
const months = engine.monthWindows(TODAY, 12);
assert.equal(months.length, 12);
assert.deepEqual(plain(months[11]), { key: "2026-09", start: "2026-09-01", end: "2026-09-30" }, "month windows are complete calendar months ending last month");
assert.equal(months[0].key, "2025-10");

// --- API request shaping --------------------------------------------------------
assert.equal(engine.buildFilterGroups({}), undefined, "an empty filter adds no dimensionFilterGroups");
assert.deepEqual(
  plain(engine.buildFilterGroups({ query: { op: "regex", value: "^coffee" }, page: { op: "contains", value: "/guides/" }, country: "TWN", device: "mobile" })),
  [{ groupType: "and", filters: [
    { dimension: "query", operator: "includingRegex", expression: "^coffee" },
    { dimension: "page", operator: "contains", expression: "/guides/" },
    { dimension: "country", operator: "equals", expression: "twn" },
    { dimension: "device", operator: "equals", expression: "MOBILE" },
  ] }],
  "filters map onto Search Analytics API operators",
);
const apiRows = engine.rowsFromResponse({ rows: [{ keys: ["咖啡機清潔", "https://example.com/a"], clicks: 10, impressions: 1000, ctr: 0.01, position: 10 }] }, ["query", "page"]);
assert.equal(apiRows[0].query, "咖啡機清潔", "API keys map onto the requested dimensions");
assert.equal(apiRows[0].page, "https://example.com/a");

// --- aggregation ----------------------------------------------------------------
const rows = [
  { query: "咖啡機清潔", page: "https://example.com/a", clicks: 10, impressions: 1000, position: 10 },
  { query: "咖啡機清潔", page: "https://example.com/a", clicks: 20, impressions: 1000, position: 20 },
  { query: "咖啡機清潔費用", page: "https://example.com/b", clicks: 12, impressions: 500, position: 14 },
];
const currentQueries = engine.group(rows, "query");
assert.equal(currentQueries.length, 2, "duplicate query rows aggregate into one query");
const cleaning = currentQueries.find((item) => item.query === "咖啡機清潔");
assert.equal(cleaning.position, 15, "position is impression-weighted");
assert.equal(cleaning.ctr, 0.015, "CTR is total clicks divided by total impressions");
assert.equal(engine.summarize(rows).clicks, 42);
assert.equal(engine.bucketFor(3.4).id, "top3", "positions round to the nearest whole rank before bucketing");
assert.equal(engine.bucketFor(3.6).id, "top10");
assert.equal(engine.bucketFor(14).id, "page2");
assert.equal(engine.bucketFor(0), null, "a missing position has no bucket");

const previousQueries = engine.group([
  { query: "咖啡機清潔", clicks: 9, impressions: 900, position: 18 },
  { query: "咖啡機清潔費用", clicks: 20, impressions: 520, position: 10 },
  { query: "舊查詢", clicks: 3, impressions: 60, position: 9 },
], "query");
const compared = engine.compare(currentQueries, previousQueries, { minRankDelta: 1 });
const cleaningMove = compared.find((item) => item.query === "咖啡機清潔");
assert.equal(cleaningMove.rankDelta, 3, "rank delta is previous position minus current position");
assert.equal(cleaningMove.rankDirection, "improved", "a smaller current position is an improvement");
assert.equal(cleaningMove.status, "growing");
assert.equal(compared.find((item) => item.query === "咖啡機清潔費用").status, "decaying");
assert.equal(compared.find((item) => item.query === "舊查詢").status, "lost", "a query that only existed before is marked lost");
const currentOnly = engine.compare(currentQueries, undefined);
assert.ok(currentOnly.every((item) => item.status === "stable" && item.rankDelta === null), "without a comparison period nothing is labelled new, lost or moved");

const series = engine.dailySeries([{ date: "2026-08-02", clicks: 5, impressions: 50, position: 4 }], "2026-08-01", "2026-08-03");
assert.equal(series.length, 3, "daily series fill every date in the window");
assert.equal(series[0].clicks, 0);
assert.equal(series[1].clicks, 5);
const weeks = engine.weeklyBuckets(Array.from({ length: 91 }, (unused, index) => ({ date: engine.addDays("2026-07-01", index), clicks: 1, impressions: 2, position: 1 })), 13);
assert.equal(weeks.length, 13);
assert.ok(weeks.every((week) => week.clicks === 7), "13 weekly buckets each cover seven days");

// --- decay heatmap --------------------------------------------------------------
const decayMonths = months.map((month, index) => ({
  key: month.key,
  rows: [
    { page: "https://example.com/decaying", clicks: index < 9 ? 100 : 30, impressions: 2000 },
    { page: "https://example.com/steady", clicks: 50, impressions: 900 },
    { page: "https://example.com/rising", clicks: index < 9 ? 20 : 80, impressions: 900 },
    ...(index >= 10 ? [{ page: "https://example.com/young", clicks: 40, impressions: 400 }] : []),
  ],
}));
const decayMap = engine.buildDecayMap(decayMonths, { decayDropRatio: 0.3, decayMinClicks: 10 });
const decayOf = (name) => decayMap.find((page) => page.page.endsWith(name));
assert.equal(decayOf("decaying").status, "decaying", "a page far below its best earlier three months is flagged");
assert.equal(decayOf("decaying").change, -0.7);
assert.equal(decayOf("steady").status, "steady");
assert.equal(decayOf("rising").status, "rising");
assert.equal(decayOf("young").status, "young", "a page with under six months of data is not judged");
assert.equal(decayMap[0].page, "https://example.com/decaying", "decaying pages sort first");
assert.deepEqual(plain(decayOf("decaying").levels.slice(8)), [4, 2, 2, 2], "heat levels are relative to the page's own best month");

// --- new pages ------------------------------------------------------------------
const newPages = engine.findNewPages(
  ["https://example.com/old"],
  [
    { page: "https://example.com/old", date: "2026-09-01", clicks: 1, impressions: 10 },
    { page: "https://example.com/new", date: "2026-09-10", clicks: 0, impressions: 5 },
    { page: "https://example.com/new", date: "2026-09-12", clicks: 2, impressions: 9 },
  ],
  { start: "2026-04-06", end: "2026-09-13" },
);
assert.equal(newPages.length, 1, "pages with earlier impressions are not new");
assert.equal(newPages[0].firstSeen, "2026-09-10");
assert.equal(newPages[0].ageDays, 4);
assert.deepEqual(plain(newPages[0].series.map((point) => point.impressions)), [5, 0, 9, 0], "the daily trend starts on the debut date");

// --- striking distance and cannibalization --------------------------------------
const queryPageRows = [
  { query: "分頁查詢", page: "https://example.com/one", clicks: 4, impressions: 80, position: 14 },
  { query: "分頁查詢", page: "https://example.com/two", clicks: 2, impressions: 30, position: 16 },
  { query: "單頁查詢", page: "https://example.com/solo", clicks: 9, impressions: 300, position: 2 },
];
const queryItems = engine.group(queryPageRows, "query");
const striking = engine.findStrikingDistance(queryItems, queryPageRows, { minImpressions: 20 });
assert.equal(striking.length, 1, "only positions 3–20 are in striking distance");
assert.equal(striking[0].query, "分頁查詢");
assert.equal(striking[0].pages.length, 2, "striking-distance queries list the pages that rank");
const cannibal = engine.findCannibalization(queryPageRows, { minImpressions: 20 });
assert.equal(cannibal.length, 1, "a query needs two contending pages to be listed");
assert.equal(cannibal[0].keep, "https://example.com/one", "the page with the most clicks is the keep candidate");
assert.equal(cannibal[0].reason, "clicks");
assert.equal(engine.findCannibalization([queryPageRows[0], { ...queryPageRows[1], impressions: 3 }], { minImpressions: 20 }).length, 0, "a page with a trivial share is not a contender");

// --- jump-to-link fragments are the same page (GitHub issue #1) -----------------
assert.equal(engine.pageKey("https://x.com/a.html#sec-1"), "https://x.com/a.html", "a fragment is dropped from the page identity");
assert.equal(engine.pageKey("https://x.com/a.html"), "https://x.com/a.html");
assert.equal(engine.pageKey("https://x.com/#!/app/list"), "https://x.com/#!/app/list", "hashbang routes are separate pages and stay intact");
assert.equal(engine.pageKey("https://x.com/#/app/list"), "https://x.com/#/app/list", "hash routes are separate pages and stay intact");
const anchorRows = [
  { query: "q", clicks: 4, impressions: 80, position: 5, page: "https://x.com/a.html" },
  { query: "q", clicks: 0, impressions: 40, position: 8, page: "https://x.com/a.html#sec-1" },
];
const anchorMerged = engine.group(anchorRows, ["query", "page"]);
assert.equal(anchorMerged.length, 1, "a page and its own anchors aggregate into one page");
assert.deepEqual(plain({ page: anchorMerged[0].page, clicks: anchorMerged[0].clicks, impressions: anchorMerged[0].impressions, position: anchorMerged[0].position }), { page: "https://x.com/a.html", clicks: 4, impressions: 120, position: 6 }, "merged anchors sum clicks and impressions and impression-weight the position");
assert.equal(engine.findCannibalization(anchorRows, { minImpressions: 20 }).length, 0, "anchors of one page are not cannibalization");
const anchorQueue = engine.buildQueue(engine.compare(engine.group(anchorRows, "query"), undefined), anchorRows, engine.summarize(anchorRows), { minImpressions: 20 });
assert.ok(!anchorQueue.some((item) => item.rules.includes("page-ownership-review")), "anchors of one page do not enter page-ownership review");
const twoRealPages = [...anchorRows, { query: "q", clicks: 1, impressions: 60, position: 9, page: "https://x.com/b.html#top" }];
const realCannibal = engine.findCannibalization(twoRealPages, { minImpressions: 20 });
assert.equal(realCannibal.length, 1, "two different pages still count as cannibalization when anchors are present");
assert.deepEqual(plain(realCannibal[0].pages.map((page) => page.page)), ["https://x.com/a.html", "https://x.com/b.html"], "contending pages are listed without fragments");
const anchorDecay = engine.buildDecayMap([{ key: "2026-08", rows: [{ page: "https://x.com/a.html", clicks: 30, impressions: 300 }, { page: "https://x.com/a.html#faq", clicks: 5, impressions: 90 }] }], {});
assert.equal(anchorDecay.length, 1, "the decay map has one row per page, not one per anchor");
assert.deepEqual(plain(anchorDecay[0].clicks), [35], "anchor clicks are counted on their page");
const anchorNew = engine.findNewPages(
  ["https://x.com/old.html"],
  [
    { page: "https://x.com/old.html#faq", date: "2026-09-02", clicks: 1, impressions: 8 },
    { page: "https://x.com/new.html#intro", date: "2026-09-10", clicks: 0, impressions: 5 },
    { page: "https://x.com/new.html", date: "2026-09-12", clicks: 2, impressions: 9 },
  ],
  { start: "2026-04-06", end: "2026-09-13" },
);
assert.deepEqual(plain(anchorNew.map((page) => page.page)), ["https://x.com/new.html"], "a new anchor on a known page is not a new page, and a new page's anchors merge into it");
assert.equal(anchorNew[0].firstSeen, "2026-09-10");
assert.equal(anchorNew[0].impressions, 14);

// --- language versions ----------------------------------------------------------
assert.deepEqual(plain(engine.languageOfUrl("https://example.com/fr/guide/")), { code: "fr", kind: "subdir" });
assert.deepEqual(plain(engine.languageOfUrl("https://example.com/zh-TW/")), { code: "zh-tw", kind: "subdir" });
assert.deepEqual(plain(engine.languageOfUrl("https://de.example.com/ratgeber/")), { code: "de", kind: "subdomain" });
assert.deepEqual(plain(engine.languageOfUrl("https://example.com/blog/post/")), { code: engine.ROOT_LANGUAGE, kind: "root" });
assert.equal(engine.languageOfUrl("https://www.example.com/").kind, "root", "www is not a language subdomain");
const languages = engine.groupByLanguage(
  [{ page: "https://example.com/fr/a", clicks: 5, impressions: 50, position: 4 }, { page: "https://example.com/fr/b", clicks: 3, impressions: 30, position: 6 }, { page: "https://example.com/c", clicks: 20, impressions: 90, position: 3 }],
  [{ page: "https://example.com/fr/a", clicks: 2, impressions: 40, position: 7 }],
);
assert.equal(languages.find((item) => item.language === "fr").clicks, 8);
assert.equal(languages.find((item) => item.language === "fr").pages, 2);
assert.equal(languages.find((item) => item.language === "fr").clickDelta, 6);
const frFilter = engine.languageFilter({ code: "fr", kind: "subdir" }, languages);
assert.equal(frFilter.operator, "includingRegex");
assert.ok(new RegExp(frFilter.expression).test("https://example.com/fr/a") && !new RegExp(frFilter.expression).test("https://example.com/free/"), "the language filter matches the path segment exactly");
assert.equal(engine.languageFilter({ code: engine.ROOT_LANGUAGE, kind: "root" }, languages).operator, "excludingRegex", "the root group excludes every detected language");

// --- action queue ---------------------------------------------------------------
const queueSummary = engine.summarize(rows);
const queue = engine.buildQueue(engine.compare(currentQueries, previousQueries), rows, queueSummary, { minImpressions: 20, lowCtrRatio: 0.95 });
assert.ok(queue.some((item) => item.query === "咖啡機清潔費用" && item.rules.includes("rewrite-11-20")), "an 11–20 query with exposure enters the review queue");
assert.ok(queue.some((item) => item.query === "咖啡機清潔費用" && item.rules.includes("decline-review")), "a ranking drop is queued for review");
const ownership = engine.buildQueue(engine.compare(queryItems, undefined), queryPageRows, engine.summarize(queryPageRows), { minImpressions: 20 });
const owned = ownership.find((item) => item.rules.includes("page-ownership-review"));
assert.ok(owned, "multiple exposed pages enter page-ownership review");
assert.equal(owned.page, engine.PAGE_MULTIPLE, "multi-page candidates carry a language-neutral sentinel");
const anomalies = engine.buildAnomalies(engine.compare(currentQueries, previousQueries), { minImpressions: 20 });
assert.ok(anomalies.some((item) => item.query === "咖啡機清潔費用" && item.signals.some((signal) => signal.type === "rank")), "a large drop is surfaced as an anomaly");
assert.ok(anomalies.some((item) => item.query === "舊查詢"), "a query that lost all impressions is an anomaly");
const ctrOpportunities = engine.buildCtrOpportunities(currentQueries, queueSummary, { minImpressions: 20, lowCtrRatio: 0.95 });
assert.ok(ctrOpportunities.some((item) => item.query === "咖啡機清潔"), "a position 4–20 query below the reference CTR is surfaced");

const expectedCtr = engine.ctrBaseline([
  { position: 1, clicks: 400, impressions: 1000 },
  { position: 12, clicks: 20, impressions: 1000 },
  { position: 14, clicks: 10, impressions: 1000 },
]);
assert.equal(expectedCtr(1), 0.4, "the CTR reference is measured per position band");
assert.equal(expectedCtr(13), 0.015, "a position-13 query is compared with other 11–20 queries, not with the brand-heavy site average");
assert.equal(engine.buildCtrOpportunities([{ query: "a", position: 12, clicks: 20, impressions: 1000, ctr: 0.02 }, { query: "b", position: 14, clicks: 10, impressions: 1000, ctr: 0.01 }, { query: "brand", position: 1, clicks: 400, impressions: 1000, ctr: 0.4 }], null, { minImpressions: 20, lowCtrRatio: 0.75 }).length, 1, "only the query below its own band's reference is an opportunity");

// --- change notes ---------------------------------------------------------------
const pendingNote = engine.noteWindows("2026-10-06", 28, "2026-10-04");
assert.equal(pendingNote.days, 0, "a note newer than the data has nothing to compare yet");
const partialNote = engine.noteWindows("2026-09-28", 28, "2026-10-04");
assert.equal(partialNote.days, 7);
assert.equal(partialNote.complete, false);
assert.deepEqual(plain(partialNote.before), { start: "2026-09-21", end: "2026-09-27" }, "an incomplete after-window shrinks the before-window to the same length");
const fullNote = engine.noteWindows("2026-08-01", 28, "2026-10-04");
assert.equal(fullNote.complete, true);
assert.deepEqual(plain(fullNote.after), { start: "2026-08-01", end: "2026-08-28" });
const noteSeries = engine.dailySeries(
  [...Array.from({ length: 7 }, (unused, index) => ({ date: engine.addDays("2026-09-21", index), clicks: 10, impressions: 100, position: 8 })), ...Array.from({ length: 7 }, (unused, index) => ({ date: engine.addDays("2026-09-28", index), clicks: 15, impressions: 100, position: 6 }))],
  "2026-09-21",
  "2026-10-04",
);
const noteResult = engine.compareNote(noteSeries, partialNote);
assert.equal(noteResult.clickChange, 0.5);
assert.equal(noteResult.rankDelta, 2);

// --- rank tracking --------------------------------------------------------------
assert.deepEqual(plain(engine.parseKeywordList('keyword,volume\n"coffee maker",900\nCoffee Maker,1\n\ncold brew ratio;12\n')), ["coffee maker", "cold brew ratio"], "keyword lists drop the header, extra columns and duplicates");
const trackRange = { start: "2026-09-08", end: "2026-09-14", previous: { start: "2026-09-01", end: "2026-09-07" } };
const tracked = engine.summarizeTracked(
  [
    { date: "2026-09-02", page: "https://example.com/old", clicks: 1, impressions: 20, position: 12 },
    { date: "2026-09-10", page: "https://example.com/new", clicks: 3, impressions: 30, position: 8 },
    { date: "2026-09-11", page: "https://example.com/old", clicks: 0, impressions: 5, position: 15 },
  ],
  trackRange,
);
assert.equal(tracked.current.page, "https://example.com/new", "the ranked page is the one with the most impressions");
assert.equal(tracked.pageChanged, true, "a different ranked page than last period is flagged");
assert.equal(tracked.rankDelta, 3);
assert.equal(tracked.series.length, 14);
assert.equal(tracked.series[0].position, null, "days without impressions have no position");

// --- export ---------------------------------------------------------------------
const exportRows = [
  { query: "coffee maker", clicks: 10, impressions: 100, ctr: 0.1, position: 4 },
  { query: "=cmd()", clicks: 1, impressions: 10, ctr: 0.1, position: 30 },
];
assert.equal(engine.filterRows(exportRows, { ranges: { position: [NaN, 20] } }).length, 1, "numeric ranges filter rows");
assert.equal(engine.filterRows(exportRows, { text: [{ field: "query", op: "regex", value: "^coffee" }] }).length, 1, "regex filters rows");
assert.throws(() => engine.filterRows(exportRows, { text: [{ field: "query", op: "regex", value: "(" }] }), (error) => error.code === "badRegex");
const csv = engine.toCsv(["query", "clicks"], [['a "quoted", value', 3], ["=cmd()", 1]]);
assert.equal(csv, 'query,clicks\r\n"a ""quoted"", value",3\r\n\'=cmd(),1', "CSV cells are quoted and formula-like cells are neutralised");

// --- URL inspection -------------------------------------------------------------
const inspected = engine.normalizeInspection({ inspectionResult: { indexStatusResult: { verdict: "NEUTRAL", coverageState: "Crawled - currently not indexed", googleCanonical: "https://example.com/a", userCanonical: "https://example.com/b" } } });
assert.equal(inspected.indexed, false);
assert.equal(inspected.canonicalMismatch, true);
assert.equal(engine.normalizeInspection({ inspectionResult: { indexStatusResult: { verdict: "PASS" } } }).indexed, true);
assert.deepEqual(plain(engine.parseUrlList("https://example.com/a\nnot a url, https://example.com/b https://example.com/a")), ["https://example.com/a", "https://example.com/b"]);

// --- demo connector follows the contract ----------------------------------------
const connector = demo.createDemoConnector({ today: TODAY });
const sites = await connector.listSites();
assert.ok(sites.length >= 2 && sites.every((site) => site.siteUrl), "the demo connector lists properties");
const demoRange = engine.resolveRange("3m", TODAY);
const byDate = await connector.query({ siteUrl: sites[0].siteUrl, startDate: demoRange.start, endDate: demoRange.end, dimensions: ["date"], rowLimit: 25000 });
assert.equal(byDate.rows.length, 91, "one row per day for a date query");
const byQuery = await connector.query({ siteUrl: sites[0].siteUrl, startDate: demoRange.start, endDate: demoRange.end, dimensions: ["query"], rowLimit: 5 });
assert.equal(byQuery.rows.length, 5, "rowLimit is honoured");
assert.ok(byQuery.rows[0].clicks >= byQuery.rows[4].clicks, "rows come back sorted by clicks");
const filtered = await connector.query({ siteUrl: sites[0].siteUrl, startDate: demoRange.start, endDate: demoRange.end, dimensions: ["page"], dimensionFilterGroups: engine.buildFilterGroups({ page: { op: "contains", value: "/fr/" } }) });
assert.ok(filtered.rows.length > 0 && filtered.rows.every((row) => row.keys[0].includes("/fr/")), "dimension filters are applied");
const again = await demo.createDemoConnector({ today: TODAY }).query({ siteUrl: sites[0].siteUrl, startDate: demoRange.start, endDate: demoRange.end, dimensions: ["date"], rowLimit: 25000 });
assert.deepEqual(plain(again.rows), plain(byDate.rows), "demo data is deterministic");
const inspection = engine.normalizeInspection(await connector.inspectUrl({ siteUrl: sites[0].siteUrl, inspectionUrl: "https://pixel-coffee.example/coffee-makers/" }));
assert.ok(["PASS", "NEUTRAL"].includes(inspection.verdict));
assert.ok((await connector.fetchSitemapUrls({ siteUrl: sites[0].siteUrl })).length > 10);

// --- locales --------------------------------------------------------------------
const BUNDLED_LOCALES = ["zh-Hant", "zh-Hans", "en"];
const localeContext = { window: {}, console };
localeContext.globalThis = localeContext;
for (const [name, source] of localeSources) vm.runInNewContext(source, localeContext, { filename: `locales/${name}` });
const locales = localeContext.window.SEOCoachGscLocales;
for (const tag of BUNDLED_LOCALES) assert.ok(locales[tag], `locales/${tag}.js is bundled`);
for (const tag of ["ja", "ko"]) assert.ok(!localeFiles.includes(`${tag}.js`), `${tag} is no longer pre-written; the coach generates it on demand`);
const htmlLocaleTags = Array.from(htmlSource.matchAll(/<script src="locales\/([^"]+)\.js"><\/script>/g)).map((match) => match[1]);
assert.deepEqual(htmlLocaleTags, BUNDLED_LOCALES, "index.html ships exactly the three bundled locale files");

for (const [code, dictionary] of Object.entries(locales)) {
  assert.ok(["ltr", "rtl"].includes(dictionary.dir), `${code} declares a text direction`);
  assert.ok(typeof dictionary.name === "string" && dictionary.name.trim(), `${code} declares a native name`);
}
const englishKeys = Object.keys(locales.en).filter((key) => key !== "dir" && key !== "name");
const placeholders = (value) => (String(value).match(/\{\{[\w.-]+\}\}/g) || []).sort();
for (const [code, dictionary] of Object.entries(locales)) {
  const missing = englishKeys.filter((key) => !(key in dictionary));
  assert.equal(missing.length, 0, `${code} is missing keys: ${missing.join(", ")}`);
  const extra = Object.keys(dictionary).filter((key) => key !== "dir" && key !== "name" && !englishKeys.includes(key));
  assert.equal(extra.length, 0, `${code} has unknown keys: ${extra.join(", ")}`);
  for (const key of englishKeys) assert.deepEqual(placeholders(dictionary[key]), placeholders(locales.en[key]), `${code} keeps the placeholders of ${key}`);
}

// Every key the runtime can ask for exists in English.
const runtimeSources = [coreSource, viewsSource, appSource];
const staticKeys = runtimeSources.flatMap((source) => [...source.matchAll(/\b(?:t|col)\(\s*"([\w.-]+)"/g), ...source.matchAll(/[?:]\s*"((?:common|rank|source|connect|notes|indexing|export|evidence|detail|segments)\.[\w.-]+)"/g)].map((match) => match[1]));
const htmlKeys = Array.from(htmlSource.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)).map((match) => match[1]);
const expand = (prefix, ids, suffix = "") => ids.map((id) => `${prefix}${id}${suffix}`);
const views = ["overview", "sites", "decay", "newPages", "rank", "striking", "cannibal", "intl", "segments", "indexing", "notes", "exportData", "queue"];
const rules = ["rewrite-11-20", "rewrite-21-30", "decline-review", "snippet-review", "page-ownership-review"];
const dynamicKeys = [
  ...expand("nav.", views),
  ...expand("group.", ["dashboard", "pages", "keywords", "segments", "tools", "coach"]),
  ...expand("status.", ["checking", "none", "legacy", "setup", "live", "demo", "error"]),
  ...expand("compare.", ["previous", "year"]),
  ...expand("range.", engine.RANGE_PRESETS.map((preset) => preset.id)),
  ...expand("filter.op.", ["contains", "notContains", "equals", "regex", "notRegex"]),
  ...expand("filter.device.", ["all", "MOBILE", "DESKTOP", "TABLET"]),
  ...expand("filter.", ["query", "page", "country", "device", "date"]),
  ...expand("metric.", ["clicks", "impressions", "ctr", "position"]),
  ...expand("error.", ["noSites", "badRegex", "unknownSite", "badConnector"]),
  ...expand("movers.status.", ["all", "growing", "decaying", "new", "lost"]),
  ...expand("movers.sort.", ["clicks", "impressions", "gain", "loss", "position"]),
  ...expand("decay.status.", ["decaying", "rising", "steady", "young", "quiet"]),
  ...expand("cannibal.reason.", ["clicks", "impressions", "position"]),
  ...expand("intl.kind.", ["subdir", "subdomain", "root"]),
  ...expand("notes.kind.", ["title", "content", "redesign", "technical", "links", "other"]),
  ...expand("queue.rule.", rules, ".title"),
  ...expand("queue.rule.", rules, ".action"),
  ...expand("queue.status.", ["open", "reviewing", "in-progress", "done", "snoozed"]),
  ...expand("queue.option.", ["minImpressions", "minRankDelta", "lowCtrRatio", "maxRecommendations", "anomalyDropRatio", "anomalyRankDelta", "maxInsights"]),
  ...expand("queue.signal.", ["rank", "clicks", "impressions"]),
];
const usedKeys = new Set([...staticKeys, ...htmlKeys, ...dynamicKeys]);
for (const key of usedKeys) assert.ok(key in locales.en, `en includes ${key}`);
const unused = englishKeys.filter((key) => !usedKeys.has(key));
assert.deepEqual(unused, [], `locale keys nothing references: ${unused.join(", ")}`);
for (const id of views) assert.match(viewsSource, new RegExp(`views\\.${id} = \\{`), `the ${id} tab is implemented`);

// --- runtime boundaries ---------------------------------------------------------
for (const source of [engineSource, demoSource, coreSource, viewsSource, appSource, configSource, ...localeSources.map(([, text]) => text)]) {
  assert.doesNotMatch(source, /\bfetch\s*\(/, "panel runtime must not call fetch");
  assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|sendBeacon/, "panel runtime must not open network channels");
  assert.doesNotMatch(source, /access_token|client_secret|refresh_token|gapi\.|accounts\.google/i, "panel runtime must not handle credentials");
}
// The one place the panel may use fetch: same-origin api/ routes of the local gsc.mjs server.
const fetchTargets = Array.from(localSource.matchAll(/\bfetch\(\s*([^,)]+)/g)).map((match) => match[1].trim());
assert.ok(fetchTargets.length > 0 && fetchTargets.every((target) => /^[`"]api\//.test(target)), "local.js only fetches same-origin api/ routes");
assert.doesNotMatch(localSource, /https?:\/\//, "local.js never names an external host");
assert.match(toolSource, /webmasters\.readonly/, "the API tool asks Google for read-only access");
assert.match(toolSource, /server\.listen\(port, "127\.0\.0\.1"/, "the local server only listens on this machine");
assert.match(toolSource, /x-gsc-panel/, "API routes reject requests that do not come from the panel page");
assert.doesNotMatch(toolSource, /console\.log\([^)]*privateKey|send\([^)]*privateKey/, "the key is never printed or served");
assert.doesNotMatch(htmlSource, /<(?:script|link)[^>]+(?:src|href)=["']https?:/i, "the panel loads no external scripts, styles or fonts");
assert.match(appSource, /window\.SEOCoachGscConnector\s*\|\|\s*window\.SEOCoachGscApi/, "the panel detects the host connector");
assert.match(appSource, /connect\(connector\)/, "the panel exposes a late connector attach method");
assert.match(coreSource, /dataState: "final"/, "requests ask for final data");
assert.match(coreSource, /typeof value\.query === "function" && typeof value\.listSites === "function"/, "a connector must implement listSites and query");
assert.match(coreSource, /SEOCoachGscPanelConfig\.locale/, "the coach-set conversation language is read from panel-config.js");
assert.match(configSource, /window\.SEOCoachGscPanelConfig = \{\s*locale: "[A-Za-z-]*",\s*\};/, "panel-config.js keeps its one-line locale setting");
assert.match(coreSource, /script\.src = `locales\/\$\{encodeURIComponent\(tag\)\}\.js`/, "coach-generated locales load through an inserted script tag");
assert.match(coreSource, /LOCALE_LOAD_TIMEOUT_MS = 3000/, "a missing locale file gives up after 3 seconds");
assert.doesNotMatch(coreSource + viewsSource + appSource, /localStorage\.setItem\([^)]*rows/, "GSC rows are never written to localStorage");
assert.doesNotMatch(htmlSource + viewsSource, /currentFiles|previousFiles|pasteInput|createDatasetFromText/, "CSV/JSON performance imports are gone; data comes from the connector");

console.log(`PASS: GSC panel engine, demo connector, locale and runtime-boundary checks (${Object.keys(locales).length} locales, ${englishKeys.length} keys)`);

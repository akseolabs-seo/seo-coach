import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = join(scriptDir, "..");
const assetDir = join(skillDir, "assets", "gsc-dashboard");
const engineSource = await readFile(join(assetDir, "engine.js"), "utf8");
const localesSource = await readFile(join(assetDir, "locales.js"), "utf8");
const appSource = await readFile(join(assetDir, "app.js"), "utf8");
const htmlSource = await readFile(join(assetDir, "index.html"), "utf8");

const context = { window: {}, console };
context.globalThis = context;
vm.runInNewContext(engineSource, context, { filename: "engine.js" });
const engine = context.window.SEOCoachGscEngine;
assert.ok(engine, "engine must be exposed for the browser app");

const currentCsv = [
  "Query,Clicks,Impressions,CTR,Position,Page,Date",
  '咖啡機清潔,10,"1,000","1%",10,https://example.com/a,2026-08-01',
  '咖啡機清潔,20,1000,2%,20,https://example.com/a,2026-08-02',
  "咖啡機清潔費用,12,500,2.4%,14,https://example.com/b,2026-08-02",
].join("\n");
const previousCsv = [
  "Query,Clicks,Impressions,CTR,Position,Page",
  "咖啡機清潔,9,900,1%,18,https://example.com/a",
  "咖啡機清潔費用,20,520,3.85%,10,https://example.com/b",
].join("\n");

const current = engine.createDatasetFromText(currentCsv, "current.csv");
const previous = engine.createDatasetFromText(previousCsv, "previous.csv");
assert.equal(current.rows.length, 3, "CSV parser keeps all query rows");
assert.equal(current.rows[0].impressions, 1000, "thousands separators parse as numbers");
assert.equal(current.rows[0].ctr, 0.01, "percent CTR parses as a ratio");
assert.equal(current.dateRange.start, "2026-08-01");
assert.equal(current.dateRange.end, "2026-08-02");

const apiJson = JSON.stringify({
  dimensions: ["query", "page"],
  siteUrl: "sc-domain:example.com",
  propertyName: "Example Search Console",
  dataState: "final",
  rowLimit: 25000,
  totalRows: 25001,
  partial: true,
  startDate: "2026-08-01",
  endDate: "2026-08-28",
  rows: [{ keys: ["API 查詢", "https://example.com/api"], clicks: 3, impressions: 30, ctr: 0.1, position: 4.2 }],
});
const fromApiShape = engine.createDatasetFromText(apiJson, "api.json");
assert.equal(fromApiShape.rows[0].query, "API 查詢", "GSC API keys map to query");
assert.equal(fromApiShape.rows[0].page, "https://example.com/api", "GSC API keys map to page");
assert.equal(fromApiShape.propertyName, "Example Search Console", "API property metadata is preserved");
assert.equal(fromApiShape.rowLimit, 25000, "API row limit metadata is preserved");
assert.equal(fromApiShape.totalRows, 25001, "API total row metadata is preserved");
assert.equal(fromApiShape.partial, true, "API partial/truncation metadata is preserved");
assert.deepEqual(Array.from(fromApiShape.dimensions), ["query", "page"], "API dimensions metadata is preserved");
const apiPeriod = engine.createDatasetFromText(JSON.stringify({
  dimensions: ["query", "page"],
  startDate: "2026-08-01",
  endDate: "2026-08-28",
  rows: [{ keys: ["API 期間", "https://example.com/api"], clicks: 5, impressions: 50, ctr: 0.1, position: 6.4 }],
}), "api-period.json", { format: "gsc-api", startDate: "2026-08-01", endDate: "2026-08-28" });
assert.equal(apiPeriod.format, "gsc-api", "API connector format is preserved");
assert.equal(apiPeriod.dateRange.start, "2026-08-01", "API start date metadata is preserved without a date dimension");
assert.equal(apiPeriod.dateRange.end, "2026-08-28", "API end date metadata is preserved without a date dimension");
const dateDataset = engine.createDatasetFromRecords([{ query: "日期查詢", clicks: 1, impressions: 10, position: 2, date: "2026-08-01" }], "dated");
assert.equal(dateDataset.dateRange.start, "2026-08-01", "date dimension is preserved");

const currentQueries = engine.aggregateRows(current.rows, "query");
assert.equal(currentQueries.length, 2, "duplicate query rows aggregate into one query");
assert.equal(currentQueries.find((item) => item.query === "咖啡機清潔").position, 15, "position is impression-weighted");
assert.equal(currentQueries.find((item) => item.query === "咖啡機清潔").ctr, 0.015, "CTR is total clicks divided by total impressions");

const model = engine.buildModel(current, previous, {
  minImpressions: 20,
  minRankDelta: 1,
  lowCtrRatio: 0.95,
  maxRecommendations: 30,
});
assert.equal(model.queryCount, 2);
assert.ok(model.distribution.find((bucket) => bucket.id === "page2").count >= 1, "11-20 bucket counts aggregated query");
const cleaningMovement = model.comparisons.find((item) => item.query === "咖啡機清潔");
assert.equal(cleaningMovement.rankDirection, "improved", "lower current average position is an improvement");
assert.equal(cleaningMovement.rankDelta, 3, "rank delta is previous position minus current position");
assert.ok(model.recommendations.some((item) => item.rule === "rewrite-11-20" && item.query === "咖啡機清潔費用"), "11-20 exposure candidate enters rewrite review queue");

const currentOnly = engine.buildModel(current, null, { minImpressions: 20 });
assert.equal(currentOnly.hasComparison, false);
assert.equal(currentOnly.movementSummary.new, 0, "current-only data is not falsely labelled as new");
assert.ok(currentOnly.comparisons.every((item) => item.primary === "stable"), "current-only movement stays unclassified");

const ownershipDataset = engine.createDatasetFromRecords([
  { query: "分頁查詢", clicks: 4, impressions: 80, position: 14, page: "https://example.com/one" },
  { query: "分頁查詢", clicks: 2, impressions: 30, position: 16, page: "https://example.com/two" },
], "ownership");
const ownershipModel = engine.buildModel(ownershipDataset, null, { minImpressions: 20 });
assert.ok(ownershipModel.recommendations.some((item) => item.rule === "page-ownership-review"), "multiple exposed pages enter page-ownership review");
assert.ok(model.anomalies.some((item) => item.query === "咖啡機清潔費用"), "large movement is surfaced as a deterministic anomaly");
assert.ok(model.ctrOpportunities.some((item) => item.query === "咖啡機清潔"), "position 4-20 low CTR opportunity is surfaced");

const localeContext = { window: {}, console };
localeContext.globalThis = localeContext;
vm.runInNewContext(localesSource, localeContext, { filename: "locales.js" });
const locales = localeContext.window.SEOCoachGscLocales;
assert.deepEqual(Object.keys(locales).sort(), ["en", "ja", "ko", "zh-Hans", "zh-Hant"], "one locale template ships for all supported languages");
const translationKeys = [
  ...appSource.matchAll(/translate\("([^"]+)"/g),
  ...htmlSource.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g),
  ...engineSource.matchAll(/"(recommendations\.[^"]+)"/g),
].map((match) => match[1]);
for (const [locale, dictionary] of Object.entries(locales)) {
  for (const key of translationKeys) assert.ok(key in dictionary, `${locale} includes ${key}`);
}

for (const source of [engineSource, appSource, localesSource]) {
  assert.doesNotMatch(source, /\bfetch\s*\(/, "dashboard runtime must not call fetch");
  assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource/, "dashboard runtime must not open network channels");
}
assert.match(appSource, /window\.SEOCoachGscConnector\s*\|\|\s*window\.SEOCoachGscApi/, "dashboard detects the optional host API bridge");
assert.match(appSource, /includePrevious:\s*true/, "dashboard requests an optional comparison period");
assert.match(appSource, /rowLimit:\s*25000/, "dashboard bridge request uses the supported row limit");
assert.match(appSource, /dataState:\s*"final"/, "dashboard bridge request asks for final data");
assert.match(appSource, /connect\(connector\)/, "dashboard exposes a late connector attach method");
assert.match(appSource, /navigator\.languages/, "dashboard detects the first-run browser language");
assert.match(appSource, /seo-coach-gsc-dashboard-locale-v1/, "dashboard persists the selected locale locally");
assert.match(appSource, /QUEUE_STORAGE_KEY/, "rewrite queue state is stored locally");
assert.match(appSource, /data-query-detail/, "keyword rows open deterministic detail panels");
assert.match(htmlSource, /id="anomalyList"/, "dashboard includes deterministic anomaly signals");
assert.match(htmlSource, /id="ctrOpportunityList"/, "dashboard includes deterministic CTR opportunities");
assert.match(htmlSource, /id="keywordDetailDialog"/, "dashboard includes keyword detail dialog");
assert.match(htmlSource, /<script src="locales\.js"><\/script>/, "dashboard loads the local locale template");
assert.doesNotMatch(htmlSource, /<script[^>]+src=["']https?:/i, "dashboard must not load external scripts");

console.log("PASS: GSC dashboard engine and local-only runtime checks");

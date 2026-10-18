#!/usr/bin/env node
// GSC tools for SEO Coach: one file, no dependencies (Node 18+).
//
//   node assets/gsc-tools/gsc.mjs check                      verify the key and list properties
//   node assets/gsc-tools/gsc.mjs serve [--port 8791]        open the GSC Panel on live data
//   node assets/gsc-tools/gsc.mjs sites
//   node assets/gsc-tools/gsc.mjs summary --site <property> [--last 28] [--compare previous|year]
//   node assets/gsc-tools/gsc.mjs query --site <property> --last 28 --dims query,page [--limit 50]
//                                       [--filter "page contains /blog/"] [--start YYYY-MM-DD --end YYYY-MM-DD]
//   node assets/gsc-tools/gsc.mjs around --site <property> --date YYYY-MM-DD [--days 14] [--filter ...]
//   node assets/gsc-tools/gsc.mjs inspect --site <property> --url <url>
//   node assets/gsc-tools/gsc.mjs updates [--days 180]       Google's own list of ranking updates
//
// Authentication is a Google service-account key (read-only scope). The key file is
// looked up in this order: --key <path>, GSC_SERVICE_ACCOUNT_KEY, GOOGLE_APPLICATION_CREDENTIALS,
// ~/.seo-coach/gsc-service-account.json. It is read from disk, never printed, never served.

import { createSign } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const panelDir = join(here, "..", "gsc-dashboard");
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const DEFAULT_KEY = join(homedir(), ".seo-coach", "gsc-service-account.json");
const UPDATES_FEED = "https://status.search.google.com/incidents.json";
const UPDATES_PAGE = "https://status.search.google.com/";

class ToolError extends Error {
  constructor(code, message, hint, status) {
    super(message);
    this.code = code;
    this.hint = hint || "";
    this.status = status || 500;
  }
}

// --- arguments ------------------------------------------------------------------
function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }
    const name = item.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) args[name] = true;
    else {
      args[name] = args[name] === undefined ? next : [].concat(args[name], next);
      index += 1;
    }
  }
  return args;
}

// --- engine (shared with the panel, so the CLI and the panel agree on the maths) ---
let enginePromise = null;
function loadEngine() {
  if (!enginePromise) {
    enginePromise = readFile(join(panelDir, "engine.js"), "utf8").then((source) => {
      const context = { window: {} };
      context.globalThis = context;
      vm.runInNewContext(source, context, { filename: "engine.js" });
      return context.window.SEOCoachGscEngine;
    });
  }
  return enginePromise;
}

// --- authentication -------------------------------------------------------------
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findKeyPath(explicit) {
  const candidates = [explicit, process.env.GSC_SERVICE_ACCOUNT_KEY, process.env.GOOGLE_APPLICATION_CREDENTIALS, DEFAULT_KEY].filter((value) => typeof value === "string" && value);
  for (const path of candidates) if (await exists(path)) return path;
  return null;
}

function createAuth(explicitKey) {
  let key = null;
  let token = null;
  let expires = 0;

  async function loadKey() {
    if (key) return key;
    const path = await findKeyPath(explicitKey);
    if (!path) throw new ToolError("noKey", "No service-account key file was found.", `Save the JSON key as ${DEFAULT_KEY} or set GSC_SERVICE_ACCOUNT_KEY to its path.`, 401);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path, "utf8"));
    } catch {
      throw new ToolError("badKey", `The key file at ${path} is not valid JSON.`, "Download the key again from Google Cloud → Service accounts → Keys → JSON.", 401);
    }
    const tokenUri = parsed.token_uri || "https://oauth2.googleapis.com/token";
    if (parsed.type === "service_account" && parsed.client_email && parsed.private_key) {
      key = { path, kind: "service_account", email: parsed.client_email, privateKey: parsed.private_key, tokenUri };
    } else if (parsed.refresh_token && parsed.client_id && parsed.client_secret) {
      // An authorised-user file (the shape gcloud and Google's client libraries save) also works,
      // for people whose organisation does not allow service-account keys.
      key = { path, kind: "authorized_user", email: parsed.account || "the signed-in Google account", clientId: parsed.client_id, clientSecret: parsed.client_secret, refreshToken: parsed.refresh_token, tokenUri };
    } else {
      throw new ToolError("badKey", `The file at ${path} is not a usable Google credential.`, "It must be a service-account JSON key (type: service_account), or an authorised-user file with client_id, client_secret and refresh_token.", 401);
    }
    return key;
  }

  async function accessToken() {
    if (token && Date.now() < expires - 60000) return token;
    const account = await loadKey();
    let grant;
    if (account.kind === "authorized_user") {
      grant = { grant_type: "refresh_token", client_id: account.clientId, client_secret: account.clientSecret, refresh_token: account.refreshToken };
    } else {
      const now = Math.floor(Date.now() / 1000);
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
      const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: account.email, scope: SCOPE, aud: account.tokenUri, iat: now, exp: now + 3600 })}`;
      grant = { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${createSign("RSA-SHA256").update(unsigned).sign(account.privateKey, "base64url")}` };
    }
    const response = await fetch(account.tokenUri, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(grant),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      throw new ToolError("tokenFailed", `Google rejected the key: ${body.error_description || body.error || response.status}.`, "Check that the key was not deleted in Google Cloud and that this computer's clock is correct.", 401);
    }
    token = body.access_token;
    expires = Date.now() + (body.expires_in || 3600) * 1000;
    return token;
  }

  return { loadKey, accessToken };
}

// --- Search Console API ---------------------------------------------------------
function explain(status, message, account) {
  const text = String(message || "");
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(text)) return new ToolError("apiDisabled", "The Google Search Console API is not enabled for the key's project.", "Google Cloud Console → APIs & Services → Library → “Google Search Console API” → Enable, in the same project as the service account.", 403);
  if (status === 403) return new ToolError("noPermission", "The service account cannot read this property.", `Search Console → Settings → Users and permissions → Add user → ${account || "the service account's client_email"} (Restricted is enough).`, 403);
  if (status === 429) return new ToolError("quota", "Google's API quota was hit.", "Wait a minute and try again; URL Inspection is limited to about 2,000 checks per property per day.", 429);
  if (status === 400) return new ToolError("badRequest", `Google rejected the request: ${text}`, "Check the dates (YYYY-MM-DD, inside the last 16 months), the dimensions and the filter expression.", 400);
  return new ToolError("apiError", `Search Console API error ${status}: ${text}`, "", status);
}

function createApi(auth) {
  async function call(url, body) {
    const token = await auth.accessToken();
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw explain(response.status, data.error && data.error.message, (await auth.loadKey()).email);
    return data;
  }
  const site = (siteUrl) => {
    if (!siteUrl) throw new ToolError("noSite", "A property is required.", "Pass --site with a value from the `sites` command, e.g. sc-domain:example.com.", 400);
    return encodeURIComponent(siteUrl);
  };

  const api = {
    async listSites() {
      const data = await call("https://www.googleapis.com/webmasters/v3/sites");
      return (data.siteEntry || []).filter((entry) => entry.permissionLevel !== "siteUnverifiedUser").map((entry) => ({ siteUrl: entry.siteUrl, permissionLevel: entry.permissionLevel }));
    },
    query(request) {
      const { siteUrl, ...body } = request;
      return call(`https://www.googleapis.com/webmasters/v3/sites/${site(siteUrl)}/searchAnalytics/query`, body);
    },
    inspectUrl(request) {
      return call("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: request.inspectionUrl, siteUrl: request.siteUrl, languageCode: request.languageCode || "en" });
    },
    // Expand a sitemap (or the property's submitted sitemaps) into page URLs.
    async fetchSitemapUrls(request) {
      const domain = String(request.siteUrl || "").replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
      let queue = [];
      if (request.sitemapUrl) queue = [request.sitemapUrl];
      else queue = ((await call(`https://www.googleapis.com/webmasters/v3/sites/${site(request.siteUrl)}/sitemaps`)).sitemap || []).map((entry) => entry.path);
      const urls = new Set();
      for (let fetched = 0; queue.length && fetched < 20 && urls.size < 5000; fetched += 1) {
        const target = queue.shift();
        let host = "";
        try {
          const parsed = new URL(target);
          if (!/^https?:$/.test(parsed.protocol)) continue;
          host = parsed.hostname.toLowerCase();
        } catch {
          continue;
        }
        if (host !== domain && !host.endsWith(`.${domain}`)) throw new ToolError("sitemapHost", `The sitemap ${target} is not on ${domain}.`, "Only sitemaps on the selected property's own domain are read.", 400);
        const response = await fetch(target, { redirect: "follow" });
        if (!response.ok) throw new ToolError("sitemapFetch", `Could not read ${target} (HTTP ${response.status}).`, "Open the sitemap in a browser to confirm it exists.", 502);
        const xml = await response.text();
        const locs = Array.from(xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi)).map((match) => match[1].replace(/&amp;/g, "&"));
        if (/<sitemapindex/i.test(xml)) queue.push(...locs);
        else for (const loc of locs) urls.add(loc);
      }
      return Array.from(urls).slice(0, 5000);
    },
    // Google's own incident feed, filtered to ranking updates.
    async listUpdates(options) {
      const response = await fetch(UPDATES_FEED);
      if (!response.ok) throw new ToolError("updatesFetch", `Could not read Google's Search Status feed (HTTP ${response.status}).`, `Open ${UPDATES_PAGE} in a browser instead.`, 502);
      const since = options && options.since ? options.since : "";
      return (await response.json())
        .filter((incident) => incident.service_name === "Ranking" || (incident.affected_products || []).some((product) => product.title === "Ranking"))
        .map((incident) => ({ date: String(incident.begin || "").slice(0, 10), end: incident.end ? String(incident.end).slice(0, 10) : "", title: incident.external_desc || "", url: `${UPDATES_PAGE}${incident.uri || ""}`, source: "Google Search Status Dashboard" }))
        .filter((update) => update.date && update.date >= since)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    },
  };
  return api;
}

// --- CLI helpers ----------------------------------------------------------------
const OPERATORS = { contains: "contains", "not-contains": "notContains", equals: "equals", "not-equals": "notEquals", regex: "includingRegex", "not-regex": "excludingRegex" };

function parseFilters(value) {
  const filters = [];
  for (const text of [].concat(value || [])) {
    const match = String(text).match(/^(query|page|country|device)\s+(contains|not-contains|equals|not-equals|regex|not-regex)\s+(.+)$/i);
    if (!match) throw new ToolError("badFilter", `Cannot read the filter "${text}".`, 'Use: --filter "<query|page|country|device> <contains|not-contains|equals|not-equals|regex|not-regex> <value>"', 400);
    filters.push({ dimension: match[1].toLowerCase(), operator: OPERATORS[match[2].toLowerCase()], expression: match[3].trim() });
  }
  return filters.length ? [{ groupType: "and", filters }] : undefined;
}

async function resolveWindow(args, engine) {
  const today = engine.localToday();
  if (args.start && args.end) {
    if (!engine.isIsoDate(args.start) || !engine.isIsoDate(args.end)) throw new ToolError("badDate", "Dates must be YYYY-MM-DD.", "", 400);
    const days = engine.diffDays(args.start, args.end) + 1;
    const previousEnd = engine.addDays(args.start, -1);
    return { start: args.start, end: args.end, days, previous: { start: engine.addDays(previousEnd, -(days - 1)), end: previousEnd } };
  }
  const days = Math.max(1, Math.min(480, Number(args.last) || 28));
  const end = engine.addDays(today, -engine.DATA_LAG_DAYS);
  const start = engine.addDays(end, -(days - 1));
  const shift = args.compare === "year" ? 364 : days;
  const previous = { start: engine.addDays(start, -shift), end: engine.addDays(end, -shift) };
  return { start, end, days, previous: previous.start >= engine.oldestDate(today) ? previous : null };
}

const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;
const tidy = (total) => ({ clicks: total.clicks, impressions: total.impressions, ctr: round(total.ctr, 4), position: round(total.position, 1) });

const BOUNDARY = "Average position is a period average, not a live SERP rank. Query rows exclude anonymized queries. A difference between two periods is not a cause.";

async function runCommand(command, args, api) {
  const engine = await loadEngine();
  const base = (window, dimensions, extra) => ({ siteUrl: args.site, startDate: window.start, endDate: window.end, dimensions, type: "web", dataState: "final", rowLimit: engine.ROW_LIMIT, dimensionFilterGroups: extra || parseFilters(args.filter) });
  const rows = async (window, dimensions) => engine.rowsFromResponse(await api.query(base(window, dimensions)), dimensions);

  if (command === "sites") return api.listSites();
  if (command === "updates") return { source: UPDATES_PAGE, updates: await api.listUpdates({ since: engine.addDays(engine.localToday(), -(Number(args.days) || 180)) }) };
  if (command === "inspect") {
    if (!args.url) throw new ToolError("noUrl", "A URL is required.", "Pass --url with the full address of one page.", 400);
    return { url: args.url, ...engine.normalizeInspection(await api.inspectUrl({ siteUrl: args.site, inspectionUrl: args.url })) };
  }
  if (command === "query") {
    const window = await resolveWindow(args, engine);
    const dimensions = String(args.dims || "query").split(",").map((item) => item.trim()).filter(Boolean);
    const all = await rows(window, dimensions);
    const limit = Math.max(1, Number(args.limit) || 50);
    return { site: args.site, period: { start: window.start, end: window.end }, dimensions, returned: all.length, partial: all.length >= engine.ROW_LIMIT, rows: all.slice(0, limit).map((row) => ({ ...Object.fromEntries(dimensions.map((dimension) => [dimension, row[dimension]])), ...tidy(row) })), boundary: BOUNDARY };
  }
  if (command === "summary") {
    const window = await resolveWindow(args, engine);
    const [current, previous, queries, previousQueries] = await Promise.all([
      rows(window, ["date"]),
      window.previous ? rows(window.previous, ["date"]) : null,
      rows(window, ["query"]),
      window.previous ? rows(window.previous, ["query"]) : null,
    ]);
    const compared = engine.compare(engine.group(queries, "query"), previousQueries ? engine.group(previousQueries, "query") : undefined);
    const movers = (direction) => compared.filter((item) => (direction > 0 ? item.clickDelta > 0 : item.clickDelta < 0)).sort((a, b) => direction * (b.clickDelta - a.clickDelta)).slice(0, 5).map((item) => ({ query: item.query, clicks: item.clicks, clickDelta: item.clickDelta, position: item.position, rankDelta: item.rankDelta }));
    return {
      site: args.site,
      period: { start: window.start, end: window.end },
      comparison: window.previous || null,
      totals: tidy(engine.summarize(current)),
      previousTotals: previous ? tidy(engine.summarize(previous)) : null,
      rankBuckets: engine.rankBuckets(engine.group(queries, "query")).buckets.map((bucket) => ({ range: Number.isFinite(bucket.max) ? `${bucket.min}-${bucket.max}` : `${bucket.min}+`, queries: bucket.count })),
      topGains: previousQueries ? movers(1) : [],
      topLosses: previousQueries ? movers(-1) : [],
      boundary: BOUNDARY,
    };
  }
  if (command === "around") {
    if (!engine.isIsoDate(args.date)) throw new ToolError("badDate", "--date must be YYYY-MM-DD.", "", 400);
    const lastData = engine.addDays(engine.localToday(), -engine.DATA_LAG_DAYS);
    const windows = engine.noteWindows(args.date, Number(args.days) || 14, lastData);
    if (!windows.days) return { site: args.site, date: args.date, status: "no data after this date yet", readyOn: windows.readyOn };
    const span = { start: windows.before.start, end: windows.after.end };
    const result = engine.compareNote(engine.dailySeries(await rows(span, ["date"]), span.start, span.end), windows);
    return {
      site: args.site,
      date: args.date,
      days: windows.days,
      complete: windows.complete,
      before: { ...windows.before, ...tidy(result.before) },
      after: { ...windows.after, ...tidy(result.after) },
      clickChange: result.clickChange == null ? null : round(result.clickChange, 3),
      impressionChange: result.impressionChange == null ? null : round(result.impressionChange, 3),
      rankDelta: result.rankDelta,
      boundary: `${BOUNDARY} Seasonality, other site changes and overlapping updates are not ruled out by this comparison.`,
    };
  }
  throw new ToolError("unknownCommand", `Unknown command "${command}".`, "Run with --help to see the commands.", 400);
}

async function check(auth, api) {
  const steps = [];
  const step = async (name, action) => {
    try {
      steps.push({ step: name, ok: true, detail: await action() });
      return true;
    } catch (error) {
      steps.push({ step: name, ok: false, detail: error.message, hint: error.hint || "" });
      return false;
    }
  };
  if (!(await step("1. key file found and readable", async () => `${(await auth.loadKey()).kind === "authorized_user" ? "authorised user" : "service account"} ${(await auth.loadKey()).email}`))) return steps;
  if (!(await step("2. Google accepts the key", async () => ((await auth.accessToken()) ? "access token issued" : "")))) return steps;
  await step("3. Search Console API enabled and at least one property shared", async () => {
    const sites = await api.listSites();
    if (!sites.length) throw new ToolError("noSites", "The API works, but no property is shared with this service account yet.", `Search Console → Settings → Users and permissions → Add user → ${(await auth.loadKey()).email}`);
    return sites.map((entry) => entry.siteUrl).join(", ");
  });
  return steps;
}

// --- local panel server ---------------------------------------------------------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

function serve(args, auth, api) {
  const port = Number(args.port) || 8791;
  const allowed = new Set([`127.0.0.1:${port}`, `localhost:${port}`, ...[].concat(args["allow-host"] || []).filter((host) => typeof host === "string")]);
  const send = (response, status, body) => {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify(body));
  };
  const readBody = (request) =>
    new Promise((resolve, reject) => {
      let text = "";
      request.on("data", (chunk) => {
        text += chunk;
        if (text.length > 1e6) reject(new ToolError("tooLarge", "Request body too large.", "", 413));
      });
      request.on("end", () => {
        try {
          resolve(text ? JSON.parse(text) : {});
        } catch {
          reject(new ToolError("badJson", "Request body is not JSON.", "", 400));
        }
      });
    });

  const server = createServer(async (request, response) => {
    try {
      // Only this machine's own panel page may talk to the API routes.
      if (!allowed.has(String(request.headers.host || "").toLowerCase())) return send(response, 403, { error: { code: "badHost", message: "Host not allowed." } });
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        const route = url.pathname.slice(5);
        if (route === "status" && request.method === "GET") {
          try {
            return send(response, 200, { ok: true, hasKey: true, account: (await auth.loadKey()).email });
          } catch (error) {
            return send(response, 200, { ok: true, hasKey: false, code: error.code, message: error.message, hint: error.hint, defaultKeyPath: DEFAULT_KEY });
          }
        }
        if (request.method !== "POST" || request.headers["x-gsc-panel"] !== "1") return send(response, 403, { error: { code: "forbidden", message: "Panel requests only." } });
        const body = await readBody(request);
        if (route === "sites") return send(response, 200, await api.listSites());
        if (route === "query") return send(response, 200, await api.query(body));
        if (route === "inspect") return send(response, 200, await api.inspectUrl(body));
        if (route === "sitemap") return send(response, 200, await api.fetchSitemapUrls(body));
        if (route === "updates") return send(response, 200, await api.listUpdates(body));
        return send(response, 404, { error: { code: "notFound", message: "Unknown route." } });
      }
      if (request.method !== "GET") return send(response, 405, { error: { code: "method", message: "GET only." } });
      const relative = normalize(decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)).replace(/^[\\/]+/, "");
      const file = join(panelDir, relative);
      if (!file.startsWith(panelDir + sep) || !MIME[extname(file)]) return send(response, 404, { error: { code: "notFound", message: "Not found." } });
      const content = await readFile(file).catch(() => null);
      if (!content) return send(response, 404, { error: { code: "notFound", message: "Not found." } });
      response.writeHead(200, { "content-type": MIME[extname(file)], "cache-control": "no-store" });
      response.end(content);
    } catch (error) {
      send(response, error.status || 500, { error: { code: error.code || "error", message: error.message, hint: error.hint || "" } });
    }
  });
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? `Port ${port} is already in use. Try: node assets/gsc-tools/gsc.mjs serve --port ${port + 1}` : `Could not start the local server: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", async () => {
    const key = await findKeyPath(args.key);
    console.log(`GSC Panel: http://127.0.0.1:${port}/`);
    console.log(key ? `Key: ${key}` : `No key yet. Save the service-account JSON as ${DEFAULT_KEY}, then reload the page.`);
    console.log("Press Ctrl+C to stop.");
  });
  return server;
}

// --- entry ----------------------------------------------------------------------
const HELP = `GSC tools for SEO Coach

  check                         verify the key, the API and shared properties
  serve [--port 8791]           open the GSC Panel on live data (http://127.0.0.1:8791/)
  sites                         list properties shared with the service account
  summary --site <p> [--last 28] [--compare previous|year] [--filter ...]
  query   --site <p> [--last 28 | --start D --end D] [--dims query,page] [--limit 50] [--filter ...]
  around  --site <p> --date YYYY-MM-DD [--days 14] [--filter ...]   equal windows before and after a date
  inspect --site <p> --url <url>
  updates [--days 180]          Google's own list of ranking updates

  --filter "<query|page|country|device> <contains|not-contains|equals|not-equals|regex|not-regex> <value>"
  --key <path>                  service-account JSON (default: ${DEFAULT_KEY})`;

export { createAuth, createApi, parseArgs, parseFilters, runCommand, serve, ToolError };

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (invoked) {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const auth = createAuth(typeof args.key === "string" ? args.key : undefined);
  const api = createApi(auth);
  // exitCode instead of process.exit(): lets pending network handles close cleanly on Windows.
  if (!command || args.help) {
    console.log(HELP);
    if (!command && !args.help) process.exitCode = 1;
  } else if (command === "serve") serve(args, auth, api);
  else {
    try {
      const result = command === "check" ? await check(auth, api) : await runCommand(command, args, api);
      console.log(JSON.stringify(result, null, 2));
      if (command === "check" && result.some((step) => !step.ok)) process.exitCode = 1;
    } catch (error) {
      console.error(JSON.stringify({ error: { code: error.code || "error", message: error.message, hint: error.hint || "" } }, null, 2));
      process.exitCode = 1;
    }
  }
}

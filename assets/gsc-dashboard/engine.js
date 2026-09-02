(function (root) {
  "use strict";

  const BUCKETS = [
    { id: "top3", label: "1–3", min: 1, max: 3 },
    { id: "top10", label: "4–10", min: 4, max: 10 },
    { id: "page2", label: "11–20", min: 11, max: 20 },
    { id: "page3", label: "21–30", min: 21, max: 30 },
    { id: "page4", label: "31–50", min: 31, max: 50 },
    { id: "beyond50", label: "51+", min: 51, max: Infinity },
  ];

  const FIELD_ALIASES = {
    query: [
      "query",
      "queries",
      "top query",
      "top queries",
      "keyword",
      "keywords",
      "search query",
      "search queries",
      "查詢",
      "搜尋查詢",
      "關鍵字",
      "關鍵詞",
      "搜索查询",
      "查询",
    ],
    page: [
      "page",
      "pages",
      "top pages",
      "landing page",
      "url",
      "網頁",
      "頁面",
      "網址",
      "页面",
    ],
    date: ["date", "日期", "日", "日期（天）", "day"],
    clicks: ["clicks", "click", "點擊次數", "點擊", "点击次数", "点击"],
    impressions: [
      "impressions",
      "impression",
      "曝光次數",
      "曝光",
      "展示次数",
      "展示",
    ],
    ctr: ["ctr", "click through rate", "click-through rate", "點閱率", "点击率"],
    position: [
      "position",
      "average position",
      "avg position",
      "平均排名",
      "平均位置",
      "平均排名位置",
      "平均排名（位置）",
    ],
    country: ["country", "國家", "国家"],
    device: ["device", "裝置", "设备"],
    searchAppearance: ["search appearance", "搜尋外觀", "搜索外观"],
  };

  const ALIAS_INDEX = Object.keys(FIELD_ALIASES).reduce((index, field) => {
    index[field] = new Set(FIELD_ALIASES[field].map(normalizeHeader));
    return index;
  }, {});

  function normalizeHeader(value) {
    return String(value == null ? "" : value)
      .replace(/^\uFEFF/, "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s_\-\/()[\]{}:：%％]/g, "")
      .trim();
  }

  function normalizeQuery(value) {
    return String(value == null ? "" : value)
      .replace(/^\uFEFF/, "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  function normalizePage(value) {
    return String(value == null ? "" : value).trim();
  }

  function round(value, digits) {
    if (!Number.isFinite(value)) return null;
    const factor = 10 ** (digits == null ? 2 : digits);
    return Math.round(value * factor) / factor;
  }

  function parseMetric(value, kind) {
    if (value == null || value === "") return null;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return null;
      if (kind === "ctr" && value > 1) return value / 100;
      return value;
    }

    let text = String(value).replace(/\u00A0/g, " ").trim();
    if (!text || /^(n\/a|na|null|undefined|—|-|未提供)$/i.test(text)) return null;
    const hasPercent = /[%％]/.test(text);
    text = text.replace(/[%％]/g, "").replace(/\s/g, "");

    if (text.includes(",") && text.includes(".")) {
      text = text.replace(/,/g, "");
    } else if (text.includes(",") && /,\d{1,2}$/.test(text)) {
      text = text.replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }

    const match = text.match(/[-+]?\d+(?:\.\d+)?/);
    if (!match) return null;
    const number = Number(match[0]);
    if (!Number.isFinite(number)) return null;
    if (kind === "ctr" && (hasPercent || number > 1)) return number / 100;
    return number;
  }

  function getField(record, field) {
    if (!record || typeof record !== "object") return null;
    const entries = Object.entries(record);
    const direct = entries.find(([key]) => ALIAS_INDEX[field].has(normalizeHeader(key)));
    return direct ? direct[1] : null;
  }

  function sanitizeDate(value) {
    if (value == null || value === "") return null;
    const text = String(value).trim();
    const iso = text.match(/\d{4}-\d{2}-\d{2}/);
    return iso ? iso[0] : text;
  }

  function normalizeDateRange(value) {
    if (!value || typeof value !== "object") return null;
    const start = sanitizeDate(value.start != null ? value.start : value.startDate);
    const end = sanitizeDate(value.end != null ? value.end : value.endDate);
    if (!start && !end) return null;
    return { start: start || null, end: end || null };
  }

  function normalizeSourceMetadata(metadata, returnedRows) {
    const source = metadata && typeof metadata === "object" ? metadata : {};
    const numberOrNull = (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= 0 ? number : null;
    };
    const propertyName = String(source.propertyName || source.property || source.siteName || "").trim();
    const siteUrl = String(source.siteUrl || source.site || source.propertyUrl || "").trim();
    const rowLimit = numberOrNull(source.rowLimit);
    const totalRows = numberOrNull(source.totalRows != null ? source.totalRows : source.totalRowCount);
    const partial = source.partial === true || source.truncated === true || (rowLimit != null && totalRows != null && totalRows > rowLimit);
    const dimensions = Array.isArray(source.dimensions) ? source.dimensions.map((value) => String(value)).filter(Boolean) : [];
    const syncedAt = source.syncedAt || source.fetchedAt || source.generatedAt || null;
    return {
      propertyName,
      siteUrl,
      dimensions,
      dataState: source.dataState ? String(source.dataState) : "",
      rowLimit,
      totalRows,
      partial,
      syncedAt: syncedAt ? String(syncedAt) : null,
      scope: source.scope && typeof source.scope === "object" ? source.scope : null,
      returnedRows: Number.isFinite(returnedRows) ? returnedRows : 0,
    };
  }

  function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    const pushRow = () => {
      row.push(field);
      field = "";
      if (row.some((cell) => String(cell).trim() !== "")) rows.push(row);
      row = [];
    };

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"' && field === "") {
        quoted = true;
      } else if (char === delimiter) {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        pushRow();
      } else if (char === "\r") {
        if (text[index + 1] === "\n") index += 1;
        pushRow();
      } else {
        field += char;
      }
    }
    if (field !== "" || row.length) pushRow();
    return rows;
  }

  function detectDelimiter(text) {
    const sample = text.split(/\r?\n/).slice(0, 12).join("\n");
    const candidates = [",", "\t", ";"];
    return candidates.reduce((best, candidate) => {
      const score = sample.split(candidate).length - 1;
      const bestScore = sample.split(best).length - 1;
      return score > bestScore ? candidate : best;
    }, ",");
  }

  function headerHasField(row, field) {
    return row.some((cell) => ALIAS_INDEX[field].has(normalizeHeader(cell)));
  }

  function csvToRecords(text) {
    const delimiter = detectDelimiter(text);
    const table = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
    const headerIndex = table.findIndex(
      (row) => headerHasField(row, "query") && ["clicks", "impressions", "position"].some((field) => headerHasField(row, field)),
    );
    if (headerIndex < 0) {
      throw new Error("找不到包含 Query／Clicks／Impressions／Position 的 GSC 標題列。");
    }
    const headers = table[headerIndex].map((header, index) => String(header || `column_${index}`).trim());
    const records = table.slice(headerIndex + 1).map((cells) =>
      headers.reduce((record, header, index) => {
        record[header] = cells[index] == null ? "" : cells[index];
        return record;
      }, {}),
    );
    return { records, format: "csv", delimiter, headerIndex };
  }

  function unwrapJson(value) {
    if (Array.isArray(value)) return { rows: value, dimensions: [] };
    if (!value || typeof value !== "object") return { rows: [], dimensions: [] };

    const dimensions = Array.isArray(value.dimensions) ? value.dimensions : [];
    const candidates = ["rows", "data", "items", "records", "results", "queryData"];
    for (const key of candidates) {
      if (Array.isArray(value[key])) return { rows: value[key], dimensions };
      if (value[key] && typeof value[key] === "object") {
        const nested = unwrapJson(value[key]);
        if (nested.rows.length) return { rows: nested.rows, dimensions: nested.dimensions.length ? nested.dimensions : dimensions };
      }
    }
    return { rows: [], dimensions };
  }

  function jsonRowToRecord(row, dimensions) {
    if (Array.isArray(row)) {
      const keys = dimensions.length ? dimensions : ["query", "page", "date", "clicks", "impressions", "ctr", "position"];
      return keys.reduce((record, key, index) => {
        record[key] = row[index];
        return record;
      }, {});
    }
    if (row && typeof row === "object" && Array.isArray(row.keys)) {
      const record = {};
      const keys = dimensions.length ? dimensions : ["query", "page", "date"];
      row.keys.forEach((value, index) => {
        record[keys[index] || `dimension_${index}`] = value;
      });
      Object.keys(row).forEach((key) => {
        if (key !== "keys") record[key] = row[key];
      });
      return record;
    }
    return row && typeof row === "object" ? row : {};
  }

  function jsonToRecords(text) {
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      throw new Error(`JSON 無法解析：${error.message}`);
    }
    const unwrapped = unwrapJson(value);
    if (!unwrapped.rows.length) throw new Error("JSON 找不到 rows／data／records 陣列。");
    return {
      records: unwrapped.rows.map((row) => jsonRowToRecord(row, unwrapped.dimensions)),
      format: "json",
      delimiter: null,
      metadata: {
        ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
        dimensions: unwrapped.dimensions,
        dateRange: normalizeDateRange(value && typeof value === "object" ? value.dateRange || value : null),
      },
    };
  }

  function parseText(text, filename) {
    const clean = String(text || "").trim();
    if (!clean) throw new Error("檔案內容是空的。");
    const lowerName = String(filename || "").toLowerCase();
    if (lowerName.endsWith(".json") || /^[\[{]/.test(clean)) return jsonToRecords(clean);
    return csvToRecords(clean);
  }

  function normalizeRows(records) {
    const rows = [];
    const skipped = { missingQuery: 0, invalidMetrics: 0 };
    records.forEach((record, index) => {
      const query = String(getField(record, "query") || "").trim();
      if (!query) {
        skipped.missingQuery += 1;
        return;
      }
      const clicksValue = parseMetric(getField(record, "clicks"), "clicks");
      const impressionsValue = parseMetric(getField(record, "impressions"), "impressions");
      const ctrValue = parseMetric(getField(record, "ctr"), "ctr");
      const positionValue = parseMetric(getField(record, "position"), "position");
      if ([clicksValue, impressionsValue, ctrValue, positionValue].every((value) => value == null)) {
        skipped.invalidMetrics += 1;
        return;
      }
      rows.push({
        id: `${index}-${normalizeQuery(query)}`,
        query,
        queryKey: normalizeQuery(query),
        page: normalizePage(getField(record, "page")),
        date: sanitizeDate(getField(record, "date")),
        clicks: Math.max(0, clicksValue == null ? 0 : clicksValue),
        impressions: Math.max(0, impressionsValue == null ? 0 : impressionsValue),
        ctr: ctrValue == null ? null : Math.max(0, ctrValue),
        position: positionValue != null && positionValue > 0 ? positionValue : null,
        country: String(getField(record, "country") || "").trim(),
        device: String(getField(record, "device") || "").trim(),
        searchAppearance: String(getField(record, "searchAppearance") || "").trim(),
      });
    });
    return { rows, skipped };
  }

  function createDatasetFromRecords(records, sourceName, metadata) {
    const normalized = normalizeRows(records);
    const inheritedSkipped = metadata && metadata.skipped ? metadata.skipped : {};
    const metadataRange = metadata && metadata.dateRange ? metadata.dateRange : metadata;
    const sourceMeta = normalizeSourceMetadata(metadata, normalized.rows.length);
    return {
      rows: normalized.rows,
      sourceName: sourceName || "匯入資料",
      skipped: {
        missingQuery: (inheritedSkipped.missingQuery || 0) + normalized.skipped.missingQuery,
        invalidMetrics: (inheritedSkipped.invalidMetrics || 0) + normalized.skipped.invalidMetrics,
      },
      format: metadata && metadata.format ? metadata.format : "records",
      dateRange: normalizeDateRange(metadataRange) || getDateRange(normalized.rows),
      propertyName: sourceMeta.propertyName,
      siteUrl: sourceMeta.siteUrl,
      dimensions: sourceMeta.dimensions,
      dataState: sourceMeta.dataState,
      rowLimit: sourceMeta.rowLimit,
      totalRows: sourceMeta.totalRows,
      partial: sourceMeta.partial,
      syncedAt: sourceMeta.syncedAt,
      scope: sourceMeta.scope,
    };
  }

  function createDatasetFromText(text, filename, metadata) {
    const parsed = parseText(text, filename);
    const dataset = createDatasetFromRecords(parsed.records, filename || "匯入資料", {
      ...(parsed.metadata || {}),
      ...(metadata || {}),
      format: metadata && metadata.format ? metadata.format : parsed.format,
    });
    dataset.delimiter = parsed.delimiter;
    dataset.headerIndex = parsed.headerIndex == null ? null : parsed.headerIndex;
    return dataset;
  }

  function combineDatasets(datasets, sourceName) {
    const valid = datasets.filter(Boolean);
    const rows = valid.flatMap((dataset) => dataset.rows || []);
    const propertyNames = [...new Set(valid.map((dataset) => dataset.propertyName).filter(Boolean))];
    const siteUrls = [...new Set(valid.map((dataset) => dataset.siteUrl).filter(Boolean))];
    const dimensions = [...new Set(valid.flatMap((dataset) => dataset.dimensions || []))];
    const totalRows = valid.some((dataset) => dataset.totalRows != null)
      ? valid.reduce((sum, dataset) => sum + (dataset.totalRows == null ? dataset.rows.length : dataset.totalRows), 0)
      : null;
    const rowLimits = valid.map((dataset) => dataset.rowLimit).filter((value) => value != null);
    return {
      rows,
      sourceName: sourceName || valid.map((dataset) => dataset.sourceName).join(" + ") || "匯入資料",
      skipped: valid.reduce(
        (sum, dataset) => ({
          missingQuery: sum.missingQuery + (dataset.skipped && dataset.skipped.missingQuery ? dataset.skipped.missingQuery : 0),
          invalidMetrics: sum.invalidMetrics + (dataset.skipped && dataset.skipped.invalidMetrics ? dataset.skipped.invalidMetrics : 0),
        }),
        { missingQuery: 0, invalidMetrics: 0 },
      ),
      format: valid.length > 1 ? "mixed" : valid[0] ? valid[0].format : "records",
      dateRange: getDateRange(rows),
      propertyName: propertyNames.length === 1 ? propertyNames[0] : propertyNames.join(" / "),
      siteUrl: siteUrls.length === 1 ? siteUrls[0] : siteUrls.join(" / "),
      dimensions,
      dataState: valid.map((dataset) => dataset.dataState).find(Boolean) || "",
      rowLimit: rowLimits.length ? Math.min(...rowLimits) : null,
      totalRows,
      partial: valid.some((dataset) => dataset.partial === true),
      syncedAt: valid.map((dataset) => dataset.syncedAt).filter(Boolean).sort().pop() || null,
      scope: valid.map((dataset) => dataset.scope).find(Boolean) || null,
    };
  }

  function getDateRange(rows) {
    const dates = rows.map((row) => row.date).filter(Boolean).sort();
    return { start: dates[0] || null, end: dates[dates.length - 1] || null };
  }

  function createGroup(key, row, labelField) {
    return {
      key,
      label: labelField === "page" ? row.page : row.query,
      clicks: 0,
      impressions: 0,
      positionSum: 0,
      positionWeight: 0,
      rowCount: 0,
      pages: new Set(),
      queries: new Set(),
      dates: new Set(),
    };
  }

  function finalizeGroup(group, labelField) {
    const position = group.positionWeight ? group.positionSum / group.positionWeight : null;
    return {
      key: group.key,
      query: labelField === "query" ? group.label : "",
      page: labelField === "page" ? group.label : "",
      clicks: round(group.clicks, 3),
      impressions: round(group.impressions, 3),
      ctr: group.impressions > 0 ? round(group.clicks / group.impressions, 6) : null,
      position: round(position, 2),
      rowCount: group.rowCount,
      pages: [...group.pages].filter(Boolean).sort(),
      queries: [...group.queries].filter(Boolean).sort(),
      dates: [...group.dates].filter(Boolean).sort(),
    };
  }

  function aggregateRows(rows, labelField) {
    const groups = new Map();
    rows.forEach((row) => {
      const label = labelField === "page" ? row.page : row.query;
      const key = labelField === "page" ? normalizePage(label) : row.queryKey || normalizeQuery(label);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, createGroup(key, row, labelField));
      const group = groups.get(key);
      group.clicks += row.clicks || 0;
      group.impressions += row.impressions || 0;
      const weight = row.impressions > 0 ? row.impressions : row.position != null ? 1 : 0;
      if (row.position != null && weight) {
        group.positionSum += row.position * weight;
        group.positionWeight += weight;
      }
      group.rowCount += 1;
      if (row.page) group.pages.add(row.page);
      if (row.query) group.queries.add(row.query);
      if (row.date) group.dates.add(row.date);
    });
    return [...groups.values()]
      .map((group) => finalizeGroup(group, labelField))
      .sort((a, b) => (b.impressions - a.impressions) || a.key.localeCompare(b.key));
  }

  function aggregateQueryPages(rows) {
    const groups = new Map();
    rows.filter((row) => row.page).forEach((row) => {
      const key = `${row.queryKey || normalizeQuery(row.query)}\u0000${normalizePage(row.page)}`;
      if (!groups.has(key)) {
        groups.set(key, {
          ...createGroup(key, row, "query"),
          pageLabel: row.page,
        });
      }
      const group = groups.get(key);
      group.clicks += row.clicks || 0;
      group.impressions += row.impressions || 0;
      const weight = row.impressions > 0 ? row.impressions : row.position != null ? 1 : 0;
      if (row.position != null && weight) {
        group.positionSum += row.position * weight;
        group.positionWeight += weight;
      }
      group.rowCount += 1;
      if (row.page) group.pages.add(row.page);
      if (row.query) group.queries.add(row.query);
      if (row.date) group.dates.add(row.date);
    });
    return [...groups.values()].map((group) => {
      const result = finalizeGroup(group, "query");
      result.query = group.label;
      result.page = group.pageLabel;
      return result;
    });
  }

  function getBucket(position) {
    if (!Number.isFinite(position) || position <= 0) return { id: "unknown", label: "未有平均排名", min: null, max: null };
    return BUCKETS.find((bucket) => position >= bucket.min && position <= bucket.max) || { id: "unknown", label: "未有平均排名" };
  }

  function summarizeRows(rows) {
    const clicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const impressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0);
    let positionSum = 0;
    let positionWeight = 0;
    rows.forEach((row) => {
      const weight = row.impressions > 0 ? row.impressions : row.position != null ? 1 : 0;
      if (row.position != null && weight) {
        positionSum += row.position * weight;
        positionWeight += weight;
      }
    });
    return {
      clicks: round(clicks, 3),
      impressions: round(impressions, 3),
      ctr: impressions > 0 ? round(clicks / impressions, 6) : null,
      position: positionWeight ? round(positionSum / positionWeight, 2) : null,
      rows: rows.length,
    };
  }

  function percentageChange(current, previous) {
    if (!Number.isFinite(previous) || previous === 0) return current === 0 ? 0 : null;
    return (current - previous) / Math.abs(previous);
  }

  function direction(delta) {
    if (delta == null || Math.abs(delta) < Number.EPSILON) return "stable";
    return delta > 0 ? "up" : "down";
  }

  function compareDatasets(currentRows, previousRows, options) {
    const config = Object.assign({ minRankDelta: 1 }, options || {});
    const current = aggregateRows(currentRows, "query");
    const previous = aggregateRows(previousRows || [], "query");
    const currentMap = new Map(current.map((item) => [item.key, item]));
    const previousMap = new Map(previous.map((item) => [item.key, item]));
    const keys = new Set([...currentMap.keys(), ...previousMap.keys()]);

    return [...keys].map((key) => {
      const now = currentMap.get(key) || null;
      const before = previousMap.get(key) || null;
      const rankDelta = now && before && now.position != null && before.position != null ? round(before.position - now.position, 2) : null;
      const clickDelta = now && before ? round(now.clicks - before.clicks, 3) : null;
      const impressionDelta = now && before ? round(now.impressions - before.impressions, 3) : null;
      const ctrDelta = now && before && now.ctr != null && before.ctr != null ? round(now.ctr - before.ctr, 6) : null;
      let rankDirection = "stable";
      if (!before) rankDirection = "new";
      else if (!now) rankDirection = "lost";
      else if (rankDelta != null && rankDelta >= config.minRankDelta) rankDirection = "improved";
      else if (rankDelta != null && rankDelta <= -config.minRankDelta) rankDirection = "declined";

      const clickDirection = !before ? "new" : !now ? "lost" : direction(clickDelta);
      const impressionDirection = !before ? "new" : !now ? "lost" : direction(impressionDelta);
      const filters = new Set(["all"]);
      if (rankDirection === "improved") filters.add("rank-up");
      if (rankDirection === "declined") filters.add("rank-down");
      if (clickDirection === "up") filters.add("click-up");
      if (clickDirection === "down") filters.add("click-down");
      if (impressionDirection === "up") filters.add("impression-up");
      if (impressionDirection === "down") filters.add("impression-down");
      if (rankDirection === "new") filters.add("new");
      if (rankDirection === "lost") filters.add("lost");
      if (filters.size === 1) filters.add("stable");

      let primary = rankDirection;
      if (["stable", "new", "lost"].includes(primary) && clickDirection === "up") primary = "click-up";
      if (["stable", "new", "lost"].includes(primary) && clickDirection === "down") primary = "click-down";
      if (["stable", "new", "lost"].includes(primary) && clickDirection === "stable" && impressionDirection === "up") primary = "impression-up";
      if (["stable", "new", "lost"].includes(primary) && clickDirection === "stable" && impressionDirection === "down") primary = "impression-down";

      return {
        key,
        query: (now || before).query,
        current: now,
        previous: before,
        rankDelta,
        clickDelta,
        impressionDelta,
        ctrDelta,
        clickPct: now && before ? percentageChange(now.clicks, before.clicks) : null,
        impressionPct: now && before ? percentageChange(now.impressions, before.impressions) : null,
        rankDirection,
        clickDirection,
        impressionDirection,
        primary,
        filters: [...filters],
      };
    }).sort((a, b) => (b.current ? b.current.impressions : 0) - (a.current ? a.current.impressions : 0) || a.key.localeCompare(b.key));
  }

  function scoreRecommendation(base, item, rankDown) {
    const scale = Math.min(12, Math.log10(Math.max(1, item.impressions) + 1) * 3);
    const declineBonus = rankDown ? 8 : 0;
    return Math.min(100, Math.round(base + scale + declineBonus));
  }

  function buildRecommendations(comparisons, queryPages, summary, options) {
    const config = Object.assign({ minImpressions: 20, lowCtrRatio: 0.75, maxRecommendations: 30 }, options || {});
    const pageMap = new Map();
    queryPages.forEach((item) => {
      const queryKey = item.key.split("\u0000")[0] || item.queries[0] && normalizeQuery(item.queries[0]);
      if (!queryKey) return;
      if (!pageMap.has(queryKey)) pageMap.set(queryKey, []);
      pageMap.get(queryKey).push(item);
    });
    const recommendations = [];
    const add = (comparison, type, base, titleKey, actionKey, reasonData, title, action, reasons) => {
      const item = comparison.current;
      if (!item) return;
      recommendations.push({
        id: `${type}-${comparison.key}`,
        type,
        title,
        query: comparison.query,
        page: item.pages.length === 1 ? item.pages[0] : item.pages.length > 1 ? "多個頁面" : "未提供頁面維度",
        position: item.position,
        bucket: getBucket(item.position).label,
        bucketId: getBucket(item.position).id,
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: item.ctr,
        rankDelta: comparison.rankDelta,
        score: scoreRecommendation(base, item, comparison.rankDirection === "declined"),
        titleKey,
        actionKey,
        reasonData,
        reasons,
        action,
        rule: type,
      });
    };

    comparisons.forEach((comparison) => {
      const item = comparison.current;
      if (!item) return;
      const enoughExposure = item.impressions >= config.minImpressions;
      const position = item.position;
      if (enoughExposure && position != null && position >= 11 && position <= 20) {
        add(
          comparison,
          "rewrite-11-20",
          82,
          "recommendations.rewrite11.title",
          "recommendations.rewrite11.action",
          [
            { key: "recommendation.rankRange", params: { position: position.toFixed(1), range: "11–20" } },
            { key: "recommendation.exposure", params: { impressions: item.impressions, threshold: config.minImpressions } },
          ],
          "重寫候選 · 11–20",
          "先用這個查詢核對當前承接頁與實際 SERP 任務，再決定補強哪個缺口；不要只為了加入關鍵字而整篇重寫。",
          [
            `平均排名 ${position.toFixed(1)}，位於 11–20 區間`,
            `曝光 ${Math.round(item.impressions).toLocaleString()}，達到目前門檻 ${Math.round(config.minImpressions).toLocaleString()}`,
          ],
        );
      } else if (enoughExposure && position != null && position >= 21 && position <= 30) {
        add(
          comparison,
          "rewrite-21-30",
          68,
          "recommendations.rewrite21.title",
          "recommendations.rewrite21.action",
          [
            { key: "recommendation.rankRange", params: { position: position.toFixed(1), range: "21–30" } },
            { key: "recommendation.exposure", params: { impressions: item.impressions, threshold: config.minImpressions } },
          ],
          "補強候選 · 21–30",
          "先確認是否已有相符頁面；再以 SERP 任務、第一方證據與內容缺口判斷要補強、合併或暫緩。",
          [
            `平均排名 ${position.toFixed(1)}，位於 21–30 區間`,
            `曝光 ${Math.round(item.impressions).toLocaleString()}，達到目前門檻 ${Math.round(config.minImpressions).toLocaleString()}`,
          ],
        );
      }

      if (comparison.rankDirection === "declined" && enoughExposure) {
        add(
          comparison,
          "decline-review",
          80,
          "recommendations.decline.title",
          "recommendations.decline.action",
          [
            { key: "recommendation.rankDecline", params: { delta: Math.abs(comparison.rankDelta || 0).toFixed(1) } },
            { key: "recommendation.currentExposure", params: { impressions: item.impressions } },
          ],
          "下降檢查",
          "先核對比較期間、頁面是否仍可索引，以及近期是否有內容／技術變更；確認原因後才決定是否重寫。",
          [
            `平均排名較前期下降 ${Math.abs(comparison.rankDelta || 0).toFixed(1)} 位`,
            `目前曝光 ${Math.round(item.impressions).toLocaleString()}`,
          ],
        );
      }

      if (
        enoughExposure &&
        position != null &&
        position >= 1 &&
        position <= 10 &&
        item.ctr != null &&
        summary.ctr != null &&
        item.ctr < summary.ctr * config.lowCtrRatio
      ) {
        add(
          comparison,
          "snippet-review",
          60,
          "recommendations.snippet.title",
          "recommendations.snippet.action",
          [
            { key: "recommendation.topTen", params: { position: position.toFixed(1) } },
            { key: "recommendation.lowCtr", params: { ctr: (item.ctr * 100).toFixed(2), reference: (summary.ctr * 100).toFixed(2), ratio: config.lowCtrRatio } },
          ],
          "摘要檢查 · 前 10",
          "先檢查 title、主要承諾與頁面內容是否對得上搜尋任務；這是摘要／意圖檢查，不等於直接重寫。",
          [
            `平均排名 ${position.toFixed(1)}，已在前 10`,
            `CTR ${(item.ctr * 100).toFixed(2)}%，低於目前站內參考 ${(summary.ctr * 100).toFixed(2)}% × ${config.lowCtrRatio}`,
          ],
        );
      }

      const pages = pageMap.get(comparison.key) || [];
      const materialPages = pages.filter((page) => page.impressions >= Math.max(1, config.minImpressions * 0.5));
      if (enoughExposure && materialPages.length >= 2) {
        add(
          comparison,
          "page-ownership-review",
          72,
          "recommendations.ownership.title",
          "recommendations.ownership.action",
          [
            { key: "recommendation.multiplePages", params: { count: materialPages.length } },
            { key: "recommendation.pageOverlap" },
          ],
          "頁面歸屬檢查",
          "同一查詢先分開看各頁的曝光與平均排名，再判斷是否為正常多頁承接或需要整理頁面歸屬；不要只看全站合計。",
          [`同一查詢有 ${materialPages.length} 個頁面帶來可見曝光`, "需要用頁面維度確認是否存在內容重疊"],
        );
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score || b.impressions - a.impressions || a.query.localeCompare(b.query) || a.type.localeCompare(b.type))
      .slice(0, config.maxRecommendations);
  }

  function buildAnomalies(comparisons, options) {
    const config = Object.assign({ minImpressions: 20, anomalyDropRatio: 0.3, anomalyRankDelta: 3, maxInsights: 8 }, options || {});
    return comparisons
      .filter((item) => item.current && item.previous)
      .map((item) => {
        const now = item.current;
        const before = item.previous;
        const enoughExposure = Math.max(now.impressions || 0, before.impressions || 0) >= config.minImpressions;
        if (!enoughExposure) return null;
        const signals = [];
        if (item.rankDelta != null && item.rankDelta <= -config.anomalyRankDelta) {
          signals.push({ key: "rank", value: round(Math.abs(item.rankDelta), 1) });
        }
        if (item.clickPct != null && item.clickPct <= -config.anomalyDropRatio) {
          signals.push({ key: "clicks", value: round(Math.abs(item.clickPct), 3) });
        }
        if (item.impressionPct != null && item.impressionPct <= -config.anomalyDropRatio) {
          signals.push({ key: "impressions", value: round(Math.abs(item.impressionPct), 3) });
        }
        if (!signals.length) return null;
        return {
          id: `anomaly-${item.key}`,
          query: item.query,
          current: now,
          previous: before,
          rankDelta: item.rankDelta,
          clickPct: item.clickPct,
          impressionPct: item.impressionPct,
          signals,
          severity: signals.length > 1 ? "high" : "watch",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.signals.length - a.signals.length || (b.current.impressions || 0) - (a.current.impressions || 0))
      .slice(0, config.maxInsights);
  }

  function buildCtrOpportunities(currentQueries, summary, options) {
    const config = Object.assign({ minImpressions: 20, lowCtrRatio: 0.75, maxInsights: 8 }, options || {});
    const referenceCtr = summary && Number.isFinite(summary.ctr) ? summary.ctr * config.lowCtrRatio : null;
    if (!Number.isFinite(referenceCtr) || referenceCtr <= 0) return [];
    return currentQueries
      .filter((item) => item.position != null && item.position >= 4 && item.position <= 20 && item.impressions >= config.minImpressions && item.ctr != null && item.ctr < referenceCtr)
      .map((item) => ({
        id: `ctr-opportunity-${item.key}`,
        query: item.query,
        page: item.pages.length === 1 ? item.pages[0] : item.pages.length > 1 ? "多個頁面" : "未提供頁面維度",
        position: item.position,
        bucket: getBucket(item.position).label,
        impressions: item.impressions,
        clicks: item.clicks,
        ctr: item.ctr,
        ctrGap: round(referenceCtr - item.ctr, 6),
        referenceCtr: round(referenceCtr, 6),
      }))
      .sort((a, b) => b.impressions - a.impressions || b.ctrGap - a.ctrGap || a.query.localeCompare(b.query))
      .slice(0, config.maxInsights);
  }

  function buildModel(currentDataset, previousDataset, options) {
    const config = Object.assign(
      { minImpressions: 20, minRankDelta: 1, lowCtrRatio: 0.75, maxRecommendations: 30, anomalyDropRatio: 0.3, anomalyRankDelta: 3, maxInsights: 8 },
      options || {},
    );
    const currentRows = currentDataset && currentDataset.rows ? currentDataset.rows : [];
    const previousRows = previousDataset && previousDataset.rows ? previousDataset.rows : [];
    const currentQueries = aggregateRows(currentRows, "query");
    const previousQueries = aggregateRows(previousRows, "query");
    const currentPages = aggregateRows(currentRows.filter((row) => row.page), "page");
    const queryPages = aggregateQueryPages(currentRows);
    const comparisons = previousRows.length
      ? compareDatasets(currentRows, previousRows, config)
      : currentQueries.map((item) => ({
          key: item.key,
          query: item.query,
          current: item,
          previous: null,
          rankDelta: null,
          clickDelta: null,
          impressionDelta: null,
          ctrDelta: null,
          clickPct: null,
          impressionPct: null,
          rankDirection: "stable",
          clickDirection: "stable",
          impressionDirection: "stable",
          primary: "stable",
          filters: ["all", "stable"],
        }));
    const summary = summarizeRows(currentRows);
    const previousSummary = previousRows.length ? summarizeRows(previousRows) : null;
    const distribution = BUCKETS.map((bucket) => ({
      ...bucket,
      count: currentQueries.filter((query) => getBucket(query.position).id === bucket.id).length,
    }));
    const unknownCount = currentQueries.filter((query) => getBucket(query.position).id === "unknown").length;
    const rankedQueryCount = distribution.reduce((sum, bucket) => sum + bucket.count, 0);
    const movementSummary = {
      rankUp: comparisons.filter((item) => item.rankDirection === "improved").length,
      rankDown: comparisons.filter((item) => item.rankDirection === "declined").length,
      clickUp: comparisons.filter((item) => item.clickDirection === "up").length,
      clickDown: comparisons.filter((item) => item.clickDirection === "down").length,
      impressionUp: comparisons.filter((item) => item.impressionDirection === "up").length,
      impressionDown: comparisons.filter((item) => item.impressionDirection === "down").length,
      new: comparisons.filter((item) => item.rankDirection === "new").length,
      lost: comparisons.filter((item) => item.rankDirection === "lost").length,
      stable: comparisons.filter((item) => item.primary === "stable").length,
    };

    return {
      config,
      hasComparison: previousRows.length > 0,
      summary,
      previousSummary,
      queryCount: currentQueries.length,
      pageCount: currentPages.length,
      rankedQueryCount,
      unknownPositionCount: unknownCount,
      distribution,
      comparisons,
      recommendations: buildRecommendations(comparisons, queryPages, summary, config),
      anomalies: buildAnomalies(comparisons, config),
      ctrOpportunities: buildCtrOpportunities(currentQueries, summary, config),
      currentQueries,
      currentPages,
      queryPages,
      movementSummary,
      metadata: {
        current: currentDataset
          ? {
              sourceName: currentDataset.sourceName,
              format: currentDataset.format,
              dateRange: currentDataset.dateRange || getDateRange(currentRows),
              rows: currentRows.length,
              skipped: currentDataset.skipped || { missingQuery: 0, invalidMetrics: 0 },
              propertyName: currentDataset.propertyName || "",
              siteUrl: currentDataset.siteUrl || "",
              dimensions: currentDataset.dimensions || [],
              dataState: currentDataset.dataState || "",
              rowLimit: currentDataset.rowLimit == null ? null : currentDataset.rowLimit,
              totalRows: currentDataset.totalRows == null ? null : currentDataset.totalRows,
              partial: currentDataset.partial === true,
              syncedAt: currentDataset.syncedAt || null,
              scope: currentDataset.scope || null,
            }
          : null,
        previous: previousDataset
          ? {
              sourceName: previousDataset.sourceName,
              format: previousDataset.format,
              dateRange: previousDataset.dateRange || getDateRange(previousRows),
              rows: previousRows.length,
              skipped: previousDataset.skipped || { missingQuery: 0, invalidMetrics: 0 },
              propertyName: previousDataset.propertyName || "",
              siteUrl: previousDataset.siteUrl || "",
              dimensions: previousDataset.dimensions || [],
              dataState: previousDataset.dataState || "",
              rowLimit: previousDataset.rowLimit == null ? null : previousDataset.rowLimit,
              totalRows: previousDataset.totalRows == null ? null : previousDataset.totalRows,
              partial: previousDataset.partial === true,
              syncedAt: previousDataset.syncedAt || null,
              scope: previousDataset.scope || null,
            }
          : null,
      },
    };
  }

  root.SEOCoachGscEngine = {
    BUCKETS,
    parseText,
    createDatasetFromText,
    createDatasetFromRecords,
    combineDatasets,
    aggregateRows,
    compareDatasets,
    buildRecommendations,
    buildAnomalies,
    buildCtrOpportunities,
    buildModel,
    getBucket,
    normalizeQuery,
    percentageChange,
  };
})(typeof window !== "undefined" ? window : globalThis);

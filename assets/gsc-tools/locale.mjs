#!/usr/bin/env node
// Scaffold or check one GSC dashboard locale file.
//
//   node assets/gsc-tools/locale.mjs <tag> "<Native name>" [ltr|rtl]
//   node assets/gsc-tools/locale.mjs --check <tag>
//   node assets/gsc-tools/locale.mjs --use <tag>
//
// The skill ships only zh-Hant / zh-Hans / en. Any other language is generated
// once, by the coach, from the English file, the first time a student speaks it.
// --use writes the conversation language into panel-config.js so the panel opens in it.

import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = join(scriptDir, "..", "..");
const localeDir = join(skillDir, "assets", "gsc-dashboard", "locales");
const configPath = join(skillDir, "assets", "gsc-dashboard", "panel-config.js");
const TAG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,4})?$/;
const HEADER = "// GENERATED SCAFFOLD — translate every value, keep keys and {{placeholders}}; then run --check";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  return [
    'Usage: node assets/gsc-tools/locale.mjs <tag> "<Native name>" [ltr|rtl] [--force]',
    "       node assets/gsc-tools/locale.mjs --check <tag>",
    "       node assets/gsc-tools/locale.mjs --use <tag>",
  ].join("\n");
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadDictionary(tag) {
  const path = join(localeDir, `${tag}.js`);
  if (!(await exists(path))) fail(`Missing locale file: ${path}`);
  const source = await readFile(path, "utf8");
  const context = { window: {}, console };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: `locales/${tag}.js` });
  const registry = context.window.SEOCoachGscLocales || {};
  const key = Object.keys(registry).find((name) => name.toLowerCase() === tag.toLowerCase());
  if (!key) fail(`locales/${tag}.js does not register SEOCoachGscLocales["${tag}"]`);
  return registry[key];
}

const placeholders = (value) => (String(value).match(/\{\{[\w.-]+\}\}/g) || []).sort();

function jsString(value) {
  return JSON.stringify(String(value));
}

async function scaffold(tag, name, dir, force) {
  if (!TAG_PATTERN.test(tag)) fail(`Invalid locale tag "${tag}". Use forms like de, pt-BR, zh-Hant.`);
  if (!name || !name.trim()) fail(`A native language name is required.\n${usage()}`);
  if (dir !== "ltr" && dir !== "rtl") fail(`Text direction must be ltr or rtl (got "${dir}").`);

  const target = join(localeDir, `${tag}.js`);
  if (!force && (await exists(target))) fail(`${target} already exists. Re-run with --force to overwrite.`);

  const english = await loadDictionary("en");
  const keys = Object.keys(english).filter((key) => key !== "dir" && key !== "name");
  const lines = [
    HEADER,
    "(function (root) {",
    '  "use strict";',
    "  root.SEOCoachGscLocales = root.SEOCoachGscLocales || {};",
    `  root.SEOCoachGscLocales[${jsString(tag)}] = {`,
    `    dir: ${jsString(dir)},`,
    `    name: ${jsString(name.trim())},`,
    ...keys.map((key) => `    ${jsString(key)}: ${jsString(english[key])},`),
    "  };",
    '})(typeof window !== "undefined" ? window : globalThis);',
    "",
  ];
  await writeFile(target, lines.join("\n"), "utf8");
  console.log(`Created ${target}`);
  console.log(`Keys to translate: ${keys.length}`);
  console.log(`Next: translate every value, then run node assets/gsc-tools/locale.mjs --check ${tag}`);
}

async function check(tag) {
  if (!TAG_PATTERN.test(tag)) fail(`Invalid locale tag "${tag}".`);
  const english = await loadDictionary("en");
  const target = await loadDictionary(tag);

  const problems = [];
  if (target.dir !== "ltr" && target.dir !== "rtl") problems.push(`dir must be "ltr" or "rtl" (got ${JSON.stringify(target.dir)})`);
  if (typeof target.name !== "string" || !target.name.trim()) problems.push("name must be a non-empty native language name");

  const keys = Object.keys(english).filter((key) => key !== "dir" && key !== "name");
  const missing = keys.filter((key) => !(key in target));
  const mismatched = keys.filter((key) => key in target && placeholders(english[key]).join(" ") !== placeholders(target[key]).join(" "));
  const untranslated = keys.filter((key) => key in target && String(target[key]) === String(english[key]));
  const extra = Object.keys(target).filter((key) => key !== "dir" && key !== "name" && !keys.includes(key));

  console.log(`locales/${tag}.js — ${keys.length} translatable keys`);
  console.log(`  missing keys:          ${missing.length}${missing.length ? `\n    ${missing.join("\n    ")}` : ""}`);
  console.log(`  placeholder mismatches:${mismatched.length ? `\n    ${mismatched.map((key) => `${key}: expected ${placeholders(english[key]).join(" ") || "(none)"}, got ${placeholders(target[key]).join(" ") || "(none)"}`).join("\n    ")}` : " 0"}`);
  console.log(`  still identical to English: ${untranslated.length}`);
  if (extra.length) console.log(`  unknown extra keys:    ${extra.length}\n    ${extra.join("\n    ")}`);
  for (const problem of problems) console.log(`  metadata: ${problem}`);

  if (missing.length || mismatched.length || problems.length) {
    console.error(`FAIL: locales/${tag}.js is not usable yet.`);
    process.exit(1);
  }
  if (untranslated.length) console.log(`WARN: ${untranslated.length} values are still English — translate them before telling the student to reload.`);
  console.log(`OK: locales/${tag}.js has every key with matching placeholders.`);
}

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
  console.log(usage());
  process.exit(argv.length ? 0 : 1);
}

// Point the panel at the language of the conversation. The locale file must exist.
async function use(tag) {
  if (!TAG_PATTERN.test(tag)) fail(`Invalid locale tag "${tag}".`);
  if (!(await exists(join(localeDir, `${tag}.js`)))) fail(`locales/${tag}.js does not exist yet. Scaffold and translate it first:
${usage()}`);
  const source = await readFile(configPath, "utf8");
  if (!/locale: "[A-Za-z0-9-]*"/.test(source)) fail(`${configPath} has no locale setting to update.`);
  await writeFile(configPath, source.replace(/locale: "[A-Za-z0-9-]*"/, `locale: ${jsString(tag)}`), "utf8");
  console.log(`panel-config.js now opens the panel in ${tag}.`);
}

const checkIndex = argv.indexOf("--check");
const useIndex = argv.indexOf("--use");
if (useIndex !== -1) {
  const tag = argv[useIndex + 1];
  if (!tag) fail(usage());
  await use(tag);
} else if (checkIndex !== -1) {
  const tag = argv[checkIndex + 1];
  if (!tag) fail(usage());
  await check(tag);
} else {
  const force = argv.includes("--force");
  const positional = argv.filter((value) => value !== "--force");
  const [tag, name, dir = "ltr"] = positional;
  if (!tag || !name) fail(usage());
  await scaffold(tag, name, dir, force);
}

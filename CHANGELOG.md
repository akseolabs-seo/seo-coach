# SEO Coach Changelog

## 1.1.0 — Continuous coaching + free-tool routing

**Type**: minor
**Surface**: session flow + progress template + keyword tools + evals
**Breaking**: no

### 對使用者更新了什麼

這版把 SEO Coach 從「做一次快速檢查」升級成更完整的 **SEO 陪跑流程**。

使用者現在不會只做完一個檢查就被放著，而是每一步都會知道：
- 這次完成了哪個 SEO 區塊
- 下一步要看什麼
- 什麼時候該繼續下一個模組
- 哪些問題可以自己做，哪些要找工程師或 SEO 專業協助

完整陪跑會以 **18 個 SEO 模組** 為主線，帶使用者逐步看過技術基礎、索引、頁面優化、內容品質、關鍵字、內部連結、外部連結、成效衡量等核心區塊。18 個模組跑完後，也不會告訴使用者「SEO 結束了」，而是進入每月維護和成效追蹤。

這版也新增了 **免費 SEO 工具路線**。使用者即使沒有預算買 Ahrefs / Semrush，也可以先用 Google Search Console、Google Autocomplete、Google Trends，以及 Ahrefs 的免費工具做基礎關鍵字規劃、外鏈檢查和網站健康檢查。

### 為什麼要更新

New users could still interpret a quick SEO check as "the SEO coaching is done." This release makes continuation explicit: every lightweight check, full session, Tier close, and boundary response must point to the next module or next safe action. It also adds a free-tool map, including current Ahrefs free tools, so beginners can do practical keyword and link checks without paid tools.

**Files changed**:
- `SKILL.md` — version bump 1.0.0 → 1.1.0; added continuation principle and reference to `38-continuous-coaching-free-tools.md`
- `references/00-session-flow.md` — added no-premature-ending continuation rules; lightweight mode now previews the next module instead of sounding one-off
- `references/sys-session-system.md` — added continuous coaching system, 18-module coverage target, and maintenance loop after all modules are complete
- `references/sys-file-templates.md` — added module coverage tracking and `下一步預告` field to `seo-progress.md`
- `references/38-continuous-coaching-free-tools.md` — new continuation + free SEO tools map, including Ahrefs free keyword/link tools
- `references/00-index.md` — registered the new reference and added free Ahrefs tools to relevant module tool lists
- `references/09-keyword-basics.md` — expanded zero-budget keyword research workflow with Ahrefs Free Keyword Generator, KD Checker, SERP Checker, and Ahrefs Free / Webmaster Tools
- `evals/evals.json` — eval set bumped 1.0.0 → 1.1.0; added four evals for continuation, full-module coverage, hard-problem continuation, and free keyword tools
- `evals/rubric.md` — added assertion definitions for continuation and free-tool behavior

**Expected behavior**:
- A quick check is framed as the first step, not the end of SEO
- Full coaching aims to cover all 18 modules and then moves into maintenance
- Hard/technical issues are marked as needing help, then the coach continues with the next safe module
- Keyword planning can start with free tools, including Ahrefs free tools, without requiring paid subscriptions

## 1.0.0 — 首次公開發布

**由 AK（@darkseoking）設計與訓練。**

### 包含

**核心架構**
- 18 個 Audit 模組（5 層架構）：爬蟲能力、索引狀態、技術 SEO、頁面優化、內容品質、E-E-A-T、內部連結、頁面速度、關鍵字基礎、連結建設、CMS 特定問題、情境防護、AI 搜尋、主題地圖、SERP 功能、進階技術、媒體優化、電商 SEO
- 蘇格拉底式陪跑對話設計（問問題引導用戶自己發現問題，不丟報告）
- 多風格支援（朋友型 / 老師型 / 教練型）
- 新手輕量模式 + 完整陪跑模式自動分流
- 持續追蹤 Session 系統（`seo-progress.md` + `seo-actions.md`）

**AK 的「低端 SEO 廠商獵殺計畫」教學整合**
- 廠商關鍵字規劃服務判斷框架
- AI 寫文章大綱優先法（三階段工作流）
- 舊文優化優先順序
- 按文章長度配內鏈數規則
- 廠商寫手鑑別的 4 個訊號

**整合與更新**
- GSC / GA4 / CMS 接 MCP / API 直讀數據（見 `references/35-data-integration.md`）
- 用戶可主動觸發版本檢查（「有沒有新版？」自動 WebFetch GitHub 比對）
- 教練可主動詢問是否開啟自動更新檢查（session 計數 ≥ 2 時問一次）

**用戶體驗**
- 開場設定期待：適合誰、不適合誰、我不做什麼
- AK 虛擬教練身份（「AK 訓練出來的虛擬陪跑教練」）
- 繁體中文預設，英文自動切換
- README 中英雙檔（中文主要 + 英文版本）
- 平台中立：可放進任何 AI agent 的 skills 資料夾使用

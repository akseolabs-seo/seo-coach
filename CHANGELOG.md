# SEO Coach Changelog

## 2.0.0 — GA4 陪跑軌道、自動召喚 router、可執行的 eval 套件

**Type**: major
**Date**: 2026-07-29
**Rollback point**: 1.2.0（commit 92c5002 — git 上的還原點；1.2.0 未對外發布）

**對外的上一個發布版本是 1.1.0**，所以多數使用者這次一次跨過 1.2.0 與 2.0.0 兩層改動。1.2.0 那層（開場瘦身、症狀入場、截圖回報、提示階梯、三層地圖、破壞性改動保護、9 個新知識檔）也是第一次到他們手上，內容見下方 1.2.0 段落。

**先看下面第一節**——教練的教學法和續課規則反轉了，那是這版真正的 breaking change。其餘是新增能力：GA4 陪跑軌道、自動召喚 router、跑得起來的 eval 套件。

### 行為反轉（升級要注意）

同樣的輸入，這版的行為跟 1.2.0 不一樣：

- **教學法反轉**：完全新手從「先答二選一預測題」改成**先示範一個結果**，再把下一個同型判斷交給他。用戶說「你先看／直接告訴我」時立刻示範，不再強迫先猜、也不再走提示階梯。
- **功課不再是續課門票**：只有真正的證據依賴或安全風險才擋下一步，其餘情況先縮小成 5-10 分鐘的 micro-step 或直接 park。
- **18 模組從預設漏斗改成 opt-in 課綱**：預設依用戶目標走 2-4 個必要檢查並講清楚退出條件；「流量掉了」不再自動展開整套課程。月度維護要再次取得同意。
- **成功條件放寬**：第一個勝利可以是健康基線、完成並重驗一個低風險修正、或建立有效量測——不再為了「一定要找到問題」製造假陽性。
- **證據護欄收緊**：`site:` 不再當精確收錄計數器（只是快篩，單一 URL 用 URL Inspection 定案）；sitemap 404 不再被寫成未收錄的單一根因。
- **移除錯誤硬規則**：中文 title/meta 不再鎖死 25–30／75–80 字；不再用通用「3–6 個月見效」或固定 CTR 曲線判定新手網站。
- **session 檔從兩個變三個**：拿到 GA4 數字時會建立 `seo-ga4-log.md`。有工具在讀進度檔的話要留意。
- **Eval**：舊的 prediction-first、homework hard gate、forced first defect 三組 assertion 被反轉——1.2.0 的判準在這版是錯的。

### 官方資料更新（2026）

GSC 24-hour view、Insights、Recommendations、custom annotations、2026 Generative AI performance report（限量推出）、FAQ rich result 退役、`llms.txt` 規則、2025–2026 ranking updates。

### 封裝

frontmatter 收斂成 `name` + `description`；新增 `agents/openai.yaml`、source/package validator、可重建 `.skill` 的 build 腳本。

### GA4 陪跑軌道

- 新增 `50-ga4-coaching-track.md`：**一輪一張指路卡**——精確點擊路徑（雙中文字樣 + 英文原名，因為 GA4 各版本選單不一致）→ 只看一個數字 → 一條常見誤讀 → 換你做。L1–L6 每級只解鎖一個概念：工作階段 vs 使用者 → 管道群組 → 維度 vs 指標 → 事件 → 關鍵事件 → GSC×GA4。
- **數字一出現就主動做三件事**（不等用戶問）：用人話翻譯這個數字在算什麼、跟台帳上次比或明講是基準線、當輪寫進台帳並告訴用戶。另有 9 條誤讀觸發表，畫面上出現就當場講掉一句（Direct 不是老客戶、`(not set)`、參與率定義、關鍵事件 0、資料保留預設 2 個月⋯⋯），一輪一條。
- 新增第三個 session 檔 **`seo-ga4-log.md`**：只增不刪的數據台帳，每列都要填「當時發生什麼」——三個月後看到波動，那一欄是唯一能把因果對起來的東西。只在第一次拿到 GA4 數字時建立，輕量模式不建。
- 新增 `51-ga4-api-connection.md`：Data API + service account 逐步，每步附「完成長什麼樣」，含驗證查詢與 7 條錯誤對照。**接通的定義是 API 數字與介面數字對得起來**，不是腳本不報錯；接了 API 也仍要讓用戶自己在介面看一次同一個數字。
- 台帳只寫本輪實際看到的數字，來源必填 `截圖／API／用戶口述`。
- `23-ga4-basics.md` 的「轉換事件」更新為「關鍵事件（Key events，舊介面叫轉換）」。

### 自動召喚 router（選用安裝）

- 新增 `hooks/`：一支 `seo_coach_router.py` 同時支援 Claude Code 與 Codex——兩邊的 hook stdin 欄位與輸出契約相同，不需要各寫一份。
- `SessionStart` 只在**陪跑資料夾**（有 `seo-progress.md` / `seo-actions.md` / `seo-ga4-log.md`）觸發並接續上次進度；`UserPromptSubmit` 在任何專案偵測到新手向 SEO 提問才觸發。
- 注入文字要求「若更適合其他更專門的 SEO 技能就改用那一個」，不把整站 audit、語意內容、GEO 硬吃進陪跑模式。
- 不裝完全不影響既有行為。無第三方套件、不寫檔、不連網，任何例外靜默 exit 0。
- `hooks/test_router.py` 26 個 pipe test，含 `Seoul` / `museo` 這類 `seo` 子字串誤觸發的反例。

### Eval 套件變成可執行

- 新增 `scripts/run_evals.py`：每個 case 送進獨立的 `claude -p` 全新 session 與空白工作目錄，存下回應、記錄該 case 實際產生了哪些檔案、輸出把判準內嵌好的判分工作表。`--judge` 提供模型判分的第一輪 triage（FAIL 必須人工覆核）。
- **補完 81 條缺失判準**：改版前 146 個 assertion 裡有 81 個（55%）在 rubric 找不到定義，60 個 case 有 42 個受影響——等於過半的判分只能望文生義。現在 146/146 都有可引用的判準。
- validator 新增閘門：assertion 沒有對應 rubric 定義就 build 失敗，這個坑不會再回來。
- 新增 10 個 GA4 相關 eval case 與 22 條判準。

### 已驗證 / 未驗證

已跑：runner 3 case 端到端（含 `seo-ga4-log.md` 真的被寫出來）；GA4 6 個 case 6/6 通過（記錄在 `evals/ga4-track-eval-2026-07-29.md`，其中 1 個是修正 spec 後重跑才過）；router 26/26；validator 閘門有反向測試；打包 64 個 runtime 檔。

未跑：其餘 54 個既有 eval 尚未用新 runner 整套重跑；`51` 的 Data API 流程未端到端實跑（需真實 GCP 專案）；hook 兩平台的實際觸發未驗證（需寫進使用者自己的設定檔），Codex `hooks.json` 的檔案位置以安裝時結果為準——細節寫在 `hooks/README.md`。

## 1.2.0 — Beginner experience overhaul + knowledge base expansion

**Type**: minor
**Surface**: opening flow + Socratic method + session system + 10 new/expanded knowledge files + evals
**Breaking**: no

### 對使用者更新了什麼

這版針對**新手體驗**做了系統性改造，目標是讓完全新手在 3 輪對話內就拿到第一個「關於自己網站的具體發現」。

**上手更快、更輕**
- 開場從 7 段縮成 2 句，直接進入第一個 5 分鐘檢查；「不適合清單」「免責聲明」改成碰到相關話題才講（延遲揭露 → 新檔 `sys-opening.md`）
- 帶著具體症狀來的用戶（流量掉了、發文沒流量⋯⋯）從**症狀入口表**對應的模組直接進場，不再一律從 robots.txt 學起
- 回報檢查結果**直接截圖貼上來就行**，不用打字描述
- 每個檢查與功課都標**預估時間**；每個問題都預告答案可以多簡單，「看不懂」永遠是合法答案

**教學法升級**
- 完全新手改用**二選一預測題**（「你猜 Google 找得到你的網站嗎？A/B——猜完馬上驗證」），不再被開放式問題逼出「不知道」；有經驗的用戶維持開放式判斷題
- 卡住時走**提示階梯**（暗示 → 選項 → 示範），示範完把下一題留給你
- 對新手用**三層地圖**講進度：Google 看得到 → 看得懂 → 值得排前面
- 第一次檢查優先選最可能有發現的項目；沒發現問題就自動接第二個檢查，保證第一次就有收穫

**更安全、更持久**
- 修改 robots.txt / noindex / canonical 這類「改錯會出事」的功課，一律附**留底、改錯症狀、還原方法**
- 修復型功課附**耐心卡**：多久見效、什麼時候該回來
- 功課連續 2 次沒做完會自動縮小成 10 分鐘版，不責備
- 教練會記住你已經學會的術語，不重複解釋；每輪新術語最多 1 個
- 輕量模式收尾給**迷你小結卡**（你自己發現了什麼／為什麼重要／下一步），並問要不要存進度

**知識庫擴充（9 個新檔 + 2 個擴充）**
- `40` 中文／台灣市場 SEO 特性（title 以中文字計長、斷詞、中文 URL、工具數據稀疏的現實）
- `41` Google 垃圾內容政策白話對照——廠商手法自查，跟 AK 的廠商獵殺系列互補
- `42` 診斷案例敘事庫（骨架＋示範案例，待 AK 補真實素材）
- `43` 中文 title／meta／內容好壞對照庫
- `44` 新手快問快答庫（40 題判斷型 FAQ）
- `45` CTR 基準值與修復生效時間表
- `46` Google 更新時間表（內建過期防護：超過 3 個月自動導向官方 dashboard）
- `47` 網域／主機／DNS 一頁入門
- `48` 沒網站用戶的判讀練習（沒網站也能開始學）
- `06-eeat` 補 Quality Rater Guidelines 可操作判準與新手自查 5 題；`04-on-page` 修正中文長度規則

### 為什麼要更新

Baseline analysis showed three structural gaps for beginners: (1) the mandatory 7-paragraph opening front-loaded boundaries and disclaimers before delivering any value; (2) open-ended Socratic questions are a pedagogical mismatch for zero-knowledge users (expertise reversal effect) — prediction questions keep the think-first benefit at near-zero answering cost; (3) the knowledge base was entirely translated from English-world sources, leaving zh-TW-specific traps (title length in characters vs 中文字) uncovered. This release also adds destructive-edit protection as a safety layer and 18 new eval cases (evals.json 29 → 47) written before implementation.

**Files changed**: `SKILL.md`（1.1.0 → 1.2.0，重構瘦身）、新增 `references/sys-opening.md` 與 `references/40`-`48` 九個知識檔、`00-session-flow.md`、`00-index.md`、`sys-session-system.md`、`sys-file-templates.md`、`36`、`33`、`01`、`02`、`04`、`06`、`12`、`37`、`evals/evals.json`、`evals/rubric.md`

---

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

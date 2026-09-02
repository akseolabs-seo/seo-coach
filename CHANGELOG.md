# SEO Coach Changelog

## 2.5.0 — Learn SEO by doing, not just reading

**Release type**: public GitHub release / marketing summary
**Date**: 2026-09-02

SEO Coach 2.5.0 is for people who want to build SEO judgment on a real website. It turns a long list of tools and terminology into a small, repeatable loop: set a safe goal, establish a baseline, inspect evidence, make one bounded change, verify the live page, and review the result at the right time.

It does not promise to turn you into another SEO master overnight. It gives you a practical, evidence-based way to build your own judgment through repeated work.

### The value in this release

- **A coach that gives judgment back to you.** It demonstrates one step, works through the next with you, and gradually removes support until you can repeat the process on an unfamiliar page.
- **A local GSC decision panel.** See clicks, impressions, CTR, period-average position, `1–3 / 4–10 / 11–20 / 21–30 / 31–50 / 51+` ranking buckets, query movement, anomaly signals, CTR opportunities, page ownership context, and transparent rewrite-review candidates.
- **A focused work queue.** Open any Query for current／previous detail, page breakdown, and matched rules; save a review status and note locally so the next action is visible without turning the panel into an automatic publisher.
- **One template, five languages.** Traditional Chinese, Simplified Chinese, English, Japanese, and Korean share the same interface and calculations. The first visit follows the browser language; manual choices stay in the local browser.
- **A privacy-first boundary.** Existing GSC connectors can provide data automatically, but the panel does not handle credentials, open its own network channel, call Codex CLI or AI, generate rewrites, or publish changes.

This is a learning and decision-support release, not a ranking guarantee. GSC average position is a period aggregate, and every rewrite candidate still requires a human check against the current SERP, existing page, first-party evidence, and post-change observation.

Full public release notes: [`RELEASE-2.5.0.md`](RELEASE-2.5.0.md).

> The engineering notes below are retained for traceability from the working line. This GitHub package is intentionally published and labeled as version 2.5.0.

## 2.4.0 — GSC 面板工作台與多語系

**Type**: minor
**Date**: 2026-09-02

- GSC 面板保留單一模板，新增繁體中文、簡體中文、英文、日文與韓文；第一次開啟依瀏覽器語言選擇，手動切換後保存於本機。
- 新增 Query 詳情視窗，顯示目前／比較期間的點擊、曝光、CTR、平均排名、頁面承接與命中規則。
- 新增 deterministic 異常訊號（排名／點擊／曝光下降）與 4–20 名低 CTR 機會，全部由瀏覽器內的 GSC 數據計算。
- 重寫佇列新增待確認、核對中、處理中、已完成、暫緩、備註、狀態篩選與匯出欄位；狀態與備註只保存於本機。
- GSC API bridge 的 property、維度、列數、partial、同步時間等來源 metadata 會顯示在資料檢查區，方便判斷資料邊界。
- 保持無直接網路通道、無面板內憑證、無 Codex CLI／AI、無自動改稿與自動發布邊界。
- `seo-coach` 版本升為 2.4.0。

## 2.3.2 — GSC API 連線後自動匯入

**Type**: patch
**Date**: 2026-09-01

- GSC 面板啟動時會先偵測既有的宿主 API bridge；有連線就自動載入目前／比較期間資料，沒有連線才回到 CSV／TSV／JSON／貼上匯入。
- 新增 `window.SEOCoachGscDashboard.connect(connector)` 與 `refreshFromApi()`；connector 負責登入、property、日期窗與 API 請求，面板只在瀏覽器內做 deterministic 計算。
- 保留無直接網路通道、無 Codex CLI／AI、無面板內憑證處理的邊界，並補上 API 失敗時保留本機資料的手動 fallback。
- `seo-coach` 版本升為 2.3.2。

## 2.3.1 — GSC 面板清爽後台化

**Type**: patch
**Date**: 2026-08-31

- 移除大型 hero、訊號環、垂直裝飾標籤與空白狀態裝飾，改為清楚的後台標題列與資料流程。
- 改用白底、淡青綠、低飽和 amber／coral 狀態色，收斂卡片高度、間距與控制項，改善繁體中文閱讀與手機版密度。
- 保留原有 GSC 匯入、排名計算、重寫候選、匯出與本機儲存行為；未加入任何 AI、Codex CLI 或外部服務。
- `seo-coach` 版本升為 2.3.1。

## 2.3.0 — GSC 本地搜尋訊號面板

**Type**: minor
**Date**: 2026-08-31

- 新增 `assets/gsc-dashboard/`：可直接在瀏覽器開啟的 code-first 面板，支援 GSC Query CSV／TSV／JSON、目前／比較期間匯入、Query 與 Page 視角、排名 `1–3／4–10／11–20／21–30／31–50／51+` 分桶、點擊／曝光／排名變化、deterministic 重寫候選與 CSV／JSON 匯出。
- 新增 `references/59-gsc-dashboard.md`：欄位格式、計算定義、透明規則、GSC 平均排名與匿名查詢等資料邊界。
- 面板完全在瀏覽器計算，不呼叫 Codex CLI、AI、外部 API 或網路服務；匯入內容只存放在本機瀏覽器的 localStorage，並提供清除資料入口。
- 將本地面板路徑與 GSC MCP／API 教練路徑分開，避免把面板的 deterministic 計算誤當成教練讀取或排名證明。
- `seo-coach` 版本升為 2.3.0。

## 2.2.0 — 標題公式與文章維運

**Type**: minor
**Date**: 2026-08-03

- 新增 `references/57-article-title-playbook.md`：八個標題型（數字／年份／問句／括號等）與公開研究證據（Backlinko、HubSpot/Outbrain、中文公開觀察，均標第三方估值與查核日期）、關鍵字措辭與簡稱策略、AI 輔助標題與大綱的「大綱優先」工作流、用自己 GSC 做 title A/B 驗證的方法。
- 新增 `references/58-article-formatting-and-cadence.md`：文章長度與結構、目錄（TOC）、表格圖文加值、懶人包 hub-spoke 互連佈局、CTA 與 OG 社群分享設定、更新頻率與時機、發布時間策略（誠實邊界：無官方最佳時辰）、發布後成效觀察順序。
- `references/46-core-update-timeline.md` 資料截至更新為 2026-08-03（以官方 status dashboard 核對，June 2026 spam 之後無新更新）。
- 移除 `adapters/new-platform.md`（harness-engineer 通用模板殘留，引用的檔案不屬於本 repo）。
- evals 86 → 88（標題不整批代寫、發文時間不編造時辰），rubric 補 6 個 assertion 定義；`validate_skill.py --require-evals` 通過。

## 2.1.0 — 搜尋機會實驗室：沒有付費工具也能循序學會

**Type**: minor
**Date**: 2026-08-01

- 新增 `references/55-search-opportunity-lab.md`，把候選查詢、手動無痕 SERP、內容差距、頁面歸屬／架構、content brief 與單點品質修正接進 G3→G4，而不是另做一份 audit。
- 加入 L0–L4 強度階梯與自主帶路規則：教練直接選下一個最小依賴步驟；第一輪一個畫面／一個結果，完成後才擴到三個與混合案例。
- 無 Ahrefs／Semrush 時，預設指導學員開新的無痕／私人視窗，記錄查詢、地區、語言、裝置、日期與截圖；教練先示範 1 筆，後續共做第 2 筆、學員獨立做第 3 筆，只有意圖混合才再擴兩筆。
- 全面重寫 GitHub README，把對外定位從模組／功能型陪跑改為真站能力學徒制，完整說明自主帶路、示範→共做→獨立、延遲複測、三條學習路線與零付費工具路徑。
- README 安裝主流程改為直接把 GitHub URL 與一段指令貼給 AI Agent；clone、skills 路徑與 router 說明收進備用安裝，不再讓新手先處理環境細節。
- G3 展開為候選、SERP、相對缺口、頁面歸屬與一頁式 brief；允許 `未觀察`、`N/A`、`待查`、`不值得補` 與「沿用既有頁」成為合格結果。
- 新增選用 `seo-strategy-workbook.md`；寫作作品集加入 `new / improve`、`保留／加強／新增`、真實內鏈與 SERP 觀察邊界。
- 清理內容品質與內鏈教材中的固定剪枝、字數、連結數、點擊深度、`site:` 蠶食與未證實排名因果；改成逐 URL 證據與 live 重驗。
- 新增 10 個 Search Opportunity Lab eval cases；eval set 與 rubric 升為 2.1。
- 免費工具地圖依 2026-08-01 官方頁面重新核對：補入 Keyword Rank Checker、Website Traffic Checker 與三個 AI 可見度工具（AI Visibility Checker、AI Overviews Tracker、AI Mode Tracker），「Ahrefs Webmaster Tools」全面改稱現行名稱 **Ahrefs Free**。
- 明確定義免費工具的進場時機：Lab 0–2 不提工具，Lab 3–4 才把 KD／SERP／流量工具當**驗證層**（學員先判斷再對答案），G6 回看才用 Keyword Rank Checker 搭配 GSC 平均排名。工具數字一律標第三方估值。
- `09-keyword-basics.md` 補上排名追蹤段落，說明 GSC 平均排名（期間平均）與 Rank Checker（當下快照）為何對不起來、以及不得互相「修正」。

## 2.0.0 — 從 SEO 問答工具，升級成真正帶你學會的 SEO 教練

**Type**: major
**Date**: 2026-07-31

### 這不是多加幾個功能，而是把 SEO Coach 變成真正的教練

2.0 最大的改變，是 SEO Coach 不再把「回答過問題、跑過檢查、上完模組」當成學會 SEO。

新版會陪使用者在自己的網站完成第一個可驗證 SEO 閉環：先建立基準、找出搜尋機會、親手完成一項安全修改、重新驗證，再於正確時間回看結果。最後還要換到陌生頁面重做，證明能力真的留在使用者身上。

對使用者而言，這次升級帶來五個核心價值：

- **真的有人帶路**：教練根據目前證據選下一個最小步驟，不把工具、術語和模組選單丟給新手。
- **真的動手學**：從示範、共做到獨立完成，學員必須親手觀察、判斷、修改與驗證。
- **真的留下成果**：不只找出問題，還要完成一個可還原的改善，留下 before／after 與回看證據。
- **真的能持續進步**：記錄能力、錯誤、提示程度與延遲複測，下次直接從尚未掌握的地方繼續。
- **真的以獨立為終點**：Capstone 測試使用者能否在不同頁面重建流程，而不是永遠依賴教練。

這一版的商業定位也更清楚：SEO Coach 不出售「一鍵變強」的幻想，不取代顧問，也不公開任何 SEO 大師的私人研究與客戶方法。它把已登錄的公開資源與公開 SEO 理論，轉化成一套低成本、可以實際練習的入門系統，幫助使用者打好基礎、對 SEO 產生真正興趣、爭取排出第一個關鍵詞，並開始建立自己的思維邏輯。

> 使用 SEO Coach 不會讓你直接變得跟資深 SEO 大師一樣強；它賣的不是捷徑，而是一個更少走彎路、更有機會走下去的開始。

上一個公開版本是 1.1.0，因此既有使用者升級後，也會一次取得 1.2.0 的新手體驗改善：更短的開場、症狀直接入場、截圖回報、提示階梯、三層學習地圖與安全修改護欄。

### 這一版適合誰

- 想從零學 SEO，但不想被課程、工具與術語淹沒的人。
- 已經看過很多教學，卻仍不知道在自己網站上先做什麼的人。
- 沒有高額工具預算，希望先靠公開資料與真實畫面打好基礎的人。
- 想親手排出第一個關鍵詞，並逐漸發展自己 SEO 思維的人。
- 不想只收到 AI 答案，而是希望有人持續陪練、糾正與驗收的人。

### 核心產品升級

- 18 模組改為按需知識庫；主線改成 G0–G7 真站專案：目標與安全 → 修改前基準 → 索引證據 → 查詢／意圖／承接頁 → 一項低風險修改 → 技術重驗 → 回看與決策 → Capstone。
- 進度從「上過模組」改成 `unseen / demonstrated / guided / independent / retained`，記錄提示級別、錯誤、換案例表現與 1／7／30 天複測。
- 加入陌生頁面畢業考；安全、授權、證據邊界與能力驗收為硬門檻，7 天後換案例仍通過才算真正保留。
- 加入四篇 SEO 寫作學徒軌道：A1 示範共作、A2 同型實作、A3 變式遷移、A4 無提示 Capstone；每篇保留研究、brief、兩版稿、回饋、QA、發布與觀察證據，以 W1–W8 硬門檻驗收，不用 AI 總分畢業。
- keyword strategy、topical map、公開競品觀察與 Now／Next／Later roadmap 改為可教的公開基礎能力；仍不代做整套顧問交付或高風險部署。
- Ahrefs 公開入門課 14 課重新蒸餾為「概念／動作／練習／別誤教」，舊數字與 KD／DR／UR 等自家估值不再當 Google 規則。
- 修正 GA4 Queries 逐 query 參與率歸因、GSC／GA4 固定誤差門檻、`site:` 零結果、固定 KD 分段與 AI 自述檢索原因等錯誤。
- 新增公開來源防火牆、個人來源 hash registry、FAILSAFE 與反向外洩 fixtures；教材只接受可追溯公開來源與學員授權資料。

### 使用者會立即感受到的改變

同樣的輸入，這版的行為跟 1.2.0 不一樣：

- **教學法反轉**：完全新手從「先答二選一預測題」改成**先示範一個結果**，再把下一個同型判斷交給他。用戶說「你先看／直接告訴我」時立刻示範，不再強迫先猜、也不再走提示階梯。
- **功課不再是續課門票**：只有真正的證據依賴或安全風險才擋下一步，其餘情況先縮小成 5-10 分鐘的 micro-step 或直接 park。
- **18 模組從預設漏斗改成 opt-in 課綱**：預設依用戶目標走 2-4 個必要檢查並講清楚退出條件；「流量掉了」不再自動展開整套課程。月度維護要再次取得同意。
- **成功條件放寬**：第一個勝利可以是健康基線、完成並重驗一個低風險修正、或建立有效量測——不再為了「一定要找到問題」製造假陽性。
- **證據護欄收緊**：`site:` 不再當精確收錄計數器（只是快篩，單一 URL 用 URL Inspection 定案）；sitemap 404 不再被寫成未收錄的單一根因。
- **移除錯誤硬規則**：中文 title/meta 不再鎖死 25–30／75–80 字；不再用通用「3–6 個月見效」或固定 CTR 曲線判定新手網站。
- **session 檔從兩個變三個**：拿到 GA4 數字時會建立 `seo-ga4-log.md`。有工具在讀進度檔的話要留意。
- **Eval**：舊的 prediction-first、homework hard gate、forced first defect 三組 assertion 被反轉——1.2.0 的判準在這版是錯的。

### 公開知識更新（2026）

GSC 24-hour view、Insights、Recommendations、custom annotations、2026 Generative AI performance report（限量推出）、FAQ rich result 退役、`llms.txt` 規則、2025–2026 ranking updates。

### 更容易安裝與維護

frontmatter 收斂成 `name` + `description`；新增 `agents/openai.yaml`、source/package validator、可重建雙版本的 build 腳本。每次建置同時產出 GitHub 公開版（可推送資料夾 + `.skill`）與本機維護版（含發布前驗證基礎）。公開版只封裝執行所需的主技能、教材、agent metadata、assets、adapters 與 runtime hooks；維護用 `scripts/`、`evals/` 與 hook test 僅留本機版。

### 看懂成效，不只追著排名跑

- 新增 `50-ga4-coaching-track.md`：**一輪一張指路卡**——精確點擊路徑（雙中文字樣 + 英文原名，因為 GA4 各版本選單不一致）→ 只看一個數字 → 一條常見誤讀 → 換你做。L1–L6 每級只解鎖一個概念：工作階段 vs 使用者 → 管道群組 → 維度 vs 指標 → 事件 → 關鍵事件 → GSC×GA4。
- **數字一出現就主動做三件事**（不等用戶問）：用人話翻譯這個數字在算什麼、跟台帳上次比或明講是基準線、當輪寫進台帳並告訴用戶。另有 9 條誤讀觸發表，畫面上出現就當場講掉一句（Direct 不是老客戶、`(not set)`、參與率定義、關鍵事件 0、資料保留預設 2 個月⋯⋯），一輪一條。
- 新增第三個 session 檔 **`seo-ga4-log.md`**：只增不刪的數據台帳，每列都要填「當時發生什麼」——三個月後看到波動，那一欄是唯一能把因果對起來的東西。只在第一次拿到 GA4 數字時建立，輕量模式不建。
- 新增 `51-ga4-api-connection.md`：Data API + service account 逐步，每步附「完成長什麼樣」，含驗證查詢與 7 條錯誤對照。**接通的定義是 API 數字與介面數字對得起來**，不是腳本不報錯；接了 API 也仍要讓用戶自己在介面看一次同一個數字。
- 台帳只寫本輪實際看到的數字，來源必填 `截圖／API／用戶口述`。
- `23-ga4-basics.md` 的「轉換事件」更新為「關鍵事件（Key events，舊介面叫轉換）」。

### 回來就能接著學：選用自動召喚 router

- 新增 `hooks/`：一支 `seo_coach_router.py` 同時支援 Claude Code 與 Codex——兩邊的 hook stdin 欄位與輸出契約相同，不需要各寫一份。
- `SessionStart` 只在**陪跑資料夾**（有 `seo-progress.md` / `seo-actions.md` / `seo-ga4-log.md`）觸發並接續上次進度；`UserPromptSubmit` 在任何專案偵測到新手向 SEO 提問才觸發。
- 注入文字要求「若更適合其他更專門的 SEO 技能就改用那一個」，不把整站 audit、語意內容、GEO 硬吃進陪跑模式。
- 不裝完全不影響既有行為。無第三方套件、不寫檔、不連網，任何例外靜默 exit 0。
- 本機維護版的 `hooks/test_router.py` 提供 28 個 pipe test，不進 GitHub 公開版與 `.skill`。

### 不是靠 prompt 感覺：可驗證的教練行為

- 新增 `scripts/run_evals.py`：每個 case 送進獨立的 `claude -p` 全新 session 與空白工作目錄，存下回應、記錄該 case 實際產生了哪些檔案、輸出把判準內嵌好的判分工作表。`--judge` 提供模型判分的第一輪 triage（FAIL 必須人工覆核）。
- **補完 81 條缺失判準**：改版前 146 個 assertion 裡有 81 個（55%）在 rubric 找不到定義，60 個 case 有 42 個受影響——等於過半的判分只能望文生義。現在 146/146 都有可引用的判準。
- validator 新增閘門：assertion 沒有對應 rubric 定義就 build 失敗，這個坑不會再回來。
- 新增 10 個 GA4 相關 eval case 與 22 條判準。

### 發布品質與公開邊界

2.0 首次把「教得好不好」納入可執行驗證，而不只檢查檔案格式：

- 用隔離的新 session 測試新手帶法、延遲複測、進度更新與常見誤判。
- 用隱私反例確認客戶資料、私人研究、未公開 prompt 與其他本機專案不會進入公開教材。
- 驗證公開安裝包與 Codex／Claude runtime 一致，避免分享版和本機版行為分岔。
- 真實 API、登入後台與平台 hook 仍以使用者授權及現場環境為準；沒有實際接通就不宣稱已驗證。

所有教材來源限於已登錄的公開資源、Google 等官方公開文件、公開網站／SERP，以及能以公開 URL 查核的理論與觀點。這個版本不包含任何私人研究方法、未公開測試、客戶資料、客戶案例細節、私訊或私人 SOP。

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
- `41` Google 垃圾內容政策白話對照——廠商手法自查，跟公開 SEO 廠商識別系列互補
- `42` 診斷案例敘事庫（只使用明確標示的合成示例）
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

**由公開、可驗證的 SEO 實務與教練式學習原則設計與訓練。**

### 包含

**核心架構**
- 18 個 Audit 模組（5 層架構）：爬蟲能力、索引狀態、技術 SEO、頁面優化、內容品質、E-E-A-T、內部連結、頁面速度、關鍵字基礎、連結建設、CMS 特定問題、情境防護、AI 搜尋、主題地圖、SERP 功能、進階技術、媒體優化、電商 SEO
- 蘇格拉底式陪跑對話設計（問問題引導用戶自己發現問題，不丟報告）
- 多風格支援（朋友型 / 老師型 / 教練型）
- 新手輕量模式 + 完整陪跑模式自動分流
- 持續追蹤 Session 系統（`seo-progress.md` + `seo-actions.md`）

**公開 SEO 廠商識別教學整合**
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
- SEO Coach 虛擬教練身份（「由 SEO 實務訓練出的虛擬陪跑教練」）
- 繁體中文預設，英文自動切換
- README 中英雙檔（中文主要 + 英文版本）
- 平台中立：可放進任何 AI agent 的 skills 資料夾使用

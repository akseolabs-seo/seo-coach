# AI 搜尋準備度（AI Search Optimization）

**reason**: 把 Google 官方的生成式 AI 搜尋規則與民間 AEO/GEO 話術分開，避免新手追逐特殊檔案或 markup。
**strip_when**: Google 對 generative AI Search 的 eligibility、控制或報表機制發生實質變更。

資料核對：2026-07-11。

## 核心概念
AI 搜尋（Google AI Overview、ChatGPT Search、Perplexity）改變了內容被「發現」的方式。傳統 SEO 是排名到搜尋結果頁，AI 搜尋是讓 AI 把你的內容當作可信來源「引用」。

**關鍵差異：**
| 傳統 SEO | AI 搜尋 |
|---------|--------|
| 爬取 → 索引 → 排名 | 擷取 → 合成 → 生成答案 |
| 目標：頁面排名第一 | 目標：被 AI 當來源引用 |
| 優化單一頁面 | 建立整體來源可信度 |

**好消息：** SEO 基礎（爬行、索引、速度、E-E-A-T）對 AI 搜尋仍然重要，不需要推翻一切重來。

---

## 技術準備

### 先讓一般搜尋能存取你的網站
Google 的 AI Overviews / AI Mode 沿用 Google Search 的基礎要求：頁面要能被 Googlebot 存取、索引，且可顯示 snippet。不要為了 AI 搜尋另外發明一套技術 SEO。

對 Google Search 的 AI features 來說，主要控制仍是 Googlebot、`noindex`、`nosnippet`、`data-nosnippet`、`max-snippet` 等 Search preview controls。`Google-Extended` 是用來控制部分 Google AI 訓練 / grounding 用途，不是讓你出現在 AI Overviews 的必要設定。

### 結構化資料對 AI 搜尋的重要性
- 不需要新增特殊的「AI schema」或 AI 專用檔案
- Google Search 明確不使用 `llms.txt` 來決定 visibility 或 ranking；可為其他服務保留，但不要把它列為 Google SEO 功課
- Structured data 仍然有用，但前提是和頁面可見內容一致
- Article / Organization / Product / LocalBusiness 等 schema 可幫助機器理解內容與實體，但不能替代真正有用、可信、可讀的內容

### llms.txt：先別急著做（我的實測觀察）
我把自己幾個站的 server log 翻過，目前幾乎沒看到任何主流 AI 爬蟲專程來抓 llms.txt——沒人主動看的索引，做得再漂亮也像塞抽屜裡沒人翻的紙。

有人會被 Google 自己的兩份文件搞混：Search Central 說「不用為了生成式搜尋（AI Overviews／AI Mode）做 llms.txt」；Chrome Lighthouse 卻把 llms.txt 放進 agentic browsing audit。這是兩件事——前者講排名，後者只講「網站對 AI agent 好不好讀」。John Mueller 把它比作當年的 keywords meta tag：做了沒壞處，對排名幾乎沒影響。（Lighthouse 的 audit 邏輯也印證：沒這檔就標 N/A，只有它嘗試抓卻碰到 server error 才 flag。）

結論：llms.txt 本質是 markdown 寫的重點頁面索引，20 分鐘做得完，沒有玄學；別排在 robots、sitemap、可收錄、速度、結構化內容前面。真的閒才花 20 分鐘讓 AI 做一份放根目錄，確認回 200、內容別亂寫。如果為了它焦慮、卻連 sitemap 和實測內容都沒顧好，那是優先順序整個反了。（as-of 2026-07）

### 確保內容可被正確解析
- 避免讓重要內容只能在複雜 JavaScript 互動後才出現；不管是 Googlebot 或其他爬蟲，越容易以 HTML / 可渲染內容取得，越穩
- 使用語意化 HTML（`<article>`、`<section>`、`<h1>-<h6>`）
- 重要資訊用純文字，不只放在圖片裡

---

## 內容優化

### 對話式內容格式
AI 搜尋喜歡能直接回答問題的內容結構：

**好的格式：**
- 問題 → 直接答案（第一段就給答案，再展開解釋）
- FAQ 格式（每個問題都有獨立標題）
- 定義式寫法（「X 是什麼？X 是...」）

**不友善的格式：**
- 答案埋在大段敘述裡
- 需要讀完全文才能找到結論
- 過度行銷、不夠直接的寫法

### 引用友善的寫作
AI 系統傾向引用：
- 有明確事實、數據的內容
- 有清楚來源引用的內容
- 語言準確、不模糊的陳述
- 有作者和發布日期的內容

### 完整涵蓋主題
AI 偏好可以完整回答一個問題的單一來源，而非需要拼湊多個來源。讓你的頁面盡可能完整地回答目標主題的所有面向。

---

## E-E-A-T 在 AI 搜尋中仍然重要

AI 搜尋會更常把內容拆成答案、比較、引用來源；因此來源可信度、清楚的實體資訊和可驗證內容更重要。但不要把它講成一個可直接操作的「AI 排名分數」。
- 清楚的作者資訊（真實姓名、職稱、專業背景）
- 明確的品牌身份（About 頁面、聯絡資訊）
- 被其他可信來源提及或引用
- 內容有清楚的發布和更新日期

---

## 自誇榜單的風險，與「第三方共識」

有個越來越危險的舊招：自己寫一篇「最佳某某供應商／最佳工具」把自己排第一，想讓 Google 和 AI 都把你當首選。2026 開年這類 self-promotional listicles 已經開始付代價——Lily Ray 在 2026 年 1 月拆解多個 SaaS／B2B 站，因為大量自誇榜單在該波 volatility 後可見度重挫約 29%–49%；Glenn Gabe 也公開認同觀察到類似模式。（as-of 2026-01 案例，非官方命名的更新，當觀點看）更麻煩的是 AIO 有時會引用這類 listicle 當來源，但你自誇未必加分，提到競爭對手反而可能讓模型把「對手也值得考慮」一起吃進去。

AI 要的不是你自誇，是**外部世界的共識訊號**。官網自述再強，AI 仍傾向當品牌宣傳；當 G2、Capterra、權威媒體、真實客戶案例、獨立評測、podcast、產業比較頁都在講你，AI 才敢把你放進答案。不同模型的引用偏好也不同（觀察值，非官方）：ChatGPT 特別常吃 listings／目錄／評論；Gemini 更偏品牌網站與結構化資料；Perplexity 拉更多可引用網頁。

所以不是「官網不用做」，是「只靠官網遠遠不夠」：
- 白帽：上 podcast、被權威媒體引用、做真實第三方評測、進中立目錄、鼓勵客戶留可被抓取的真實評論、發布透明方法論的比較研究。
- 官網仍是地基（你是誰、產品怎麼用、真實證據、透明方法論），但要另外積極佔住外部可被引用的位置。

（延伸：若用戶主動問到「自建第三方內容站群／矩陣」這類灰帽做法，重點是每個站都要像獨立內容資產、也會誠實談其他品牌與缺點；低級互吹站群容易被偵測成同一組低品質訊號，長期大概率被打壓。不主動教操作。）

---

## 怎麼追蹤 AI 搜尋的曝光

目前沒有跨平台完美追蹤，但可以：
1. **Google Search Console**：2026-06 起，Google 正向部分網站推出獨立的 Generative AI performance report，可看 AI Overviews／AI Mode 的 impressions、pages、countries、devices、dates；若看不到，可能尚未開放或資料不足
2. **一般 Performance**：生成式 AI 資料仍包含在 Web search type 的整體數據中
3. **手動抽查**：在不同 AI 搜尋產品觀察品牌與主題，但個人化結果不能當穩定排名報表
4. **免費第三方追蹤工具**（見下）：填補 GSC 報表還沒開放、或想跨平台看的空窗

### 三個免費 AI 可見度工具（2026-08-01 核對）

Ahrefs 的免費工具頁 https://ahrefs.com/free-seo-tools 目前提供：

| 工具 | 看什麼 | 什麼時候給學員 |
|---|---|---|
| **AI Visibility Checker** | 品牌在 ChatGPT、Gemini、Perplexity 等平台被提及的頻率 | 用戶問「AI 找不找得到我」的第一輪 |
| **AI Overviews Tracker** | 在 AI Overviews 的能見度、引用與答案波動 | 已經在做內容、想看有沒有被引用時 |
| **AI Mode Tracker** | 在 Google AI Mode 的提及與引用 | 同上 |

**教練用法**：一輪只開一個，先讓學員自己搜一次品牌名看 AI 怎麼講他，再用工具對照——順序反過來的話，學員會直接相信數字而不會判讀答案內容。

**證據邊界（必講）**：這三個都是 Ahrefs 自己的抽樣與模型輸出，**不是各 AI 平台的內部資料**，照 `52-public-source-policy.md` 一律標成第三方估值。提及次數變動可能來自模型更新、抽樣或個人化，不能單獨當成「我的 SEO 有效／無效」的因果證據。數字要跟 GSC 的 Generative AI report 與手動抽查一起看，並記下查核日期。

---

## 手動抽查的證據邊界

可以在乾淨環境重做一組公開問題，記錄實際回答、可見引用 URL、日期、地區與模型版本，再比較哪些公開頁面反覆被引用。

不要追問模型「你剛剛拒絕了哪些來源、原因是什麼」後，把回答當成真實檢索紀錄。模型可能生成一個聽起來合理的事後解釋，卻沒有能力揭露完整隱藏流程。診斷只使用可見引用、可重做輸出、公開頁面與平台提供的正式報表。

---

## 實用的快速改善清單

- [ ] 確認 Googlebot 沒有被 robots.txt、CDN、主機或登入牆擋住
- [ ] Structured data 與頁面可見內容一致，不標記假的或看不到的資訊
- [ ] 重要文章有清楚作者、日期、來源與更新紀錄
- [ ] 重要頁面讓讀者容易找到答案；不為 AI 強制把內容切成小塊或改成固定模板
- [ ] FAQ 區塊只在讀者真的需要時加入，不期待 FAQ rich result（Google 已於 2026-05 停止顯示）
- [ ] 確認 About 頁面有完整的品牌/作者資訊
- [ ] 在 ChatGPT/Perplexity 搜尋你的品牌和核心關鍵字，記錄現況

---

## 邊界聲明
以下建議尋求專業判斷：
- AEO（Answer Engine Optimization）完整策略
- AI 搜尋的競爭分析和引用差距分析
- 大規模的 AI 搜尋可見度監控系統建立

官方來源：
- AI optimization guide：https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- 2026 Generative AI report：https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports
- Search Console report：https://support.google.com/webmasters/answer/16984139

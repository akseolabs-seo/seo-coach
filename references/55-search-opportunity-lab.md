# 55 — 搜尋機會實驗室：從查詢到一項內容改進

本實驗室嵌入 `53-zero-to-first-result-apprenticeship.md` 的 G3→G4。它教學員親手完成一個縮小閉環：**候選查詢 → 手動 SERP → 相對缺口 → 承接頁 → brief → 一項改進**。它不是 keyword report、競品 audit、整站架構案或內容品質評分表，也不重複 G0–G7 的基準、上線與延遲成效判讀規則。

## 目錄

1. [完成能力與啟動方式](#完成能力與啟動方式)
2. [每輪教學契約](#每輪教學契約)
3. [Lab 0：建立問題](#lab-0建立問題)
4. [Lab 1：候選查詢](#lab-1候選查詢)
5. [Lab 2：無付費工具的手動 SERP](#lab-2無付費工具的手動-serp)
6. [Lab 3：內容缺口](#lab-3內容缺口)
7. [Lab 4：承接頁與網站架構](#lab-4承接頁與網站架構)
8. [Lab 5：新建或改善 brief](#lab-5新建或改善-brief)
9. [Lab 6：內容品質單點修正](#lab-6內容品質單點修正)
10. [作品、通過條件與錯誤](#作品通過條件與錯誤)
11. [1／7／30 天複測](#1730-天複測)
12. [來源與更新護欄](#來源與更新護欄)

## 完成能力與啟動方式

學員完成後應能：

- 用可追溯來源找出少量候選查詢，不捏造搜尋量或 KD。
- 在新的無痕／私密視窗手動讀 SERP，區分觀察、推論與未觀察。
- 判斷「競品有」是不是自己真的值得補的缺口。
- 選擇改善現有頁或建立新頁，避免一個意圖被多頁互搶。
- 寫出可執行的小型 brief，指定真實內部連結，不使用虛構 URL。
- 對一頁做一項內容品質修正，留下修改前後與重驗證據。

### 低強度起步

- 第一次只處理 **1 個業務問題、1 個候選查詢、1 個 organic result**。教練先示範第一筆；下一輪共做第二筆，再由學員獨立判讀第三筆，才形成三筆的初始樣本。
- 不先要求完整工具帳號、十個競品、全站 crawl、關鍵字清單或內容日曆。
- 教練能安全查看公開資料時先示範；需要登入、地區或個人畫面時，給一張操作卡並請學員截圖。
- 學員說「你先看／我不懂」時立即示範一例，不以猜題或密集問答開場。
- 三筆初始樣本仍顯示 mixed intent 時，才再加 **2 筆**並重新判斷；不要為了顯得完整而預設檢查 Top 10。

### 免費工具什麼時候才進場

預設路徑是手動無痕 SERP，**不是因為沒有免費工具，而是因為看不懂畫面的人拿到 `KD = 23` 也不知道那代表什麼**。所以工具按 Lab 進度分層開放，不在第一輪丟清單：

| 階段 | 工具 | 角色 |
|---|---|---|
| Lab 0–2（建立問題、候選查詢、手動 SERP） | **不提工具** | 學員先用眼睛讀懂一個結果 |
| Lab 3–4（內容缺口、承接頁決策） | Ahrefs Free Keyword Generator、Keyword Difficulty Checker、SERP Checker、Website Traffic Checker | **驗證層**：學員先講自己的判斷，再開工具對答案 |
| Lab 5–6 之後、G6 回看 | Ahrefs Keyword Rank Checker（配 GSC 平均排名） | 檢查這次修改後排名有沒有動 |

**驗證層的用法是固定的**：先問學員「你覺得這個字難不難做、誰會排前面」，記下他的答案，**再**打開工具。一致 → 確認他的判讀邏輯站得住；不一致 → 那個落差就是本輪最好的教學素材，比直接給數字有用。順序反過來，學員會學會查數字，但不會學會判斷。

> **這個階梯管的是「教練指定的下一個動作」，不是「能不能回答工具問題」。**
> 學員直接問「沒預算能不能做關鍵字規劃」「有哪些免費工具」「這個工具怎麼用」時，**當輪就要具體點名可用的免費工具**（GSC 查詢報告、Google Autocomplete、Google Trends、Keyword Planner、Ahrefs 免費工具⋯⋯清單見 `38-continuous-coaching-free-tools.md`），照 SKILL.md「工具操作步驟直接回答」處理。回答完再說明本輪的動作仍然從手動判讀開始、工具在哪一步進場。
> 不能因為現在還在 Lab 0–2，就對一個直接的工具問題完全不提工具名稱——那不是教學節奏，那是答非所問。

工具清單與各自的限制見 `38-continuous-coaching-free-tools.md`；所有 volume、KD、DR、流量與 AI 提及數一律標**第三方估值**，不得冒充 Google 或 AI 平台的內部資料。

## 每輪教學契約

每輪只推進 **1 個概念 + 1 個檢查**，預設 2–4 段：

1. **示範（I do）**：教練用一例說「看到什麼／最多能證明什麼」。
2. **共做（We do）**：給 1–5 分鐘操作與答案形狀；截圖優先，不要求長篇描述。
3. **獨立（You do）**：下一個同型案例由學員完成；換案例才算遷移，不把教練代做算成能力。

提示階梯為暗示→二至三個選項→直接示範。若用戶明確要求直接看，跳到示範。每輪收尾只給一個停點或一個功課；未完成不自動停課，除非缺少它會讓下一步證據無效或造成風險。

### 證據用語

| 標籤 | 用法 |
|---|---|
| 官方行為 | 官方文件直接說明 |
| 公開觀察 | 本輪手動 SERP、公開頁面或截圖實際看到 |
| 第三方估值 | 工具估計的 volume、KD、traffic 等，不能冒充 Google 資料 |
| 學員證據 | 學員授權的 GSC、GA4、CMS 或網站資料 |
| 教學判斷 | 根據上述證據做的優先建議 |
| 未觀察 | 畫面、工具或權限沒有提供；不能寫成「不存在」 |

## Lab 0：建立問題

只補 G3 所需的問題，不重做 G0／G1。

若學員此刻明確問「SERP 怎麼看」或說沒有付費工具，直接先給 Lab 2 的一筆無痕操作卡，不要求先填完整 Lab 0。已有候選詞就直接使用；沒有才請他給一個顧客問題，或用明標為示範的查詢帶一次。

**示範**：「這個服務頁想增加台北地區的有效詢問」比「我要更多流量」更能約束查詢與頁型。

**共做**：請學員用一句話填：

> `[頁面／服務]` 想透過自然搜尋增加 `[可觀察結果]`，主要服務 `[受眾／地區]`。

**獨立通過**：能指出頁面、受眾、地區／語言與結果；若缺 G1 baseline，只記為待補依賴，不直接進修改。

## Lab 1：候選查詢

### 概念

候選查詢是要驗證的假設，不是只要像關鍵字就值得做。來源優先序：學員自己的 GSC 查詢 → 客戶／使用者原話 → Google 搜尋建議與相關搜尋 → 合法公開工具。Autocomplete 只能證明出現過建議，不能證明月搜尋量。

### 示範→共做→獨立

- **示範**：列 1 個查詢，標來源、日期、地區／語言，以及目前未知的 volume／KD。
- **共做**：讓學員在 3 個候選中排除 1 個與業務不相干的詞，答案形狀為 `選 A/B/C + 一句原因`。
- **獨立**：學員為另一頁找 3 個候選，先只選 1 個進 SERP 驗證。

不要強制計算 opportunity score，也不設定固定 volume、KD 或 CPC 門檻。資料缺失就標 `N/A／未觀察`；優先級使用業務相關性、實際意圖、現有承接能力與觀察到的競爭情境。

## Lab 2：無付費工具的手動 SERP

### 學員操作卡

1. 開一個**新的無痕／私密瀏覽視窗**；不要只在原本登入中的一般分頁搜尋。
2. 記錄搜尋字詞、國家／城市、介面語言、裝置類型與日期。無痕會減少部分本機狀態影響，但不等於完全中立；地區、語言、裝置與即時變動仍會改變結果。
3. 搜尋完全相同的查詢。先忽略廣告。第一輪只看第 **1 個 organic result**，由教練示範怎麼記錄標題、URL、頁型與承諾；後續再逐步做到第 2、3 筆。
4. 截下包含查詢與目前正在判讀結果的畫面。看不懂時直接貼截圖，不用轉錄。
5. 另記畫面實際可見的 AI Overview、PAA、local、video、shopping 等功能。沒有截到或工具沒提供就標 `未觀察`，不能寫「不存在」。
6. 完成三筆初始樣本後，若頁型與任務大致一致，可作暫定意圖；若訊號明顯分裂，標記 `mixed intent`，只再看第 4、5 筆後重新判斷。仍不清楚就停在 `證據不足`，不硬選頁型。

### 教練帶法

- **示範**：圈出第一個結果的頁型，說明「這是公開觀察；它不能單獨證明排名原因」。
- **共做**：下一輪只請學員判斷第二名是教學文、產品／服務頁、比較頁、分類頁或其他；答案可直接標在截圖上。
- **獨立**：學員判讀同一查詢的第三筆；能力穩定後才換查詢，獨立記錄環境、三筆樣本與暫定意圖，教練再核對。

意圖必須引用至少兩個觀察，例如「前三名有兩篇比較頁」加「標題共同承諾選擇／評比」。不得以固定字數、DA／DR、backlinks 或「大站很多」直接產出難度分數。

## Lab 3：內容缺口

### 概念

缺口是**相對於自站、比較對象和搜尋需求**的差異。競品有寫只是一個 candidate gap，不代表自己必須寫。

用最小矩陣比較自站最相關頁面與 1–2 個真正相近的公開競品頁：

| 主題／需求 | 自站覆蓋與 URL | 競品覆蓋與 URL | 狀態 | 值得補的理由 |
|---|---|---|---|---|
| [需求] | [有／無／部分] | [有／無／部分] | candidate／verified／不做 | [意圖、受眾、業務、差異化] |

缺口可分為 topic、depth、angle、format、freshness、proof 或 journey stage。只有四項都得到支持，才標 `verified`：自站未充分承接、SERP／受眾確有需求、網站能可信提供所承諾的內容／服務、而且對業務有實際價值。缺任一項就留在 `candidate` 或標 `不做`；競品有寫或沒寫都不能跳過這四項。

- **示範**：展示一個「競品有但不值得追」和一個 verified gap。
- **共做**：學員填矩陣的一列。
- **獨立**：換小主題比較自己的 1–3 頁與兩個公開頁；「沒有值得補的缺口」也是合格結果。

## Lab 4：承接頁與網站架構

### 新頁或舊頁決策

依序回答：

1. 站內是否已有主要意圖相同、受眾相同的頁面？
2. 現有頁能否透過補段落、改承諾或加內鏈完整承接？
3. SERP 是否顯示另一種明確頁型／意圖，需要獨立 URL？

能補現有頁時預設 **improve**；只有不同意圖需要獨立承接時才 **new**。字面不同不是拆頁理由。若兩頁可能互搶，先標 `PAGE_MAPPING` 並停在規劃，不直接發布。

### 真實內部連結練習

- 從目前站內實際存在的頁面選 1–3 個來源頁與目的頁。
- 每條記錄 `source URL → target URL → 放置段落 → 描述性 anchor → 為何對讀者有幫助`。
- 先開啟 URL 驗證為真實頁面；不得用 `[pillar URL]`、猜測 slug 或虛構未發布頁。
- 連結要放在語意相關的正文位置，不以固定每頁連結數量當合格條件。

## Lab 5：新建或改善 brief

### 共用欄位

```text
業務目標／受眾／地區與語言
主要查詢／次要需求／SERP 日期與截圖
主意圖／預期頁型／讀者完成後能做到什麼
必答問題／可提供的真實經驗、證據或來源
真實內部連結：source → target → anchor → placement
不確定處／發布後如何驗證
```

### `NEW` brief

另填：為何現有頁不能承接、建議 URL 角色、與現有頁的邊界、避免重疊的方法。不得只因競品有文章就建頁。

### `IMPROVE` brief

另填：現有 URL、保留內容、觀察到的缺口、只改哪一項、修改前留底、回復方法。首次實作優先一個低風險改動，例如補直接回答、補證據、調整標題承諾或加入一條真實內鏈。

學員先寫 brief；教練可示範一欄、共做一欄，不能代填完整策略再把它算成學員能力。

## Lab 6：內容品質單點修正

不跑 80 項 E-E-A-T 分數。每輪只選一個鏡頭：

1. **承諾**：title／H1 的承諾是否被正文實質回答？
2. **證據**：關鍵 claim 是否有可追溯來源、方法或真實經驗？
3. **信任**：作者、商業關係、限制與更新狀態是否足以讓讀者判斷？
4. **組織**：讀者能否快速找到答案與下一步？

每項只用 `pass / partial / fail / unknown / N/A`。`unknown` 是適用但未觀察，不是 fail；`N/A` 必須真的不適用並寫原因。短內容不自動等於薄弱，字數、schema、年份與第一人稱都不是結果保證。

- **示範**：在一小段標出 `claim → evidence → unknown`。
- **共做**：學員判斷第二段的狀態並指出畫面證據。
- **獨立**：在自己的頁面選一個最高優先缺口，留下 before／after，重新開真實頁面確認改動可見且原承諾未被破壞。

標題／正文重大不符、內部重大事實矛盾、未揭露的重大商業關係與 YMYL 高風險內容，停止自行修改並升級專業或補證據。

## 作品、通過條件與錯誤

每個案例只留一張 `搜尋機會卡`，可存入 `seo-progress.md` 的案例紀錄；若屬四篇寫作軌道，放入對應作品的 research／brief 證據，不另造平行進度系統。

```text
案例／日期／提示級別
問題與目標
候選查詢及來源標籤
無痕 SERP 環境、截圖、Top 3、觀察／未觀察、意圖
自站頁／競品頁／candidate 或 verified gap
NEW 或 IMPROVE 決策與理由
真實內鏈計畫
brief／單項改動／before-after／重驗
錯誤類型／下次 1、7、30 天題目
```

### 單一案例通過條件

- 證據有 URL／截圖、日期、環境與來源標籤，沒有捏造數字。
- 主意圖由至少兩項 SERP 觀察支持，未觀察沒有被寫成不存在。
- 缺口有自站與競品雙邊證據；能說明做或不做。
- NEW／IMPROVE 決策處理頁面重疊風險。
- internal links 均為已驗證的真實 URL、相關位置與描述性 anchor。
- brief 能交給學員自己執行；修改有留底、回復方式與真實頁面重驗。
- 能說明本次證據不能證明排名、流量或轉換一定提升。

### 錯誤類型

| 代碼 | 觸發 |
|---|---|
| `EVIDENCE_LABEL` | 把估值、推論或未觀察寫成已測量事實 |
| `SERP_CONTEXT` | 未開新無痕視窗，或漏記地區／語言／裝置／日期 |
| `INTENT_MISREAD` | 只看一名、修飾詞或印象判意圖 |
| `SCOPE_MISMATCH` | 比較對象、受眾、地區或頁型不相近 |
| `GAP_OVERCLAIM` | 競品有寫就當 verified gap，或沒找到就說沒人做 |
| `PAGE_MAPPING` | 同意圖多頁、字面差異拆頁或忽略現有承接頁 |
| `FAKE_INTERNAL_LINK` | URL 未驗證、猜 slug、只填 placeholder |
| `METRIC_OVERREACH` | 以固定 KD、分數、字數或時程保證結果 |
| `ACTION_MISMATCH` | 修正與觀察到的問題無關，或一次改太多無法判讀 |
| `SAFETY_AUTHORITY` | 越權發布、偽造經驗、忽略揭露或高風險內容 |

## 1／7／30 天複測

- **1 天**：同站換一個查詢或段落；最多一級提示，重做 Top 3 SERP 判讀與 NEW／IMPROVE 選擇。
- **7 天**：換意圖、頁型或陌生公開頁；無提示完成縮小的「查詢→SERP→缺口→承接頁」並留下證據。通過才可由 `independent` 升為 `retained`。
- **30 天**：混合題只給業務目標與頁面；學員自己選先查哪項、何時擴展 SERP、何時因證據不足停止，以及做哪一項低風險內容改進。

一次做對不等於會了。不同案例至少兩次正確、其中一次無提示，才標 `independent`；延遲換案例仍正確才標 `retained`。失敗只調整對應能力並用錯誤代碼安排下一題。

## 來源與更新護欄

方法經重新編排後參考以下 pinned 開源技能：Corey Haines 與 AgriciDaniel 的來源採 MIT License，Aaron He Zhu 的來源採 Apache-2.0。此處只吸收可教學的證據流程並重新表達，不整段搬運，也不搬入一次性交付 audit、固定分數或工具依賴：

- [Content Strategy](https://github.com/coreyhaines31/marketingskills/tree/c21a984a56da/skills/content-strategy)
- [SEO Audit](https://github.com/coreyhaines31/marketingskills/tree/c21a984a56da/skills/seo-audit)
- [Site Architecture](https://github.com/coreyhaines31/marketingskills/tree/c21a984a56da/skills/site-architecture)
- [Content Gap Analysis](https://github.com/aaron-he-zhu/aaron-marketing-skills/tree/bc7d62dd685b/seo-geo/survey/content-gap-analysis)
- [Content Quality Auditor](https://github.com/aaron-he-zhu/aaron-marketing-skills/tree/bc7d62dd685b/seo-geo/tune/content-quality-auditor)
- [Keyword Research](https://github.com/aaron-he-zhu/aaron-marketing-skills/tree/bc7d62dd685b/seo-geo/survey/keyword-research)
- [SEO Content Brief](https://github.com/AgriciDaniel/claude-seo/tree/09d37c7b66ed/skills/seo-content-brief)
- [SERP Analysis](https://github.com/aaron-he-zhu/aaron-marketing-skills/tree/bc7d62dd685b/seo-geo/survey/serp-analysis)

Google 官方校準來源：

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [SEO link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Browse Chrome as a guest or in Incognito](https://support.google.com/chrome/answer/95464)

SERP、Google 介面與功能會變；使用時記查核日期。若開源模板與較新的 Google 官方說明或當下畫面衝突，以官方說明和本輪觀察為準。Google 明確表示沒有偏好的固定字數；E-E-A-T 不是單一排名因子，因此不得把品質清單、schema 或分數包裝成排名保證。

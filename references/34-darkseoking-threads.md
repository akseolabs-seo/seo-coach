# 34 — AK 的「低端 SEO 廠商獵殺計畫」教學系列

來源：AK（@darkseoking）在 Threads 公開發表的「低端SEO廠商獵殺計畫」系列 + 配套開源工具。
這個檔案是 AK 自己的教學立場與工具邏輯，回答以下類型的問題時優先參考：
- 「廠商報價合理嗎？」「這個 SEO 服務值不值得買？」
- 「我自己做得來嗎？」「外包還是自學？」
- 用戶在猶豫關鍵字規劃、寫文章、舊文優化、內部連結這幾件事要不要花錢外包

使用注意：這份是 AK 的 Threads 教學與銷售語境素材，適合拿來理解口吻、常見廠商話術、低競爭場景的實務判斷。它不是 Google 官方規範；涉及排名、流量倍數、工具效果時，只能當作案例或觀點，不能輸出成保證。

---

## 系列宗旨（AK 的立場）

低端 SEO 廠商最常剝削的，是「客戶不知道自己其實做得到」這件事。
AK 把廠商通常包成「月費 NT$1.8 萬～3 萬」的服務拆開來，**用免費或月付制工具 + 系統化流程**，讓中小企業主自己做。

教練在對話中要傳遞的核心訊息：
1. **被報價嚇到 ≠ 服務真的值那個價** — 先看廠商在做什麼，再判斷該不該付。
2. **可以自己做的就自己做** — 工具有 free tier 或可以「集中一個月用完再退訂」。
3. **重點不是省錢，是學會判斷** — 學會了，才知道下次哪些值得外包、哪些不要。

---

## 系列貼文索引（與 URL 對應）

| #   | 主題                | Threads URL                                                         | 配套工具                                                                  |
| --- | ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| #1  | 關鍵字規劃          | https://www.threads.com/@darkseoking/post/DIBa4d3PY4T               | Ahrefs / SEMrush（外部商業工具）                                          |
| #2  | 文章怎麼寫？        | https://www.threads.com/@darkseoking/post/DRMlJRPE9Ax               | —                                                                         |
| #2-1| 大綱生成器          | https://www.threads.com/@darkseoking/post/DSZ7O7vk-fK               | **GitHub: akseolabs-seo/Anti-Low-End-SEO-Planner**（完整 prompt 已收入）  |
| #3  | 舊文優化            | https://www.threads.com/@darkseoking/post/DRg3Ot1kyMt               | AK 已在貼文 carousel 寫完整 SOP，遇到時直接導用戶讀貼文                   |
| #4  | 內部連結            | https://www.threads.com/@darkseoking/post/DR3qRkvEwC-               | 公開 AI Studio app（需 Google 登入；本 Skill 不收錄其內部指令）          |

---

## #1 關鍵字規劃

**廠商常見話術**：「關鍵字規劃要月付 1.8 萬，至少簽 6 個月（約 11 萬）。」

**AK 的拆解**：
- 關鍵字規劃確實是 SEO 戰略的根基——選錯了，後面再怎麼優化都白費。
- 但「會用 Ahrefs 或 SEMrush」≠ 顧問才能做。工具本身就是答案來源，廠商只是代查。
- 中小企業可以**集中一個月**密集用 Ahrefs / SEMrush，做完整套規劃後退訂。一次成本約 USD 100-200，不是 NT$11 萬。

**教練怎麼用**：
- 用戶說「廠商報價 X 萬做關鍵字規劃」→ 先問：「他有跟你解釋具體會交付什麼嗎？是一份關鍵字清單，還是包含搜尋意圖分群、難度評估、優先順序？」
- 用戶說「我不會用 Ahrefs」→ 引導用 GSC 查詢報告（免費）+ Google Autocomplete + People Also Ask 起步，等真的有預算再上工具。
- 對應模組：Module 10 (Keyword Basics) → `references/09-keyword-basics.md`

---

## #2 文章怎麼寫？（寫手鑑別）

**AK 的觀察**：10 年來面試過 300-400 位 SEO 寫手，**寫文章是低端寫手最容易露餡的地方**。很多來自大廠商的寫手，只會套模板。

**廠商常見問題**：
- 把文章長度當品質（「我們保證每篇 3000 字」）
- H2/H3 結構抄競品但沒有自己的搜尋意圖判斷
- 段落生成靠「擴寫」而不是「答題」
- 沒有人類觀點，全是維基百科式平鋪

**教練怎麼用**：
- 用戶問「我要不要外包寫文章？」→ 先問：「廠商有沒有給你看過他們寫過的範例？你拿去 Google 搜尋目標關鍵字，他們的文章排得到第一頁嗎？」
- 用戶問「為什麼我發了文章沒排名？」→ 進到 Module 7 (Content Quality)，重點問「你的文章有沒有完整回答用戶搜這個字時想知道的事？」
- 對應模組：Module 7 → `references/05-content-quality.md`

---

## #2-1 大綱生成器（Anti-Low-End-SEO-Planner）

**AK 的核心發現**：用「單一 AI node 一次生成完整文章」品質很差。
**正確架構**：**生成大綱 → 人類照大綱寫 → AI 評估**。AI 不是寫手，是 outline producer + reviewer。

GitHub: https://github.com/akseolabs-seo/Anti-Low-End-SEO-Planner
授權：CC BY-NC-SA 4.0（嚴禁商用）

### AK 對這個工具的定位（README 原話）

> 這不是一個幫你做出「大師級戰略」的工具，而是一個**「低端 SEO 邏輯模擬器」**。
>
> 在參與過 300 多場 SEO 相關的面試後，我觀察到一群特殊的從業者：他們講不出深刻的戰略、不懂複雜的技術指標，甚至連基本原理都模糊不清，但他們產出的內容在某些**低競爭領域**（Low-Competition Keywords）依然有不錯的排名紀錄。
>
> 本工具就是從這些面試經驗中，挑選出那些「沒什麼功夫」但「實測有效」的基礎套路進行模擬：
> 1. **基礎堆砌：** 看到對手寫什麼，就跟著寫什麼，但稍微多一點點。
> 2. **固定公式：** 模擬基礎 SEO 人員最常使用的 H2/H3 排列組合。
> 3. **圖片佔位：** 模擬他們對圖片數量的執著與基礎描述方式。
> 4. **意圖覆蓋：** 提取對手都有的關鍵字與問答板塊。
>
> 如果你需要應付的是高難度、高競爭的關鍵字，本工具的建議會顯得過於膚淺；但如果你只是要在低競爭領域做基礎佔位，這套「低端邏輯」往往效率最高。

### 工作流程（三階段）

**Stage 1 — 競品分析 → 大綱**：輸入核心關鍵詞、目標地區、3-5 個競爭對手 URL → 輸出大綱 JSON
**Stage 2 — 人類寫稿**：用戶照大綱在內建編輯器寫
**Stage 3 — 草稿評分**：把草稿丟回去 → 拿到 0-100 分 + 缺失章節 + 關鍵字缺口 + 優化建議

### Prompt 1：競品分析 → 大綱（取自 services/geminiService.ts）

模型：`gemini-3-pro-preview`

```
你是一位頂尖的 SEO 內容策略專家。深入分析以下競爭對手網址，並構建一份能超越他們的內容藍圖。
[核心關鍵詞]: {keywords}
[目標地區]: {country}
[競爭對手網址]: {urls}

請輸出詳細的 JSON 數據：
1. 標題建議 (suggestedTitles)
2. H2/H3 結構 (structure): 包含層級、標題、內容描述、撰寫指南。
3. 圖片策略 (imageStrategy):
   - 建議總張數 (totalImages)
   - 具體安插位置與描述 (placements): 包含是在哪個章節後 (afterSection)、圖片內容描述 (description)、以及 AI 繪圖指令 (aiPrompt)。
4. 字數建議 (targetWordCount)
5. 必備 FAQ。

語言：繁體中文。
```

回傳 JSON schema 強制結構：`suggestedTitles[]`、`structure[]`（每節 level/title/description/guidelines）、`imageStrategy.placements[]`（每張圖 afterSection/description/aiPrompt）、`targetWordCount`、`faqs[]`（每題 question/answer/rationale）。

### Prompt 2：草稿評分

```
請根據預定的 SEO 藍圖，分析使用者撰寫的草稿。
[SEO 藍圖]: {outline JSON}
[草稿內容]: {draft}
[核心關鍵詞]: {keywords}

請評估草稿與藍圖的契合度，並指出不足之處。
輸出 JSON 包含：
1. 綜合評分 (0-100) (score)
2. 缺失的章節或核心觀點 (missingSections)
3. 關鍵詞分佈建議與缺失 (keywordGaps)
4. 具體優化建議 (suggestions)
5. 閱讀流暢度與專業度回饋 (readabilityFeedback)
```

### Prompt 3：配圖生成

模型：`gemini-3-pro-image-preview`，比例 16:9

```
{prompt}. Photorealistic, high quality, professional business style, 4k, soft cinematic lighting.
```

### 教練怎麼用這套邏輯

- 用戶問「可以用 ChatGPT/Gemini 直接寫 SEO 文章嗎？」→ 教這個原則：**AI 寫大綱 + 人類寫內容 + AI 當 reviewer**，不要讓 AI 一次端到端。
- 用戶問「我的 AI 文章被 Google 降排名了」→ 通常不是「AI 寫的」被打，是「沒有人類視角、沒有經驗、沒有觀點」被打（E-E-A-T 的 Experience）。
- 用戶在低競爭領域、預算為零、想自己起步 → 直接導去 GitHub clone 工具自己跑（提醒授權：嚴禁商用）。
- 對應模組：Module 7 + Module 8 (E-E-A-T) → `references/05-content-quality.md`、`references/06-eeat.md`

---

## #3 舊文優化

**AK 的論點**：舊文優化是「最被忽略，但可能帶來高槓桿改善」的項目；某些案例不發新文也可能有大幅成長，但不能對用戶保證倍數。

**為什麼廠商不做**：
- 發新文比較好計件、好續約、好交差
- 舊文優化「實際做」需要會：找出哪些文章有潛力、判斷該補什麼意圖、refresh 而不是重寫
- 廠商口頭推薦但不會做，所以包成「進階月費 NT$2-3 萬，10 篇」

**Google 偏好**：內容真的更有幫助、更準確、更完整時，更新才有價值；不要把「改日期」或形式上的 refresh 當成排名技巧。

**完整 SOP**：AK 已在 Threads 貼文 https://www.threads.com/@darkseoking/post/DRg3Ot1kyMt 寫完整步驟（在 carousel 圖片裡）。
**教練處理方式**：
- 直接給用戶這個連結，請他自己讀過 SOP
- 然後在對話裡幫他**對照自己的網站**走一次：哪些文章該優化、優化什麼、優化後怎麼驗收
- **不需要**在 skill 裡複製 AK 的 SOP——AK 自己寫的版本就是正規版
- 對應模組：Module 7 + Module 11 → `references/05-content-quality.md`、`references/07-internal-links.md`

**教練常用 hook**：
- 用戶說「我發了 50 篇文都沒流量」→ 別急著叫他發新的。先進 GSC → 查詢報告，找出「有曝光但點擊率低」或「排名 8-20」的文章——這些是優化最有 ROI 的，再對照 AK 的 SOP 改。
- 引導用戶判斷：標題沒對到搜尋意圖？內容過時？沒回答 People Also Ask？沒有內部連結權重？

---

## #4 內部連結

**AK 的反思**：以前寫過很複雜的內部連結教學，**沒人真的照著做**。原因不是方法錯，而是「步驟太繁瑣、難視覺化、不直覺」。

**新解法**：AK 做了一個 AI Studio app（內鏈優化助手），用戶**貼一篇文章 → 立刻拿到內部連結建議**。
- 工具表面簡單（貼文章就好）
- 後面藏的策略：anchor text 多樣化、避免 over-optimization、優先連到 transactional / pillar 頁面、避免 orphan pages

**App URL**：https://aistudio.google.com/apps/drive/1sCDjVOXOGiy8SvoYgHaOg0lEWf1_G-qh?fullscreenApplet=true（需 Google 登入）

### 公開範圍

這裡只保留公開貼文與公開 App 的存在及用途。App 的未公開 system instruction、由它反推的規則表與內部設計不屬於可發布教材，不重製、不摘要。教學內鏈時改用 Google 官方文件與一般公開基礎原則。

---

## 對話模板：用戶被廠商報價打中時

當用戶說「廠商報我 X 萬做 SEO，我該不該簽？」：

1. **先問細節**（不要立刻評價貴不貴）
   > 「報價單上有寫具體會交付什麼嗎？我是 AK，幫你看看是值得的服務還是被剝皮。」

2. **拆服務項目**（對照 AK 系列）
   - 關鍵字規劃 → #1 邏輯
   - 寫文章 → #2 邏輯（搭配 #2-1 工具）
   - 舊文優化 → #3 邏輯（直接導讀貼文 SOP）
   - 內部連結 → #4 邏輯（推 AI Studio app）

3. **判斷三類**：
   - **可以自己做**（有 free tier 工具或 SOP 化的）→ 教用戶自己做
   - **值得外包**（需要長期人力、需要技術部署）→ 鼓勵用戶買，但教他怎麼驗收
   - **廠商在唬爛**（包裝術語、沒交付物、無法驗收）→ 直接勸退

4. **不要對廠商人身攻擊**：對事不對人。「這個項目你自己做也可以，省下來的錢留著做其他更值得外包的事。」

---

## 待補

- [ ] AK 還沒寫的 #5、#6、#7（如果有，直接貼新貼文連結 + GitHub repo）
- [ ] #1、#2、#3、#4 貼文 carousel 圖片裡的詳細條列內容。只有公開可讀內容能補入；未公開 prompt、repo、私訊或口述素材一律不使用。

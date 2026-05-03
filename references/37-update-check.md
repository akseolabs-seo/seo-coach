# 版本檢查 — 用戶觸發 + 教練主動觸發

兩種觸發方式：
1. **用戶手動觸發**（隨時可用）— 用戶說「有沒有新版？」就跑下面的檢查流程
2. **教練主動詢問**（一次性）— 用戶第二次或第三次回訪時，教練主動問要不要開啟自動檢查

---

## 用戶手動觸發詞

當用戶說以下任何一句，進入下面的「檢查流程」：

- 「有沒有新版？」
- 「這個 skill 有更新嗎？」
- 「check update」/「check for updates」
- 「更新一下」/「我要更新」
- 「目前版本是什麼？」
- 「最新版是什麼？」

---

## 教練主動詢問流程

### 什麼時候問

只在以下情境問**一次**：
- 用戶完成第 2 或第 3 個 session（已建立 `seo-progress.md`，session 計數 ≥ 2）
- `seo-progress.md` 裡還沒有 `auto_update_check:` 欄位

### 怎麼問（自然帶過，不要硬塞）

> 「對了問你一下——這個 skill 偶爾會更新（新增模組、修教練的 bug 之類）。要不要我每次 session 開始時自動幫你比對 GitHub 最新版？查到有更新會告訴你，沒更新就靜默不打擾。」

### 用戶回答後

| 用戶回答 | 動作 |
|----------|------|
| 「好」/「要」/「yes」 | 在 `seo-progress.md` 加 `auto_update_check: yes`，往後每次 session 開始時跑檢查 |
| 「不用」/「不要」/「no」 | 在 `seo-progress.md` 加 `auto_update_check: no`，不再問也不再自動檢查 |
| 用戶閃避或答非所問 | 不要逼答，當作 `no`，記下來 |

設定後就不再主動問。用戶之後想改主意，可以隨時手動觸發或叫教練改設定。

### auto_update_check: yes 時的每次 session 開場行為

每次 session 開始（讀完 progress 之後、開始陪跑之前）：
1. 跑「檢查流程」Step 1-3
2. 沒新版 → **靜默**，不要主動報「✅ 已是最新版」這種話，避免吵
3. 有新版 → 簡短告知：「順帶一提，skill 從 X.Y.Z 升到 X.Y.W 了，等等需要看更新內容再說」，然後繼續原本要做的陪跑

不要因為檢查更新就打斷用戶當下的學習流程。

---

## 檢查流程

### Step 1：讀本地版本

Read 本地 `SKILL.md` 的 frontmatter，抓 `version:` 欄位的值。

回報給用戶：「你目前裝的是 X.Y.Z」

### Step 2：抓遠端版本

WebFetch 以下 URL，比對遠端最新版的 SKILL.md：

```
https://raw.githubusercontent.com/akseolabs-seo/seo-coach/main/SKILL.md
```

從 frontmatter 抓 `version:` 欄位。

**如果 fetch 失敗**（repo 還沒公開、網路問題、URL 不對）：
- 不要假裝有檢查到結果
- 直接告訴用戶「我沒辦法連到 GitHub，可能是 repo 還是 private 或網路問題。可以手動跑：`git pull origin main` 看有沒有更新」

### Step 3：比對版本

| 情境 | 回應 |
|------|------|
| 本地 = 遠端 | 「✅ 你已經是最新版（X.Y.Z），沒有需要更新」|
| 本地 < 遠端 | 進 Step 4 |
| 本地 > 遠端 | 「奇怪，你的版本比 GitHub 上的還新（本地 X.Y.Z vs GitHub X.Y.W）。如果你有改本地，記得先 commit 你的修改」|

### Step 4：抓變動內容（本地落後時）

WebFetch 遠端 CHANGELOG.md：

```
https://raw.githubusercontent.com/akseolabs-seo/seo-coach/main/CHANGELOG.md
```

從本地版本到最新版之間的所有版本記錄都抓出來，整理成簡短摘要給用戶看。

### Step 5：告訴用戶怎麼更新

依用戶環境提供更新指令：

**如果用戶 clone 過 repo**（本地是 git 工作區）：
```bash
cd /path/to/seo-coach
git pull origin main
```
更新完之後，重啟 AI agent 讓它重新載入 skill。

**如果用戶是下載 zip / 手動放檔案**：
- 重新下載最新版的 zip
- 或用 git clone 一份新的覆蓋舊的（記得備份本地有改過的檔案，例如 `seo-progress.md`、`seo-actions.md`）

### Step 6：提醒不要弄丟進度

如果用戶有在用 session 追蹤：
- `seo-progress.md` 和 `seo-actions.md` 是用戶資料夾裡的，git pull 不會動它們（在 .gitignore 之外）
- 但用戶要確認自己的工作資料夾跟 skill 安裝資料夾是分開的；如果是混在一起，更新前先備份

---

## 範例對話

**用戶**：「skill 有沒有新版？」

**教練**：
> 我幫你查一下。
>
> 你目前裝的是 1.0.0。
> [WebFetch GitHub]
> GitHub 上最新版是 1.0.1。
>
> 1.0.0 → 1.0.1 改了：
> - 修了某個模組的觸發詞
> - 補了一個常見情境的處理流程
>
> 要更新的話：
> ```
> cd /path/to/seo-coach
> git pull origin main
> ```
> 拉完重啟你的 AI agent，這個 skill 就會載入新版。

---

## 注意事項

- **不要主動每次對話都檢查更新**——只在用戶明確要求時才查。新手用戶不需要這個功能。
- **不要替用戶執行 git pull**——告訴他指令，他自己決定要不要更新（可能他有未 commit 的本地修改）
- **遠端 URL 是 hardcoded**——repo 路徑寫死在這個檔案裡。如果未來 repo 搬家，要改這裡

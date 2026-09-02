# GSC 本地資料面板

**用途：** 當學員已授權並取得自己的 Google Search Console（GSC）搜尋成效匯出資料時，提供一個可在瀏覽器直接開啟的分析面板。它是資料閱讀與下一步排序工具，不是完整 SEO audit，也不會代替學員判斷搜尋意圖或直接重寫文章。

面板入口：`assets/gsc-dashboard/index.html`

## 固定邊界

- 面板啟動時會先檢查宿主頁面是否已提供既有的 GSC API bridge；有 bridge 就自動接收目前／比較期間資料，沒有 bridge 才使用使用者選擇或貼上的 CSV／TSV／JSON。面板本身不直接呼叫外部 API、網路服務、Codex CLI 或 AI。
- 匯入後的資料會留在該瀏覽器的 `localStorage`，方便重新開啟；清除按鈕會移除本機保存的期間資料。
- 面板使用單一 HTML／CSS／JS 模板，提供 `zh-Hant`、`zh-Hans`、`en`、`ja`、`ko` 五個語系。第一次沒有本機語系設定時，會依 `navigator.languages`／`navigator.language` 選擇；手動切換、重寫佇列狀態與備註都只保存於該瀏覽器。
- 面板的「重寫候選」是 deterministic 規則產生的人工核對清單，不是 Google 建議，也不是自動判定「一定要重寫」。
- GSC 的平均排名是匯總期間平均位置，不是某個人此刻在 SERP 看到的固定名次；Query 可能包含匿名查詢省略的限制。
- 前後期比較必須盡量使用同一 property、同一維度、同一地區／裝置範圍與相近長度的日期窗；不同範圍混比時只標示為不可直接比較，不把差異當成 SEO 因果。

## 可匯入格式

CSV／TSV 標題可使用 GSC 英文欄名或常見繁中欄名。最少需要：

`Query`／`查詢`、`Clicks`／`點擊次數`、`Impressions`／`曝光次數`、`CTR`／`點閱率`、`Position`／`平均排名`

可選欄位：`Page`／`頁面`、`Date`／`日期`、`Country`／`國家`、`Device`／`裝置`、`Search appearance`／`搜尋外觀`。JSON 支援陣列、`rows`、`data`、`records` 或 GSC Search Analytics API 常見的 `{ keys: [], clicks, impressions, ctr, position }` 結構；若 API JSON 有 `dimensions`，面板會按該順序讀取 `keys`。

GSC 下載的 ZIP 請先解壓，再把其中的 CSV／JSON 匯入。可把同一期間分頁或分檔的資料一次選多個檔案，面板會在本機合併。

## API 自動匯入（可選）

如果使用者已在宿主網站或既有 connector 完成 GSC API 連線，宿主只需要在面板載入前提供 `window.SEOCoachGscConnector`，或在載入後呼叫 `window.SEOCoachGscDashboard.connect(connector)`。面板啟動時會先執行 connector 的 `load`，成功後自動載入資料；沒有 bridge 時仍顯示 CSV／TSV／JSON 與貼上匯入。

```js
window.SEOCoachGscConnector = {
  load: async ({ dimensions, rowLimit, dataState, includePrevious }) => ({
    current: {
      sourceName: "GSC API / 目前期間",
      startDate: "2026-08-01",
      endDate: "2026-08-28",
      dimensions,
      rows: [{ keys: ["查詢文字", "https://example.com/page"], clicks: 12, impressions: 340, ctr: 0.0353, position: 8.4 }],
    },
    previous: null,
  }),
};
```

bridge 負責既有的登入、property、日期窗與 API 請求；面板只接收回傳資料並在瀏覽器內計算，不保存或讀取連線憑證。回傳可用單一目前期間資料，或使用 `current`／`previous` 提供兩個可比較期間。GSC Search Analytics API 的 `dimensions` 順序會對應每列 `keys` 順序，`rowLimit` 可用到 25,000；實際回傳仍可能受 API 的資料抽樣／列數限制影響。若回傳 `propertyName`、`siteUrl`、`dataState`、`rowLimit`、`totalRows`、`partial`、`syncedAt` 或 `scope`，面板會保留並在資料來源與邊界區顯示；`partial` 或 `totalRows > rowLimit` 時不把結果說成完整資料。

## 面板計算

### 現況總覽

- 點擊：所有可分析 Query 列的 `clicks` 加總。
- 曝光：所有可分析 Query 列的 `impressions` 加總。
- CTR：`總點擊 ÷ 總曝光`，不把每列 CTR 做簡單平均。
- 平均排名：以曝光數作權重匯總各列 `position`；沒有曝光但有排名的列使用 1 作最低權重。
- 關鍵詞數：依正規化後的 Query 去重，不把同一 Query 的日期列或 Page 列重複算成多個關鍵詞。

### 排名分桶

每個去重 Query 的匯總平均排名落入：`1–3`、`4–10`、`11–20`、`21–30`、`31–50`、`51+`。這些是閱讀分布的區間，不是成效保證或 Google 的固定分級。沒有可計算平均排名的 Query 另外列為未有平均排名。

### 前後期變化

同一 Query 的排名變化使用：`前期平均排名 − 目前平均排名`。正數代表目前數字變小、排名改善；負數代表目前數字變大、排名下降。面板另外顯示點擊與曝光的原始差額，避免把流量變化和排名變化混成一個分數。

預設「排名改善／下降」判定幅度是 1.0 位，可在規則設定修改。只有一份期間時，面板不把 Query 標成新出現或消失，也不提供前後期成長／下降結論。

### 異常與 CTR 訊號

- 異常變化只使用有目前／比較期間且達到最低曝光的 Query；預設標記排名下降至少 3 位、點擊下降至少 30% 或曝光下降至少 30% 的 Query，並顯示觸發的訊號。
- CTR 機會使用目前排名 4–20、曝光達門檻的 Query，將 Query CTR 與目前期間站內總 CTR × 低 CTR 倍率比較；它是摘要／搜尋任務核對候選，不是保證可以增加點擊的預測。
- 兩者都可在「規則設定」修改門檻與顯示數量；沒有比較期間時，異常卡片只顯示等待比較，不猜測下降原因。

## deterministic 建議規則

規則排序分數只是面板內的優先順序，會受曝光量、排名區間與下降訊號影響；它不是 Google 分數，也不代表預測排名。

| 規則 | 預設觸發 | 面板行動文字 |
|---|---|---|
| `rewrite-11-20` | 平均排名 11–20，曝光至少 20 | 先用 Query 核對 SERP 與現有承接頁，再決定補強哪個缺口 |
| `rewrite-21-30` | 平均排名 21–30，曝光至少 20 | 先確認既有頁面、搜尋任務與第一方證據，再決定補強、合併或暫緩 |
| `decline-review` | 排名下降至少 1 位，且目前曝光至少 20 | 先核對比較期間、索引狀態與近期變更，再決定是否重寫 |
| `snippet-review` | 排名 1–10、曝光至少 20，且該 Query CTR 低於站內 CTR × 0.75 | 先檢查 title、承諾與頁面是否對得上搜尋任務；不直接等於重寫 |
| `page-ownership-review` | 同一 Query 有至少 2 個 Page，各自達到最低曝光的一半 | 先分開看 Query → Page，再判斷正常多頁承接或需要整理頁面歸屬 |

最低曝光、排名變化幅度、低 CTR 參考倍率與建議數量都可在面板調整。調整門檻只改排序與篩選，不改原始資料。

## 教學使用順序

1. 先匯入目前期間，讓學員看 `1–3 / 4–10 / 11–20 / 21–30` 分布。
2. 再匯入相同範圍的比較期間，只先讀一個上升與一個下降 Query。
3. 打開重寫佇列，說明它只提供「人工核對候選」；下一步回到當下 SERP、承接頁與網站能否可信提供。
4. 完成一項修改後，在正確觀察窗口重新匯出相同範圍，保留前期檔案再比較。

不要把面板本地計算、單次匯入、GSC 平均排名或佇列排序當成排名改善的證明。真正的修改成效仍需要修改前基準、真實頁面重驗與適當時間窗口後的 GSC／其他第一方資料。

## 內建的延伸功能

- Query 動向搜尋、依排名／點擊／曝光差異排序。
- Query 詳情視窗，顯示目前／比較期間指標、頁面承接、排名變化與命中人工核對規則。
- 異常變化與低 CTR 機會卡片，提供可追溯的下降訊號與核對方向，不呼叫 AI。
- Query → Page 頁面視角，用於初步檢查頁面承接與可能的頁面歸屬問題。
- 資料來源、日期範圍、被略過列與匯入格式的 provenance 區塊。
- 重寫佇列的狀態、備註、本機保存、狀態篩選與匯出。
- 單一模板的五語系切換與首次瀏覽器語言偵測。
- 將 deterministic 重寫佇列匯出 CSV、將完整分析匯出 JSON、列印報告。
- 本機保存上次匯入資料與可調規則；支援清除本機資料。
- `window.SEOCoachGscDashboard.load({ current, previous })` 注入介面與 `connect(connector)`／`refreshFromApi()` 介面，供宿主頁面交給面板已取得的資料或既有 connector；這些介面不負責登入、取憑證或直接呼叫 GSC。

刻意不放入：面板內的 GSC OAuth／service account、GA4 轉換歸因、AI 文章生成、Codex CLI 呼叫、自動發布、競品推論與無證據的搜尋意圖分類。API bridge 若要存在，必須由外部既有連線層另立權限與資料來源契約，不應把憑證邏輯偷偷擴進本地面板。

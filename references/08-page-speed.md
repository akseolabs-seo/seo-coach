# 頁面速度（Page Speed & Core Web Vitals）

## 核心概念
Google 的排名系統會使用 **Core Web Vitals（CWV）** 等頁面體驗訊號，但不要把它理解成「分數高就一定排名高」。相關性與內容品質仍然更重要；CWV 的實用價值是讓頁面更好用，並避免在競爭接近時被體驗問題拖累。

**三個核心指標：**
- **LCP**（Largest Contentful Paint）= 最大內容元素載入時間 → 感知載入速度
- **INP**（Interaction to Next Paint）= 互動到下次繪製時間 → 互動響應速度（2024 年取代 FID）
- **CLS**（Cumulative Layout Shift）= 累計版面配置位移 → 視覺穩定性

---

## 指標標準

| 指標 | 良好 | 需要改善 | 差 |
|------|------|---------|-----|
| LCP | ≤ 2.5 秒 | 2.5-4 秒 | > 4 秒 |
| INP | ≤ 200ms | 200-500ms | > 500ms |
| CLS | ≤ 0.1 | 0.1-0.25 | > 0.25 |

---

## LCP（最大內容元素載入時間）

### 是什麼
頁面中最大的可見元素（通常是主圖、Hero 圖、或大段文字）完全載入的時間。

### 常見 LCP 元素
- 英雄圖（Hero Image）
- 大型橫幅圖片
- 頁面最主要的文字區塊

### 改善 LCP 的方法
1. **優化圖片：**
   - 使用 WebP 格式（比 JPG/PNG 小 25-35%）
   - 壓縮圖片（TinyPNG、Squoosh）
   - 設定正確的圖片尺寸（不要用 CSS 縮小大圖）
   - 對 LCP 圖片加 `fetchpriority="high"` 屬性

2. **使用 CDN：** 從離用戶近的伺服器傳送內容

3. **啟用瀏覽器快取：** 回訪用戶不用重新下載靜態資源

4. **減少伺服器回應時間（TTFB）：** 好的主機、啟用快取外掛（WordPress）

---

## INP（互動到下次繪製時間）

### 是什麼
用戶點擊、輸入、或與頁面互動後，頁面多快做出視覺回應。

### 常見問題來源
- JavaScript 執行時間過長（主執行緒被佔用）
- 過多第三方腳本（廣告、聊天機器人、行銷追蹤）
- 動畫效果過度複雜

### 改善方向
- 延遲載入非必要的 JavaScript
- 移除不用的第三方腳本
- 使用 `async`/`defer` 屬性載入腳本

---

## CLS（累計版面配置位移）

### 是什麼
頁面載入過程中，元素突然移位的程度。0 表示完全穩定，0.1 以下是良好。

**常見體驗：** 你正要點一個按鈕，廣告突然載入，按鈕往下移，你點到了別的東西。

### 常見 CLS 原因
- 沒有設定尺寸的圖片（`width` 和 `height` 屬性）
- 晚於頁面載入的廣告、嵌入內容
- 動態插入的內容（通知欄、Cookie 橫幅）
- 自訂字體載入導致的文字位移（FOUT/FOIT）

### 修復方法
- 所有圖片加上 `width` 和 `height` 屬性
- 廣告/嵌入內容預留固定空間
- 字體使用 `font-display: swap`

---

## 怎麼測量

### PageSpeed Insights（pagespeed.web.dev）
- 輸入 URL 即可
- 分「行動裝置」和「桌機」兩個版本
- 顯示實際用戶數據（CrUX）和 Lab 數據

### Google Search Console → 體驗 → Core Web Vitals
- 顯示整個網站的 CWV 狀況
- 分 URL 群組顯示哪些頁面有問題
- 是實際用戶的數據，比 Lab 數據更重要

注意：Search Console 的舊「行動裝置可用性」報告已退役。手機體驗問題改用 Lighthouse、Chrome DevTools、PageSpeed Insights 和實機檢查輔助判斷。

### Chrome DevTools → Lighthouse
- 按 F12 → Lighthouse → 分析
- 適合本地開發環境測試

---

## WordPress 速度優化

### 常用解決方案
| 問題 | 解法 |
|------|------|
| 伺服器回應慢 | 安裝快取外掛（WP Rocket、W3 Total Cache、LiteSpeed Cache） |
| 圖片太大 | Smush、ShortPixel 自動壓縮 |
| 過多外掛 | 停用不使用的外掛 |
| 主題太重 | 換輕量主題（Astra、GeneratePress） |
| JS/CSS 太多 | WP Rocket 的合併/延遲載入功能 |

### Shopify 速度優化
- 移除不使用的 App（每個 App 都可能增加 JS）
- 優化主題的圖片預設設定
- 使用 Shopify 原生的圖片格式轉換

---

## 邊界聲明
以下建議尋求專業判斷：
- 複雜的 JavaScript 應用（React/Next.js 等）的效能優化
- 伺服器層級的效能問題
- 大型網站的 Core Web Vitals 大規模改善計畫

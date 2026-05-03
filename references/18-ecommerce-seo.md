# 電商 SEO：產品頁與 Faceted Navigation

## 產品頁優化（Product Page SEO）

### 為什麼產品頁是電商 SEO 的核心
產品頁是最接近購買決策的頁面，也是最容易帶來直接收益的排名。但很多電商的產品頁品質極差——薄內容、重複描述、缺少 Schema。

---

### 產品頁的必要元素

**1. 獨特的產品描述**
- 不要直接用廠商提供的描述（所有競爭對手都一樣）
- 用自己的語言，強調你的目標客群最在意的事
- 至少 150-300 字的描述

**2. Title Tag 格式**
建議格式：`[產品名稱] - [關鍵特色] | [品牌名]`
例：`天然酸麵包工具組 - 含發酵籃+割線刀 | 麵包工作室`

**3. 用戶評論**
- 評論是獨特的用戶生成內容（UGC），每次有新評論就更新了頁面
- 用 `AggregateRating` Schema 讓評分顯示在搜尋結果

**4. Product Schema（結構化資料）**
```json
{
  "@type": "Product",
  "name": "天然酸麵包工具組",
  "description": "...",
  "brand": {"@type": "Brand", "name": "麵包工作室"},
  "offers": {
    "@type": "Offer",
    "price": "1200",
    "priceCurrency": "TWD",
    "availability": "InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
}
```

**5. 圖片優化**
- 多角度圖片（主圖 + 細節圖 + 情境圖）
- 所有圖片加 alt text（包含產品名稱和顏色/規格）
- WebP 格式，壓縮後上傳

**6. Breadcrumb（麵包屑）**
清楚的層級路徑對用戶和 SEO 都有幫助：
`首頁 > 烘焙工具 > 酸麵包工具 > 天然酸麵包工具組`

---

### 常見產品頁 SEO 問題

| 問題 | 原因 | 解法 |
|------|------|------|
| 重複的 Title Tag | 多個 SKU（顏色/尺寸）同一個標題 | 每個 variant 加上規格描述 |
| 薄內容 | 只有廠商描述 + 規格表 | 加入使用情境、FAQ、評論 |
| 缺少 Schema | 沒設定 Product Schema | 加入 JSON-LD |
| 404 頁面未處理 | 產品下架後直接刪除 | 保留頁面 or 301 到替代產品 |
| 分類頁無內容 | 只有產品列表，沒有文字 | 加入 150+ 字的分類介紹 |

---

## Faceted Navigation（篩選導航）

### 問題說明
電商網站通常有篩選功能（顏色、尺寸、品牌、價格等）。每次用戶篩選，URL 就會產生一個新的組合：

```
/products?color=red
/products?color=red&size=L
/products?color=red&size=L&sort=price-low
/products?brand=nike&color=blue&size=M&sort=new
```

這可能產生**數百萬個 URL**，帶來嚴重的重複內容和爬行預算問題。

---

### Faceted Navigation 的處理策略

**策略 1：限制不重要的篩選 URL 被索引**
- `robots.txt` 是管理爬行，不是移除索引；如果頁面已被外部連結發現，單靠 robots.txt 不一定能讓它退出搜尋結果
- `noindex` 需要讓 Google 能爬到頁面才看得到；不要同時用 robots.txt 擋住又期待 `noindex` 生效
- 對小型電商，通常先控制「哪些篩選頁值得被內鏈與索引」，不要一開始就讓所有參數頁進索引

**策略 2：讓有搜尋量的篩選頁面被索引**
- 例：「Nike 藍色球鞋」有人在搜 → `/shoes?brand=nike&color=blue` 值得索引
- 需要判斷哪些篩選組合有搜尋量
- 這些頁面需要有獨特的 title、meta description 和足夠的產品數量

**策略 3：noindex + 允許爬取（中間路線）**
- 允許 Googlebot 爬取（發現內部連結），但不索引篩選 URL
- 在 `<head>` 加 `<meta name="robots" content="noindex, follow">`

**策略 4：canonical 指向基礎頁面**
- 所有篩選 URL 的 canonical 都指向 `/products/`
- 告訴 Google 正式版本是哪個

---

### 哪種策略適合你？

| 網站規模 | 建議策略 |
|---------|---------|
| 小型電商（< 1000 產品） | 預設不讓多數篩選 URL 進索引，只保留明確有搜尋需求的分類/篩選頁 |
| 中型電商 | canonical / noindex / 內鏈控制並用，開放有搜尋需求的篩選頁 |
| 大型電商 | 需要完整的 Faceted Navigation 策略分析 |

---

### 怎麼檢查有沒有 Faceted Navigation 問題
1. `site:yourdomain.com` 看索引頁面數量是否異常多
2. GSC → 索引 → 頁面 → 查看被索引的 URL 列表，看有沒有大量帶參數的 URL
3. Screaming Frog 爬取後過濾含 `?` 的 URL

---

## 邊界聲明
以下建議尋求專業 SEO 服務：
- 大型電商的完整 Faceted Navigation 策略規劃
- 電商 Category Page 的關鍵字策略
- 產品頁的大規模 A/B 測試

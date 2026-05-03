# 圖片與影片 SEO（Image & Video Optimization）

## 圖片 SEO

### 為什麼重要
1. **圖片搜尋流量**：Google 圖片搜尋是獨立的流量來源
2. **Core Web Vitals**：圖片是最常見的 LCP 元素，直接影響速度指標
3. **內容理解**：Google 靠圖片 alt text 理解頁面主題

---

### 圖片格式選擇

| 格式 | 適用情況 | 大小 |
|------|---------|------|
| WebP | 所有現代瀏覽器，替代 JPG/PNG 首選 | 最小 |
| AVIF | 最新格式，壓縮率更好，但支援度略低 | 比 WebP 更小 |
| JPG/JPEG | 照片類圖片的傳統格式 | 中 |
| PNG | 需要透明背景的圖片 | 較大 |
| SVG | Logo、圖示等向量圖 | 最小（向量） |
| GIF | 動圖（建議改用影片或 WebP 動圖） | 很大 |

**建議：** 上傳前先轉 WebP 格式，或讓 CMS/CDN 自動轉換。

---

### 圖片壓縮

壓縮目標：在視覺品質可接受的前提下，盡可能縮小檔案大小。

**免費工具：**
- Squoosh（`squoosh.app`）— 線上工具，可以預覽壓縮前後差異
- TinyPNG / TinyJPG — 批次壓縮
- ShortPixel（WordPress 外掛）— 自動壓縮

**一般建議：**
- 網頁用圖片不超過 200KB（重要圖片）、100KB 以下最佳
- Hero 圖片可以到 300-500KB，但要配合 Lazy Load

---

### 圖片尺寸設定

**避免 CLS（版面位移）的關鍵：**
```html
<!-- 永遠設定 width 和 height -->
<img src="sourdough.webp" alt="手工酸麵包" width="800" height="600">
```

**響應式圖片（srcset）：**
```html
<img src="sourdough-800.webp"
     srcset="sourdough-400.webp 400w,
             sourdough-800.webp 800w,
             sourdough-1200.webp 1200w"
     sizes="(max-width: 600px) 400px, 800px"
     alt="手工酸麵包">
```

---

### 圖片 Alt Text（再強調）
- 描述圖片的實際內容（對看不見圖片的人說明）
- 自然包含相關關鍵字，不要硬塞
- 裝飾性圖片用空的 alt（`alt=""`）

---

### 圖片 Sitemap

如果網站有大量重要圖片（攝影作品集、電商產品圖），可以提交圖片 Sitemap：
```xml
<url>
  <loc>https://example.com/sourdough/</loc>
  <image:image>
    <image:loc>https://example.com/images/sourdough.webp</image:loc>
    <image:title>手工酸麵包</image:title>
  </image:image>
</url>
```

---

### Lazy Loading
讓圖片在用戶滾動到才載入，減少首次載入時間：
```html
<!-- 非首屏圖片加 loading="lazy" -->
<img src="bread.webp" alt="麵包" loading="lazy">

<!-- LCP 圖片（首屏最大圖）不要加 lazy，反而要加 fetchpriority="high" -->
<img src="hero.webp" alt="Hero 圖" fetchpriority="high">
```

---

## 影片 SEO

### 為什麼有獨立的影片 SEO
- Google 的影片 Carousel 出現在越來越多搜尋結果
- YouTube 是世界第二大搜尋引擎
- 影片內容的 Dwell Time（停留時間）通常比純文字長

---

### 網站嵌入影片的 SEO 最佳實踐

**VideoObject Schema（必做）：**
```json
{
  "@type": "VideoObject",
  "name": "如何製作酸麵包",
  "description": "完整的手工酸麵包製作步驟教學",
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "uploadDate": "2024-01-15",
  "duration": "PT10M30S",
  "contentUrl": "https://example.com/video.mp4"
}
```

**影片縮圖（Thumbnail）：**
- 尺寸至少 1280×720px
- 比例 16:9
- 清楚顯示影片主題

**影片描述：**
- 在頁面內文中描述影片內容（讓 Google 理解）
- 不要讓影片是頁面上的唯一內容

---

### YouTube SEO 基礎

YouTube 的搜尋演算法跟 Google 不同，但有相似邏輯：

**重要因素：**
- **標題**：包含目標關鍵字，前 60 字最重要
- **描述**：前 3 行最重要，包含關鍵字和連結
- **標籤（Tags）**：輔助，影響力越來越低
- **縮圖**：點擊率的最大影響因素
- **觀看時長（Watch Time）**：觀眾看完比例高 = 優質信號
- **留言、點讚、分享**：互動信號

**怎麼找 YouTube 關鍵字：**
- YouTube 搜尋框的自動補全
- 競爭頻道的熱門影片標題

---

## 邊界聲明
以下建議尋求專業判斷：
- 大規模的圖片 SEO 審查（電商數萬張產品圖）
- YouTube 頻道的完整成長策略
- 影片 CDN 和串流優化

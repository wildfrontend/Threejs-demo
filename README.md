# Video Highlight Tool

---

## 技術選型說明

- **框架 (Framework)：Next.js**  
  熟悉度較高，能夠快速開發並降低學習與實作成本。

- **UI 元件庫 (UI Library)：MUI**  
  提供完整且成熟的元件，設計一致性高，能加速介面開發。

- **狀態管理 (State Management)：Zustand**  
  由於需求涉及較多跨組件的資料處理，選擇輕量且易於開發的 Zustand 來取代較複雜的方案。

- **工具函式庫 (Utilities)：**
  - [`ahooks`](https://ahooks.js.org/)：透過 `useRequest` 簡化 API 狀態管理，減少重複撰寫資料請求邏輯。
  - [`react-player`](https://github.com/cookpete/react-player)：快速整合影音播放，省去自行控制原生 `<video>` 的繁瑣程式碼。
  - [`react-dropzone`](https://react-dropzone.js.org/)：提供檔案拖曳與上傳的狀態管理，降低開發難度。

---

## 本地開發

### 安裝依賴

```bash
npm install
npm run dev
```

### 訪問應用程式

打開瀏覽器並前往：http://localhost:3000

---

## Mock Data

- 模擬使用者上傳的影片：`/public/mock-video.mp4`
- 模擬 AI 處理後的 API 回傳資料：`/src/mocks/hank_outline_segments.json`
- 影片字幕檔（用於分析）：`/src/mocks/mock-video.srt`

---

## 處理 Mock Data

### 建立字幕檔

- 研究得出使用 `faster-whisper` 並使用[線上轉檔工具](https://yowlab.idv.tw/wordpress/?p=2962)將影片轉為逐字稿
- 產生的字幕檔為 `mock-video.srt`

### 產生 API 回傳資料

- 將字幕檔與影片大綱交給 NoteboolLM 或 ChatGPT 處理，生成 `hank_outline_segments.json`
- 內容包含精華片段的時間軸與字幕
- 只整理出乾淨、正確的資料（部分字幕可能缺失）

#### API 格式說明

| 欄位                        | 型別    | 說明                                                    |
| --------------------------- | ------- | ------------------------------------------------------- |
| `title`                     | string  | 段落標題，代表影片的章節或主題                          |
| `items`                     | array   | 每段落的字幕句子及精華片段資訊                          |
| `label`                     | string  | 該句子簡短描述（可用於列表或標籤）                      |
| `start_seconds`             | number  | 該段落/句子開始時間（秒）                               |
| `end_seconds`               | number  | 該段落/句子結束時間（秒）                               |
| `start`                     | string  | 開始時間，格式 `hh:mm:ss.sss`（可用於顯示）             |
| `end`                       | string  | 結束時間，格式 `hh:mm:ss.sss`                           |
| `captions`                  | string  | 該段落完整文字，可用於顯示或轉文字覆蓋影片              |
| `is_highlighted`            | boolean | 是否為精華片段（用於高亮或自動播放）                    |
| `subtitles`                 | array   | 句子級字幕，包含精確時間與文字                          |
| `subtitles[].time`          | string  | 該字幕句子的時間範圍（`hh:mm:ss,SSS --> hh:mm:ss,SSS`） |
| `subtitles[].text`          | string  | 該字幕文字內容                                          |
| `subtitles[].start_seconds` | number  | 該字幕開始時間（秒）                                    |
| `subtitles[].end_seconds`   | number  | 該字幕結束時間（秒）                                    |

---

## 功能設計

### 1. 上傳影片後取得模擬 AI 處理資料

- 使用者可上傳影片或圖片
- 系統模擬 AI 處理，產生精華片段資料
- 透過 Zustand 初始化影片控制與字幕控制

### 2. 編輯精華片段區塊

- 顯示影片大綱與段落字幕
- 點擊時間戳 → 跳轉到影片對應時間段
- 可勾選段落是否為精華片段
- 播放中段落會高亮顯示
- 使用 `useScrollIntoView` 確保當前播放段落可見
- 字幕段落會隨影片進度自動滾動

### 3. 影片播放與進度條互動

- 精華片段區塊會隨影片進度變色
- 精華片段區塊與字幕自動更新
- 可列出影片精華片段，點擊即可跳轉至對應進度

---

## 技術細節：

### useScrollIntoView

- 段落區塊是巢狀結構，不能直接使用 `container.scrollTo`
- 使用 `getBoundingClientRect()` 取得元素相對於視窗的位置
- 計算元素相對容器頂部的距離 `distanceToTop`
- 計算目標滾動位置：

```typescript
targetScrollTop = container.scrollTop + distanceToTop - offset;
```

### useHighlightPlayer

`useHighlightPlayer` 是控制影片播放與精華片段互動的核心 hook，主要負責以下功能：

- **自動播放精華片段**
  - 當使用者點擊某個精華片段，影片會跳轉至對應時間段並播放
  - 可支援自動播放下個精華片段

- **同步字幕與精華片段高亮**
  - 根據影片播放進度，動態更新精華片段區塊的高亮狀態
  - 滑動字幕區塊，使當前播放段落始終可見（結合 `useScrollIntoView`）

- **影片控制整合**
  - 暫停、播放、跳轉到指定時間
  - 與進度條互動：當進度條拖動或點擊，精華片段區塊與字幕自動更新

### 關於 Shows the edited highlight clip, not the original video

這需求可能是需要跳著精華片段播，但因為我已經有各精華片段的播放節點，所以就不特別設計保留影片播放流暢度，但做法也能做修改如下即可

```
 <ReactPlayer
    onTimeUpdate={(e) => {
    const currentTime = timeFixed2(e.currentTarget.currentTime);

    // 判斷是否在精華片段內
    const currentHighlight = highlight.find(
        (h) =>
        currentTime >= h.start_seconds && currentTime <= h.end_seconds
    );

    if (!currentHighlight) {
        // 跳到下一個精華片段或暫停
        const nextHighlight = highlight.find(
        (h) => h.start_seconds > currentTime
        );
        if (nextHighlight) {
        e.currentTarget.currentTime = nextHighlight.start_seconds;
        } else {
        e.currentTarget.pause();
        }
    }

    setProccess(currentTime);
    }}
```

---

## 開發時程

- Day 1：釐清需求，製作 Mock Data
- Day 2~3：開發雛形
- Day 4：補全功能

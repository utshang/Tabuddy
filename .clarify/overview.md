# 釐清項目總覽

> 本輪掃描對象：`spec/features/編輯交通時間.feature`

## 釐清項目統計

- 資料模型相關：0 項
- 功能模型相關：0 項
- 總計：0 項

## 優先級分佈

- High：0 項
- Medium：0 項
- Low：0 項

## 建議釐清順序

（本輪所有項目已全數解決）

## 釐清策略說明

- 本輪掃描範圍：`spec/features/編輯交通時間.feature`，交叉比對 `spec/erm.dbml` 的 `transports`、`新增交通時間.feature` 與 `.clarify/resolved/` 既有決議
- 3 項釐清已全數解決，歸檔於 `.clarify/resolved/features/` 與 `.clarify/resolved/data/`
- 原有 2 條 #TODO 規則（編輯後的時 >= 0、分 >= 0 且 < 60）的邊界已由新增交通時間階段的決議涵蓋，於整合階段直接補上 Example，未列入釐清問答
- **範圍外備註**：`刪除交通時間.feature` 與 `行程時間軸.feature` 的交通時間資料表尚未補上 `icon` 欄位，不屬本輪掃描範圍，於各自 phase 的 discovery 處理

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 編輯作用於既有 `transports` 實體，無新實體 |
| A2 屬性定義 | Resolved | icon 已同步進本 feature（決議：僅隨交通工具變更一併設定，不可單獨編輯） |
| A3 屬性值邊界條件 | Resolved | mode 補上「trim 後不可為空字串」；時／分邊界沿用既有決議並補上 Example |
| A4 跨屬性不變條件 | Resolved | 已補上「mode 為預設選項時 icon 必為空，改回預設選項時自動清除」不變條件 |
| A5 關係與唯一性 | Clear | `after_activity_id` unique 約束已於新增階段釐清，編輯不變更關聯對象 |
| A6 生命週期與狀態 | Clear | `transports` 無狀態欄位 |
| B1 功能識別 | Clear | 與「新增／刪除交通時間」界線清楚 |
| B2 規則完整性 | Resolved | 新增 3 條 Rule（變更交通工具時可一併設定圖示、圖示不可單獨編輯、改為預設選項時圖示自動清除） |
| B3 例子覆蓋度 | Resolved | 2 條 #TODO 規則皆已補上 Example，本 feature 目前無任何 #TODO |
| B4 邊界條件覆蓋 | Resolved | 時負數、分達 60、mode 純空白、mode × icon 組合皆已涵蓋 |
| B5 錯誤與異常處理 | Resolved | 非成員、必填、邊界值、單獨改圖示的失敗行為皆有對應 Example |
| C1 詞彙表 | Clear | 「時／分／交通工具／圖示」與 ERM 的 `hours`／`minutes`／`mode`／`icon` 對應一致 |
| C2 術語衝突 | Resolved | 本 feature 資料表已補上 `icon` 欄位，與 `新增交通時間.feature` 格式一致 |
| D1 待決事項 | Resolved | 2 個 #TODO 標記皆已處理完畢 |
| D2 模糊描述 | Clear | 無未量化形容詞 |

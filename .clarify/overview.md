# 釐清項目總覽

> 本輪掃描對象：`spec/features/刪除交通時間.feature`

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

- 本輪掃描範圍：`spec/features/刪除交通時間.feature`，交叉比對 `spec/erm.dbml` 的 `transports` 實體、`新增交通時間.feature`、`編輯交通時間.feature`，以及 `.clarify/resolved/` 既有決議
- 已檢查 `.clarify/resolved/features/` 與 `.clarify/resolved/data/`，確認「使用者必須是旅程成員」「刪除需經使用者確認才會執行」皆已有前例（`刪除行程.feature`、`刪除旅程.feature`）可直接沿用，未重複建立釐清項目
- 唯一發現的缺口（資料表 icon 欄位格式不一致）已釐清並整合進規格，歸檔於 `.clarify/resolved/features/`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 刪除作用於既有 `transports` 實體，無新實體 |
| A2 屬性定義 | Resolved | 資料表已補上 `icon` 欄位，與 ERM 定義及新增/編輯交通時間.feature 一致 |
| A3 屬性值邊界條件 | Clear | 刪除操作不涉及數值邊界驗證 |
| A4 跨屬性不變條件 | Clear | 刪除不觸發 mode/icon 不變條件 |
| A5 關係與唯一性 | Clear | `after_activity_id` unique 約束已於新增階段釐清；刪除後釋放該關聯，與新增規則互補一致 |
| A6 生命週期與狀態 | Clear | `transports` 無狀態欄位 |
| B1 功能識別 | Clear | 與「新增／編輯交通時間」界線清楚 |
| B2 規則完整性 | Clear | 3 條 Rule（成員限制、成功刪除、需確認）已對齊 `刪除行程.feature`、`刪除旅程.feature` 既有模式 |
| B3 例子覆蓋度 | Clear | 每條 Rule 皆有對應 Example，無 #TODO |
| B4 邊界條件覆蓋 | Resolved | 資料表欄位已與同系列 feature 一致（icon 欄位補齊） |
| B5 錯誤與異常處理 | Clear | 非成員操作失敗、取消確認維持原狀，皆有對應 Example |
| C1 詞彙表 | Clear | 「時／分／交通工具／圖示」與 ERM 的 `hours`／`minutes`／`mode`／`icon` 對應一致 |
| C2 術語衝突 | Resolved | 三個交通時間相關 feature 的資料表欄位格式已統一 |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
